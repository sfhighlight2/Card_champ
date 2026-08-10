-- Storage buckets and their access policies.
--
-- Path convention is `{user_id}/...` for every user-writable bucket, so the
-- owner check is the first path segment. Card images are PRIVATE: a collection
-- is private by default, and its images must not be guessable by URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',         'avatars',         true,  2 * 1024 * 1024, array['image/jpeg','image/png','image/webp']),
  ('card-images',     'card-images',     false, 8 * 1024 * 1024, array['image/jpeg','image/png','image/webp']),
  ('community-media', 'community-media', true,  8 * 1024 * 1024, array['image/jpeg','image/png','image/webp']),
  ('catalog-media',   'catalog-media',   true,  8 * 1024 * 1024, array['image/jpeg','image/png','image/webp']),
  ('message-media',   'message-media',   false, 8 * 1024 * 1024, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy avatars_read on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'avatars');

create policy avatars_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and private.is_permanent_user()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy card_images_read_own on storage.objects
  for select to authenticated
  using (bucket_id = 'card-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy card_images_write_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'card-images'
    and private.is_permanent_user()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy card_images_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'card-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy card_images_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'card-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy community_media_read on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'community-media');

create policy community_media_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'community-media'
    and private.is_permanent_user()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy community_media_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'community-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- trusted imports only — no client write policy
create policy catalog_media_read on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'catalog-media');

-- path convention here is `{conversation_id}/{...}`
create policy message_media_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'message-media'
    and private.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );

create policy message_media_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'message-media'
    and private.is_permanent_user()
    and private.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );
