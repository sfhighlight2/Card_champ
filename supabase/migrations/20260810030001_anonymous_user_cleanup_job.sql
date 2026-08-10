-- Anonymous (guest) identities are real auth.users rows and never expire on
-- their own. With anonymous sign-ins enabled, every guest visit mints one, so
-- without a reaper the auth table grows without bound — and is trivially
-- floodable. Supabase's own guidance is to prune them on a schedule.
--
-- Deleting the auth.users row cascades to profiles/preferences; guests own no
-- collections, cards, posts, or messages by design, so nothing else is touched.

create extension if not exists pg_cron;

create or replace function private.purge_stale_anonymous_users(p_older_than interval default interval '30 days')
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  with gone as (
    delete from auth.users
     where is_anonymous = true
       and created_at < now() - p_older_than
    returning 1
  )
  select count(*) into v_deleted from gone;

  return v_deleted;
end;
$$;

revoke all on function private.purge_stale_anonymous_users(interval) from public, anon, authenticated;

comment on function private.purge_stale_anonymous_users(interval) is
  'Prunes guest identities older than the given age. Scheduled nightly via pg_cron.';

-- 03:20 UTC nightly.
select cron.schedule(
  'purge-stale-anonymous-users',
  '20 3 * * *',
  $$select private.purge_stale_anonymous_users(interval '30 days')$$
);
