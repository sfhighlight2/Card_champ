-- Card Champs — collections, physical copies, folders, and chases
--
-- The core ownership model. A `card_copy` is one physical slab: it may point at
-- a canonical catalog card, or carry typed fallback fields when a scan matched
-- nothing. Value lives in an append-only valuation history rather than a
-- mutable column, and ownership changes are recorded as events so a card can
-- transfer between collectors without being cloned.
--
-- Collections are PRIVATE by default. Public visibility is an explicit choice.

-- ---------------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------------

create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  visibility  text not null default 'private'
                check (visibility in ('private', 'unlisted', 'public')),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz,

  -- Composite key so child tables can enforce "same owner" structurally.
  constraint collections_id_owner_key unique (id, owner_id)
);

create unique index collections_one_default_per_owner
  on public.collections (owner_id)
  where is_default and archived_at is null;

create index collections_owner_idx on public.collections (owner_id);
create index collections_public_idx on public.collections (visibility) where visibility = 'public';

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- card_copies
-- ---------------------------------------------------------------------------

create table public.card_copies (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  collection_id      uuid not null,
  catalog_card_id    uuid references public.catalog_cards (id) on delete set null,

  -- Typed fallback identity for scans that matched no catalog card. Keeping
  -- these as real columns (rather than a JSON blob) means they stay queryable
  -- and can be reconciled into the catalog later.
  raw_title          text,
  raw_year           smallint check (raw_year between 1850 and 2200),
  raw_brand          text,
  raw_team           text,
  raw_card_number    text,

  grading_company_id uuid references public.grading_companies (id) on delete set null,
  grade              numeric(3, 1) check (grade >= 0 and grade <= 10),
  grade_label        text,
  certificate_number text,
  autograph          boolean not null default false,
  serial_number      text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  archived_at        timestamptz,

  -- Deliberately NOT globally unique: user-entered cert numbers are unreliable.
  -- Provider verification can identify true duplicates later.
  certificate_normalized text generated always as (
    nullif(upper(regexp_replace(coalesce(certificate_number, ''), '[^A-Za-z0-9]', '', 'g')), '')
  ) stored,

  constraint card_copies_has_identity check (
    catalog_card_id is not null
    or (raw_title is not null and char_length(btrim(raw_title)) > 0)
  ),

  -- The collection must belong to the same owner as the copy.
  constraint card_copies_collection_fk
    foreign key (collection_id, owner_id)
    references public.collections (id, owner_id) on delete cascade,

  constraint card_copies_id_owner_collection_key unique (id, owner_id, collection_id)
);

create index card_copies_owner_idx on public.card_copies (owner_id);
create index card_copies_collection_idx on public.card_copies (collection_id) where archived_at is null;
create index card_copies_catalog_idx on public.card_copies (catalog_card_id);
create index card_copies_cert_idx on public.card_copies (certificate_normalized) where certificate_normalized is not null;
create index card_copies_recent_idx on public.card_copies (owner_id, created_at desc);

create trigger card_copies_set_updated_at
  before update on public.card_copies
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- subgrades, media, valuations, ownership history
-- ---------------------------------------------------------------------------

create table public.card_copy_subgrades (
  copy_id   uuid not null references public.card_copies (id) on delete cascade,
  dimension text not null
              check (dimension in ('centering', 'corners', 'edges', 'surface', 'autograph')),
  score     numeric(3, 1) not null check (score >= 0 and score <= 10),
  primary key (copy_id, dimension)
);

