# Card Champs Supabase Architecture Plan

## Summary

Replace the prototype’s `localStorage` and mock-backed state with Supabase Auth, Postgres, Storage, and Realtime while preserving every implemented surface:

- Authentication and guest browsing
- Card scanning, collection management, valuations, folders, chases, insights, and backups
- Marketplace browsing, watchlists, native/external listings, purchases, and listing status
- Profiles, interests, follows, community posts/comments/reactions, achievements, and direct messages
- Private-by-default collections with revocable sharing
- Settings, theme, privacy preferences, and legacy-data migration

The schema will distinguish canonical cards, physical copies, ownership, valuations, listings, and completed sales. This avoids duplicating catalog data and allows the same physical graded card to transfer safely between collectors.

Wallet, Notifications, Live Events, and Promotions remain out of the initial schema. Stable user, catalog, listing, order, and conversation IDs provide extension points for later migrations.

## Database Foundation

- Use Supabase CLI migrations as the only schema source of truth; never make undocumented production-only changes through the dashboard.
- Enable `citext`, `pg_trgm`, and `pgcrypto`.
- Use UUID primary keys with `gen_random_uuid()`.
- Store timestamps as `timestamptz`, all money as nonnegative `bigint` minor units plus a three-letter currency code, and grades as `numeric(3,1)`.
- Store handles without `@`, as lowercase `citext`; add `@` only in the UI.
- Prefer lookup tables and checked text status columns over hard-to-evolve Postgres enums.
- Add `created_at` and `updated_at` to mutable records and a shared trigger for `updated_at`.
- Use `archived_at` or lifecycle statuses for cards, folders, posts, listings, and orders that may have historical references. Hard-delete only disposable join rows.
- Put policy helper functions in a non-exposed `private` schema. Every `security definer` function must use `set search_path = ''` and fully qualified names.

## Tables and Relationships

### Accounts and social identity

- `profiles`
  - `id uuid PK` referencing `auth.users(id) on delete cascade`
  - `handle citext unique`, `display_name`, `bio` limited to 200 characters, `avatar_path`, `collecting_since smallint`, `chasing`
  - `is_anonymous`, `is_discoverable`, `is_verified`
  - Timestamps
  - Do not store email, passwords, follower totals, card totals, portfolio value, level, or badge here.
- `user_preferences`
  - `user_id PK/FK`
  - `theme`: `light|dark|system`
  - `hide_values boolean`
  - `locale`, `timezone`
  - `legacy_imported_at`, `legacy_backup_version`
- `interests`
  - Seeded `id`, unique `slug`, display `label`, active flag.
- `profile_interests`
  - Composite PK `(profile_id, interest_id)`.
- `user_follows`
  - Composite PK `(follower_id, followee_id)`, `created_at`
  - Check that a user cannot follow themselves.
  - Index both directions; follower/following counts remain derived.

An Auth insert trigger creates the profile and preference rows. An Auth update trigger synchronizes `is_anonymous` when an anonymous identity is upgraded. Supabase recommends using a public profile table linked to `auth.users` and testing the Auth trigger carefully because trigger failures can block signup. [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data)

### Canonical card catalog

- `sports`: unique slug and name.
- `brands`: name, optional sport, manufacturer metadata.
- `teams`: sport, name, abbreviation, active flag.
- `card_sets`: sport, brand, set name, release year, set metadata; unique on the normalized identifying tuple.
- `subjects`: athlete/character/team/other, display name, optional sport.
- `catalog_cards`
  - Set, card number, title, parallel/variant, rookie flag, autograph designation, release year, metadata JSON for provider-specific non-core fields.
  - Add generated full-text search content and GIN/trigram indexes across title, number, set, and subject names.
  - Use a normalized unique key for set, card number, and parallel.
- `catalog_card_subjects`
  - Card, subject, optional team, role, display order.
  - Supports multi-player and team cards without duplicating the catalog card.
- `grading_companies`
  - Unique code such as PSA/BGS/SGC/CGC/TAG/FWrk, full name, scale maximum, active flag.
- `marketplace_providers`
  - Unique code, name, provider type, base URL, active flag.
  - Seed eBay, Fanatics, PSA Marketplace, Card Ladder, COMC, MySlabs, and StockX.

Catalog and provider records are publicly readable but writable only by trusted server/import roles. A user-entered card that cannot be matched must not create public catalog pollution.

### Collections and physical copies

