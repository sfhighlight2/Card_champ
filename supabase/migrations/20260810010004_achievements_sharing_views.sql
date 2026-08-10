-- Card Champs — achievements, share links, and the read-side views
--
-- Note on achievement count: the prototype capped levels at 10 but only ever
-- defined 8 milestones, so the XP ring could never fill. Ten definitions are
-- seeded here so MAX_LEVEL = 10 is actually reachable.

create table public.achievement_definitions (
  code       text primary key check (code ~ '^[a-z0-9-]{3,40}$'),
  label      text not null,
  metric     text not null check (metric in
               ('card_count', 'folder_count', 'chase_count', 'watchlist_count',
                'listing_count', 'post_count', 'follow_count')),
  threshold  integer not null check (threshold > 0),
  sort_order smallint not null default 0,
  is_active  boolean not null default true
);

insert into public.achievement_definitions (code, label, metric, threshold, sort_order) values
  ('first-card',      'Added your first card',        'card_count',      1,  10),
  ('first-folder',    'Created your first folder',    'folder_count',    1,  20),
  ('first-chase',     'Started your first chase',     'chase_count',     1,  30),
  ('first-watchlist', 'Started a watchlist',          'watchlist_count', 1,  40),
  ('first-listing',   'Listed your first card',       'listing_count',   1,  50),
  ('first-post',      'Posted in the Community',      'post_count',      1,  60),
  ('first-follow',    'Connected with a collector',   'follow_count',    1,  70),
  ('cards-10',        '10 cards collected',           'card_count',     10,  80),
  ('cards-50',        '50 cards collected',           'card_count',     50,  90),
  ('cards-100',       '100 cards collected',          'card_count',    100, 100);

create table public.user_achievements (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  achievement_code text not null references public.achievement_definitions (code) on delete cascade,
  earned_at        timestamptz not null default now(),
  context          jsonb not null default '{}'::jsonb,
  primary key (user_id, achievement_code)
);

create index user_achievements_user_idx on public.user_achievements (user_id);

-- Evaluated server-side from real counts. Achievements are immutable once
-- earned: there is no client update or delete path.
create or replace function public.evaluate_achievements()
returns setof text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null or not private.is_permanent_user() then
    return;
  end if;

  return query
  with metrics as (
    select
      (select count(*) from public.card_copies      where owner_id = v_user and archived_at is null) as card_count,
      (select count(*) from public.folders          where owner_id = v_user and archived_at is null) as folder_count,
      (select count(*) from public.chases           where owner_id = v_user)                          as chase_count,
      (select count(*) from public.watchlist_items  where user_id  = v_user)                          as watchlist_count,
      (select count(*) from public.marketplace_listings where seller_id = v_user)                      as listing_count,
      (select count(*) from public.posts            where author_id = v_user and deleted_at is null)  as post_count,
      (select count(*) from public.user_follows     where follower_id = v_user)                        as follow_count
  ),
  earned as (
    insert into public.user_achievements (user_id, achievement_code)
    select v_user, d.code
      from public.achievement_definitions d, metrics m
     where d.is_active
       and case d.metric
             when 'card_count'      then m.card_count
             when 'folder_count'    then m.folder_count
             when 'chase_count'     then m.chase_count
             when 'watchlist_count' then m.watchlist_count
             when 'listing_count'   then m.listing_count
             when 'post_count'      then m.post_count
             when 'follow_count'    then m.follow_count
           end >= d.threshold
    on conflict (user_id, achievement_code) do nothing
    returning achievement_code
  )
  select achievement_code from earned;
end;
$$;

revoke all on function public.evaluate_achievements() from public;
grant execute on function public.evaluate_achievements() to authenticated;

-- ---------------------------------------------------------------------------
-- share links
-- ---------------------------------------------------------------------------
-- Only the SHA-256 hash is stored. The raw token is returned exactly once, at
-- creation, and can never be recovered from the database.

