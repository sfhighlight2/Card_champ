-- Card Champs — direct messaging
--
-- `direct_key` is a deterministic, order-independent key for a pair of users,
-- so "Andrew messages Logan" and "Logan messages Andrew" resolve to the same
-- single thread no matter who starts it.

create table public.conversations (
  id                uuid primary key default gen_random_uuid(),
  conversation_type text not null default 'direct' check (conversation_type in ('direct', 'group')),
  created_by        uuid references public.profiles (id) on delete set null,
  direct_key        text unique,
  last_message_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint conversations_direct_has_key check (
    (conversation_type = 'direct' and direct_key is not null)
    or (conversation_type = 'group' and direct_key is null)
  )
);

create index conversations_recent_idx on public.conversations (last_message_at desc nulls last);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function private.set_updated_at();

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  role            text not null default 'member' check (role in ('member', 'owner')),
  joined_at       timestamptz not null default now(),
  left_at         timestamptz,
  last_read_at    timestamptz,
  is_muted        boolean not null default false,
  primary key (conversation_id, user_id)
);

create index conversation_members_user_idx on public.conversation_members (user_id)
  where left_at is null;

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  kind            text not null default 'text' check (kind in ('text', 'share')),
  body            text not null check (char_length(body) between 1 and 4000),
  reply_to_id     uuid references public.messages (id) on delete set null,
  created_at      timestamptz not null default now(),
  edited_at       timestamptz,
  deleted_at      timestamptz
);

create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

create table public.message_attachments (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references public.messages (id) on delete cascade,
  attachment_type text not null default 'image'
                    check (attachment_type in ('image', 'catalog_card', 'share_link')),
  storage_path    text,
  catalog_card_id uuid references public.catalog_cards (id) on delete set null,
  share_reference text,
  created_at      timestamptz not null default now()
);

create index message_attachments_message_idx on public.message_attachments (message_id);

-- Membership test, factored out so the messages policies stay readable and the
-- planner sees one stable predicate.
create or replace function private.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members m
     where m.conversation_id = p_conversation_id
       and m.user_id = auth.uid()
       and m.left_at is null
  );
$$;

grant execute on function private.is_conversation_member(uuid) to authenticated;

-- Keeps a conversation's ordering column fresh without a client write.
create or replace function private.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function private.touch_conversation();

-- ---------------------------------------------------------------------------
-- get_or_create_direct_conversation
-- ---------------------------------------------------------------------------

create or replace function public.get_or_create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me    uuid := auth.uid();
  v_key   text;
  v_conv  uuid;
begin
  if v_me is null or not private.is_permanent_user() then
    raise exception 'Sign in to send messages' using errcode = '42501';
  end if;
  if p_other_user_id is null or p_other_user_id = v_me then
    raise exception 'Pick someone else to message' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'No such collector' using errcode = 'P0002';
  end if;

  -- Order-independent so both directions collapse to one thread.
  v_key := least(v_me::text, p_other_user_id::text) || ':' || greatest(v_me::text, p_other_user_id::text);

  select id into v_conv from public.conversations where direct_key = v_key;
  if found then
    return v_conv;
  end if;

  insert into public.conversations (conversation_type, created_by, direct_key)
  values ('direct', v_me, v_key)
  on conflict (direct_key) do nothing
  returning id into v_conv;

  if v_conv is null then
    select id into v_conv from public.conversations where direct_key = v_key;
    return v_conv;
  end if;

  insert into public.conversation_members (conversation_id, user_id, role)
  values (v_conv, v_me, 'owner'), (v_conv, p_other_user_id, 'member')
  on conflict do nothing;

  return v_conv;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS — nothing here is readable by anon or by non-members
-- ---------------------------------------------------------------------------

alter table public.conversations        enable row level security;
alter table public.conversations        force  row level security;
alter table public.conversation_members enable row level security;
alter table public.conversation_members force  row level security;
alter table public.messages             enable row level security;
alter table public.messages             force  row level security;
alter table public.message_attachments  enable row level security;
alter table public.message_attachments  force  row level security;

create policy conversations_select_member on public.conversations
  for select to authenticated
  using (private.is_conversation_member(id));

create policy conversation_members_select on public.conversation_members
  for select to authenticated
  using (private.is_conversation_member(conversation_id));

-- You may only update your own membership row (marking a thread read, muting).
create policy conversation_members_update_own on public.conversation_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy messages_select_member on public.messages
  for select to authenticated
  using (private.is_conversation_member(conversation_id));

create policy messages_insert_member on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_permanent_user()
    and private.is_conversation_member(conversation_id)
  );

create policy messages_update_own on public.messages
  for update to authenticated
  using (sender_id = (select auth.uid()) and private.is_permanent_user())
  with check (sender_id = (select auth.uid()) and private.is_permanent_user());

create policy message_attachments_select on public.message_attachments
  for select to authenticated
  using (exists (
    select 1 from public.messages m
     where m.id = message_attachments.message_id
       and private.is_conversation_member(m.conversation_id)
  ));

create policy message_attachments_insert on public.message_attachments
  for insert to authenticated
  with check (exists (
    select 1 from public.messages m
     where m.id = message_attachments.message_id
       and m.sender_id = (select auth.uid())
       and private.is_permanent_user()
  ));