- `collections`
  - Owner, name, visibility `private|unlisted|public`, `is_default`, timestamps, optional archive time.
  - Create one private default collection for each permanent account.
  - Partial unique index allowing only one active default collection per owner.
- `card_copies`
  - Current owner and collection.
  - Nullable `catalog_card_id`.
  - Typed fallback fields for unmatched scans: title/player, year, brand, team, and card number.
  - Grading company, grade, certificate number, autograph flag, serial number, and archive time.
  - Require either a catalog card or sufficient unmatched-card identity.
  - Index owner/collection, catalog card, normalized certificate, and recent creation.
  - Do not make user-entered certificate numbers globally unique; provider verification can identify duplicates later.
- `card_copy_subgrades`
  - `(copy_id, dimension)` PK with score; supports centering, corners, edges, surface, and future grader-specific dimensions.
- `card_copy_media`
  - Copy, uploader, storage path, media type `front|back|slab|barcode|other`, sort order, timestamps.
  - One partial unique primary image per copy/media type.
- `copy_ownership_events`
  - Copy, previous owner, new owner, event type `added|imported|purchased|sold|transferred|removed`, amount/currency, provider, order, occurred time.
  - Append-only audit trail; native sales transfer the existing physical copy instead of cloning it.
- `card_copy_valuations`
  - Copy, amount/currency, source `user|provider|sale_comp|system`, optional provider, observed time, created-by user.
  - Latest valuation comes from a view; never overwrite history.
- `population_reports`
  - Catalog card, grader, grade, population, provider, observed time.
  - This replaces the prototype’s copy-level `popReport`.
- `folders`
  - Owner, collection, name, color, optional thumbnail copy, visibility, timestamps, archive time.
- `folder_copies`
  - Owner, folder, copy, position, created time.
  - Composite foreign keys must guarantee that folder and copy belong to the same owner and collection.
- `chases`
  - Owner, title, description, optional target catalog card, featured owned copy, preferred grader, minimum grade, maximum amount/currency, priority, status `active|fulfilled|archived`, timestamps.
  - Current free-text chases continue to work; structured criteria enable later matching and alerts.

### Marketplace and market analytics

- `marketplace_listings`
  - Source type `native|external`.
  - Provider and external ID/URL for external listings.
  - Seller and physical copy for native listings.
  - Catalog card, grader/grade snapshot, title snapshot, condition, asking amount/currency, shipping country.
  - Status `draft|active|reserved|sold|cancelled|expired`, published/expiry timestamps, server-maintained view count.
  - Checks enforce native seller/copy requirements and external provider/reference requirements.
  - Unique `(provider_id, external_id)` for imported listings and one active native listing per copy.
- `market_sale_comps`
  - Provider, catalog card, grader/grade, sold amount/currency, sold time, external reference/URL.
  - Trusted ingestion only.
- `market_price_snapshots`
  - Catalog card, optional grader/grade/provider, amount/currency, observation time, methodology.
  - Powers marketplace price charts and portfolio movement.
- `watchlist_items`
  - User plus exactly one of `catalog_card_id` or `listing_id`.
  - Composite uniqueness prevents duplicates.
- `orders`
  - Buyer, seller, native listing, physical copy, subtotal/fees/total/currency, status `pending|awaiting_payment|paid|cancelled|fulfilled|refunded`, timestamps.
  - A native listing can have only one non-cancelled order.
  - Payment-provider IDs and a payment ledger are deliberately deferred until payment functionality is selected.
  - External “Buy” actions redirect to the provider; after purchase, the user can record the acquisition as a new physical copy and ownership event.

Native order placement must use a transaction with row locking: verify the listing is active, reserve it, create the order, and prevent double purchase. Only a later trusted payment/fulfillment operation may transfer ownership.

### Community

- `community_topics`: seeded slug, label, emoji, sort order, active flag.
- `posts`
  - Author, topic, body, hot score, moderation status, timestamps, edit/delete times.
- `post_attachments`
  - Post, attachment type, optional catalog card, public community-media path, sort order.
  - Publishing a private card uses a sanitized snapshot/public attachment and does not expose its private copy row.
- `post_reactions`
  - `(post_id, user_id)` PK, reaction `like|dislike`, timestamp.
  - Switching reaction updates the existing row; removing a reaction deletes it.
- `comments`
  - Post, author, optional parent comment, body, moderation status, timestamps, edit/delete times.
- `comment_reactions`
  - `(comment_id, user_id)` PK, initially `like`.
- Likes, dislikes, comment totals, “hot” state, and author badges are derived through queries/views rather than trusted client counters.

