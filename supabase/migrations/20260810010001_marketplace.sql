-- Card Champs — marketplace, market analytics, watchlist, orders
--
-- Listings are either `native` (a Card Champs member selling their own physical
-- copy) or `external` (an imported provider listing we link out to). The check
-- constraints keep those two shapes from bleeding into each other.
--
-- Payment is deliberately absent. Orders can be placed and reserved; only a
-- trusted server-side operation may mark them paid or fulfilled.

create table public.marketplace_listings (
  id                 uuid primary key default gen_random_uuid(),
  source_type        text not null check (source_type in ('native', 'external')),

  -- native
  seller_id          uuid references public.profiles (id) on delete cascade,
  copy_id            uuid references public.card_copies (id) on delete cascade,

  -- external
  provider_id        uuid references public.marketplace_providers (id) on delete cascade,
  external_id        text,
  external_url       text,

  -- snapshot of identity at listing time, so the card can change without
  -- rewriting history
  catalog_card_id    uuid references public.catalog_cards (id) on delete set null,
  grading_company_id uuid references public.grading_companies (id) on delete set null,
  grade              numeric(3, 1) check (grade >= 0 and grade <= 10),
  title_snapshot     text not null,
  condition          text not null default 'As graded',
  asking_amount_minor bigint not null check (asking_amount_minor >= 0),
  currency           char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  ships_from         text,

  status             text not null default 'draft'
                       check (status in ('draft', 'active', 'reserved', 'sold', 'cancelled', 'expired')),
  view_count         integer not null default 0 check (view_count >= 0),
  published_at       timestamptz,
  expires_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint listings_native_shape check (
    source_type <> 'native'
    or (seller_id is not null and copy_id is not null and provider_id is null and external_id is null)
  ),
  constraint listings_external_shape check (
    source_type <> 'external'
    or (provider_id is not null and external_id is not null and seller_id is null and copy_id is null)
  )
);

create unique index listings_external_key
  on public.marketplace_listings (provider_id, external_id)
  where source_type = 'external';

-- A physical copy may only be live in one place at a time.
create unique index listings_one_live_per_copy
  on public.marketplace_listings (copy_id)
  where source_type = 'native' and status in ('active', 'reserved');

create index listings_seller_idx on public.marketplace_listings (seller_id, status);
create index listings_browse_idx on public.marketplace_listings (status, published_at desc)
  where status = 'active';
create index listings_catalog_idx on public.marketplace_listings (catalog_card_id);

create trigger listings_set_updated_at
  before update on public.marketplace_listings
  for each row execute function private.set_updated_at();

-- Trusted ingestion only — the browser never writes prices.
create table public.market_sale_comps (
  id                 uuid primary key default gen_random_uuid(),
  provider_id        uuid not null references public.marketplace_providers (id) on delete cascade,
  catalog_card_id    uuid references public.catalog_cards (id) on delete cascade,
  grading_company_id uuid references public.grading_companies (id) on delete set null,
  grade              numeric(3, 1) check (grade >= 0 and grade <= 10),
  sold_amount_minor  bigint not null check (sold_amount_minor >= 0),
  currency           char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  sold_at            timestamptz not null,
  external_reference text,
  external_url       text,
  created_at         timestamptz not null default now()
);

create index market_sale_comps_card_idx
  on public.market_sale_comps (catalog_card_id, sold_at desc);

create table public.market_price_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  catalog_card_id    uuid not null references public.catalog_cards (id) on delete cascade,
  grading_company_id uuid references public.grading_companies (id) on delete set null,
  grade              numeric(3, 1) check (grade >= 0 and grade <= 10),
  provider_id        uuid references public.marketplace_providers (id) on delete set null,
  amount_minor       bigint not null check (amount_minor >= 0),
  currency           char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  observed_at        timestamptz not null default now(),
  methodology        text
);

create index market_price_snapshots_series_idx
  on public.market_price_snapshots (catalog_card_id, observed_at desc);

-- Watch either a canonical card or one specific listing, never both.
create table public.watchlist_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  catalog_card_id uuid references public.catalog_cards (id) on delete cascade,
  listing_id      uuid references public.marketplace_listings (id) on delete cascade,
  created_at      timestamptz not null default now(),

  constraint watchlist_exactly_one_target check (
    (catalog_card_id is not null)::int + (listing_id is not null)::int = 1
  )
);

create unique index watchlist_card_key on public.watchlist_items (user_id, catalog_card_id)
  where catalog_card_id is not null;
create unique index watchlist_listing_key on public.watchlist_items (user_id, listing_id)
  where listing_id is not null;
