# Card Champs — Supabase

Schema source of truth. Every change is a migration file in `migrations/`;
nothing is edited directly in the dashboard.

- **Project ref:** `evwjqanebbdjfxaayupo`
- **API URL:** `https://evwjqanebbdjfxaayupo.supabase.co`
- **Region:** ca-central-1 · **Postgres:** 17.6
- **Design doc:** [`../docs/plans/card-champs-supabase-architecture.md`](../docs/plans/card-champs-supabase-architecture.md)

## Migrations

| Version | Name | Local file? | Contents |
|---|---|---|---|
| `20260810004602` | `foundation` | yes | `citext` / `pg_trgm` / `pgcrypto`, the non-exposed `private` schema, `set_updated_at()`, `is_permanent_user()` |
| `20260810004631` | `profiles` | yes | `profiles`, `user_preferences`, `interests`, `profile_interests`, `user_follows`, auth insert/update triggers |
| `20260810004701` | `catalog` | yes | `sports`, `brands`, `teams`, `card_sets`, `subjects`, `catalog_cards`, `catalog_card_subjects`, `grading_companies`, `marketplace_providers` + seeds |
| `20260810004807` | `collections` | yes | `collections`, `card_copies`, subgrades/media/valuations, `copy_ownership_events`, `population_reports`, `folders`, `folder_copies`, `chases` |
| `2026081001xxxx` | `marketplace` | yes | `marketplace_listings`, `market_sale_comps`, `market_price_snapshots`, `watchlist_items`, `orders`, `place_native_order()` |
| `2026081001xxxx` | `community` | yes | `community_topics`, `posts`, `post_attachments`, `post_reactions`, `comments`, `comment_reactions` |
| `2026081001xxxx` | `messaging` | yes | `conversations`, `conversation_members`, `messages`, `message_attachments`, `get_or_create_direct_conversation()` |
| `2026081001xxxx` | `achievements_sharing_views` | yes | achievements, `share_links`, and the five `security_invoker` views |
| `2026081001xxxx` | `revoke_rpc_execute_from_anon` | yes | removes `anon` EXECUTE on all four RPCs |
| — | `fix_placeholder_handle_collisions` | **NO** | replaces the uuid-derived placeholder handle with a sequence |
| — | `demo_seed` | **NO** | Andrew Cordle + peer roster, cards, folders, chases, posts, DMs, listings |
| — | `fix_catalog_card_identity` | **NO** | gives seeded catalog cards a `card_number` so distinct players in one set stop colliding |
| `20260810040000` | `copy_sell_price_pop_and_folder_view_fixes` | yes | `card_copies.sell_amount_minor` / `sell_currency` / `pop_report`, exposed through `collection_copy_details`; `folder_summaries` stops counting archived copies and finally honours `folders.thumbnail_copy_id` |
| `20260810040001` | `demo_seed_sell_price_and_pop` | yes | fills the new columns for Andrew's twelve copies, and repairs one copy seeded with the unresolvable image ref `local:2023` |

> **Known gap:** the last three migrations were applied to the remote database
> but do not yet have local `.sql` files, so `migrations/` is not a complete
> record. Recover them before relying on `supabase db reset`:
>
> ```sh
> supabase link --project-ref evwjqanebbdjfxaayupo
> supabase db pull        # writes the remote history back into migrations/
> ```

Still to come: the `import_legacy_backup` / `restore_portable_backup` /
`resolve_share_link` / `complete_profile_setup` RPCs, and Storage buckets
(`avatars`, `card-images`, `community-media`, `catalog-media`, `message-media`).

## Demo content

Andrew Cordle and the peer roster are **real seeded accounts** (10 profiles),
not client-side mocks, so follows, DMs, and community posts operate on real
rows. Their images use a `local:<key>` reference resolved by
[`src/app/lib/media.ts`](../src/app/lib/media.ts) to the bundled artwork in
`src/imports`, so nothing needs uploading to Storage.

Andrew's collection reproduces the prototype exactly: 12 cards, $8,542, +8.02%.
Peers hold 6 cards each — real rows rather than the mock's fabricated
"142 cards / $284,000" counters.

To remove all demo content later:

```sql
delete from auth.users where email like '%@demo.cardchamps.invalid';
```

## Conventions

- UUID primary keys; `timestamptz` everywhere.
- Money is a nonnegative `bigint` of **minor units** plus a 3-letter currency
  code — never a float. Grades are `numeric(3,1)`.
- Checked text status columns, never Postgres enums.
- Handles are stored **without** a leading `@`, as case-insensitive `citext`.
  The UI adds the `@`.
- RLS is **enabled and forced** on every exposed table. `postgres` and
  `service_role` hold `BYPASSRLS`, so security-definer triggers and trusted
  server operations still function under `FORCE`.
- Guests are browse-only. Supabase anonymous users authenticate as the
  `authenticated` Postgres role, so role membership alone cannot tell a guest
  from a real account — every write policy pairs ownership with
  `private.is_permanent_user()`.
- Derived, never stored: follower counts, card totals, portfolio value, level,
  badges, post like/comment counts. A client cannot inflate its own standing.

## Working with the CLI

The CLI is not installed yet. Migrations so far were applied through the
Supabase MCP connector and are recorded in the remote migration history under
the versions above.

```sh
brew install supabase/tap/supabase
supabase link --project-ref evwjqanebbdjfxaayupo
supabase migration list          # local files vs. remote history
supabase db reset                # rebuild a local stack from migrations/
```

## App configuration

The browser only ever receives the URL and the publishable key:

```sh
VITE_SUPABASE_URL=https://evwjqanebbdjfxaayupo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The `service_role` key must never be exposed through Vite, committed, or used
in client code.