create table public.card_copy_media (
  id           uuid primary key default gen_random_uuid(),
  copy_id      uuid not null references public.card_copies (id) on delete cascade,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  storage_path text not null,
  media_type   text not null default 'front'
                 check (media_type in ('front', 'back', 'slab', 'barcode', 'other')),
  is_primary   boolean not null default false,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index card_copy_media_one_primary
  on public.card_copy_media (copy_id, media_type)
  where is_primary;

create index card_copy_media_copy_idx on public.card_copy_media (copy_id);

create trigger card_copy_media_set_updated_at
  before update on public.card_copy_media
  for each row execute function private.set_updated_at();

-- Append-only valuation history. The "current" value is the latest row, never
-- an overwritten column, so 30-day change is a real query instead of the
-- prototype's stored `change` percentage.
create table public.card_copy_valuations (
  id           uuid primary key default gen_random_uuid(),
  copy_id      uuid not null references public.card_copies (id) on delete cascade,
  amount_minor bigint not null check (amount_minor >= 0),
  currency     char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  source       text not null check (source in ('user', 'provider', 'sale_comp', 'system')),
  provider_id  uuid references public.marketplace_providers (id) on delete set null,
  observed_at  timestamptz not null default now(),
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index card_copy_valuations_latest_idx
  on public.card_copy_valuations (copy_id, observed_at desc);

-- Append-only audit trail. A native sale transfers the existing copy row and
-- records an event here; it never clones the card.
create table public.copy_ownership_events (
  id                uuid primary key default gen_random_uuid(),
  copy_id           uuid not null references public.card_copies (id) on delete cascade,
  previous_owner_id uuid references public.profiles (id) on delete set null,
  new_owner_id      uuid references public.profiles (id) on delete set null,
  event_type        text not null
                      check (event_type in ('added', 'imported', 'purchased', 'sold', 'transferred', 'removed')),
  amount_minor      bigint check (amount_minor >= 0),
  currency          char(3) check (currency ~ '^[A-Z]{3}$'),
  provider_id       uuid references public.marketplace_providers (id) on delete set null,
  occurred_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index copy_ownership_events_copy_idx on public.copy_ownership_events (copy_id, occurred_at desc);

-- Population is a property of the canonical card + grade, not of one slab.
-- This replaces the prototype's copy-level popReport field.
create table public.population_reports (
  id                 uuid primary key default gen_random_uuid(),
  catalog_card_id    uuid not null references public.catalog_cards (id) on delete cascade,
  grading_company_id uuid not null references public.grading_companies (id) on delete cascade,
  grade              numeric(3, 1) not null check (grade >= 0 and grade <= 10),
  population         integer not null check (population >= 0),
  provider_id        uuid references public.marketplace_providers (id) on delete set null,
  observed_at        timestamptz not null default now()
);

create index population_reports_lookup_idx
  on public.population_reports (catalog_card_id, grading_company_id, grade, observed_at desc);

-- ---------------------------------------------------------------------------
-- folders
-- ---------------------------------------------------------------------------

create table public.folders (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.profiles (id) on delete cascade,
  collection_id     uuid not null,
  name              text not null check (char_length(name) between 1 and 80),
  color             text not null default '#111111' check (color ~ '^#[0-9a-fA-F]{6}$'),
  thumbnail_copy_id uuid references public.card_copies (id) on delete set null,
  visibility        text not null default 'private'
                      check (visibility in ('private', 'unlisted', 'public')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz,

  constraint folders_collection_fk
    foreign key (collection_id, owner_id)
    references public.collections (id, owner_id) on delete cascade,

  constraint folders_id_owner_collection_key unique (id, owner_id, collection_id)
);

create index folders_owner_idx on public.folders (owner_id);
create index folders_collection_idx on public.folders (collection_id) where archived_at is null;

create trigger folders_set_updated_at
  before update on public.folders
  for each row execute function private.set_updated_at();

-- The composite foreign keys make it structurally impossible to file another
-- user's copy into your folder, or to mix copies across collections — the
-- prototype enforced neither.
create table public.folder_copies (
  folder_id     uuid not null,
  copy_id       uuid not null,
  owner_id      uuid not null,
  collection_id uuid not null,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),

  primary key (folder_id, copy_id),

  constraint folder_copies_folder_fk
    foreign key (folder_id, owner_id, collection_id)
    references public.folders (id, owner_id, collection_id) on delete cascade,

  constraint folder_copies_copy_fk
    foreign key (copy_id, owner_id, collection_id)
    references public.card_copies (id, owner_id, collection_id) on delete cascade
);

create index folder_copies_copy_idx on public.folder_copies (copy_id);
create index folder_copies_owner_idx on public.folder_copies (owner_id);

-- ---------------------------------------------------------------------------
-- chases
-- ---------------------------------------------------------------------------
-- Free-text title/description keep the current UI working verbatim; the
-- structured criteria below are what later matching and alerts will use.

create table public.chases (
  id                           uuid primary key default gen_random_uuid(),
  owner_id                     uuid not null references public.profiles (id) on delete cascade,
  title                        text not null check (char_length(title) between 1 and 120),
  description                  text not null default '',
  target_catalog_card_id       uuid references public.catalog_cards (id) on delete set null,
  featured_copy_id             uuid references public.card_copies (id) on delete set null,
  preferred_grading_company_id uuid references public.grading_companies (id) on delete set null,
  minimum_grade                numeric(3, 1) check (minimum_grade >= 0 and minimum_grade <= 10),
  max_amount_minor             bigint check (max_amount_minor >= 0),
  currency                     char(3) not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  priority                     smallint not null default 0,
  status                       text not null default 'active'
                                 check (status in ('active', 'fulfilled', 'archived')),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

create index chases_owner_idx on public.chases (owner_id, status);

create trigger chases_set_updated_at
  before update on public.chases
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- default collection provisioning
-- ---------------------------------------------------------------------------
-- Permanent accounts get exactly one private default collection. Anonymous
-- guests get none — they are browse-only and have nothing to own. The two auth
-- trigger functions from 20260809000002 are replaced here now that
-- public.collections exists.

create or replace function private.ensure_default_collection(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.collections (owner_id, name, visibility, is_default)
  values (p_user_id, 'My Collection', 'private', true)
  on conflict do nothing;
exception
  when unique_violation then
    null;  -- a default already exists; nothing to do
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_handle  text;
  v_attempt int := 0;
begin
  loop
    v_attempt := v_attempt + 1;
    v_handle := 'collector_' || substr(replace(new.id::text, '-', ''), 1, 12)
                || case when v_attempt = 1 then '' else v_attempt::text end;

    begin
      insert into public.profiles (id, handle, display_name, is_anonymous)
      values (new.id, v_handle, 'Collector', coalesce(new.is_anonymous, false));
      exit;
    exception
      when unique_violation then
        if v_attempt >= 5 then raise; end if;
    end;
  end loop;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  if not coalesce(new.is_anonymous, false) then
    perform private.ensure_default_collection(new.id);
  end if;

  return new;
end;
$$;

create or replace function private.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_anonymous is distinct from old.is_anonymous then
    update public.profiles
       set is_anonymous = new.is_anonymous
     where id = new.id;

    -- A guest who upgraded to a permanent account now needs somewhere to
    -- put cards.
    if not coalesce(new.is_anonymous, false) then
      perform private.ensure_default_collection(new.id);
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Read: your own rows always; other people's only through a collection that is
-- explicitly public. ('unlisted' becomes readable once share links land in a
-- later migration — deliberately not readable yet.)
-- Write: owner only, and only as a permanent (non-anonymous) user.

alter table public.collections           enable row level security;
alter table public.collections           force  row level security;
alter table public.card_copies           enable row level security;
alter table public.card_copies           force  row level security;
alter table public.card_copy_subgrades   enable row level security;
alter table public.card_copy_subgrades   force  row level security;
alter table public.card_copy_media       enable row level security;
alter table public.card_copy_media       force  row level security;
alter table public.card_copy_valuations  enable row level security;
alter table public.card_copy_valuations  force  row level security;
alter table public.copy_ownership_events enable row level security;
alter table public.copy_ownership_events force  row level security;
alter table public.population_reports    enable row level security;
alter table public.population_reports    force  row level security;
alter table public.folders               enable row level security;
alter table public.folders               force  row level security;
alter table public.folder_copies         enable row level security;
alter table public.folder_copies         force  row level security;
alter table public.chases                enable row level security;
alter table public.chases                force  row level security;

-- Readability helper: true when the given collection is the caller's own, or
-- is published publicly. Used by every child table so the rule lives once.
create or replace function private.can_read_collection(p_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.collections c
     where c.id = p_collection_id
       and c.archived_at is null
       and (c.owner_id = auth.uid() or c.visibility = 'public')
  );
$$;

grant execute on function private.can_read_collection(uuid) to authenticated, anon;

-- collections

create policy collections_select on public.collections
  for select to authenticated, anon
  using (owner_id = (select auth.uid()) or (visibility = 'public' and archived_at is null));

create policy collections_insert_own on public.collections
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());

create policy collections_update_own on public.collections
  for update to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user())
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());

create policy collections_delete_own on public.collections
  for delete to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user() and not is_default);

-- card_copies

create policy card_copies_select on public.card_copies
  for select to authenticated, anon
  using (owner_id = (select auth.uid()) or private.can_read_collection(collection_id));

create policy card_copies_insert_own on public.card_copies
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());

