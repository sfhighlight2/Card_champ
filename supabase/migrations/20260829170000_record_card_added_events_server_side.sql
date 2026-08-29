-- Every card add was failing (2026-08-29): the client inserted the 'added'
-- ownership event itself, but copy_ownership_events deliberately has no
-- client INSERT policy ("written only by trusted server-side operations"),
-- so RLS returned 403 and the app rolled the whole add back. The history
-- row now comes from the database, where the schema always meant it to.

create or replace function private.record_copy_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.copy_ownership_events (copy_id, new_owner_id, event_type, occurred_at)
  values (new.id, new.owner_id, 'added', new.created_at);
  return new;
end;
$$;

revoke all on function private.record_copy_added() from public;

drop trigger if exists card_copies_record_added on public.card_copies;
create trigger card_copies_record_added
  after insert on public.card_copies
  for each row execute function private.record_copy_added();

-- Backfill: any copy with no history at all gets its 'added' event, dated to
-- when it was created.
insert into public.copy_ownership_events (copy_id, new_owner_id, event_type, occurred_at)
select c.id, c.owner_id, 'added', c.created_at
from public.card_copies c
where not exists (select 1 from public.copy_ownership_events e where e.copy_id = c.id);
