-- Supabase's default privileges grant EXECUTE on public functions to `anon`
-- directly, so `revoke ... from public` in the earlier migrations did not
-- remove it. Each of these RPCs already rejects an anonymous caller at runtime,
-- but they should not be reachable from the unauthenticated API surface at all.

revoke execute on function public.place_native_order(uuid) from anon;
revoke execute on function public.get_or_create_direct_conversation(uuid) from anon;
revoke execute on function public.create_share_link(text, uuid, boolean, timestamptz) from anon;
revoke execute on function public.evaluate_achievements() from anon;
