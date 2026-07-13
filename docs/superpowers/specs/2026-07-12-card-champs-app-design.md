# Card Champs — Working Application Design

Date: 2026-07-12
Status: Approved

## Context

Card Champs is a Figma Make export: a React 18 + Vite + Tailwind + shadcn/ui
mobile-frame prototype for tracking a sports trading card collection, with
three tabs — Cards (collection + folders), Shop (marketplace), Peers
(social/leaderboard). It has never been installed (`node_modules` absent,
no lockfile) and is not a git repository. All data is hardcoded mock
arrays; all state is in-memory `useState` (nothing survives a refresh);
the entire UI is boxed inside a `max-w-[430px]` phone frame centered on a
blank page. Almost every component lives in one 2417-line file,
`src/app/App.tsx`.

Goal: turn this into a real, working, responsive web application with no
backend/database — data lives in the browser via `localStorage` — treating
all three tabs (Cards, Shop, Peers) as genuine product surfaces, not just
the Cards tab.

## Non-goals

- No backend, no real database, no real payments, no real other users.
- No auth/accounts.
- No native mobile app packaging.
- No redesign of the visual style — keep the existing look and feel.

## 1. Getting it running

- `pnpm-workspace.yaml` restricts `supportedArchitectures.os` to `linux`,
  which would break native optional deps (esbuild/rollup) if installed via
  pnpm on macOS. Fix: install with plain `npm install` instead of fighting
  the pnpm config (no lockfile exists yet either way).
- Verify `npm run dev` boots and `npm run build` succeeds as a baseline
  before making further changes.
- Initialize a git repository at the project root so this (and future)
  work is tracked and revertible.

## 2. Code structure

Split `src/app/App.tsx` into:

- `src/app/types.ts` — `Card`, `FolderType`, `Peer`, `MarketItem`,
  `Listing`, `Profile` types.
- `src/app/data/mockCards.ts` — `ALL_CARDS` (seed only, used once), grader
  colors, grade tables, years/brands/teams constants.
- `src/app/data/mockMarket.ts` — `MARKET_ITEMS`.
- `src/app/data/mockPeers.ts` — `PEERS`, `SUGGESTED`.
- `src/app/hooks/useLocalStorage.ts` — generic persisted-state hook.
- `src/app/hooks/use3DTilt.ts` — extracted tilt hook.
- `src/app/components/shared/` — `ShareSheet`, `ConfirmDialog` (new),
  `AnimateIn`, `CountUp`, `ScrollPicker`.
- `src/app/components/cards/` — `CardTile`, `CardListRow`, `DetailSheet`,
  `ScanCardSheet`, `EditCardSheet` (new), `NewFolderSheet`,
  `EditFolderSheet` (new), `FolderDetailView`.
- `src/app/components/market/` — `MarketView`, `MarketCardDetailSheet`,
  `SellFlow`, `BuyConfirmSheet` (new).
- `src/app/components/peers/` — `PeersView`, `PeerProfileSheet`.
- `src/app/components/settings/` — `SettingsView` (new): profile edit,
  export/import, reset.
- `src/app/App.tsx` — composition root: routing, top-level persisted
  state, layout shell.

## 3. Data & persistence model

Generic hook:

```ts
function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>]
```

Backed stores, each namespaced `cardchamps:<name>`:

