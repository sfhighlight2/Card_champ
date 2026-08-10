-- Performance tuning surfaced by get_advisors(performance).
--
-- 1. Split every `for all` write policy into insert/update/delete. `for all`
--    also matches SELECT, so these seven tables were evaluating two permissive
--    policies on every read for no benefit.
-- 2. Add covering indexes for the foreign keys that actually get traversed
--    (cascade deletes and hot read paths). Pure lookup-table FKs — grader,
--    provider, sport on reference rows — are deliberately left unindexed;
--    those tables are tiny and the indexes would cost more than they save.

drop policy card_copy_subgrades_write_own on public.card_copy_subgrades;
create policy card_copy_subgrades_insert_own on public.card_copy_subgrades for insert to authenticated
  with check (exists (select 1 from public.card_copies c where c.id = card_copy_subgrades.copy_id
    and c.owner_id = (select auth.uid()) and private.is_permanent_user()));
create policy card_copy_subgrades_update_own on public.card_copy_subgrades for update to authenticated
  using (exists (select 1 from public.card_copies c where c.id = card_copy_subgrades.copy_id
    and c.owner_id = (select auth.uid()) and private.is_permanent_user()));
create policy card_copy_subgrades_delete_own on public.card_copy_subgrades for delete to authenticated
  using (exists (select 1 from public.card_copies c where c.id = card_copy_subgrades.copy_id
    and c.owner_id = (select auth.uid()) and private.is_permanent_user()));

drop policy card_copy_media_write_own on public.card_copy_media;
create policy card_copy_media_insert_own on public.card_copy_media for insert to authenticated
  with check (exists (select 1 from public.card_copies c where c.id = card_copy_media.copy_id
    and c.owner_id = (select auth.uid()) and private.is_permanent_user()));
create policy card_copy_media_update_own on public.card_copy_media for update to authenticated
  using (exists (select 1 from public.card_copies c where c.id = card_copy_media.copy_id
    and c.owner_id = (select auth.uid()) and private.is_permanent_user()));
create policy card_copy_media_delete_own on public.card_copy_media for delete to authenticated
  using (exists (select 1 from public.card_copies c where c.id = card_copy_media.copy_id
    and c.owner_id = (select auth.uid()) and private.is_permanent_user()));

drop policy folder_copies_write_own on public.folder_copies;
create policy folder_copies_insert_own on public.folder_copies for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());
create policy folder_copies_update_own on public.folder_copies for update to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user());
create policy folder_copies_delete_own on public.folder_copies for delete to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user());

drop policy chases_write_own on public.chases;
create policy chases_insert_own on public.chases for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.is_permanent_user());
create policy chases_update_own on public.chases for update to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user());
create policy chases_delete_own on public.chases for delete to authenticated
  using (owner_id = (select auth.uid()) and private.is_permanent_user());

drop policy post_attachments_write_own on public.post_attachments;
create policy post_attachments_insert_own on public.post_attachments for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_attachments.post_id
    and p.author_id = (select auth.uid()) and private.is_permanent_user()));
create policy post_attachments_delete_own on public.post_attachments for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_attachments.post_id
    and p.author_id = (select auth.uid()) and private.is_permanent_user()));

drop policy post_reactions_write_own on public.post_reactions;
create policy post_reactions_insert_own on public.post_reactions for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_permanent_user());
create policy post_reactions_update_own on public.post_reactions for update to authenticated
  using (user_id = (select auth.uid()) and private.is_permanent_user())
  with check (user_id = (select auth.uid()) and private.is_permanent_user());
create policy post_reactions_delete_own on public.post_reactions for delete to authenticated
  using (user_id = (select auth.uid()) and private.is_permanent_user());

drop policy comment_reactions_write_own on public.comment_reactions;
create policy comment_reactions_insert_own on public.comment_reactions for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_permanent_user());
create policy comment_reactions_delete_own on public.comment_reactions for delete to authenticated
  using (user_id = (select auth.uid()) and private.is_permanent_user());

create index if not exists messages_sender_idx              on public.messages (sender_id);
create index if not exists post_reactions_user_idx          on public.post_reactions (user_id);
create index if not exists comment_reactions_user_idx       on public.comment_reactions (user_id);
create index if not exists comments_parent_idx              on public.comments (parent_comment_id) where parent_comment_id is not null;
create index if not exists card_copies_collection_owner_idx on public.card_copies (collection_id, owner_id);
create index if not exists folders_collection_owner_idx     on public.folders (collection_id, owner_id);
create index if not exists folder_copies_folder_fk_idx      on public.folder_copies (folder_id, owner_id, collection_id);
create index if not exists folder_copies_copy_fk_idx        on public.folder_copies (copy_id, owner_id, collection_id);
create index if not exists folders_thumbnail_idx            on public.folders (thumbnail_copy_id) where thumbnail_copy_id is not null;
create index if not exists chases_featured_copy_idx         on public.chases (featured_copy_id) where featured_copy_id is not null;
create index if not exists chases_target_card_idx           on public.chases (target_catalog_card_id) where target_catalog_card_id is not null;
create index if not exists card_copy_media_uploader_idx     on public.card_copy_media (uploaded_by);
create index if not exists card_copy_valuations_creator_idx on public.card_copy_valuations (created_by);
create index if not exists ownership_events_new_owner_idx   on public.copy_ownership_events (new_owner_id);
create index if not exists ownership_events_prev_owner_idx  on public.copy_ownership_events (previous_owner_id);
create index if not exists conversations_creator_idx        on public.conversations (created_by);
create index if not exists orders_copy_idx                  on public.orders (copy_id);
create index if not exists watchlist_catalog_idx            on public.watchlist_items (catalog_card_id) where catalog_card_id is not null;
create index if not exists watchlist_listing_idx            on public.watchlist_items (listing_id) where listing_id is not null;
create index if not exists user_achievements_code_idx       on public.user_achievements (achievement_code);
create index if not exists share_links_collection_idx       on public.share_links (collection_id) where collection_id is not null;
create index if not exists share_links_folder_idx           on public.share_links (folder_id) where folder_id is not null;
create index if not exists share_links_copy_idx             on public.share_links (copy_id) where copy_id is not null;
create index if not exists card_sets_brand_idx              on public.card_sets (brand_id);
create index if not exists listings_grader_idx              on public.marketplace_listings (grading_company_id);
