-- Card Champs — stream new messages to open chats
--
-- The `supabase_realtime` publication existed with no tables in it, so a chat
-- only ever showed what was cached when it opened: the recipient saw nothing
-- until something else happened to invalidate the query. A conversation where
-- replies do not arrive is not a conversation.
--
-- RLS still applies to realtime `postgres_changes`, so a subscriber is only sent
-- message rows that `messages_select_member` already lets them read — being on
-- the channel grants nothing extra.
--
-- Only INSERT matters here, so the table's default replica identity is enough;
-- REPLICA IDENTITY FULL would only be needed to receive the previous row on
-- UPDATE or DELETE.

alter publication supabase_realtime add table public.messages;