| store | seeded from | shape |
|---|---|---|
| `cards` | `ALL_CARDS` (once, if store doesn't exist yet) | `Card[]` |
| `folders` | existing default 2 folders (once) | `FolderType[]` |
| `profile` | `{ name: "Andrew Cordle", handle: "@andrewcordle", avatar }` (once) | `Profile` |
| `watchlist` | `[]` | `number[]` (market item indices/ids) |
| `following` | `[]` | `string[]` (peer handles) |
| `listings` | `[]` | `Listing[]` |

`cards` unifies the current `ALL_CARDS`/`userCards` split — today seed cards
can't be edited or deleted because they come from a static import; after
this change everything in "your collection" is one persisted, fully
mutable array. `MARKET_ITEMS` and `PEERS`/`SUGGESTED` remain static seed
data (they represent an external marketplace and other users we can't
actually run) — only your interactions with them (watchlist, follow,
listings, purchases) persist.

Seeding happens lazily inside `useLocalStorage`'s initializer: if the key
isn't present yet, write the seed value; otherwise use what's stored.

## 4. Layout — responsive, not phone-frame

- Replace the fixed `max-w-[430px]` centered frame with a fluid container
  that widens at `md`/`lg` breakpoints.
- Card grids: `grid-cols-3` (mobile) → `md:grid-cols-4` → `lg:grid-cols-6`.
- Profile header: stacked/centered on mobile, horizontal (avatar left,
  stats right) at `md+`.
- Bottom sheets (Scan, Share, Sell, Edit, Detail, etc.) keep the
  slide-up-from-bottom mobile pattern but cap content width at `md+`
  (`max-w-lg mx-auto`) instead of stretching edge-to-edge.
- Floating bottom action bar (Scan/Share/Sell) stays fixed-bottom-centered
  at all sizes.

## 5. Feature additions

- **Edit card**: new `EditCardSheet`, single-page form (not the multi-step
  scan wizard) pre-filled with the card's current fields, reachable from
  `DetailSheet`. Saves in place in the `cards` store.
- **Delete card**: reachable from `DetailSheet` via `ConfirmDialog`
  ("Delete this card? This can't be undone."). Removes from `cards` and
  from any folder's `cardIds`.
- **Edit folder**: rename + recolor, reachable from `FolderDetailView`
  header.
- **Delete folder**: `ConfirmDialog`, reachable from `FolderDetailView`
  header. Removes the folder; does not delete its cards.
- **Buy (Shop)**: tapping "Buy" opens a `BuyConfirmSheet`
  ("Buy for $X — adds this card to your collection"); confirming appends a
  new entry to `cards` (cloned from the `MarketItem`, fresh id/cert) and
  shows a toast. No real transaction.
- **Watchlist**: heart/bookmark toggle on market item tiles and
  `MarketCardDetailSheet`; new "Watchlist" sub-tab in `MarketView` listing
  saved items.
- **Sell flow → My Listings**: `SellFlow`'s final step appends a `Listing`
  to the `listings` store instead of just showing a success screen; "My
  Listings" tab reads from `listings` (replacing the 3 hardcoded rows),
  supports marking sold / removing.
- **Follow (Peers)**: `following` persisted globally (moved out of
  component-local state in `PeersView`); follow state survives navigation
  and refresh.
- **Share "Copy Link"**: writes the share text to
  `navigator.clipboard.writeText` for real (currently just flips a
  `copied` boolean with no clipboard write).
- **Settings screen**: new gear icon in the top bar opens `SettingsView`:
  - Edit profile name/handle (avatar stays one of the bundled images for
    now — no upload pipeline).
  - Export: downloads a JSON file of all stores (`cards`, `folders`,
    `profile`, `watchlist`, `following`, `listings`).
  - Import: file picker restores all stores from a previously exported
    JSON file, after a confirm step warning it overwrites current data.
  - Reset: clears all stores back to the original seed data, behind a
    confirm step.
- **Routing**: introduce `react-router` (already an unused dependency) for
  the three main tabs plus Settings: `/`, `/shop`, `/peers`, `/settings`.
  Enables working browser back/forward and refresh-safe navigation.
  Sheets/modals (card detail, folder detail, edit, scan, sell, share,
  buy-confirm) remain state-driven overlays, not routed — keeps the change
  scoped and avoids deep-linking complexity for transient UI.

## Error handling

- `useLocalStorage`: reading corrupted/invalid JSON from a key falls back
  to the seed value rather than throwing (wrap `JSON.parse` in try/catch).
- Import: validate the uploaded JSON has the expected top-level keys
  before applying; on failure, show a toast ("Invalid backup file") and
  leave existing data untouched.
- Delete/reset actions are confirm-gated since there is no undo (no
  database, no version history).

## Testing / verification

No existing test suite. Verification is manual, end-to-end, in a browser
after implementation:

1. `npm run build` — type-check/build baseline.
2. Add a card via Scan, edit it, delete it.
3. Create a folder, add/remove cards, rename it, delete it.
4. Buy a Shop item, confirm it lands in Cards; add/remove a Watchlist
   item.
5. Create a listing via Sell, confirm it shows in My Listings; mark it
   sold.
6. Follow a peer, refresh the page, confirm it's still followed.
7. Copy-link a card, confirm clipboard contains the text.
8. Export a backup, reset data, import the backup, confirm data is
   restored.
9. Resize the browser window mobile → tablet → desktop, confirm grids and
   sheets adapt without visual breakage.