create policy card_copies_update_own on public.card_copies
  for update to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user())
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());

create policy card_copies_delete_own on public.card_copies
  for delete to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user());

-- card_copy_subgrades / media / valuations follow their parent copy

create policy card_copy_subgrades_select on public.card_copy_subgrades
  for select to authenticated, anon
  using (exists (
    select 1 from public.card_copies c
     where c.id = card_copy_subgrades.copy_id
       and (c.owner_id = (select auth.uid()) or private.can_read_collection(c.collection_id))
  ));

create policy card_copy_subgrades_write_own on public.card_copy_subgrades
  for all to authenticated
  using (exists (
    select 1 from public.card_copies c
     where c.id = card_copy_subgrades.copy_id
       and c.owner_id = (select auth.uid()) and private.is_permanent_user()
  ))
  with check (exists (
    select 1 from public.card_copies c
     where c.id = card_copy_subgrades.copy_id
       and c.owner_id = (select auth.uid()) and private.is_permanent_user()
  ));

create policy card_copy_media_select on public.card_copy_media
  for select to authenticated, anon
  using (exists (
    select 1 from public.card_copies c
     where c.id = card_copy_media.copy_id
       and (c.owner_id = (select auth.uid()) or private.can_read_collection(c.collection_id))
  ));

create policy card_copy_media_write_own on public.card_copy_media
  for all to authenticated
  using (exists (
    select 1 from public.card_copies c
     where c.id = card_copy_media.copy_id
       and c.owner_id = (select auth.uid()) and private.is_permanent_user()
  ))
  with check (exists (
    select 1 from public.card_copies c
     where c.id = card_copy_media.copy_id
       and c.owner_id = (select auth.uid()) and private.is_permanent_user()
  ));

