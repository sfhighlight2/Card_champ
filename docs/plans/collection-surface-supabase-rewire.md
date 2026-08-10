# Collection surface → Supabase

Rewires the collection surface (cards, folders, chases, insights, and the
profile header that summarises them) from the prototype's `localStorage` stores
onto the Supabase backend, through the repository layer in
[`src/app/data/repositories.ts`](../../src/app/data/repositories.ts) and the
[`useCollection`](../../src/app/data/useCollection.ts) hook.

Companion to [`card-champs-supabase-architecture.md`](./card-champs-supabase-architecture.md),
which defines the schema this consumes.

## Scope

In: the collection surface, the auth gate it depends on, and the two backend
gaps that block it.

Out: marketplace, community, connections, and messaging. Those keep their mock
data this pass, behind the new id types.

## Why auth comes along

`useCollection` keys every query on `user.id` from `AuthProvider`, but `App`
still gates on its own `cardchamps:auth` localStorage record and `LoginScreen`
discards the password it collects. The collection cannot read a single row until
that is replaced, so real auth is part of this pass rather than a follow-up.

## Backend additions

One migration, `20260810040000_copy_sell_price_pop_and_folder_view_fixes.sql`.

### `card_copies`: sell price and pop report

`DetailSheet` displays them, `EditCardSheet` and `ScanCardSheet` collect them,
and nothing in the schema stored them. Three columns, following the money
convention (nonnegative `bigint` of minor units plus a 3-letter code, matching
the existing `card_copy_valuations_currency_check` regex):

| Column | Type | Meaning |
|---|---|---|
| `sell_amount_minor` | `bigint`, nullable, `>= 0` | What a marketplace would pay for this copy |
| `sell_currency` | `text not null default 'USD'`, `~ '^[A-Z]{3}$'` | Currency of the above |
| `pop_report` | `integer`, nullable, `>= 0` | The owner's own population figure for this copy |

`pop_report` is deliberately copy-level and user-entered. Population is really a
property of *(catalog card, grader, grade)*, and `population_reports` remains the
authoritative catalog-level source — but most copies carry no
`catalog_card_id`, and the prototype's semantics are "the number the owner read
off the slab". The two coexist; neither derives from the other.

Sell price is a column rather than a `card_copy_valuations` row with a distinct
`source`, because `collection_copy_details` takes the *latest* valuation
regardless of source. A sell-price row would silently overwrite estimated value.

### `collection_copy_details`: expose the three columns

Appended, so the dependent `folder_summaries` is unaffected. Re-declared
`with (security_invoker = true)`.

### `folder_summaries`: two gaps closed

Both verified against the live database.

1. **Archived copies still counted.** The view joins `folder_copies` with no
   `archived_at` filter, so a deleted card keeps inflating `card_count` and
   `total_value_minor` while the card grid correctly excludes it. Fixed by
   filtering the copy join and counting `d.id` rather than `fc.copy_id`, so
   membership rows for archived copies stop contributing.
2. **`folders.thumbnail_copy_id` ignored.** `thumbnail_path` is just the first
   member card's image. `repo.updateFolder` already accepts
   `thumbnail_copy_id` and writes it, and the view then throws it away — so the
   "Choose Thumbnail" picker cannot round-trip. Fixed by preferring the chosen
   copy's image and falling back to the first member.

`fetchFolders` reads `folder_copies` directly for `cardIds` and keeps returning
raw membership, including archived copies. `useCollection` intersects it with
the live card set, so the count the UI renders and the cards it renders always
agree.

## Type flip

`src/app/types.ts` carries the prototype's numeric ids. The collection-owned
types move to UUID strings:

- `Card.id`, `FolderType.id`, `FolderType.cardIds`, `Chase.id`,
  `Chase.pinnedCardId` → `string`
- `Listing.cardId` → `string` (it holds a card id)

`MarketItem`, `CommunityPost`, `MessageThread`, and the `watchlist` array stay
numeric; those surfaces keep their mocks.

`useCollection`'s local `Card` / `FolderType` / `Chase` mirrors are deleted and
re-imported from `types.ts`, as its own header comment anticipated. `DbCard` and
`NewCardInput` gain `sellPrice` and `popReport`.

## App wiring

