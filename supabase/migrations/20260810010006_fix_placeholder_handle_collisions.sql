-- The original placeholder handle was derived from the first 12 hex characters
-- of the user id, with a 5-attempt retry. UUIDs that share a prefix (as
-- sequentially-authored ids do) all collapse to the same handle and exhaust the
-- retries, which raises inside an auth.users trigger and therefore blocks
-- signup outright. A sequence is unique by construction — no retry, no
-- derivation, no collision.

create sequence if not exists private.handle_seq start 1000;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_handle text;
begin
  v_handle := 'collector_' || nextval('private.handle_seq');

  insert into public.profiles (id, handle, display_name, is_anonymous)
  values (new.id, v_handle, 'Collector', coalesce(new.is_anonymous, false));

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  if not coalesce(new.is_anonymous, false) then
    perform private.ensure_default_collection(new.id);
  end if;

  return new;
end;
$$;
