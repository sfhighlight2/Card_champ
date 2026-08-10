-- Card Champs — canonical card catalog
--
-- The catalog describes cards that *exist*; it says nothing about who owns
-- them. Physical copies (next migration) reference it optionally, so a scan
-- that matches nothing still records cleanly without polluting the catalog.
--
-- Everything here is publicly readable and service-role writable only.

-- ---------------------------------------------------------------------------
-- taxonomy
-- ---------------------------------------------------------------------------

create table public.sports (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name      text not null,
  is_active boolean not null default true
);

create table public.brands (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  sport_id     uuid references public.sports (id) on delete set null,
  manufacturer text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create unique index brands_name_key on public.brands (lower(name));

create table public.teams (
  id           uuid primary key default gen_random_uuid(),
  sport_id     uuid not null references public.sports (id) on delete cascade,
  name         text not null,
  abbreviation text,
  is_active    boolean not null default true
);

create unique index teams_sport_name_key on public.teams (sport_id, lower(name));

create table public.card_sets (
  id           uuid primary key default gen_random_uuid(),
  sport_id     uuid references public.sports (id) on delete set null,
  brand_id     uuid references public.brands (id) on delete set null,
  name         text not null,
  release_year smallint check (release_year between 1850 and 2200),
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create unique index card_sets_identity_key
  on public.card_sets (coalesce(brand_id::text, ''), lower(name), coalesce(release_year, 0));

create table public.subjects (
  id           uuid primary key default gen_random_uuid(),
  subject_type text not null default 'athlete'
                 check (subject_type in ('athlete', 'character', 'team', 'other')),
  display_name text not null,
  sport_id     uuid references public.sports (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index subjects_name_trgm_idx on public.subjects using gin (display_name extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- catalog_cards
-- ---------------------------------------------------------------------------

create table public.catalog_cards (
  id            uuid primary key default gen_random_uuid(),
  card_set_id   uuid not null references public.card_sets (id) on delete cascade,
  card_number   text,
  title         text not null,
  variant       text,                       -- parallel / variant / insert
  is_rookie     boolean not null default false,
  autograph     text not null default 'none'
                  check (autograph in ('none', 'on_card', 'sticker', 'cut', 'unknown')),
  release_year  smallint check (release_year between 1850 and 2200),
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  search_content tsvector generated always as (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title, '') || ' ' || coalesce(card_number, '') || ' ' || coalesce(variant, '')
    )
  ) stored
);

-- One row per (set, number, parallel). Nulls normalize to '' so the index
-- actually enforces uniqueness instead of silently allowing duplicates.
create unique index catalog_cards_identity_key on public.catalog_cards (
  card_set_id,
  lower(coalesce(trim(card_number), '')),
  lower(coalesce(trim(variant), ''))
);

create index catalog_cards_search_idx on public.catalog_cards using gin (search_content);
create index catalog_cards_title_trgm_idx on public.catalog_cards using gin (title extensions.gin_trgm_ops);
create index catalog_cards_set_idx on public.catalog_cards (card_set_id);

create trigger catalog_cards_set_updated_at
  before update on public.catalog_cards
  for each row execute function private.set_updated_at();

-- Multi-player and team cards attach many subjects without duplicating the card.
create table public.catalog_card_subjects (
  catalog_card_id uuid not null references public.catalog_cards (id) on delete cascade,
  subject_id      uuid not null references public.subjects (id) on delete cascade,
  team_id         uuid references public.teams (id) on delete set null,
  role            text not null default 'primary' check (role in ('primary', 'secondary')),
  sort_order      smallint not null default 0,
  primary key (catalog_card_id, subject_id)
);

create index catalog_card_subjects_subject_idx on public.catalog_card_subjects (subject_id);

-- ---------------------------------------------------------------------------
-- graders and marketplace providers
-- ---------------------------------------------------------------------------

create table public.grading_companies (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (code ~ '^[A-Za-z]{2,8}$'),
  name       text not null,
  scale_max  numeric(3, 1) not null default 10.0,
  is_active  boolean not null default true
);

create table public.marketplace_providers (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code ~ '^[a-z0-9_]{2,40}$'),
  name          text not null,
  provider_type text not null default 'marketplace'
                  check (provider_type in ('marketplace', 'price_index', 'auction', 'other')),
  base_url      text,
  is_active     boolean not null default true
);

-- ---------------------------------------------------------------------------
-- seeds
-- ---------------------------------------------------------------------------
-- Grader codes and team names mirror src/app/data/mockCards.ts exactly so the
-- one-time legacy localStorage import can match on them without fuzzy logic.
-- ("Indians" is seeded because the prototype's seed data uses it; the modern
-- name can be added later without breaking existing references.)

insert into public.grading_companies (code, name) values
  ('PSA',  'Professional Sports Authenticator'),
  ('BGS',  'Beckett Grading Services'),
  ('SGC',  'Sportscard Guaranty Corporation'),
  ('CGC',  'Certified Guaranty Company'),
  ('TAG',  'TAG Grading'),
  ('FWrk', 'Fieldwork Grading');

insert into public.marketplace_providers (code, name, provider_type, base_url) values
  ('ebay',            'eBay',             'marketplace', 'https://www.ebay.com'),
  ('fanatics',        'Fanatics Collect', 'marketplace', 'https://www.fanaticscollect.com'),
  ('psa_marketplace', 'PSA Marketplace',  'marketplace', 'https://www.psacard.com'),
  ('card_ladder',     'Card Ladder',      'price_index', 'https://www.cardladder.com'),
  ('comc',            'COMC',             'marketplace', 'https://www.comc.com'),
  ('myslabs',         'MySlabs',          'marketplace', 'https://www.myslabs.com'),
  ('stockx',          'StockX',           'marketplace', 'https://stockx.com');

insert into public.sports (slug, name) values
  ('baseball',   'Baseball'),
  ('basketball', 'Basketball'),
  ('football',   'Football'),
  ('hockey',     'Hockey'),
  ('soccer',     'Soccer'),
  ('tcg',        'Trading Card Game');

insert into public.brands (name, sport_id)
select b.name, s.id
from (values
  ('Topps'), ('Topps Traded'), ('Bowman'), ('Fleer'), ('Donruss'),
  ('Upper Deck'), ('Score'), ('Panini'), ('Leaf'), ('Kellogg''s'),
  ('Pacific'), ('Skybox')
) as b(name)
cross join (select id from public.sports where slug = 'baseball') as s;

insert into public.teams (sport_id, name)
select s.id, t.name
from (values
  ('Angels'), ('Astros'), ('Athletics'), ('Blue Jays'), ('Braves'), ('Brewers'),
  ('Cardinals'), ('Cubs'), ('Dodgers'), ('Giants'), ('Indians'), ('Mariners'),
  ('Marlins'), ('Mets'), ('Nationals'), ('Orioles'), ('Padres'), ('Phillies'),
  ('Pirates'), ('Rangers'), ('Red Sox'), ('Reds'), ('Rockies'), ('Royals'),
  ('Tigers'), ('Twins'), ('White Sox'), ('Yankees')
) as t(name)
cross join (select id from public.sports where slug = 'baseball') as s;

-- ---------------------------------------------------------------------------
-- RLS — public read, service-role write
-- ---------------------------------------------------------------------------

alter table public.sports                enable row level security;
alter table public.sports                force  row level security;
alter table public.brands                enable row level security;
alter table public.brands                force  row level security;
alter table public.teams                 enable row level security;
alter table public.teams                 force  row level security;
alter table public.card_sets             enable row level security;
alter table public.card_sets             force  row level security;
alter table public.subjects              enable row level security;
alter table public.subjects              force  row level security;
alter table public.catalog_cards         enable row level security;
alter table public.catalog_cards         force  row level security;
alter table public.catalog_card_subjects enable row level security;
alter table public.catalog_card_subjects force  row level security;
alter table public.grading_companies     enable row level security;
alter table public.grading_companies     force  row level security;
alter table public.marketplace_providers enable row level security;
alter table public.marketplace_providers force  row level security;

create policy sports_select                on public.sports                for select to authenticated, anon using (true);
create policy brands_select                on public.brands                for select to authenticated, anon using (true);
create policy teams_select                 on public.teams                 for select to authenticated, anon using (true);
create policy card_sets_select             on public.card_sets             for select to authenticated, anon using (true);
create policy subjects_select              on public.subjects              for select to authenticated, anon using (true);
create policy catalog_cards_select         on public.catalog_cards         for select to authenticated, anon using (true);
create policy catalog_card_subjects_select on public.catalog_card_subjects for select to authenticated, anon using (true);
create policy grading_companies_select     on public.grading_companies     for select to authenticated, anon using (true);
create policy marketplace_providers_select on public.marketplace_providers for select to authenticated, anon using (true);