`useCollection()` replaces the localStorage hooks in place. `App.tsx` is 1049
lines and worth splitting, but not in the same diff as a data-source swap — the
one exception is the ~50-line inline folders grid, which moves to
`components/cards/FolderGrid.tsx` since its counting logic is being rewritten
anyway.

**Removed stores:** `cardchamps:cards`, `:folders`, `:chases`, `:profile`,
`:auth`, `:achievements-seen`.

**Retained stores:** `:theme`, `:privacy`, `:watchlist`, `:following`,
`:listings`, `:posts`, `:threads`, `:watchlist-banner-dismissed` — all owned by
surfaces not yet migrated.

### Derived values stop being computed client-side

Per the architecture doc's rule that standing is derived, never stored:

| Value | Was | Becomes |
|---|---|---|
| Card count, total value, 30-day change | `cards.reduce(...)` | `profile_stats` via `stats` |
| Followers | `profile.followers` in localStorage | `stats.followerCount` |
| Level / tier | `computeLevel(seenAchievements.length)` | `computeLevel(earnedCount)` |
| Earned achievements | local `MILESTONES` checks | `evaluate_achievements()` |

The DB defines ten achievements including `first-chase` and `first-follow`,
which the local `MILESTONES` list never had. The toast and confetti fire on the
codes the RPC reports as newly earned, so they can no longer celebrate an
achievement the server hasn't recorded.

`computePortfolioChangePct` survives only for `InsightsView`'s trend curve —
there is still no valuation-history table to chart honestly — but `changePct`
is passed in from `stats` so Insights and the header cannot disagree.

### Sorting

`"recent"` / `"oldest"` sorted by `a.id - b.id`. UUIDs make that meaningless;
both switch to `createdAt`.

### Buying

`handleBuy` fabricated a card with `id: Date.now()`. It becomes a real
`addCard` mutation — a genuine collection write, so it belongs here even though
the marketplace it starts from is still mock data.

## Auth wiring

- `LoginScreen` takes `onSignIn(email, password)` / `onSignUp(email, password)`
  plus `error` and `busy`. Password minimum goes 4 → 6 to match Supabase's
  default, so the form stops accepting passwords the API will reject.
- Sign-up surfaces `needsConfirmation` as an explicit "check your email" state
  instead of appearing to silently fail.
- `App`'s gate becomes `useAuth()`; `handleLogout` calls `signOut()`.
- Guests (anonymous sign-in) are browse-only by design, and `useCollection`
  already disables its queries for them. The collection shows its empty state
  with a "Create an account" call to action, and every write control is
  disabled. Community and marketplace stay browsable.

### Demo seed follow-up

A second migration, `20260810040001_demo_seed_sell_price_and_pop.sql`, fills the
new columns for Andrew's twelve copies from the prototype's figures, so the
seeded collection keeps reproducing the prototype exactly and the new columns are
actually visible in the demo. Matching on the bundled artwork reference exposed a
pre-existing seed bug: one copy was stored as `local:2023`, which is not a key in
`LOCAL_ASSETS`, so `resolveImage` returned `""` and John Montague rendered as a
blank fallback tile. Repaired to `local:card5` in the same migration.

## Two things this pass breaks

- **Settings Restore / Reset.** Both write localStorage stores that no longer
  exist, and the `import_legacy_backup` / `restore_portable_backup` RPCs are
  still to come. The controls get an explicit unavailable state rather than
  buttons that corrupt collection state. `backup.test.ts` narrows to the export
  path.
- **Folder thumbnail picker.** Works only once the `folder_summaries` fix above
  lands, and stores a `copy_id` instead of a raw image URL.

## Follow-up pass: auth completion, Storage, and three more surfaces

Delivered after the collection landed, closing most of the gaps that made the
app unusable for real users.

### Password reset (was broken and unreachable)

`resetPassword` pointed `redirectTo` at `/reset-password`, a route that did not
exist — App compares `location.pathname` against a fixed set and falls through
to the collection view, so a recovery link stranded its token in the URL. It was
also dead code: nothing called it, and the form had no "Forgot password?" link.

