-- Card Champs — community feed
--
-- Like/dislike/comment totals are NOT stored. They are counted from the
-- reaction and comment tables at read time, so a client cannot inflate them,
-- and switching a reaction can never double-count or go negative — the bug
-- class the prototype's client-side counters were prone to.

create table public.community_topics (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  label      text not null,
  emoji      text,
  sort_order smallint not null default 0,
  is_active  boolean not null default true
);

insert into public.community_topics (slug, label, emoji, sort_order) values
  ('baseball',   'Baseball',   '⚾', 10),
  ('basketball', 'Basketball', '🏀', 20),
  ('pokemon',    'Pokémon',    '🎮', 30),
  ('soccer',     'Soccer',     '⚽', 40),
  ('anime',      'Anime',      '🎌', 50);

create table public.posts (
  id                uuid primary key default gen_random_uuid(),
  author_id         uuid not null references public.profiles (id) on delete cascade,
  topic_id          uuid not null references public.community_topics (id) on delete restrict,
  body              text not null check (char_length(body) between 1 and 500),
  hot_score         real not null default 0,
  moderation_status text not null default 'visible'
                      check (moderation_status in ('visible', 'flagged', 'hidden', 'removed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  edited_at         timestamptz,
  deleted_at        timestamptz
);

create index posts_feed_idx on public.posts (created_at desc)
  where deleted_at is null and moderation_status = 'visible';
create index posts_topic_idx on public.posts (topic_id, created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function private.set_updated_at();

-- Publishing a card to the feed copies a sanitized snapshot rather than
-- exposing the private card_copies row behind it.
create table public.post_attachments (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references public.posts (id) on delete cascade,
  attachment_type text not null default 'image'
                    check (attachment_type in ('image', 'catalog_card', 'link')),
  catalog_card_id uuid references public.catalog_cards (id) on delete set null,
  media_path      text,
  sort_order      smallint not null default 0,
  created_at      timestamptz not null default now()
);

create index post_attachments_post_idx on public.post_attachments (post_id);

-- One row per (post, user). Switching like -> dislike updates in place.
create table public.post_reactions (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  reaction   text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_reactions_post_idx on public.post_reactions (post_id, reaction);

create table public.comments (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid not null references public.posts (id) on delete cascade,
  author_id         uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  body              text not null check (char_length(body) between 1 and 500),
  moderation_status text not null default 'visible'
                      check (moderation_status in ('visible', 'flagged', 'hidden', 'removed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  edited_at         timestamptz,
  deleted_at        timestamptz
);

create index comments_post_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function private.set_updated_at();

create table public.comment_reactions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  reaction   text not null default 'like' check (reaction in ('like')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index comment_reactions_comment_idx on public.comment_reactions (comment_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.community_topics  enable row level security;
alter table public.community_topics  force  row level security;
alter table public.posts             enable row level security;
alter table public.posts             force  row level security;
alter table public.post_attachments  enable row level security;
alter table public.post_attachments  force  row level security;
alter table public.post_reactions    enable row level security;
alter table public.post_reactions    force  row level security;
alter table public.comments          enable row level security;
alter table public.comments          force  row level security;
alter table public.comment_reactions enable row level security;
alter table public.comment_reactions force  row level security;

create policy community_topics_select on public.community_topics
  for select to authenticated, anon using (is_active);

create policy posts_select on public.posts
  for select to authenticated, anon
  using ((deleted_at is null and moderation_status = 'visible') or author_id = (select auth.uid()));

create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (author_id = (select auth.uid()) and private.is_permanent_user());

create policy posts_update_own on public.posts
  for update to authenticated
  using (author_id = (select auth.uid()) and private.is_permanent_user())
  with check (author_id = (select auth.uid()) and private.is_permanent_user());

create policy posts_delete_own on public.posts
  for delete to authenticated
  using (author_id = (select auth.uid()) and private.is_permanent_user());

create policy post_attachments_select on public.post_attachments
  for select to authenticated, anon
  using (exists (
    select 1 from public.posts p
     where p.id = post_attachments.post_id
       and ((p.deleted_at is null and p.moderation_status = 'visible') or p.author_id = (select auth.uid()))
  ));

create policy post_attachments_write_own on public.post_attachments
  for all to authenticated
  using (exists (
    select 1 from public.posts p
     where p.id = post_attachments.post_id
       and p.author_id = (select auth.uid()) and private.is_permanent_user()
  ))
  with check (exists (
    select 1 from public.posts p
     where p.id = post_attachments.post_id
       and p.author_id = (select auth.uid()) and private.is_permanent_user()
  ));

create policy post_reactions_select on public.post_reactions
  for select to authenticated, anon using (true);

create policy post_reactions_write_own on public.post_reactions
  for all to authenticated
  using (user_id = (select auth.uid()) and private.is_permanent_user())
  with check (user_id = (select auth.uid()) and private.is_permanent_user());

create policy comments_select on public.comments
  for select to authenticated, anon
  using ((deleted_at is null and moderation_status = 'visible') or author_id = (select auth.uid()));

create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (author_id = (select auth.uid()) and private.is_permanent_user());

create policy comments_update_own on public.comments
  for update to authenticated
  using (author_id = (select auth.uid()) and private.is_permanent_user())
  with check (author_id = (select auth.uid()) and private.is_permanent_user());

create policy comments_delete_own on public.comments
  for delete to authenticated
  using (author_id = (select auth.uid()) and private.is_permanent_user());

create policy comment_reactions_select on public.comment_reactions
  for select to authenticated, anon using (true);

create policy comment_reactions_write_own on public.comment_reactions
  for all to authenticated
  using (user_id = (select auth.uid()) and private.is_permanent_user())
  with check (user_id = (select auth.uid()) and private.is_permanent_user());