create index watchlist_user_idx on public.watchlist_items (user_id);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  buyer_id           uuid not null references public.profiles (id) on delete restrict,
  seller_id          uuid not null references public.profiles (id) on delete restrict,
  listing_id         uuid not null references public.marketplace_listings (id) on delete restrict,
  copy_id            uuid not null references public.card_copies (id) on delete restrict,
  subtotal_minor     bigint not null check (subtotal_minor >= 0),
  fees_minor         bigint not null default 0 check (fees_minor >= 0),
  total_minor        bigint not null check (total_minor >= 0),
  currency           char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status             text not null default 'pending'
                       check (status in ('pending', 'awaiting_payment', 'paid', 'cancelled', 'fulfilled', 'refunded')),
  placed_at          timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint orders_no_self_purchase check (buyer_id <> seller_id)
);

-- At most one live order per listing.
create unique index orders_one_live_per_listing
  on public.orders (listing_id)
  where status <> 'cancelled';

create index orders_buyer_idx on public.orders (buyer_id, placed_at desc);
create index orders_seller_idx on public.orders (seller_id, placed_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- place_native_order — the only supported way to buy
-- ---------------------------------------------------------------------------
-- Locks the listing row, re-checks it is still active, reserves it, and creates
-- the order in one transaction. Two simultaneous buyers cannot both win.

create or replace function public.place_native_order(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer   uuid := auth.uid();
  v_listing public.marketplace_listings%rowtype;
  v_order   uuid;
begin
  if v_buyer is null or not private.is_permanent_user() then
    raise exception 'Sign in to buy' using errcode = '42501';
  end if;

  select * into v_listing
    from public.marketplace_listings
   where id = p_listing_id
     for update;

  if not found then
    raise exception 'Listing not found' using errcode = 'P0002';
  end if;
  if v_listing.source_type <> 'native' then
    raise exception 'Only native listings can be ordered here' using errcode = '22023';
  end if;
  if v_listing.status <> 'active' then
    raise exception 'Listing is no longer available' using errcode = '55000';
  end if;
  if v_listing.seller_id = v_buyer then
    raise exception 'You cannot buy your own listing' using errcode = '22023';
  end if;

  update public.marketplace_listings
     set status = 'reserved'
   where id = p_listing_id;

  insert into public.orders (
    buyer_id, seller_id, listing_id, copy_id,
    subtotal_minor, fees_minor, total_minor, currency, status
  ) values (
    v_buyer, v_listing.seller_id, v_listing.id, v_listing.copy_id,
    v_listing.asking_amount_minor, 0, v_listing.asking_amount_minor,
    v_listing.currency, 'pending'
  )
  returning id into v_order;

  return v_order;
end;
$$;

revoke all on function public.place_native_order(uuid) from public;
grant execute on function public.place_native_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.marketplace_listings   enable row level security;
alter table public.marketplace_listings   force  row level security;
alter table public.market_sale_comps      enable row level security;
alter table public.market_sale_comps      force  row level security;
alter table public.market_price_snapshots enable row level security;
alter table public.market_price_snapshots force  row level security;
alter table public.watchlist_items        enable row level security;
alter table public.watchlist_items        force  row level security;
alter table public.orders                 enable row level security;
alter table public.orders                 force  row level security;

-- Published listings are browsable by anyone (including guests). Drafts and
-- cancelled listings are visible only to their seller.
create policy listings_select on public.marketplace_listings
  for select to authenticated, anon
  using (
    status in ('active', 'reserved', 'sold')
    or seller_id = (select auth.uid())
  );

create policy listings_insert_own on public.marketplace_listings
  for insert to authenticated
  with check (
    source_type = 'native'
    and seller_id = (select auth.uid())
    and private.is_permanent_user()
    and exists (
      select 1 from public.card_copies c
       where c.id = marketplace_listings.copy_id
         and c.owner_id = (select auth.uid())
         and c.archived_at is null
    )
  );

create policy listings_update_own on public.marketplace_listings
  for update to authenticated
  using (seller_id = (select auth.uid()) and private.is_permanent_user())
  with check (seller_id = (select auth.uid()) and private.is_permanent_user());

create policy listings_delete_own on public.marketplace_listings
  for delete to authenticated
  using (seller_id = (select auth.uid()) and private.is_permanent_user() and status in ('draft', 'cancelled', 'expired'));

-- Market analytics: public read, service-role write.
create policy market_sale_comps_select on public.market_sale_comps
  for select to authenticated, anon using (true);
create policy market_price_snapshots_select on public.market_price_snapshots
  for select to authenticated, anon using (true);

create policy watchlist_select_own on public.watchlist_items
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy watchlist_insert_own on public.watchlist_items
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_permanent_user());

create policy watchlist_delete_own on public.watchlist_items
  for delete to authenticated
  using (user_id = (select auth.uid()) and private.is_permanent_user());

-- Orders are readable by both parties; created only through
-- place_native_order(); state changes are trusted-server only.
create policy orders_select_party on public.orders
  for select to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));