Now: `ResetPasswordScreen` handles `/reset-password` **ahead of the sign-in
gate**, since a recovery link arrives with its own session. `AuthProvider` gains
`updatePassword` and tracks `isRecovering` off the `PASSWORD_RECOVERY` event —
without it the app cannot distinguish a recovery session from a normal sign-in.
An expired or already-used link gets an explicit "this link has expired" state
rather than a dead form.

### Scanned images to Storage (and the private-bucket bug it exposed)

Captures were written as `data:` URLs into `card_copy_media.storage_path`.
`lib/uploads.ts` now uploads to `card-images` at `{user_id}/{uuid}.jpg`, matching
the path convention the Storage policies check.

The upload happens **before** the `card_copies` insert, so a rejected image
leaves nothing half-created — that is also why the object name is a fresh uuid
rather than the copy id.

Fixing the upload surfaced a second bug: `card-images` is a **private** bucket,
and `resolveImage` was building `getPublicUrl` links for it. Every real upload
would have 404'd even after a correct upload. `signCardImages` now batch-signs
card-image paths in one request per read; `resolveImage`'s default bucket moved
to `catalog-media` so a private path can't silently take the public branch.

### Community, Connections, Messages

All three moved off mock data onto the views that already existed and had zero
consumers. Three hooks mirroring `useCollection`: `useCommunity`, `usePeers`,
`useMessages`.

What stopped being fabricated:

| Was | Now |
|---|---|
| `PEER_TIER_BADGES` — a per-handle badge map | `authorBadgeFor(achievementCount)`, the same derivation the current user's own badge uses |
| `PEER_XP_FRACTIONS` / `PEER_RING_COLORS` — hardcoded per handle | `computeLevel(achievementCount)` + `TIER_RING_STOPS` |
| Like/dislike counts incremented by hand | `community_feed` recomputes them, so they cannot drift or go negative |
| `PEERS` / `SUGGESTED` — two static rosters | "My Peers" is who you follow; "Suggested" is discoverable profiles you don't |
| Threads keyed by peer handle, no unread concept | `conversation_summaries`, with `unread` derived from `last_read_at` |
| Share-to-DM picked from the mock roster and sent nothing | Sends a real message into the pair's thread via `get_or_create_direct_conversation` |

A peer's collection is now genuinely fetched, and honestly gated:
`card_copies_select` pairs ownership with `can_read_collection`, so a private
collection returns nothing and the sheet says so instead of showing fabricated
cards. Their card *images* remain unreadable — `card_images_read_own` is
own-files-only, so an image a peer uploaded cannot be signed by us and the tile
falls back to its placeholder. Seeded peers use bundled `local:` artwork and
render fine. Widening that would need a Storage read policy keyed to public
collections, which is a deliberate backend decision, not an oversight here.

Deleted as dead: `mockPosts`, `mockPeers`, `mockThreads`, `lib/messages.ts`, and
the `Peer` / `SuggestedPeer` / `CommunityPost` / `CommunityComment` /
`MessageThread` types.

### Still not done

- **The marketplace** is the one surface still on mock data. `MARKET_ITEMS` is
  fabricated browse inventory, and `watchlist` / `listings` remain localStorage.
  The backend is ready and unused: 9 seeded `marketplace_listings`, 48
  `market_price_snapshots`, 24 `market_sale_comps`, plus `fetchListings`,
  `fetchPriceHistory`, `fetchRecentSales`, `fetchWatchlist`, `toggleWatchlist`,
  `fetchMyListings`, `createListing`, and the `place_native_order` RPC.
- **Email deliverability.** Sign-up and password reset both send through
  Supabase's built-in email, which is rate-limited to a handful per hour and not
  intended for production. Needs custom SMTP configured in the dashboard — it
  requires provider credentials, so it cannot be done from the codebase.
- **Leaked-password protection** is disabled (security advisor `WARN`). A
  dashboard toggle under Authentication → Policies.
- **Settings Import** still needs the `import_legacy_backup` /
  `restore_portable_backup` RPCs.

## Verification

`npm run typecheck` and `npm test` must pass, and the app must render the
collection against real seeded rows — Andrew Cordle's 12 cards, $8,542, +8.02% —
not merely typecheck. New tests cover the `createdAt` sort comparators, folder
count and value derivation against archived copies, and guest gating, with the
Supabase client mocked.
