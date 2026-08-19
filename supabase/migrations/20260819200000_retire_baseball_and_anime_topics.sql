-- Retire the Baseball and Anime community topics (owner request, 2026-08-19).
-- Deactivated rather than deleted: baseball still has live posts, which keep
-- their tag; the topics just disappear from the rail and the New Post picker.
update public.community_topics
set is_active = false
where slug in ('baseball', 'anime');
