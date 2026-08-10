-- Card Champs — accounts and social identity
--
-- profiles, user_preferences, interests, profile_interests, user_follows,
-- plus the auth triggers that keep them in step with auth.users.
--
-- Deliberately NOT stored here: email, passwords, follower totals, card totals,
-- portfolio value, level, or badge. Every one of those is derived at read time
-- so a client can never inflate its own standing.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  handle            extensions.citext not null unique,
  display_name      text not null check (char_length(display_name) between 1 and 60),
  bio               text check (char_length(bio) <= 200),
  avatar_path       text,
  collecting_since  smallint check (collecting_since between 1850 and 2200),
  chasing           text check (char_length(chasing) <= 200),
  is_anonymous      boolean not null default false,
  is_discoverable   boolean not null default true,
  is_verified       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Stored without '@' and case-insensitively unique. The UI adds the '@'.
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,30}$')
);

comment on column public.profiles.handle is 'Stored without a leading "@". The UI adds it.';

create index profiles_handle_trgm_idx on public.profiles using gin (handle extensions.gin_trgm_ops);
create index profiles_discoverable_idx on public.profiles (is_discoverable) where is_discoverable;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- user_preferences
-- ---------------------------------------------------------------------------

create table public.user_preferences (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  theme                  text not null default 'system' check (theme in ('light', 'dark', 'system')),
  hide_values            boolean not null default false,
  locale                 text not null default 'en-US',
  timezone               text not null default 'UTC',
  -- Set only after a legacy cardchamps:* localStorage import fully succeeds.
  legacy_imported_at     timestamptz,
  legacy_backup_version  smallint check (legacy_backup_version between 1 and 3),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- interests  (replaces the free-text Profile.tags array in the prototype)
-- ---------------------------------------------------------------------------

create table public.interests (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  label      text not null,
  is_active  boolean not null default true,
  sort_order smallint not null default 0
);

create table public.profile_interests (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, interest_id)
);

create index profile_interests_interest_idx on public.profile_interests (interest_id);

insert into public.interests (slug, label, sort_order) values
  ('baseball',   'Baseball',   10),
  ('basketball', 'Basketball', 20),
  ('football',   'Football',   30),
  ('hockey',     'Hockey',     40),
  ('soccer',     'Soccer',     50),
  ('pokemon',    'Pokémon',    60),
  ('anime',      'Anime',      70),
  ('graded',     'Graded',     80),
  ('vintage',    'Vintage',    90),
  ('rookies',    'Rookies',   100),
  ('autographs', 'Autographs',110),
  ('investment', 'Investment',120);

-- ---------------------------------------------------------------------------
-- user_follows
-- ---------------------------------------------------------------------------
-- Follower/following counts stay derived; no denormalized counters to drift.

create table public.user_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint user_follows_no_self check (follower_id <> followee_id)
);

create index user_follows_followee_idx on public.user_follows (followee_id);

-- ---------------------------------------------------------------------------
-- auth triggers
-- ---------------------------------------------------------------------------
-- A failure in an auth.users trigger blocks signup entirely, so the insert
-- path avoids anything that can fail on user input: the placeholder handle is
-- derived from the (unique) user id rather than the email, and collisions
-- retry rather than raise. The user picks a real handle later via
-- public.complete_profile_setup().

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

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Keep profiles.is_anonymous truthful when a guest upgrades to a real account.

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
  end if;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function private.handle_user_updated();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.profiles          force  row level security;
alter table public.user_preferences  enable row level security;
alter table public.user_preferences  force  row level security;
alter table public.interests         enable row level security;
alter table public.interests         force  row level security;
alter table public.profile_interests enable row level security;
alter table public.profile_interests force  row level security;
alter table public.user_follows      enable row level security;
alter table public.user_follows      force  row level security;

-- profiles: discoverable profiles are browsable (including by guests); you can
-- always read and edit your own. No client insert or delete path — the auth
-- trigger owns creation and account deletion cascades from auth.users.

create policy profiles_select on public.profiles
  for select to authenticated, anon
  using (is_discoverable or id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and private.is_permanent_user())
  with check (id = (select auth.uid()) and private.is_permanent_user());

-- user_preferences: strictly private to their owner.

create policy user_preferences_select_own on public.user_preferences
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy user_preferences_update_own on public.user_preferences
  for update to authenticated
  using (user_id = (select auth.uid()) and private.is_permanent_user())
  with check (user_id = (select auth.uid()) and private.is_permanent_user());

-- interests: a public seeded lookup; writes are service-role only.

create policy interests_select on public.interests
  for select to authenticated, anon
  using (is_active);

-- profile_interests: readable when the owning profile is readable; writable
-- only by its owner.

create policy profile_interests_select on public.profile_interests
  for select to authenticated, anon
  using (exists (
    select 1 from public.profiles p
     where p.id = profile_interests.profile_id
       and (p.is_discoverable or p.id = (select auth.uid()))
  ));

create policy profile_interests_insert_own on public.profile_interests
  for insert to authenticated
  with check (profile_id = (select auth.uid()) and private.is_permanent_user());

create policy profile_interests_delete_own on public.profile_interests
  for delete to authenticated
  using (profile_id = (select auth.uid()) and private.is_permanent_user());

-- user_follows: the graph is public; you may only act as yourself.

create policy user_follows_select on public.user_follows
  for select to authenticated, anon
  using (true);

create policy user_follows_insert_own on public.user_follows
  for insert to authenticated
  with check (follower_id = (select auth.uid()) and private.is_permanent_user());

create policy user_follows_delete_own on public.user_follows
  for delete to authenticated
  using (follower_id = (select auth.uid()) and private.is_permanent_user());
