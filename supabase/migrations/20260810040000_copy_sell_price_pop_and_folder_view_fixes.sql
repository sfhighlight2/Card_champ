-- Card Champs — copy-level sell price / pop report, and two folder_summaries fixes
--
-- The collection UI displayed a sell price and a pop report per card and had
-- nowhere to store either, so both were silently discarded on save. They become
-- real columns here.
--
-- Sell price is a column on card_copies rather than a card_copy_valuations row
-- with its own `source`, because collection_copy_details takes the *latest*
-- valuation regardless of source — a sell-price row would overwrite estimated
-- value.
--
-- pop_report is deliberately copy-level and user-entered. Population is really a
-- property of (catalog card, grader, grade), and public.population_reports stays
-- the authoritative catalog-level source; but most copies carry no
-- catalog_card_id, and this column means "the number the owner read off the
-- slab". Neither derives from the other.

alter table public.card_copies
  add column sell_amount_minor bigint  check (sell_amount_minor >= 0),
  add column sell_currency     text    not null default 'USD'
                                       check (sell_currency ~ '^[A-Z]{3}$'),
  add column pop_report        integer check (pop_report >= 0);

-- ---------------------------------------------------------------------------
-- collection_copy_details: expose the three new columns
-- ---------------------------------------------------------------------------
-- Appended at the end, so the dependent folder_summaries view is unaffected.

create or replace view public.collection_copy_details
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
  end                                                     as change_pct,
  cc.sell_amount_minor,
  cc.sell_currency,
  cc.pop_report
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

-- ---------------------------------------------------------------------------
-- folder_summaries: stop counting archived copies, and honour thumbnail_copy_id
-- ---------------------------------------------------------------------------
-- Two bugs the collection surface exposed:
--
-- 1. The copy join carried no archived_at filter, so a soft-deleted card kept
--    inflating card_count and total_value_minor while the card grid correctly
--    excluded it. The count now counts d.id (null for an archived or missing
--    copy) instead of fc.copy_id, whose membership row survives archival.
--
-- 2. thumbnail_path ignored folders.thumbnail_copy_id entirely and always
--    returned the first member card's image, so the folder thumbnail picker —
--    which repo.updateFolder already persists — could never round-trip. The
--    chosen copy now wins, with the first member as the fallback.

create or replace view public.folder_summaries
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
  count(d.id)                                as card_count,
  coalesce(sum(d.value_minor), 0)::bigint     as total_value_minor,
  thumb.image_path                           as thumbnail_path
from public.folders f
left join public.folder_copies fc on fc.folder_id = f.id
left join public.collection_copy_details d
       on d.id = fc.copy_id and d.archived_at is null
left join lateral (
  select coalesce(
    (select d2.image_path
       from public.collection_copy_details d2
      where d2.id = f.thumbnail_copy_id
        and d2.archived_at is null),
    (select d3.image_path
       from public.folder_copies fc2
       join public.collection_copy_details d3
         on d3.id = fc2.copy_id and d3.archived_at is null
      where fc2.folder_id = f.id
      order by fc2.position, fc2.created_at
      limit 1)
  ) as image_path
) thumb on true
group by f.id, f.owner_id, f.collection_id, f.name, f.color, f.visibility,
         f.archived_at, f.created_at, thumb.image_path;
