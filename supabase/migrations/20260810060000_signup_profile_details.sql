-- Card Champs — let a new account choose its name and handle at signup
--
-- handle_new_user hardcoded 'Collector' and a sequence handle, ignoring anything
-- the client sent. Every new account therefore appeared as "Collector" with a
-- handle like collector_1023 — including in the community feed, where a wall of
-- identical names is the first thing a new user sees.
--
-- The signup form now collects a display name and handle and passes them through
-- `signUp({ options: { data } })`, which lands in auth.users.raw_user_meta_data.
-- This reads them, validates them, and falls back to the old behaviour whenever
-- they are absent, malformed, or already taken — a signup must never fail because
-- of a handle collision.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_handle    text;
  v_requested text;
  v_name      text;
begin
  -- Requested handle: trimmed, lowercased, a leading @ removed, and spaces or
  -- dashes folded to underscores so ordinary typing produces a valid handle.
  v_requested := lower(btrim(coalesce(new.raw_user_meta_data->>'handle', '')));
  v_requested := regexp_replace(v_requested, '^@', '');
  v_requested := regexp_replace(v_requested, '[\s-]+', '_', 'g');

  -- Must satisfy profiles_handle_format and still be free. Compared as lowered
  -- text rather than casting to citext, which lives in the extensions schema.
  if v_requested ~ '^[a-z0-9_]{3,30}$'
     and not exists (
       select 1 from public.profiles p where lower(p.handle::text) = v_requested
     )
  then
    v_handle := v_requested;
  else
    v_handle := 'collector_' || nextval('private.handle_seq');
  end if;

  -- Display name: capped at the 60 characters profiles_display_name_check allows,
  -- and never blank.
  v_name := btrim(coalesce(new.raw_user_meta_data->>'display_name', ''));
  if v_name = '' then
    v_name := 'Collector';
  else
    v_name := left(v_name, 60);
  end if;

  insert into public.profiles (id, handle, display_name, is_anonymous)
  values (new.id, v_handle, v_name, coalesce(new.is_anonymous, false));

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  if not coalesce(new.is_anonymous, false) then
    perform private.ensure_default_collection(new.id);
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- handle availability, checkable before an account exists
-- ---------------------------------------------------------------------------
-- The signup form needs to tell someone their handle is taken *before* they
-- submit. A plain select cannot answer that honestly: the caller is `anon`, and
-- profiles_select only exposes rows where is_discoverable is true, so a handle
-- belonging to a non-discoverable account would look free and then be silently
-- replaced by collector_N.
--
-- Security definer so it can see every row, but it returns only a boolean — no
-- profile data leaks, and it cannot be used to enumerate accounts beyond
-- confirming whether a specific handle is spoken for.

create or replace function public.is_handle_available(p_handle text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    case
      when lower(btrim(coalesce(p_handle, ''))) !~ '^[a-z0-9_]{3,30}$' then false
      else not exists (
        select 1 from public.profiles p
         where lower(p.handle::text) = lower(btrim(p_handle))
      )
    end;
$$;

revoke all on function public.is_handle_available(text) from public;
grant execute on function public.is_handle_available(text) to anon, authenticated;