-- Valuations are append-only for owners: insert and select, never update or
-- delete, so history cannot be rewritten.
create policy card_copy_valuations_select on public.card_copy_valuations
  for select to authenticated, anon
  using (exists (
    select 1 from public.card_copies c
     where c.id = card_copy_valuations.copy_id
       and (c.owner_id = (select auth.uid()) or private.can_read_collection(c.collection_id))
  ));

create policy card_copy_valuations_insert_own on public.card_copy_valuations
  for insert to authenticated
  with check (
    source = 'user'
    and created_by = (select auth.uid())
    and private.is_permanent_user()
    and exists (
      select 1 from public.card_copies c
       where c.id = card_copy_valuations.copy_id
         and c.owner_id = (select auth.uid())
    )
  );

-- Ownership events: readable by either party, written only by trusted
-- server-side operations (no insert/update/delete policy for clients).
create policy copy_ownership_events_select on public.copy_ownership_events
  for select to authenticated
  using (
    previous_owner_id = (select auth.uid())
    or new_owner_id = (select auth.uid())
  );

-- population_reports: public reference data, service-role write only.
create policy population_reports_select on public.population_reports
  for select to authenticated, anon
  using (true);

-- folders

create policy folders_select on public.folders
  for select to authenticated, anon
  using (owner_id = (select auth.uid()) or (visibility = 'public' and archived_at is null));

create policy folders_insert_own on public.folders
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());

create policy folders_update_own on public.folders
  for update to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user())
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());

create policy folders_delete_own on public.folders
  for delete to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user());

-- folder_copies

create policy folder_copies_select on public.folder_copies
  for select to authenticated, anon
  using (exists (
    select 1 from public.folders f
     where f.id = folder_copies.folder_id
       and (f.owner_id = (select auth.uid()) or (f.visibility = 'public' and f.archived_at is null))
  ));

create policy folder_copies_write_own on public.folder_copies
  for all to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user())
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());

-- chases

create policy chases_select on public.chases
  for select to authenticated, anon
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.profiles p
       where p.id = chases.owner_id and p.is_discoverable
    )
  );

create policy chases_write_own on public.chases
  for all to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user())
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());
