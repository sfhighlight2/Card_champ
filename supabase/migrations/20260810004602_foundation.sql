-- Card Champs — foundation
--
-- Extensions, the non-exposed `private` helper schema, and the shared trigger
-- and identity helpers every later migration builds on.
--
-- Reference: docs/plans/card-champs-supabase-architecture.md
--
-- Conventions established here and used throughout:
--   * UUID primary keys via gen_random_uuid()
--   * timestamptz for all times
--   * money as a nonnegative bigint of minor units + a 3-letter currency code
--   * grades as numeric(3,1)
--   * checked text status columns, never Postgres enums
--   * RLS enabled AND forced on every exposed table; `postgres` and
--     `service_role` hold BYPASSRLS, so security-definer triggers and trusted
--     server operations still work under FORCE.

create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- private schema
-- ---------------------------------------------------------------------------
-- Not added to PostgREST's exposed schemas, so nothing in here is reachable
-- over the API. Policy helpers live here; grants are per-function and explicit.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, anon;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

grant execute on function private.set_updated_at() to authenticated, anon;

-- ---------------------------------------------------------------------------
-- identity helpers
-- ---------------------------------------------------------------------------
-- Supabase anonymous users authenticate as the `authenticated` Postgres role,
-- so role membership alone cannot distinguish a guest from a real account.
-- Every write policy pairs ownership with is_permanent_user() to keep guests
-- browse-only, per the architecture plan.

create or replace function private.is_permanent_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

grant execute on function private.is_permanent_user() to authenticated, anon;

comment on function private.is_permanent_user() is
  'True only for a signed-in, non-anonymous identity. Guests are browse-only.';