create table public.share_links (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  target_type   text not null check (target_type in ('collection', 'folder', 'card_copy')),
  collection_id uuid references public.collections (id) on delete cascade,
  folder_id     uuid references public.folders (id) on delete cascade,
  copy_id       uuid references public.card_copies (id) on delete cascade,
  token_hash    bytea not null unique,
  show_values   boolean not null default true,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  access_count  integer not null default 0 check (access_count >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint share_links_exactly_one_target check (
    (collection_id is not null)::int + (folder_id is not null)::int + (copy_id is not null)::int = 1
  )
);

create index share_links_owner_idx on public.share_links (owner_id);

create trigger share_links_set_updated_at
  before update on public.share_links
  for each row execute function private.set_updated_at();

create or replace function public.create_share_link(
  p_target_type text,
  p_target_id   uuid,
  p_show_values boolean default true,
  p_expires_at  timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_token text;
begin
  if v_owner is null or not private.is_permanent_user() then
    raise exception 'Sign in to share' using errcode = '42501';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  if p_target_type = 'collection' then
    if not exists (select 1 from public.collections where id = p_target_id and owner_id = v_owner) then
      raise exception 'Not your collection' using errcode = '42501';
    end if;
    insert into public.share_links (owner_id, target_type, collection_id, token_hash, show_values, expires_at)
    values (v_owner, 'collection', p_target_id, extensions.digest(v_token, 'sha256'), p_show_values, p_expires_at);

  elsif p_target_type = 'folder' then
    if not exists (select 1 from public.folders where id = p_target_id and owner_id = v_owner) then
      raise exception 'Not your folder' using errcode = '42501';
    end if;
    insert into public.share_links (owner_id, target_type, folder_id, token_hash, show_values, expires_at)
    values (v_owner, 'folder', p_target_id, extensions.digest(v_token, 'sha256'), p_show_values, p_expires_at);

  elsif p_target_type = 'card_copy' then
    if not exists (select 1 from public.card_copies where id = p_target_id and owner_id = v_owner) then
      raise exception 'Not your card' using errcode = '42501';
    end if;
    insert into public.share_links (owner_id, target_type, copy_id, token_hash, show_values, expires_at)
    values (v_owner, 'card_copy', p_target_id, extensions.digest(v_token, 'sha256'), p_show_values, p_expires_at);

  else
    raise exception 'Unknown share target' using errcode = '22023';
  end if;

  return v_token;   -- returned once, never stored
end;
$$;

revoke all on function public.create_share_link(text, uuid, boolean, timestamptz) from public;
grant execute on function public.create_share_link(text, uuid, boolean, timestamptz) to authenticated;

alter table public.achievement_definitions enable row level security;
alter table public.achievement_definitions force  row level security;
alter table public.user_achievements       enable row level security;
alter table public.user_achievements       force  row level security;
alter table public.share_links             enable row level security;
alter table public.share_links             force  row level security;

create policy achievement_definitions_select on public.achievement_definitions
  for select to authenticated, anon using (is_active);

create policy user_achievements_select on public.user_achievements
  for select to authenticated, anon using (true);

create policy share_links_select_own on public.share_links
  for select to authenticated using (owner_id = (select auth.uid()));

create policy share_links_revoke_own on public.share_links
  for update to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user())
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());