### Messaging

- `conversations`
  - Type `direct|group`, creator, unique direct-pair key where applicable, last-message time, timestamps.
- `conversation_members`
  - Conversation, user, joined/left times, last-read time, muted flag, role.
  - Composite PK and user index.
- `messages`
  - Conversation, sender, kind `text|share`, body, reply target, created/edited/deleted times.
- `message_attachments`
  - Message, attachment type, storage path, catalog card, or share-link reference.
- `get_or_create_direct_conversation(other_user_id)` creates one stable direct thread regardless of which participant starts it.
- Use private Realtime Broadcast channels scoped to the conversation. Supabase currently recommends Broadcast over raw Postgres Changes for scalability and security. [Supabase Realtime guidance](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)

### Sharing and achievements

- `share_links`
  - Owner, target type `collection|folder|card_copy`, exactly one target FK, SHA-256 token hash, value-visibility flag, expiry, revoked time, access count, timestamps.
  - Return the raw token only when created; never store it.
  - A resolver returns only sanitized target data after checking token, expiration, revocation, and target visibility.
  - Private card images require short-lived signed Storage URLs from a trusted share resolver when public share pages are implemented.
- `achievement_definitions`
  - Seeded code, label, metric, threshold, sort order, active flag.
- `user_achievements`
  - `(user_id, achievement_code)` PK, earned time, context JSON.
  - A private evaluation function runs after qualifying card, folder, watchlist, listing, and post changes. Achievements are immutable once earned.

Do not create Wallet, Notification, Event, or Promotion tables in this migration. Message unread state is handled by `conversation_members.last_read_at`; that is not a notification system.

## Views, RPCs, and Client Interfaces

Create `security_invoker` views:

- `collection_copy_details`: physical copy plus canonical identity, grader, primary image, latest valuation, and change percentage.
- `folder_summaries`: folder count, total latest value, and thumbnail.
- `market_listing_details`: listing, catalog identity, primary image, latest market data, and seller summary.
- `community_feed`: author/topic data and aggregated reaction/comment counts.
- `conversation_summaries`: peer/group information, last message, timestamp, and unread count.

Required transactional RPCs:

- `complete_profile_setup(display_name, handle)`
- `get_or_create_direct_conversation(other_user_id)`
- `place_native_order(listing_id)`
- `fulfill_native_order(order_id)`—trusted server only
- `create_share_link(target_type, target_id, options)`
- `resolve_share_link(raw_token)`
- `import_legacy_backup(payload jsonb)`
- `restore_portable_backup(payload jsonb)`
- `evaluate_achievements(user_id)`—private trigger helper

Generate TypeScript database types from the schema. Replace numeric IDs and epoch milliseconds in the current UI types with UUID strings and ISO timestamps. Add DTO adapters during migration so presentation components do not directly depend on raw joined Supabase rows.

## Security and Storage

