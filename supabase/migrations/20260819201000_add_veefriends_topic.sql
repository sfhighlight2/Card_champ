-- Add the VeeFriends community topic (owner request, 2026-08-19). sort_order 25
-- places it between Basketball (20) and Pokémon (30), matching the design's
-- Frame 8 tile order. Idempotent: re-running just reactivates/repositions it.
insert into public.community_topics (slug, label, emoji, is_active, sort_order)
values ('veefriends', 'VeeFriends', '😺', true, 25)
on conflict (slug) do update
set label = excluded.label, is_active = true, sort_order = excluded.sort_order;