-- ---------------------------------------------------------------------------
-- read-side views (security_invoker: the caller's RLS still applies)
-- ---------------------------------------------------------------------------

-- One row per physical copy with its canonical identity, current value, and
-- 30-day movement — replacing the prototype's stored `value` + `change`.
create view public.collection_copy_details
with (security_invoker = true) as
select
  cc.id,
  cc.owner_id,
  cc.collection_id,
  cc.catalog_card_id,
  coalesce(cat.title, cc.raw_title)                       as player,
  coalesce(cat.release_year, cs.release_year, cc.raw_year) as year,
  coalesce(b.name, cc.raw_brand)                          as brand,
  cc.raw_team                                             as team,
  coalesce(cat.card_number, cc.raw_card_number)           as card_number,
  gc.code                                                 as grader,
  cc.grade,
  cc.grade_label,
  cc.certificate_number,
  cc.autograph,
  cc.archived_at,
  cc.created_at,
  media.storage_path                                      as image_path,
  latest.amount_minor                                     as value_minor,
  latest.currency                                         as currency,
  prior.amount_minor                                      as value_30d_ago_minor,
  case
    when prior.amount_minor is null or prior.amount_minor = 0 then 0::numeric
    else round(((latest.amount_minor - prior.amount_minor)::numeric / prior.amount_minor) * 100, 2)
  end                                                     as change_pct
from public.card_copies cc
left join public.catalog_cards cat on cat.id = cc.catalog_card_id
left join public.card_sets    cs  on cs.id  = cat.card_set_id
left join public.brands       b   on b.id   = cs.brand_id
left join public.grading_companies gc on gc.id = cc.grading_company_id
left join lateral (
  select m.storage_path
    from public.card_copy_media m
   where m.copy_id = cc.id
   order by m.is_primary desc, m.sort_order, m.created_at
   limit 1
) media on true
left join lateral (
  select v.amount_minor, v.currency
    from public.card_copy_valuations v
   where v.copy_id = cc.id
   order by v.observed_at desc
   limit 1
) latest on true
left join lateral (
  select v.amount_minor
    from public.card_copy_valuations v
   where v.copy_id = cc.id
     and v.observed_at <= now() - interval '30 days'
   order by v.observed_at desc
   limit 1
) prior on true;

create view public.folder_summaries
with (security_invoker = true) as
select
  f.id,
  f.owner_id,
  f.collection_id,
  f.name,
  f.color,
  f.visibility,
  f.archived_at,
  f.created_at,
  count(fc.copy_id)                          as card_count,
  coalesce(sum(d.value_minor), 0)::bigint    as total_value_minor,
  thumb.image_path                           as thumbnail_path
from public.folders f
left join public.folder_copies fc on fc.folder_id = f.id
left join public.collection_copy_details d on d.id = fc.copy_id
left join lateral (
  select d2.image_path
    from public.folder_copies fc2
    join public.collection_copy_details d2 on d2.id = fc2.copy_id
   where fc2.folder_id = f.id
   order by fc2.position, fc2.created_at
   limit 1
) thumb on true
group by f.id, f.owner_id, f.collection_id, f.name, f.color, f.visibility,
         f.archived_at, f.created_at, thumb.image_path;

create view public.community_feed
with (security_invoker = true) as
select
  p.id,
  p.author_id,
  pr.handle::text                                     as author_handle,
  pr.display_name                                     as author_name,
  pr.avatar_path                                      as author_avatar_path,
  t.slug                                              as topic_slug,
  t.label                                             as topic_label,
  t.emoji                                             as topic_emoji,
  p.body,
  p.hot_score,
  p.created_at,
  count(*) filter (where r.reaction = 'like')::int    as like_count,
  count(*) filter (where r.reaction = 'dislike')::int as dislike_count,
  (select count(*) from public.comments c
    where c.post_id = p.id and c.deleted_at is null)::int as comment_count,
  (select r2.reaction from public.post_reactions r2
    where r2.post_id = p.id and r2.user_id = auth.uid())  as my_reaction,
  (select count(*) from public.user_achievements ua
    where ua.user_id = p.author_id)::int               as author_achievements
from public.posts p
join public.profiles pr on pr.id = p.author_id
join public.community_topics t on t.id = p.topic_id
left join public.post_reactions r on r.post_id = p.id
where p.deleted_at is null and p.moderation_status = 'visible'
group by p.id, p.author_id, pr.handle, pr.display_name, pr.avatar_path,
         t.slug, t.label, t.emoji, p.body, p.hot_score, p.created_at;

create view public.conversation_summaries
with (security_invoker = true) as
select
  c.id,
  c.conversation_type,
  c.last_message_at,
  me.last_read_at,
  peer.user_id           as peer_id,
  peer_profile.handle::text   as peer_handle,
  peer_profile.display_name   as peer_name,
  peer_profile.avatar_path    as peer_avatar_path,
  last_msg.body          as last_message_body,
  last_msg.sender_id     as last_message_sender_id,
  last_msg.created_at    as last_message_at_exact,
  (select count(*) from public.messages m2
    where m2.conversation_id = c.id
      and m2.deleted_at is null
      and m2.sender_id <> auth.uid()
      and (me.last_read_at is null or m2.created_at > me.last_read_at))::int as unread_count
from public.conversations c
join public.conversation_members me
  on me.conversation_id = c.id and me.user_id = auth.uid() and me.left_at is null
left join public.conversation_members peer
  on peer.conversation_id = c.id and peer.user_id <> auth.uid() and peer.left_at is null
left join public.profiles peer_profile on peer_profile.id = peer.user_id
left join lateral (
  select m.body, m.sender_id, m.created_at
    from public.messages m
   where m.conversation_id = c.id and m.deleted_at is null
   order by m.created_at desc
   limit 1
) last_msg on true;

-- Header/profile stats. Every number here is derived — none of it is a stored
-- counter a client could inflate.
create view public.profile_stats
with (security_invoker = true) as
select
  pr.id                                        as profile_id,
  pr.handle::text                              as handle,
  pr.display_name,
  pr.avatar_path,
  pr.bio,
  pr.chasing,
  pr.collecting_since,
  pr.is_verified,
  pr.is_discoverable,
  coalesce(stats.card_count, 0)::int           as card_count,
  coalesce(stats.total_value_minor, 0)::bigint as total_value_minor,
  coalesce(stats.prior_value_minor, 0)::bigint as total_value_30d_ago_minor,
  case
    when coalesce(stats.prior_value_minor, 0) = 0 then 0::numeric
    else round(((stats.total_value_minor - stats.prior_value_minor)::numeric
                 / stats.prior_value_minor) * 100, 2)
  end                                          as change_pct,
  (select count(*) from public.user_follows uf where uf.followee_id = pr.id)::int as follower_count,
  (select count(*) from public.user_follows uf where uf.follower_id = pr.id)::int as following_count,
  (select count(*) from public.user_achievements ua where ua.user_id = pr.id)::int as achievement_count
from public.profiles pr
left join lateral (
  select
    count(*)                            as card_count,
    sum(d.value_minor)                  as total_value_minor,
    sum(coalesce(d.value_30d_ago_minor, d.value_minor)) as prior_value_minor
  from public.collection_copy_details d
  where d.owner_id = pr.id and d.archived_at is null
) stats on true;

grant select on public.collection_copy_details to authenticated, anon;
grant select on public.folder_summaries        to authenticated, anon;
grant select on public.community_feed          to authenticated, anon;
grant select on public.conversation_summaries  to authenticated;
grant select on public.profile_stats           to authenticated, anon;