- Enable and force RLS on every exposed table.
- Add indexes for every ownership, membership, and foreign-key field used in RLS.
- Use `(select auth.uid())` in policies and explicitly reject null identities.
- Anonymous Supabase users use the `authenticated` role, so add restrictive policies based on the JWT `is_anonymous` claim. They may browse public profiles, catalog, marketplace, and community data but cannot write any application table. Enable Turnstile/CAPTCHA and schedule cleanup of anonymous Auth users older than 30 days. [Supabase anonymous-auth guidance](https://supabase.com/docs/guides/auth/auth-anonymous)
- Permanent users may:
  - Manage only their profiles, preferences, private collections, copies, folders, chases, valuations, and watchlists.
  - Read another collection/copy only when public or returned through a valid share resolver.
  - Follow, post, react, comment, message, list, and order only as themselves.
  - Read messages only in conversations where they are active members.
- Catalog, provider, external listing, sale-comp, price snapshot, verification, moderation, fulfillment, and achievement-definition writes are service-role only.
- Seller and buyer can read their orders; only trusted operations change payment/fulfillment states.
- Never expose a Supabase secret/service key through Vite. The browser receives only `VITE_SUPABASE_URL` and the current publishable key.

Storage buckets:

- `avatars`: public-read; permanent users write only under `{user_id}/`.
- `card-images`: private; owner-scoped paths and RLS.
- `community-media`: public-read, permanent author writes under `{user_id}/`, with size/type limits.
- `catalog-media`: public-read, trusted imports only.
- `message-media`: private and accessible only to active conversation members.

Private buckets require RLS for access; public sharing of private media must use authorized downloads or signed URLs. [Supabase Storage access model](https://supabase.com/docs/guides/storage/buckets/fundamentals)

## Application Migration

- Add `@supabase/supabase-js` and a single browser client module, Auth provider, query/repository layer, and generated database types.
- Add a server-state cache such as TanStack Query for loading, mutation state, optimistic updates, and targeted invalidation.
- Replace the mock authentication handlers with email/password signup, confirmation, signin, password recovery, signout, session restoration, and `signInAnonymously()` for guest browsing.
- Replace each top-level `useLocalStorage` domain store in `App.tsx` with owner-scoped queries/mutations. Retain local storage only as:
  - A fast mirror for theme before first paint.
  - Temporary unsaved form state.
  - The untouched legacy backup until migration is confirmed.
- Keep mock catalog, market, peer, community, and thread data only in local development seed data; production must not silently create celebrity profiles or starter collections.
- Convert the bundled 12 cards into catalog/dev seed records. New permanent accounts start with an empty private collection.
- Implement a one-time legacy migration:
  - Detect the existing `cardchamps:*` keys after permanent authentication.
  - Validate versions 1/2, show counts and request confirmation.
  - Import atomically and idempotently.
  - Match known cards to canonical catalog records; import unknown cards using typed fallback fields.
  - Convert folders to join rows, subgrades to rows, value to a valuation event, and profile tags to interests.
  - Import legacy listings as drafts, never as live listings or completed sales.
  - Do not import mock posts/messages as user-created content.
  - Set `legacy_imported_at` only after the full transaction succeeds and retain the original local data until the user explicitly removes it.
- Introduce backup version 3 for portable owner data: profile, preferences, collections, copies, media metadata, valuations, folders, chases, watchlist, and follows. Exclude messages, posts, reactions, orders, sale history, and live listing state; restored listings become drafts.
- Server-managed market ingestion later uses Edge Functions, Cron, and Vault-held provider secrets. The browser never writes external prices or sale comps. Supabase supports scheduled Edge Function invocation through Cron/Vault when that work begins. [Supabase scheduling guidance](https://supabase.com/docs/guides/functions/schedule-functions)

## Test and Acceptance Plan

- Preserve the current clean baseline: TypeScript passes and all 38 existing tests remain green.
- Add migration-reset and seed verification against a local Supabase instance.
- Add database tests for constraints, ownership-preserving folder joins, latest valuation selection, reaction uniqueness, one direct conversation per pair, one active native listing per copy, and one non-cancelled order per listing.
- Add an RLS matrix covering unauthenticated, anonymous guest, owner, unrelated permanent user, conversation member, buyer, seller, and trusted service roles for every table and Storage bucket.
- Verify anonymous guests can browse but cannot insert/update/delete even though they use the `authenticated` Postgres role.
- Verify cross-user collection, valuation, message, media, order, and draft-listing access is rejected.
- Race-test two buyers placing an order on the same listing; exactly one may reserve it.
- Verify native fulfillment removes seller folder memberships, transfers the existing copy, records ownership history, and prevents the seller from retaining private access.
- Verify external purchases create new copies without mutating provider listings.
- Verify post reaction switches cannot produce negative or double-counted totals.
- Verify private Realtime conversation channels reject non-members.
- Verify share tokens are stored hashed, expire/revoke correctly, hide values when configured, and never expose unrelated collection data.
- Verify legacy import is atomic, idempotent, preserves the original local backup, and handles malformed/corrupt data without partial writes.
- Add browser tests for signup/signin/recovery, guest browse restrictions, scan/add/edit/archive card, folder operations, chase operations, watchlist, listing lifecycle, order reservation, community post/comment/reaction, follow/unfollow, messaging/unread state, profile settings, backup/restore, and signout/session restoration.
- Run `supabase db reset`, generated-type drift checks, `npm run typecheck`, unit tests, production build, and browser tests in CI.

## Assumptions and Defaults

- “Superbase” means Supabase.
- “Adding function line later” is treated as adding more functionality later; speculative coming-soon modules are intentionally excluded.
- Collections are private by default; public access requires an explicit visibility change or revocable share link.
- Anonymous guests receive Supabase anonymous identities but are browse-only.
- Permanent authentication initially uses email/password with email confirmation and password recovery; the schema remains OAuth-compatible.
- USD is the initial UI currency, but every stored monetary value includes a currency code.
- Payments, payouts, wallets, provider API ingestion, moderation tooling, and notification delivery are later phases. Clients cannot mark orders paid or fulfilled.
