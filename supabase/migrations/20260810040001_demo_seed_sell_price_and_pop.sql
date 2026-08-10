-- Card Champs — demo seed: sell price and pop report for Andrew Cordle's copies
--
-- Demo content, not schema. The previous migration added the columns; this fills
-- them for the seeded collection so it keeps reproducing the prototype exactly,
-- as supabase/README.md claims. Without it, Andrew's twelve cards show no Sell
-- Price or Pop Report tile and the new columns are invisible in the demo.
--
-- Matched on the bundled artwork reference rather than certificate_number: the
-- prototype reused cert 068264764 across three different cards, so it is not a
-- unique key. `local:cardN` is.
--
-- Also repairs one broken reference the match exposed: John Montague's copy was
-- seeded as `local:2023`, which is not a key in LOCAL_ASSETS (src/app/lib/media.ts),
-- so resolveImage returned "" and the card rendered as a blank fallback tile
-- instead of its bundled artwork. It should be `local:card5`.

update public.card_copy_media m
   set storage_path = 'local:card5'
 where m.storage_path = 'local:2023'
   and exists (
     select 1 from public.card_copies cc
      where cc.id = m.copy_id
        and cc.owner_id = (select id from public.profiles where handle = 'andrewcordle')
   );

update public.card_copies cc
   set sell_amount_minor = v.sell_price * 100,
       pop_report        = v.pop_report
  from (values
    ('local:card1',  380,  4821),
    ('local:card2',  2000, 1152),
    ('local:card3',  210,  3290),
    ('local:card4',  115,  88),
    ('local:card5',  50,   142),
    ('local:card6',  365,  4821),
    ('local:card7',  1050, 2104),
    ('local:card8',  4800, 23),
    ('local:card9',  720,  312),
    ('local:card10', 45,   67),
    ('local:card11', 65,   44),
    ('local:card12', 48,   1876)
  ) as v (image_ref, sell_price, pop_report)
 where cc.owner_id = (select id from public.profiles where handle = 'andrewcordle')
   and exists (
     select 1 from public.card_copy_media m
      where m.copy_id = cc.id
        and m.storage_path = v.image_ref
   );
