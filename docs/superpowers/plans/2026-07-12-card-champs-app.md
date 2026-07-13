# Card Champs Working Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Card Champs Figma Make export into a working, responsive, localStorage-persisted web app with real edit/delete/buy/watchlist/follow/settings functionality across all three tabs (Cards, Shop, Peers).

**Architecture:** Split the 2417-line `src/app/App.tsx` into focused modules (types, seed data, hooks, one file per UI component), back all mutable app state with a generic `useLocalStorage` hook, add `react-router` for the four top-level destinations (`/`, `/shop`, `/peers`, `/settings`), and make grids/sheets responsive at `md`/`lg` breakpoints instead of a fixed 430px phone frame.

**Tech Stack:** React 18, Vite 6, TypeScript, Tailwind CSS v4, lucide-react, recharts, react-router 7, Vitest + @testing-library/react (new, for logic-only unit tests).

Spec: `docs/superpowers/specs/2026-07-12-card-champs-app-design.md`

**Baseline:** everything currently lives in `src/app/App.tsx` (already committed as commit `35e5818` in this repo — "Import Card Champs Figma Make export"). Every task below either creates a new file or extracts/modifies a known section of that original file.

---

## Task 1: Install dependencies, add TypeScript config, verify baseline

**Files:**
- Create: `tsconfig.json`
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

Run: `cd "/Volumes/Ext SSD/Aspire/Card Champs" && npm install`

Expected: installs without error (do **not** use `pnpm` — `pnpm-workspace.yaml` restricts `supportedArchitectures.os` to `linux`, which breaks native optional deps like esbuild/rollup on macOS).

- [ ] **Step 2: Verify the dev server boots**

Run: `npm run dev -- --port 5183 &` then `sleep 2 && curl -sf http://localhost:5183/ > /dev/null && echo OK`; then stop the background dev server (`kill %1`).

Expected: `OK` printed, no error output from vite.

- [ ] **Step 3: Verify the production build succeeds**

Run: `npm run build`

Expected: exits 0, prints a `dist/` build summary.

- [ ] **Step 4: Add a TypeScript config**

The project has no `tsconfig.json` today, so nothing type-checks it — `vite build` only transpiles via esbuild. Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Add `typescript` and a `typecheck` script**

Modify `package.json`: add `"typecheck": "tsc --noEmit"` to `"scripts"`, and add `"typescript": "5.7.3"` to `"devDependencies"`.

Run: `npm install` again to pull in `typescript`, then `npm run typecheck`.

Expected: it will report real pre-existing errors (implicit `React.X` type usages with no `React` import — these get fixed as each file is extracted in later tasks; do not fix them in `App.tsx` in this task). Confirm the command *runs* (compiler executes and reports errors) rather than failing to launch.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json package.json package-lock.json
git commit -m "Add TypeScript config and typecheck script"
```

---

## Task 2: Add Vitest test tooling

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install test dependencies**

Run: `npm install -D vitest@2.1.9 jsdom@25.0.1 @testing-library/react@16.1.0`

- [ ] **Step 2: Add a `test` script**

Modify `package.json` `"scripts"`: add `"test": "vitest run"`.

- [ ] **Step 3: Point `vite.config.ts` at `vitest/config` and add a test block**

Modify `vite.config.ts` — change the `defineConfig` import and add a `test` key:

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Verify vitest runs with zero tests**

Run: `npm run test`

Expected: prints "No test files found" (or similar) and exits 0 — this confirms the runner is wired up before later tasks add real tests.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "Add Vitest test tooling"
```

---

## Task 3: Create shared types

**Files:**
- Create: `src/app/types.ts`

- [ ] **Step 1: Write the types file**

```ts
export interface SubGrades {
  centering: string;
  corners: string;
  edges: string;
  surface: string;
}

export interface Card {
  id: number;
  img: string;
  player: string;
  year: string;
  brand: string;
  team: string;
  grader: string;
  grade: string;
  gradeLabel: string;
  cert: string;
  value: number;
  change: number;
  subGrades: SubGrades | null;
  autograph: boolean;
  popReport?: number;
  sellPrice?: number;
}

export interface FolderType {
  id: number;
  name: string;
  color: string;
  cardIds: number[];
  thumbnail?: string;
}

export interface PriceHistoryPoint {
  d: string;
  v: number;
}

export interface RecentSale {
  date: string;
  price: number;
  source: string;
}

export interface MarketItem {
  id: number;
  img: string;
  player: string;
  year: string;
  brand: string;
  grader: string;
  grade: string;
  price: number;
  change: number;
  source: string;
  priceHistory: PriceHistoryPoint[];
  recentSales: RecentSale[];
  dealNote: string | null;
}

export interface Peer {
  name: string;
  handle: string;
  cards: number;
  value: number;
  avatar: string;
  badge: string;
  verified: boolean;
  topCards: string[];
  snapshot: string[];
  specialty: string;
}

export interface SuggestedPeer {
  name: string;
  handle: string;
  cards: number;
  avatar: string;
}

export interface Listing {
  id: number;
  cardId: number;
  platform: string;
  askingPrice: number;
  condition: string;
  shipsFrom: string;
  status: "active" | "sold";
  views: number;
  createdAt: number;
}

export interface Profile {
  name: string;
  handle: string;
  avatar: string;
  followers: number;
}

export type MainTab = "cards" | "shop" | "peers";
```

- [ ] **Step 2: Verify it compiles in isolation**

Run: `npx tsc --noEmit src/app/types.ts --jsx react-jsx --esModuleInterop --skipLibCheck`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/types.ts
git commit -m "Add shared Card Champs types"
```

---

## Task 4: Create the seed data layer

**Files:**
- Create: `src/app/data/cardImages.ts`
- Create: `src/app/data/mockCards.ts`
- Create: `src/app/data/mockMarket.ts`
- Create: `src/app/data/mockPeers.ts`

This centralizes every hardcoded value that today lives inline in `App.tsx` (lines 1-57, 473-493, 1194-1204, 1484-1505, 1626-1632, and the two default folders at lines 2185-2188). No behavior changes yet — later tasks wire these into components.

- [ ] **Step 1: Create the centralized asset re-exports**

`src/app/data/cardImages.ts`:

```ts
import card1 from "@/imports/CARD_1-1.png";
import card2 from "@/imports/CARD_2-3.png";
import card3 from "@/imports/CARD_3-1.png";
import card4 from "@/imports/CARD_4-1.png";
import card5 from "@/imports/CARD_5-1.png";
import card6 from "@/imports/CARD_6-1.png";
import card7 from "@/imports/CARD_7.png";
import card8 from "@/imports/CARD_8.png";
import card9 from "@/imports/CARD_9.png";
import card10 from "@/imports/CARD_10.png";
import card11 from "@/imports/CARD_11.png";
import card12 from "@/imports/CARD_12.png";
import profilePic from "@/imports/image-1.png";
import loganPaul from "@/imports/logan_paul.jpg";
import barbaraCorcoran from "@/imports/barbara_corcoran.jpeg";
import garyVee from "@/imports/gary_vee.png";
import kevinOLeary from "@/imports/kevin_o_leary.png";

export {
  card1, card2, card3, card4, card5, card6,
  card7, card8, card9, card10, card11, card12,
  profilePic, loganPaul, barbaraCorcoran, garyVee, kevinOLeary,
};
```

- [ ] **Step 2: Create the cards seed data module**

`src/app/data/mockCards.ts` — this is `ALL_CARDS` (App.tsx lines 22-35), `GRADER_COLOR` (37-44), `FOLDER_COLORS` (57), `GRADERS`/`GRADES`/`GRADE_LABELS`/`ALL_YEARS`/`BRANDS_BY_YEAR` (473-491), `ALL_TEAMS` (493), plus a new `DEFAULT_FOLDERS` (the two folders currently hardcoded at App.tsx lines 2185-2188):

```ts
import type { Card, FolderType } from "../types";
import {
  card1, card2, card3, card4, card5, card6,
  card7, card8, card9, card10, card11, card12,
} from "./cardImages";

export const ALL_CARDS: Card[] = [
  { id: 1,  img: card1,  player: "Bo Jackson",       year: "1986", brand: "Topps",        team: "Royals",   grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 320,  change: +4,  subGrades: null,                                                              autograph: false, popReport: 4821, sellPrice: 380  },
  { id: 2,  img: card2,  player: "Bo Jackson",       year: "1986", brand: "Topps Traded", team: "Royals",   grader: "PSA",  grade: "10",  gradeLabel: "Gem Mint", cert: "22365223",  value: 1745, change: +7,  subGrades: null,                                                              autograph: false, popReport: 1152, sellPrice: 2000 },
  { id: 3,  img: card3,  player: "Rickey Henderson", year: "1980", brand: "Topps",        team: "Athletics",grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 185,  change: -2,  subGrades: null,                                                              autograph: false, popReport: 3290, sellPrice: 210  },
  { id: 4,  img: card4,  player: "Gary Nolan",       year: "1978", brand: "Topps",        team: "Angels",   grader: "BGS",  grade: "9",   gradeLabel: "Mint",     cert: "004295496", value: 95,   change: +1,  subGrades: { centering: "9", corners: "9.5", edges: "9.5", surface: "10" }, autograph: true,  popReport: 88,   sellPrice: 115  },
  { id: 5,  img: card5,  player: "John Montague",    year: "1978", brand: "Topps",        team: "Mariners", grader: "FWrk", grade: "9",   gradeLabel: "Mint",     cert: "FW-2023-001",value: 42,  change: 0,   subGrades: { centering: "9.5", corners: "8.5", edges: "9", surface: "9" },  autograph: false, popReport: 142,  sellPrice: 50   },
  { id: 6,  img: card6,  player: "Bo Jackson",       year: "1986", brand: "Topps",        team: "Royals",   grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264765", value: 310,  change: +3,  subGrades: null,                                                              autograph: false, popReport: 4821, sellPrice: 365  },
  { id: 7,  img: card7,  player: "Shohei Ohtani",    year: "2022", brand: "Bowman",       team: "Dodgers",  grader: "FWrk", grade: "9.5", gradeLabel: "Mint+",    cert: "5625404",   value: 890,  change: +22, subGrades: null,                                                              autograph: false, popReport: 2104, sellPrice: 1050 },
  { id: 8,  img: card8,  player: "Mickey Mantle",    year: "1952", brand: "Topps",        team: "Yankees",  grader: "SGC",  grade: "9.5", gradeLabel: "Mint+",    cert: "364764",    value: 4200, change: +8,  subGrades: { centering: "9.5", corners: "9.5", edges: "9.5", surface: "9.5" },autograph: false, popReport: 23,   sellPrice: 4800 },
  { id: 9,  img: card9,  player: "Mickey Mantle",    year: "1954", brand: "Bowman",       team: "Yankees",  grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 620,  change: +5,  subGrades: null,                                                              autograph: false, popReport: 312,  sellPrice: 720  },
  { id: 10, img: card10, player: "Mickey Hatcher",   year: "1986", brand: "Fleer",        team: "Rangers",  grader: "FWrk", grade: "9.5", gradeLabel: "Mint+",    cert: "5625405",   value: 38,   change: 0,   subGrades: null,                                                              autograph: false, popReport: 67,   sellPrice: 45   },
  { id: 11, img: card11, player: "Jim York",         year: "1975", brand: "Topps",        team: "Astros",   grader: "SGC",  grade: "9.5", gradeLabel: "Mint+",    cert: "364765",    value: 55,   change: +1,  subGrades: { centering: "9.5", corners: "9.5", edges: "9.5", surface: "9.5" },autograph: false, popReport: 44,   sellPrice: 65   },
  { id: 12, img: card12, player: "Don Baylor",       year: "1975", brand: "Topps",        team: "Orioles",  grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264766", value: 42,   change: -1,  subGrades: null,                                                              autograph: false, popReport: 1876, sellPrice: 48   },
];

export const GRADER_COLOR: Record<string, string> = {
  PSA:  "#E01F26",
  BGS:  "#1A1A1A",
  CGC:  "#1D4FA1",
  SGC:  "#111111",
  TAG:  "#6B7280",
  FWrk: "#111111",
};

export const FOLDER_COLORS = ["#111", "#1a6cc4", "#c9a84c", "#c42020", "#2a9d8f", "#e76f51", "#6a4c93"];

export const DEFAULT_FOLDERS: FolderType[] = [
  { id: 1, name: "Rookies", color: "#1a6cc4", cardIds: [1, 6] },
  { id: 2, name: "Hall of Fame", color: "#c9a84c", cardIds: [2, 3] },
];

export const GRADERS = ["PSA", "BGS", "SGC", "CGC", "TAG", "FWrk"];
export const GRADES  = ["1","1.5","2","2.5","3","3.5","4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10"];
export const GRADE_LABELS: Record<string, string> = {
  "1":"Poor","1.5":"Fair","2":"Good","2.5":"Good+","3":"VG","3.5":"VG+",
  "4":"VG-EX","4.5":"VG-EX+","5":"EX","5.5":"EX+","6":"EX-MT","6.5":"EX-MT+",
  "7":"NM","7.5":"NM+","8":"NM-MT","8.5":"NM-MT+","9":"Mint","9.5":"Mint+","10":"Gem Mint",
};
export const ALL_YEARS = Array.from({ length: 76 }, (_, i) => String(2025 - i)); // 2025 → 1950

export const BRANDS_BY_YEAR = (y: number): string[] => {
  if (y <= 1954) return ["Topps","Bowman"];
  if (y <= 1959) return ["Topps"];
  if (y <= 1980) return ["Topps","Fleer","Kellogg's"];
  if (y <= 1988) return ["Topps","Fleer","Donruss","Score"];
  if (y <= 1993) return ["Topps","Fleer","Donruss","Upper Deck","Score","Bowman","Leaf"];
  if (y <= 2000) return ["Topps","Fleer","Donruss","Upper Deck","Score","Bowman","Pacific","Leaf","Skybox"];
  if (y <= 2009) return ["Topps","Bowman","Upper Deck","Fleer","Donruss","Leaf"];
  return ["Topps","Bowman","Panini","Leaf"];
};

export const ALL_TEAMS = ["Angels","Astros","Athletics","Blue Jays","Braves","Brewers","Cardinals","Cubs","Dodgers","Giants","Indians","Mariners","Marlins","Mets","Nationals","Orioles","Padres","Phillies","Pirates","Rangers","Red Sox","Reds","Rockies","Royals","Tigers","Twins","White Sox","Yankees"];
```

- [ ] **Step 3: Create the market seed data module**

`src/app/data/mockMarket.ts` — App.tsx lines 1194-1204, with a new `id: 1..9` field added to each entry (needed so the Watchlist feature in Task 18 has a stable key — the original array had no id):

```ts
import type { MarketItem } from "../types";
import { card1, card2, card3, card4, card7, card8, card9, card11, card12 } from "./cardImages";

export const MARKET_ITEMS: MarketItem[] = [
  { id: 1, img: card8, player: "Mickey Mantle", year: "1952", brand: "Topps", grader: "SGC", grade: "9.5", price: 4200, change: +8, source: "eBay", priceHistory: [{d:"Jan",v:3800},{d:"Feb",v:3950},{d:"Mar",v:4100},{d:"Apr",v:3900},{d:"May",v:4200},{d:"Jun",v:4200}], recentSales: [{date:"Jun 12",price:4100,source:"eBay"},{date:"May 28",price:3950,source:"Fanatics"},{date:"Apr 15",price:4200,source:"eBay"}], dealNote: "Deal of the Day" },
  { id: 2, img: card7, player: "Shohei Ohtani", year: "2022", brand: "Bowman", grader: "FWrk", grade: "9.5", price: 890, change: +22, source: "Fanatics", priceHistory: [{d:"Jan",v:600},{d:"Feb",v:680},{d:"Mar",v:720},{d:"Apr",v:780},{d:"May",v:840},{d:"Jun",v:890}], recentSales: [{date:"Jun 10",price:875,source:"Fanatics"},{date:"Jun 2",price:820,source:"eBay"}], dealNote: null },
  { id: 3, img: card2, player: "Bo Jackson RC", year: "1986", brand: "Topps Traded", grader: "PSA", grade: "10", price: 1745, change: +7, source: "PSA Marketplace", priceHistory: [{d:"Jan",v:1400},{d:"Feb",v:1500},{d:"Mar",v:1580},{d:"Apr",v:1620},{d:"May",v:1700},{d:"Jun",v:1745}], recentSales: [{date:"Jun 8",price:1720,source:"eBay"},{date:"May 20",price:1650,source:"PSA Marketplace"}], dealNote: null },
  { id: 4, img: card1, player: "Bo Jackson", year: "1986", brand: "Topps", grader: "PSA", grade: "8", price: 410, change: +2, source: "eBay", priceHistory: [{d:"Jan",v:380},{d:"Feb",v:390},{d:"Mar",v:400},{d:"Apr",v:395},{d:"May",v:405},{d:"Jun",v:410}], recentSales: [{date:"Jun 5",price:405,source:"eBay"}], dealNote: null },
  { id: 5, img: card3, player: "Rickey Henderson", year: "1980", brand: "Topps", grader: "SGC", grade: "8.5", price: 320, change: -3, source: "Fanatics", priceHistory: [{d:"Jan",v:350},{d:"Feb",v:345},{d:"Mar",v:335},{d:"Apr",v:330},{d:"May",v:325},{d:"Jun",v:320}], recentSales: [{date:"Jun 1",price:318,source:"Fanatics"}], dealNote: null },
  { id: 6, img: card9, player: "Mickey Mantle", year: "1954", brand: "Bowman", grader: "PSA", grade: "1", price: 620, change: +5, source: "eBay", priceHistory: [{d:"Jan",v:560},{d:"Feb",v:575},{d:"Mar",v:590},{d:"Apr",v:600},{d:"May",v:612},{d:"Jun",v:620}], recentSales: [{date:"May 30",price:610,source:"eBay"}], dealNote: null },
  { id: 7, img: card4, player: "Gary Nolan", year: "1978", brand: "Topps", grader: "BGS", grade: "9.5", price: 155, change: +11, source: "Card Ladder", priceHistory: [{d:"Jan",v:120},{d:"Feb",v:130},{d:"Mar",v:140},{d:"Apr",v:145},{d:"May",v:150},{d:"Jun",v:155}], recentSales: [{date:"Jun 3",price:150,source:"Card Ladder"}], dealNote: null },
  { id: 8, img: card11, player: "Jim York", year: "1975", brand: "Topps", grader: "SGC", grade: "9.5", price: 55, change: +1, source: "eBay", priceHistory: [{d:"Jan",v:50},{d:"Feb",v:51},{d:"Mar",v:52},{d:"Apr",v:53},{d:"May",v:54},{d:"Jun",v:55}], recentSales: [{date:"May 25",price:54,source:"eBay"}], dealNote: null },
  { id: 9, img: card12, player: "Don Baylor", year: "1975", brand: "Topps", grader: "PSA", grade: "1", price: 42, change: -1, source: "Fanatics", priceHistory: [{d:"Jan",v:45},{d:"Feb",v:44},{d:"Mar",v:43},{d:"Apr",v:43},{d:"May",v:42},{d:"Jun",v:42}], recentSales: [{date:"May 18",price:43,source:"Fanatics"}], dealNote: null },
];
```

- [ ] **Step 4: Create the peers seed data module**

`src/app/data/mockPeers.ts` — App.tsx lines 1484-1505 (`PEERS`) and 1626-1632 (`SUGGESTED`):

```ts
import type { Peer, SuggestedPeer } from "../types";
import {
  loganPaul, barbaraCorcoran, garyVee, kevinOLeary,
  card1, card2, card3, card4, card5, card6, card7, card8, card9, card10, card11, card12,
} from "./cardImages";

export const PEERS: Peer[] = [
  {
    name: "Logan Paul", handle: "@loganpaul", cards: 142, value: 284000, avatar: loganPaul, badge: "Top Collector", verified: true,
    topCards: [card8, card7, card2], snapshot: [card8, card7, card2, card9, card1, card3],
    specialty: "Yankees · Modern",
  },
  {
    name: "Barbara Corcoran", handle: "@barbaracorcoran", cards: 67, value: 93000, avatar: barbaraCorcoran, badge: "Top Collector", verified: false,
    topCards: [card2, card8, card11], snapshot: [card2, card8, card11, card4, card6, card5],
    specialty: "HOF · Vintage",
  },
  {
    name: "Gary Vee", handle: "@garyvee", cards: 318, value: 520000, avatar: garyVee, badge: "Top Collector", verified: true,
    topCards: [card8, card2, card7], snapshot: [card8, card2, card7, card9, card3, card12],
    specialty: "Graded · Investment",
  },
  {
    name: "Kevin O'Leary", handle: "@kevinoleary", cards: 89, value: 176000, avatar: kevinOLeary, badge: "Trending", verified: false,
    topCards: [card7, card8, card2], snapshot: [card7, card8, card2, card11, card4, card10],
    specialty: "ROI · Rare Finds",
  },
];

export const SUGGESTED: SuggestedPeer[] = [
  { name: "DJ Khaled", handle: "@djkhaled", cards: 203, avatar: card8 },
  { name: "Meek Mill", handle: "@meekmill", cards: 87, avatar: card7 },
  { name: "Lil Baby", handle: "@lilbaby", cards: 54, avatar: card2 },
  { name: "Pat McAfee", handle: "@patmcafee", cards: 121, avatar: card3 },
  { name: "Rich Paul", handle: "@richpaul", cards: 178, avatar: card9 },
];
```

- [ ] **Step 5: Typecheck the new data files**

Run: `npm run typecheck 2>&1 | grep -E "data/(mockCards|mockMarket|mockPeers|cardImages)"`

Expected: no output (no errors reference these four new files — they aren't imported by anything yet, but a bad literal like the `card10 = card10` typo above would still surface here as a syntax error).

- [ ] **Step 6: Commit**

```bash
git add src/app/data
git commit -m "Extract Card Champs seed data into src/app/data"
```

---

## Task 5: Create the `useLocalStorage` persistence hook

**Files:**
- Create: `src/app/hooks/useLocalStorage.ts`
- Test: `src/app/hooks/useLocalStorage.test.ts`

- [ ] **Step 1: Write the failing test**

`src/app/hooks/useLocalStorage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("seeds localStorage with the initial value on first read", () => {
    const { result } = renderHook(() => useLocalStorage("test:seed", { count: 1 }));
    expect(result.current[0]).toEqual({ count: 1 });
    expect(JSON.parse(window.localStorage.getItem("test:seed")!)).toEqual({ count: 1 });
  });

  it("reads an existing value instead of re-seeding", () => {
    window.localStorage.setItem("test:existing", JSON.stringify({ count: 5 }));
    const { result } = renderHook(() => useLocalStorage("test:existing", { count: 1 }));
    expect(result.current[0]).toEqual({ count: 5 });
  });

  it("persists updates made via the setter", () => {
    const { result } = renderHook(() => useLocalStorage("test:update", 0));
    act(() => result.current[1](7));
    expect(result.current[0]).toBe(7);
    expect(JSON.parse(window.localStorage.getItem("test:update")!)).toBe(7);
  });

  it("supports a functional updater", () => {
    const { result } = renderHook(() => useLocalStorage("test:fn", 1));
    act(() => result.current[1](prev => prev + 1));
    expect(result.current[0]).toBe(2);
  });

  it("supports a lazy initializer for the seed value", () => {
    const { result } = renderHook(() => useLocalStorage("test:lazy", () => ({ count: 9 })));
    expect(result.current[0]).toEqual({ count: 9 });
  });

  it("falls back to the seed value when stored JSON is corrupted", () => {
    window.localStorage.setItem("test:corrupt", "{not valid json");
    const { result } = renderHook(() => useLocalStorage("test:corrupt", { count: 1 }));
    expect(result.current[0]).toEqual({ count: 1 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- useLocalStorage`

Expected: FAIL — `Cannot find module './useLocalStorage'` (the hook doesn't exist yet).

- [ ] **Step 3: Write the hook**

`src/app/hooks/useLocalStorage.ts`:

```ts
import { useState } from "react";

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(next: Updater<T>, prev: T): T {
  return next instanceof Function ? next(prev) : next;
}

function readSeed<T>(initialValue: T | (() => T)): T {
  return initialValue instanceof Function ? initialValue() : initialValue;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (next: Updater<T>) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // corrupted JSON — fall through to seeding
    }
    const seed = readSeed(initialValue);
    try {
      window.localStorage.setItem(key, JSON.stringify(seed));
    } catch {
      // localStorage unavailable (e.g. private mode) — keep in-memory only
    }
    return seed;
  });

  const setAndPersist = (next: Updater<T>) => {
    setValue(prev => {
      const resolved = resolve(next, prev);
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // ignore write failures
      }
      return resolved;
    });
  };

  return [value, setAndPersist];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- useLocalStorage`

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/hooks/useLocalStorage.ts src/app/hooks/useLocalStorage.test.ts
git commit -m "Add useLocalStorage persistence hook"
```

---

## Task 6: Create backup export/import helpers

**Files:**
- Create: `src/app/lib/backup.ts`
- Test: `src/app/lib/backup.test.ts`

- [ ] **Step 1: Write the failing test**

`src/app/lib/backup.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildBackup, isValidBackup, parseBackupFile, type BackupData } from "./backup";
import type { Card, FolderType, Profile } from "../types";

const sampleProfile: Profile = { name: "Andrew Cordle", handle: "@andrewcordle", avatar: "/a.png", followers: 219 };

function sampleBackup(): BackupData {
  return buildBackup({
    cards: [] as Card[],
    folders: [] as FolderType[],
    profile: sampleProfile,
    watchlist: [1, 2],
    following: ["@garyvee"],
    listings: [],
  });
}

describe("buildBackup", () => {
  it("stamps version 1", () => {
    expect(sampleBackup().version).toBe(1);
  });
});

describe("isValidBackup", () => {
  it("accepts a well-formed backup", () => {
    expect(isValidBackup(sampleBackup())).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidBackup(null)).toBe(false);
  });

  it("rejects a wrong version number", () => {
    expect(isValidBackup({ ...sampleBackup(), version: 2 })).toBe(false);
  });

  it("rejects a missing array field", () => {
    const bad = sampleBackup() as unknown as Record<string, unknown>;
    delete bad.cards;
    expect(isValidBackup(bad)).toBe(false);
  });

  it("rejects a non-object profile", () => {
    expect(isValidBackup({ ...sampleBackup(), profile: "nope" })).toBe(false);
  });
});

describe("parseBackupFile", () => {
  it("resolves with the parsed backup for a valid JSON file", async () => {
    const file = new File([JSON.stringify(sampleBackup())], "backup.json", { type: "application/json" });
    const parsed = await parseBackupFile(file);
    expect(parsed.following).toEqual(["@garyvee"]);
  });

  it("rejects for invalid JSON", async () => {
    const file = new File(["{not json"], "backup.json", { type: "application/json" });
    await expect(parseBackupFile(file)).rejects.toThrow("Invalid backup file");
  });

  it("rejects for well-formed JSON that isn't a backup", async () => {
    const file = new File([JSON.stringify({ hello: "world" })], "backup.json", { type: "application/json" });
    await expect(parseBackupFile(file)).rejects.toThrow("Invalid backup file");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- backup`

Expected: FAIL — `Cannot find module './backup'`.

- [ ] **Step 3: Write the implementation**

`src/app/lib/backup.ts`:

```ts
import type { Card, FolderType, Listing, Profile } from "../types";

export interface BackupData {
  version: 1;
  cards: Card[];
  folders: FolderType[];
  profile: Profile;
  watchlist: number[];
  following: string[];
  listings: Listing[];
}

export function buildBackup(data: Omit<BackupData, "version">): BackupData {
  return { version: 1, ...data };
}

export function isValidBackup(value: unknown): value is BackupData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.cards) &&
    Array.isArray(v.folders) &&
    typeof v.profile === "object" && v.profile !== null &&
    Array.isArray(v.watchlist) &&
    Array.isArray(v.following) &&
    Array.isArray(v.listings)
  );
}

export function downloadBackup(data: BackupData, filename = "card-champs-backup.json"): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isValidBackup(parsed)) {
          reject(new Error("Invalid backup file"));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error("Invalid backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- backup`

Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/backup.ts src/app/lib/backup.test.ts
git commit -m "Add collection backup export/import helpers"
```

---

## Task 7: Extract shared utility components

**Files:**
- Create: `src/app/hooks/use3DTilt.ts`
- Create: `src/app/components/shared/AnimateIn.tsx`
- Create: `src/app/components/shared/CountUp.tsx`
- Create: `src/app/components/shared/ScrollPicker.tsx`

These are pulled verbatim from `App.tsx` (lines 157-200, 1745-1773, 2159-2177, 498-545), with one fix applied to all of them: the original file uses `React.CSSProperties` / `React.ReactNode` / `React.MouseEvent` as bare type references without ever importing `React` as a value or namespace. That only "worked" because nothing type-checked the project before Task 1. Each extraction below imports the specific type it needs from `"react"` instead.

- [ ] **Step 1: Create `use3DTilt.ts`**

```ts
import { useRef, useState, useCallback, useEffect } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";

export function use3DTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  const applyTilt = useCallback((clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setStyle({
      transform: `perspective(600px) rotateX(${(y - 0.5) * -20}deg) rotateY(${(x - 0.5) * 20}deg) scale3d(1.04,1.04,1.04)`,
      transition: "transform 0.05s ease",
      "--glare-x": `${Math.round(x * 100)}%`,
      "--glare-y": `${Math.round(y * 100)}%`,
    } as CSSProperties);
  }, []);

  const resetTilt = useCallback(() => {
    setStyle({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)", transition: "transform 0.4s ease" });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      applyTilt(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => resetTilt();
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [applyTilt, resetTilt]);

  const onMouseMove = useCallback((e: ReactMouseEvent) => applyTilt(e.clientX, e.clientY), [applyTilt]);
  const onMouseLeave = useCallback(() => resetTilt(), [resetTilt]);

  return { ref, style, onMouseMove, onMouseLeave };
}
```

- [ ] **Step 2: Create `components/shared/AnimateIn.tsx`**

```tsx
import { useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface AnimateInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimateIn({ children, delay = 0, className = "" }: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(28px)",
        transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/shared/CountUp.tsx`**

```tsx
import { useState, useEffect } from "react";

interface CountUpProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function CountUp({ to, duration = 1000, prefix = "", suffix = "" }: CountUpProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return <>{prefix}{value.toLocaleString()}{suffix}</>;
}
```

- [ ] **Step 4: Create `components/shared/ScrollPicker.tsx`**

```tsx
import { useRef, useEffect } from "react";
import type { CSSProperties } from "react";

interface ScrollPickerProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  width?: string;
}

export function ScrollPicker({ items, value, onChange, width }: ScrollPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ITEM_H = 44;

  useEffect(() => {
    const idx = items.indexOf(value);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H;
    }
  }, []);

  const onScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (items[clamped] && items[clamped] !== value) onChange(items[clamped]);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ height: ITEM_H * 5, width: width || "100%" }}>
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: "linear-gradient(to bottom, #fff 20%, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: "linear-gradient(to top, #fff 20%, transparent)" }} />
      <div className="absolute left-0 right-0 z-0 rounded-xl" style={{ top: ITEM_H * 2, height: ITEM_H, background: "#f4f4f5" }} />
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as CSSProperties}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map(item => (
          <div
            key={item}
            onClick={() => { onChange(item); if (ref.current) ref.current.scrollTop = items.indexOf(item) * ITEM_H; }}
            style={{ height: ITEM_H, scrollSnapAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: item === value ? 600 : 400, color: item === value ? "#111" : "#aaa", cursor: "pointer", userSelect: "none", transition: "color 0.15s, font-weight 0.15s", fontFamily: "'Google Sans', sans-serif" }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck 2>&1 | grep -E "(use3DTilt|AnimateIn|CountUp|ScrollPicker)"`

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/app/hooks/use3DTilt.ts src/app/components/shared
git commit -m "Extract shared utility components (tilt, animate-in, count-up, scroll picker)"
```

---

## Task 8: Create the `ConfirmDialog` component

**Files:**
- Create: `src/app/components/shared/ConfirmDialog.tsx`

This is new — the prototype has no confirmation pattern anywhere. It backs every destructive action added in later tasks (delete card, delete folder, restore backup, reset data).

- [ ] **Step 1: Write the component**

```tsx
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold"
            style={{ background: destructive ? "#dc2626" : "#111" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep ConfirmDialog`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/shared/ConfirmDialog.tsx
git commit -m "Add ConfirmDialog for destructive actions"
```

---

## Task 9: Extract `ShareSheet` and `ShareFlow`

**Files:**
- Create: `src/app/components/shared/ShareSheet.tsx`
- Create: `src/app/components/shared/ShareFlow.tsx`

`ShareSheet` (App.tsx lines 68-153) is the small "share this one thing" sheet used by `DetailSheet` and `FolderDetailView`. `ShareFlow` (lines 1777-1958, including the `SHARE_PLATFORMS` constant) is the richer multi-step flow used from the app's bottom action bar and from `PeersView`'s "Share Collection" button. Both get the same two fixes: the "Copy Link" action now really writes to `navigator.clipboard`, and the bottom sheet's content width is capped (`max-w-lg`) so it doesn't stretch edge-to-edge on wide screens — the mobile slide-up-from-bottom behavior is unchanged. From this task on, apply that same width-cap treatment to every other bottom sheet as it's extracted, instead of doing it as a separate pass later.

- [ ] **Step 1: Create `components/shared/ShareSheet.tsx`**

```tsx
import { useState } from "react";
import type { ReactNode } from "react";
import { X, Link, Mail, MessageCircle, Check, Share2, ChevronRight } from "lucide-react";

interface ShareTarget {
  label: string;
  subtitle: string;
  icon: ReactNode;
  action: () => void;
}

interface ShareSheetProps {
  title: string;
  subtitle: string;
  onClose: () => void;
}

export function ShareSheet({ title, subtitle, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(`${title} — ${subtitle}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targets: ShareTarget[] = [
    {
      label: "Copy Link",
      subtitle: "Anyone with the link can view",
      icon: copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link className="w-4 h-4 text-gray-700" />,
      action: copy,
    },
    {
      label: "Messages",
      subtitle: "Send via iMessage or SMS",
      icon: <MessageCircle className="w-4 h-4 text-green-500" />,
      action: onClose,
    },
    {
      label: "Email",
      subtitle: "Share as an email",
      icon: <Mail className="w-4 h-4 text-blue-500" />,
      action: onClose,
    },
    {
      label: "More options",
      subtitle: "Instagram, Twitter & more",
      icon: <Share2 className="w-4 h-4 text-gray-400" />,
      action: onClose,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 mb-1 md:hidden">
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-6 pt-3 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 pb-10">
          {targets.map((t, i) => (
            <button
              key={i}
              onClick={t.action}
              className="w-full flex items-center gap-4 py-3.5 text-left focus:outline-none"
              style={{ borderBottom: i < targets.length - 1 ? "1px solid #f4f4f5" : "none" }}
            >
              <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/shared/ShareFlow.tsx`**

```tsx
import { useState } from "react";
import { X, Check, Share2, Link, Mail, MessageCircle, ChevronRight, Folder } from "lucide-react";
import type { Card, FolderType } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";

const SHARE_PLATFORMS = [
  { id: "link",  label: "Copy Link",   sub: "Anyone with the link can view", icon: <Link className="w-4 h-4 text-gray-600" /> },
  { id: "msg",   label: "Messages",    sub: "iMessage or SMS",               icon: <MessageCircle className="w-4 h-4 text-green-500" /> },
  { id: "mail",  label: "Email",       sub: "Share as an email",             icon: <Mail className="w-4 h-4 text-blue-500" /> },
  { id: "more",  label: "More",        sub: "Instagram, Twitter & more",     icon: <Share2 className="w-4 h-4 text-gray-400" /> },
];

interface ShareFlowProps {
  onClose: () => void;
  allCards: Card[];
  folders: FolderType[];
}

export function ShareFlow({ onClose, allCards, folders }: ShareFlowProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<"collection" | "folder" | "card" | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const shareTitle = type === "collection" ? "Andrew's Collection"
    : type === "folder" ? selectedFolder?.name ?? ""
    : selectedCard ? `${selectedCard.player} ${selectedCard.year}` : "";

  const shareSubtitle = type === "collection" ? `${allCards.length} cards · Est. $${allCards.reduce((s,c)=>s+c.value,0).toLocaleString()}`
    : type === "folder" ? `${selectedFolder?.cardIds.length} cards`
    : selectedCard ? `${selectedCard.grader} ${selectedCard.grade} · $${selectedCard.value.toLocaleString()}` : "";

  const canContinue = type === "collection" || (type === "folder" && selectedFolder) || (type === "card" && selectedCard);

  const shareViaLink = () => {
    void navigator.clipboard?.writeText(`${shareTitle} — ${shareSubtitle}`).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); setDone(true); }, 800);
  };

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #c9a84c 0%, #e8c96e 45%, #b8903c 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          {type === "card" && selectedCard?.img && (
            <img src={selectedCard.img} alt={selectedCard.player} className="w-36 mb-5 rounded-xl"
              style={{ objectFit: "contain", boxShadow: "0 12px 32px rgba(0,0,0,0.3)", transform: "rotate(-2deg)" }} draggable={false} />
          )}
          {type === "folder" && selectedFolder && (
            <div className="w-28 h-28 rounded-2xl mb-5 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.25)", boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
              <Folder className="w-12 h-12 text-white" />
            </div>
          )}
          {type === "collection" && (
            <div className="flex gap-1 mb-5">
              {allCards.filter(c => c.img).slice(0, 3).map((c, i) => (
                <img key={c.id} src={c.img} alt={c.player} className="w-20 rounded-lg"
                  style={{ objectFit: "contain", background: "rgba(255,255,255,0.2)", boxShadow: "0 8px 20px rgba(0,0,0,0.25)", transform: `rotate(${[-6,0,6][i]}deg)` }} draggable={false} />
              ))}
            </div>
          )}

          <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-2">Shared</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
            {type === "card" ? `Look at this card!` : type === "folder" ? `Check out ${selectedFolder?.name}!` : "Look at my collection!"}
          </h2>
          <p className="text-white/70 text-sm mb-8">{shareSubtitle}</p>

          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm mb-3"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>
            Share Again
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm"
            style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.8)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "88vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {[1,2].map(i => <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ background: step >= i ? "#111" : "#f0f0f0" }} />)}
          </div>
          <span className="text-xs text-gray-400 mr-3">{step}/2</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(88vh - 88px)", scrollbarWidth: "none" }}>

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">What do you want to share?</h2>
              <p className="text-sm text-gray-400 mb-5">Choose what you'd like to send.</p>

              {[
                { id: "collection" as const, label: "Entire Collection", sub: `${allCards.length} cards · $${allCards.reduce((s,c)=>s+c.value,0).toLocaleString()}` },
                { id: "folder" as const, label: "A Folder", sub: "Select one of your folders" },
                { id: "card" as const, label: "A Single Card", sub: "Pick one card to share" },
              ].map(opt => (
                <button key={opt.id} onClick={() => { setType(opt.id); setSelectedFolder(null); setSelectedCard(null); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl mb-2 text-left transition-all"
                  style={{ background: type === opt.id ? "#111" : "#f7f7f7" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: type === opt.id ? "#fff" : "#111" }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: type === opt.id ? "rgba(255,255,255,0.6)" : "#aaa" }}>{opt.sub}</p>
                  </div>
                  {type === opt.id && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                </button>
              ))}

              {type === "folder" && (
                <div className="flex flex-col gap-2 mt-3 mb-4">
                  {folders.map(f => (
                    <button key={f.id} onClick={() => setSelectedFolder(f)}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                      style={{ background: selectedFolder?.id === f.id ? f.color : "#f4f4f5" }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selectedFolder?.id === f.id ? "rgba(255,255,255,0.7)" : f.color }} />
                      <span className="text-sm font-semibold" style={{ color: selectedFolder?.id === f.id ? "#fff" : "#111" }}>{f.name}</span>
                      <span className="text-xs ml-auto" style={{ color: selectedFolder?.id === f.id ? "rgba(255,255,255,0.6)" : "#aaa" }}>{f.cardIds.length} cards</span>
                    </button>
                  ))}
                </div>
              )}

              {type === "card" && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3 mb-4">
                  {allCards.map(card => (
                    <button key={card.id} onClick={() => setSelectedCard(card)} className="relative focus:outline-none">
                      <div className="overflow-hidden" style={{ outline: selectedCard?.id === card.id ? "2px solid #111" : "2px solid transparent", outlineOffset: 2 }}>
                        {card.img
                          ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                          : <div className="w-full flex items-center justify-center py-4" style={{ background: GRADER_COLOR[card.grader]||"#888", aspectRatio:"2.5/3.5" }}><span className="text-white text-[9px] text-center px-1">{card.player}</span></div>
                        }
                      </div>
                      {selectedCard?.id === card.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(2)} disabled={!canContinue}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30 transition-opacity mt-2">
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Share via</h2>
              <div className="rounded-2xl bg-gray-50 px-4 py-3 mb-5">
                <p className="text-sm font-semibold text-gray-900">{shareTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{shareSubtitle}</p>
              </div>
              {SHARE_PLATFORMS.map((p, i) => (
                <button key={p.id} onClick={() => { if (p.id === "link") shareViaLink(); else setDone(true); }}
                  className="w-full flex items-center gap-4 py-3.5 text-left"
                  style={{ borderBottom: i < SHARE_PLATFORMS.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                  <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {p.id === "link" && copied ? <Check className="w-4 h-4 text-emerald-500" /> : p.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{p.id === "link" && copied ? "Copied!" : p.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </>
          )}

          {step === 2 && <button onClick={() => setStep(1)} className="w-full mt-4 py-2.5 text-sm text-gray-400">← Back</button>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep -E "ShareSheet|ShareFlow"`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/shared/ShareSheet.tsx src/app/components/shared/ShareFlow.tsx
git commit -m "Extract ShareSheet and ShareFlow, wire Copy Link to the clipboard"
```

---

## Task 10: Extract `CardTile` and `CardListRow`

**Files:**
- Create: `src/app/components/cards/CardTile.tsx`
- Create: `src/app/components/cards/CardListRow.tsx`

Verbatim extraction of App.tsx lines 204-249 and 253-270 (the grid tile with the 3D tilt/flip effect, and the list-view row), retyped against `Card` and pointed at the new `use3DTilt` hook and `GRADER_COLOR` data module.

- [ ] **Step 1: Create `components/cards/CardTile.tsx`**

```tsx
import { useState } from "react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";
import { use3DTilt } from "../../hooks/use3DTilt";

interface CardTileProps {
  card: Card;
  onClick: () => void;
  index?: number;
}

export function CardTile({ card, onClick, index = 0 }: CardTileProps) {
  const tilt = use3DTilt();
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    if (spinning) return;
    setSpinning(true);
  };

  return (
    <>
      <style>{`
        @keyframes cardFlip { 0%{transform:perspective(600px) rotateY(0deg) scale(1)} 50%{transform:perspective(600px) rotateY(180deg) scale(1.06)} 100%{transform:perspective(600px) rotateY(360deg) scale(1)} }
        @keyframes cardEnter { 0%{opacity:0;transform:perspective(600px) translateY(48px) rotateX(24deg) scale(0.92)} 100%{opacity:1;transform:perspective(600px) translateY(0) rotateX(0deg) scale(1)} }
      `}</style>
      <button
        onClick={handleClick}
        className="focus:outline-none w-full"
        style={{ perspective: "600px", animation: `cardEnter 0.6s cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${index * 70}ms` }}
      >
        <div
          ref={spinning ? undefined : tilt.ref}
          style={spinning
            ? { animation: "cardFlip 0.45s cubic-bezier(0.4,0,0.2,1) forwards", willChange: "transform" }
            : { ...tilt.style, transformStyle: "preserve-3d", willChange: "transform" }
          }
          onMouseMove={spinning ? undefined : tilt.onMouseMove}
          onMouseLeave={spinning ? undefined : tilt.onMouseLeave}
          onAnimationEnd={() => { setSpinning(false); onClick(); }}
          className="relative w-full overflow-hidden"
        >
        {card.img
          ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
          : <div className="w-full flex flex-col items-center justify-center gap-1 px-1" style={{ background: GRADER_COLOR[card.grader] || "#888", aspectRatio: "2.5/3.5" }}>
              <span className="text-white font-semibold text-[10px] text-center leading-tight">{card.player}</span>
              <span className="text-white/70 text-[9px]">{card.year}</span>
              <span className="text-white font-black text-xl leading-none">{card.grade}</span>
              <span className="text-white/70 text-[9px]">{card.grader}</span>
            </div>
        }
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.18) 0%, transparent 65%)" }} />
        </div>
      </button>
    </>
  );
}
```

- [ ] **Step 2: Create `components/cards/CardListRow.tsx`**

```tsx
import { ChevronRight } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";

interface CardListRowProps {
  card: Card;
  onClick: () => void;
}

export function CardListRow({ card, onClick }: CardListRowProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 py-2.5 focus:outline-none">
      <img src={card.img} alt={card.player} className="w-11 flex-shrink-0" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{card.player}</p>
        <p className="text-xs text-gray-400 mt-0.5">{card.year} · {card.brand} · {card.team}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: GRADER_COLOR[card.grader] || "#111" }}>
          {card.grader} {card.grade}
        </span>
        <span className="text-sm font-semibold text-gray-800">${card.value}</span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
    </button>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep -E "CardTile|CardListRow"`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/cards/CardTile.tsx src/app/components/cards/CardListRow.tsx
git commit -m "Extract CardTile and CardListRow"
```

---

## Task 11: Extract and modify `DetailSheet`

**Files:**
- Create: `src/app/components/cards/DetailSheet.tsx`

This extracts App.tsx lines 274-469 and adds two things the design calls for: Edit and Delete buttons (only shown for your own cards, not peers' — gated by new optional `onEdit`/`onDelete` props and a `ConfirmDialog` for delete), and a real bug fix: the original component's Share button (line 462) reads `card.player`/`card.year`/`card.brand`/`card.grader`/`card.grade`/`card.value` — the raw `card` **prop**, not the resolved `current` card. That prop is `undefined` whenever `DetailSheet` is opened in list mode (`cards`+`initialIndex`, i.e. from the main Cards grid and from `FolderDetailView`) — which is the common case. Tapping Share there would throw `Cannot read properties of undefined`. Fixed below by using `current` throughout.

- [ ] **Step 1: Create `components/cards/DetailSheet.tsx`**

```tsx
import { useState, useRef } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import { X, Share2, Pencil, Trash2 } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";
import { use3DTilt } from "../../hooks/use3DTilt";
import { AnimateIn } from "../shared/AnimateIn";
import { ShareSheet } from "../shared/ShareSheet";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface DetailSheetProps {
  card?: Card;
  onClose: () => void;
  isPeer?: boolean;
  cards?: Card[];
  initialIndex?: number;
  onEdit?: (card: Card) => void;
  onDelete?: (id: number) => void;
}

export function DetailSheet({ card, onClose, isPeer = false, cards = [], initialIndex = 0, onEdit, onDelete }: DetailSheetProps) {
  const [idx, setIdx] = useState(initialIndex);
  const current = cards.length > 0 ? cards[idx] : card!;
  const gradeColor = GRADER_COLOR[current.grader] || "#111";
  const tilt = use3DTilt();
  const [sharing, setSharing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const touchStartX = useRef(0);
  const onTouchStart = (e: ReactTouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: ReactTouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 50 || cards.length < 2) return;
    if (dx < 0 && idx < cards.length - 1) setIdx(i => i + 1);
    if (dx > 0 && idx > 0) setIdx(i => i - 1);
  };

  const canManage = !isPeer && (onEdit || onDelete);
  const editDeleteDelay = current.subGrades ? 320 : 240;
  const actionsDelay = current.subGrades ? (canManage ? 400 : 320) : (canManage ? 320 : 240);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <div
          className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg"
          style={{ maxHeight: "92vh" }}
          onClick={e => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex justify-center pt-3 md:hidden">
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>
          <div className="flex items-center justify-between px-5 pt-2 pb-0">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            {cards.length > 1 && (
              <div className="flex items-center gap-1">
                {cards.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: i === idx ? "#111" : "#e0e0e0", width: i === idx ? 16 : 6 }} />
                ))}
              </div>
            )}
            <div className="w-8" />
          </div>

          <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 64px)", scrollbarWidth: "none" }}>
            <AnimateIn delay={0}>
            <div className="flex justify-center mb-6 mt-4" style={{ perspective: "800px" }}>
              <div
                ref={tilt.ref}
                style={{ ...tilt.style, transformStyle: "preserve-3d", willChange: "transform", width: "58%" }}
                onMouseMove={tilt.onMouseMove}
                onMouseLeave={tilt.onMouseLeave}
                className="relative overflow-hidden"
              >
                {current.img
                  ? <img src={current.img} alt={current.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                  : <div className="w-full flex flex-col items-center justify-center gap-1 px-2" style={{ background: gradeColor, aspectRatio: "2.5/3.5" }}>
                      <span className="text-white font-semibold text-xs text-center">{current.player}</span>
                      <span className="text-white font-black text-2xl">{current.grade}</span>
                      <span className="text-white/70 text-[10px]">{current.grader}</span>
                    </div>
                }
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.2) 0%, transparent 65%)" }} />
              </div>
            </div>
            </AnimateIn>

            <AnimateIn delay={80}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 leading-tight">{current.player}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{current.year} {current.brand} · {current.team}</p>
                {current.autograph && (
                  <span className="inline-block mt-1.5 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Autograph</span>
                )}
              </div>
              <div className="flex flex-col items-center px-3.5 py-2 rounded-2xl" style={{ background: gradeColor }}>
                <span className="text-2xl font-bold text-white leading-none">{current.grade}</span>
                <span className="text-[9px] font-semibold tracking-widest text-white/70 mt-0.5 uppercase">{current.grader}</span>
              </div>
            </div>
            </AnimateIn>

            <AnimateIn delay={160}>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Est. Value</p>
                  <p className="text-[9px] text-gray-400">eBay</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">${current.value.toLocaleString()}</p>
                {current.change !== 0 ? (
                  <div className={`flex items-center gap-1 mt-1.5 px-2 py-1 rounded-lg w-fit ${current.change > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                      {current.change > 0
                        ? <path d="M5 8V2M2 5l3-3 3 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        : <path d="M5 2v6M2 5l3 3 3-3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                    </svg>
                    <span className={`text-[10px] font-bold ${current.change > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {current.change > 0 ? "+" : ""}{current.change}% 30d
                    </span>
                  </div>
                ) : <p className="text-[10px] text-gray-300 mt-1">No change</p>}
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Condition</p>
                <p className="text-sm font-semibold text-gray-800">{current.gradeLabel}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Grader</p>
                <p className="text-sm font-semibold text-gray-800">{current.grader}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Cert #</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{current.cert}</p>
              </div>

              {current.popReport && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                  <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Pop Report</p>
                  <p className="text-sm font-semibold text-gray-800">{current.popReport.toLocaleString()}</p>
                </div>
              )}

              {current.sellPrice && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Sell Price</p>
                    <p className="text-[9px] text-gray-400">Fanatics</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">${current.sellPrice.toLocaleString()}</p>
                </div>
              )}
            </div>
            </AnimateIn>

            {current.subGrades && (
            <AnimateIn delay={240}>
              <div className="rounded-2xl border border-gray-100 px-4 py-3.5 mb-4">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Sub-grades</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {Object.entries(current.subGrades!).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-base font-semibold text-gray-900">{v}</p>
                      <p className="text-[9px] text-gray-400 capitalize mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
            )}

            {canManage && (
              <AnimateIn delay={editDeleteDelay}>
                <div className="flex gap-2 mb-2">
                  {onEdit && (
                    <button onClick={() => onEdit(current)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />Edit
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => setConfirmingDelete(true)} className="flex-1 py-3 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  )}
                </div>
              </AnimateIn>
            )}

            <AnimateIn delay={actionsDelay}>
            <div className="flex gap-2">
              <button onClick={() => setSharing(true)} className="flex-1 py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold flex items-center justify-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />Share
              </button>
              <button className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Shop</button>
            </div>
            </AnimateIn>
          </div>
        </div>
      </div>

      {sharing && (
        <ShareSheet
          title={`${current.player} — ${current.year} ${current.brand}`}
          subtitle={`${current.grader} ${current.grade} · Est. $${current.value}`}
          onClose={() => setSharing(false)}
        />
      )}

      {confirmingDelete && onDelete && (
        <ConfirmDialog
          title="Delete this card?"
          message={`This removes ${current.player} (${current.year}) from your collection and any folders it's in. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => { onDelete(current.id); setConfirmingDelete(false); onClose(); }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep DetailSheet`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/cards/DetailSheet.tsx
git commit -m "Extract DetailSheet, add edit/delete, fix Share crash in list mode"
```

---

## Task 12: Create `EditCardSheet`

**Files:**
- Create: `src/app/components/cards/EditCardSheet.tsx`

New component — a single-page form (not the multi-step scan wizard) pre-filled from an existing `Card`, opened from `DetailSheet`'s new Edit button.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from "react";
import { X, Check } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR, GRADERS, GRADES, GRADE_LABELS } from "../../data/mockCards";

interface EditCardSheetProps {
  card: Card;
  onClose: () => void;
  onSave: (updated: Card) => void;
}

export function EditCardSheet({ card, onClose, onSave }: EditCardSheetProps) {
  const [player, setPlayer] = useState(card.player);
  const [year, setYear] = useState(card.year);
  const [brand, setBrand] = useState(card.brand);
  const [team, setTeam] = useState(card.team);
  const [grader, setGrader] = useState(card.grader);
  const [grade, setGrade] = useState(card.grade);
  const [cert, setCert] = useState(card.cert);
  const [value, setValue] = useState(String(card.value));
  const [sellPrice, setSellPrice] = useState(card.sellPrice ? String(card.sellPrice) : "");
  const [popReport, setPopReport] = useState(card.popReport ? String(card.popReport) : "");

  const graderColor = GRADER_COLOR[grader] || "#111";
  const canSave = player.trim().length > 0 && grader.length > 0 && grade.length > 0 && cert.trim().length > 0 && value.trim().length > 0;

  const handleSave = () => {
    onSave({
      ...card,
      player: player.trim(),
      year,
      brand,
      team,
      grader,
      grade,
      gradeLabel: GRADE_LABELS[grade] || card.gradeLabel,
      cert: cert.trim(),
      value: parseFloat(value) || 0,
      sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
      popReport: popReport ? parseInt(popReport, 10) : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-900">Edit card</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 70px)", scrollbarWidth: "none" }}>
          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 mt-4">Player</p>
          <input value={player} onChange={e => setPlayer(e.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-4" />

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Year</p>
              <input value={year} onChange={e => setYear(e.target.value)}
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Brand</p>
              <input value={brand} onChange={e => setBrand(e.target.value)}
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Team</p>
              <input value={team} onChange={e => setTeam(e.target.value)}
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
          </div>

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grader</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {GRADERS.map(g => (
              <button key={g} onClick={() => setGrader(g)}
                className="py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: grader === g ? (GRADER_COLOR[g] || "#111") : "#f4f4f5", color: grader === g ? "#fff" : "#888" }}>
                {g}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grade</p>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {GRADES.map(g => (
              <button key={g} onClick={() => setGrade(g)}
                className="py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: grade === g ? graderColor : "#f4f4f5", color: grade === g ? "#fff" : "#888" }}>
                {g}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Cert #</p>
          <input value={cert} onChange={e => setCert(e.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-4 font-mono" />

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Value ($)</p>
              <input value={value} onChange={e => setValue(e.target.value)} inputMode="decimal" type="number"
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Sell ($)</p>
              <input value={sellPrice} onChange={e => setSellPrice(e.target.value)} inputMode="decimal" type="number"
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Pop</p>
              <input value={popReport} onChange={e => setPopReport(e.target.value)} inputMode="numeric" type="number"
                className="w-full rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none" />
            </div>
          </div>

          <button onClick={handleSave} disabled={!canSave}
            className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" />Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep EditCardSheet`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/cards/EditCardSheet.tsx
git commit -m "Add EditCardSheet"
```

---

## Task 13: Extract `ScanCardSheet`

**Files:**
- Create: `src/app/components/cards/ScanCardSheet.tsx`

Verbatim extraction of App.tsx lines 547-903 (the 6-step "Add a card" wizard: Scan → Player → Card info → Grading → Pricing → Review), retyped against `Card` and pointed at the shared `ScrollPicker` and the seed-data constants.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from "react";
import { Scan, X, Check, Share2 } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR, GRADERS, GRADES, GRADE_LABELS, ALL_YEARS, BRANDS_BY_YEAR, ALL_TEAMS } from "../../data/mockCards";
import { card2 } from "../../data/cardImages";
import { ScrollPicker } from "../shared/ScrollPicker";

interface ScanCardSheetProps {
  onClose: () => void;
  onAdd: (card: Card) => void;
}

export function ScanCardSheet({ onClose, onAdd }: ScanCardSheetProps) {
  const [step, setStep]         = useState(1);
  const [scanDone, setScanDone] = useState(false);
  const [done, setDone]         = useState(false);
  const [player, setPlayer]     = useState("");
  const [year, setYear]         = useState("1986");
  const [brand, setBrand]       = useState("Topps");
  const [team, setTeam]         = useState("Yankees");
  const [cardNumber, setCardNumber] = useState("");
  const [grader, setGrader]     = useState("");
  const [grade, setGrade]       = useState("");
  const [cert, setCert]         = useState("");
  const [value, setValue]       = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [popReport, setPopReport] = useState("");

  const STEPS = ["Scan","Player","Card","Grading","Pricing","Review"];
  const gradeLabel  = GRADE_LABELS[grade] || "";
  const graderColor = GRADER_COLOR[grader] || "#111";


  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const canNext = [
    true,
    player.trim().length > 0,
    true,
    grader.length > 0 && grade.length > 0 && cert.trim().length > 0,
    value.trim().length > 0,
    true,
  ][step - 1];

  const startScan = () => {
    setScanDone(false);
    setTimeout(() => setScanDone(true), 2000);
  };

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #c9a84c 0%, #e8c96e 45%, #b8903c 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div className="relative mb-6" style={{ perspective: "600px" }}>
            <img
              src={card2}
              alt="Reference card"
              className="w-40 rounded-xl"
              style={{ objectFit: "contain", boxShadow: "0 16px 40px rgba(0,0,0,0.35)", transform: "rotate(-2deg)" }}
              draggable={false}
            />
          </div>
          <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-2">Success</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Added to your<br />collection!</h2>
          <p className="text-white/70 text-sm mb-2">{player} · {year} {brand}</p>
          <div className="flex items-center gap-2 mt-1 mb-8">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white/90" style={{ background: "rgba(0,0,0,0.2)" }}>
              {grader} {grade}
            </span>
            {value && <span className="text-white font-semibold text-sm">${parseFloat(value).toLocaleString()}</span>}
          </div>
          <button
            onClick={() => {}}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm mb-3"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
          >
            <Share2 className="inline w-4 h-4 mr-1.5 -mt-0.5" />
            Share
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.8)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 mb-6">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: step > i ? "#111" : "#f0f0f0" }} />
            ))}
          </div>
          <span className="text-xs text-gray-400 mr-3 flex-shrink-0">{step}/{STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 90px)", scrollbarWidth: "none" }}>

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Add a card</h2>
              <p className="text-sm text-gray-400 mb-6">Scan the barcode on the slab or enter manually.</p>

              <button
                onClick={startScan}
                className="w-full rounded-2xl overflow-hidden mb-5 focus:outline-none"
                style={{ height: 200, background: "#0c0c0e" }}
              >
                {[["top-3 left-3","border-t-2 border-l-2"],["top-3 right-3","border-t-2 border-r-2"],["bottom-3 left-3","border-b-2 border-l-2"],["bottom-3 right-3","border-b-2 border-r-2"]].map(([pos, border], i) => (
                  <div key={i} className={`absolute w-7 h-7 ${pos} ${border} border-white/50 rounded-sm`} />
                ))}
                {scanDone ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-white text-sm font-semibold">Detected</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute left-6 right-6 h-px bg-white/50 rounded-full"
                      style={{ animation: "scanLine 1.8s ease-in-out infinite" }} />
                    <Scan className="w-8 h-8 text-white/20" />
                    <style>{`@keyframes scanLine{0%,100%{top:25%}50%{top:75%}}`}</style>
                  </div>
                )}
              </button>

              <button onClick={next}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold mb-3">
                {scanDone ? "Continue with scan" : "Enter manually"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Who's on the card?</h2>
              <p className="text-sm text-gray-400 mb-6">Enter the player's name.</p>
              <input
                autoFocus value={player} onChange={e => setPlayer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canNext && next()}
                placeholder="e.g. Bo Jackson"
                className="w-full rounded-2xl bg-gray-50 px-4 py-4 text-lg text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }}
              />
              <button onClick={next} disabled={!canNext}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {step === 3 && (() => {
            const availBrands = BRANDS_BY_YEAR(parseInt(year) || 2000);
            const currentBrand = availBrands.includes(brand) ? brand : availBrands[0];
            if (currentBrand !== brand) setBrand(currentBrand);
            return (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Card info</h2>
                <p className="text-sm text-gray-400 mb-4">Scroll to select — brands update based on the year.</p>

                <div className="flex gap-2 mb-1">
                  {["Year","Brand","Team"].map(l => (
                    <p key={l} className="flex-1 text-center text-[10px] font-medium text-gray-400 tracking-widest uppercase">{l}</p>
                  ))}
                </div>

                <div className="flex gap-2 mb-5">
                  <div className="flex-1">
                    <ScrollPicker items={ALL_YEARS} value={year || ALL_YEARS[35]} onChange={v => { setYear(v); }} />
                  </div>
                  <div className="flex-1">
                    <ScrollPicker items={availBrands} value={currentBrand} onChange={setBrand} />
                  </div>
                  <div className="flex-1">
                    <ScrollPicker items={ALL_TEAMS} value={team || ALL_TEAMS[0]} onChange={setTeam} />
                  </div>
                </div>

                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">
                  Card # <span className="normal-case font-normal tracking-normal text-gray-300">optional</span>
                </p>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="e.g. #50T"
                  className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none mb-6"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />

                <button onClick={next} className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                  Continue
                </button>
              </>
            );
          })()}

          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Grading</h2>
              <p className="text-sm text-gray-400 mb-5">Select the grading company and score.</p>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grader *</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {GRADERS.map(g => (
                  <button key={g} onClick={() => setGrader(g)}
                    className="py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ background: grader === g ? (GRADER_COLOR[g] || "#111") : "#f4f4f5", color: grader === g ? "#fff" : "#888" }}>
                    {g}
                  </button>
                ))}
              </div>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grade *</p>
              <div className="grid grid-cols-5 gap-2 mb-1">
                {GRADES.map(g => (
                  <button key={g} onClick={() => setGrade(g)}
                    className="py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ background: grade === g ? (graderColor) : "#f4f4f5", color: grade === g ? "#fff" : "#888" }}>
                    {g}
                  </button>
                ))}
              </div>
              {grade && <p className="text-xs text-gray-400 mb-4">{gradeLabel}</p>}
              {!grade && <div className="mb-4" />}

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Cert # *</p>
              <input value={cert} onChange={e => setCert(e.target.value)} placeholder="e.g. 22365223"
                inputMode="numeric"
                className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 outline-none font-mono mb-6" />

              <button onClick={next} disabled={!canNext}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">What's it worth?</h2>
              <p className="text-sm text-gray-400 mb-5">Add pricing so your collection stays up to date.</p>

              {[
                { label: "Est. Value", sub: "eBay", val: value, set: setValue, required: true, placeholder: "0" },
                { label: "Sell Price", sub: "Fanatics", val: sellPrice, set: setSellPrice, required: false, placeholder: "0" },
                { label: "Pop Report", sub: "PSA", val: popReport, set: setPopReport, required: false, placeholder: "0", noPrefix: true },
              ].map(f => (
                <div key={f.label} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">{f.label}{f.required ? " *" : ""}</p>
                    <p className="text-[10px] text-gray-300">{f.sub}</p>
                  </div>
                  <div className="relative">
                    {!f.noPrefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>}
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                      inputMode="decimal" type="number"
                      className={`w-full rounded-2xl bg-gray-50 ${!f.noPrefix ? "pl-8" : "pl-4"} pr-4 py-3.5 text-base text-gray-900 placeholder-gray-300 outline-none`}
                      style={{ fontFamily: "'Google Sans', sans-serif" }} />
                  </div>
                </div>
              ))}

              <div className="mt-6">
                <button onClick={next} disabled={!canNext}
                  className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Looks good?</h2>
              <p className="text-sm text-gray-400 mb-5">Review before adding to your collection.</p>

              <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#f7f7f7" }}>
                <div className="h-1.5 w-full" style={{ background: graderColor }} />
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{player}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {year}{brand ? ` · ${brand}` : ""}{team ? ` · ${team}` : ""}{cardNumber ? ` · ${cardNumber}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl flex-shrink-0" style={{ background: graderColor }}>
                      <span className="text-xl font-black text-white leading-none">{grade}</span>
                      <span className="text-[9px] font-bold tracking-widest text-white/70 uppercase">{grader}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Cert #",     value: cert,       mono: true },
                      { label: "Condition",  value: gradeLabel              },
                      ...(value     ? [{ label: "Est. Value", value: `$${parseFloat(value).toLocaleString()}`,     sub: "eBay"     }] : []),
                      ...(sellPrice ? [{ label: "Sell Price", value: `$${parseFloat(sellPrice).toLocaleString()}`, sub: "Fanatics" }] : []),
                      ...(popReport ? [{ label: "Pop Report", value: popReport, sub: "PSA" }] : []),
                    ].map((s: any) => (
                      <div key={s.label} className="rounded-xl bg-white px-3 py-2.5">
                        <p className="text-[9px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">{s.label}</p>
                        <p className={`text-sm font-semibold text-gray-800 ${s.mono ? "font-mono text-xs" : ""}`}>{s.value || "—"}</p>
                        {s.sub && <p className="text-[9px] text-gray-400 mt-0.5">{s.sub}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onAdd({
                    id: Date.now(),
                    img: "",
                    player,
                    year,
                    brand,
                    team,
                    grader,
                    grade,
                    gradeLabel,
                    cert,
                    value: parseFloat(value) || 0,
                    change: 0,
                    subGrades: null,
                    autograph: false,
                    popReport: popReport ? parseInt(popReport) : undefined,
                    sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
                  });
                  setDone(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                Add to Collection
              </button>
            </>
          )}

          {step > 1 && (
            <button onClick={back} className="w-full mt-3 py-2.5 text-sm text-gray-400">← Back</button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep ScanCardSheet`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/cards/ScanCardSheet.tsx
git commit -m "Extract ScanCardSheet"
```

---

## Task 14: Extract `NewFolderSheet`, create `EditFolderSheet`

**Files:**
- Create: `src/app/components/cards/NewFolderSheet.tsx`
- Create: `src/app/components/cards/EditFolderSheet.tsx`

Two things to know before extracting `NewFolderSheet` (App.tsx lines 915-1056):

1. `const FOLDER_ICONS = [...]` at lines 907-913 is dead code — grep the original file (`grep -n FOLDER_ICONS src/app/App.tsx`) and it only appears once, at its own definition. There's no icon-picker step anywhere in the 3-step wizard (`STEPS = ["Name", "Color", "Cards"]`). Do not extract it.
2. The component destructures a prop `allCards = ALL_CARDS` in its signature but its body never actually reads that prop — `filteredCards` (line 923) and `previewImgs` (line 932) both read the module-level `ALL_CARDS` constant directly, ignoring whatever was passed in. That's a real bug: once cards live in a persisted store instead of the static `ALL_CARDS` array (Task 23), this sheet's "add cards to folder" search would keep showing stale seed data forever, missing anything you scanned, edited, or deleted. Fixed below by actually using the `allCards` prop.

`EditFolderSheet` is new — a 2-field rename + recolor sheet (no card-selection step), opened from `FolderDetailView`'s new "⋯" menu in Task 15.

- [ ] **Step 1: Create `components/cards/NewFolderSheet.tsx`**

```tsx
import { useState } from "react";
import { Folder, Check, Search, X } from "lucide-react";
import type { Card } from "../../types";
import { FOLDER_COLORS } from "../../data/mockCards";

interface NewFolderSheetProps {
  onClose: () => void;
  onCreate: (name: string, color: string, thumbnail?: string, cardIds?: number[]) => void;
  allCards: Card[];
}

export function NewFolderSheet({ onClose, onCreate, allCards }: NewFolderSheetProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [thumbnail] = useState<string | undefined>(undefined);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [cardSearch, setCardSearch] = useState("");

  const filteredCards = allCards.filter(c =>
    c.player.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.year.includes(cardSearch) ||
    c.team.toLowerCase().includes(cardSearch.toLowerCase())
  );

  const STEPS = ["Name", "Color", "Cards"];

  const previewImgs = allCards.filter(c => selectedCards.includes(c.id)).slice(0, 3).map(c => c.img);
  const offsets = [
    { rotate: "-12deg", translate: "-16px, 4px", z: 0 },
    { rotate: "-3deg",  translate: "-2px, 2px",  z: 1 },
    { rotate: "6deg",   translate: "14px, 0px",  z: 2 },
  ];
  const FolderPreview = () => (
    <div className="w-28 mx-auto rounded-2xl overflow-hidden mb-5" style={{ background: color }}>
      <div className="relative flex items-center justify-center" style={{ height: "80px", background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}>
        {previewImgs.length > 0 ? (
          previewImgs.map((img, i) => (
            <img key={i} src={img} alt="" draggable={false} className="absolute"
              style={{ width: 34, objectFit: "contain", background: "#f4f4f5", borderRadius: 3, boxShadow: "0 2px 6px rgba(0,0,0,0.3)", transform: `rotate(${offsets[i].rotate}) translate(${offsets[i].translate})`, zIndex: offsets[i].z }} />
          ))
        ) : (
          <Folder className="w-5 h-5 text-white/50" />
        )}
      </div>
      <div className="px-2.5 py-1.5" style={{ background: "rgba(0,0,0,0.18)" }}>
        <p className="text-[10px] font-semibold text-white truncate">{name || "Folder"}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: step > i ? "#111" : "#f0f0f0" }} />
            ))}
          </div>
          <span className="text-xs text-gray-400 mr-3 flex-shrink-0">{step} / {STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(85vh - 90px)", scrollbarWidth: "none" }}>

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Name your folder</h2>
              <p className="text-sm text-gray-400 mb-6">Give it a name that reflects what's inside.</p>
              <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && setStep(2)}
                placeholder="e.g. Rookies, Hall of Fame…"
                className="w-full rounded-2xl bg-gray-50 px-4 py-4 text-base text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }}
              />
              <button onClick={() => setStep(2)} disabled={!name.trim()}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30 transition-opacity">
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Pick a color</h2>
              <p className="text-sm text-gray-400 mb-6">This color will represent your folder.</p>
              <div className="grid grid-cols-4 gap-3 mb-8">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="h-14 rounded-2xl flex items-center justify-center transition-all"
                    style={{ background: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "3px" }}>
                    {color === c && <Check className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(3)} className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Continue</button>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Add cards</h2>
              <p className="text-sm text-gray-400 mb-4">Select the cards you want in this folder.</p>
              <FolderPreview />
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3.5 py-2.5 mb-4">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={cardSearch} onChange={e => setCardSearch(e.target.value)} placeholder="Search cards…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
                {cardSearch && <button onClick={() => setCardSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                {filteredCards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCards(prev => prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id])}
                    className="relative focus:outline-none">
                    <div className="overflow-hidden" style={{ outline: selectedCards.includes(card.id) ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                      <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                    </div>
                    {selectedCards.includes(card.id) && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-950 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <p className="text-[9px] text-gray-500 text-center mt-1 truncate">{card.player.split(" ").pop()}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { onCreate(name.trim(), color, thumbnail, selectedCards); onClose(); }}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                Create Folder{selectedCards.length > 0 ? ` · ${selectedCards.length} cards` : ""}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/cards/EditFolderSheet.tsx`**

```tsx
import { useState } from "react";
import { X, Check } from "lucide-react";
import type { FolderType } from "../../types";
import { FOLDER_COLORS } from "../../data/mockCards";

interface EditFolderSheetProps {
  folder: FolderType;
  onClose: () => void;
  onSave: (updated: FolderType) => void;
}

export function EditFolderSheet({ folder, onClose, onSave }: EditFolderSheetProps) {
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ ...folder, name: name.trim(), color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-900">Edit folder</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 pb-10">
          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 mt-4">Name</p>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-4 text-base text-gray-900 outline-none mb-6" />

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Color</p>
          <div className="grid grid-cols-4 gap-3 mb-8">
            {FOLDER_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="h-14 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "3px" }}>
                {color === c && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>

          <button onClick={handleSave} disabled={!name.trim()}
            className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep -E "NewFolderSheet|EditFolderSheet"`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/cards/NewFolderSheet.tsx src/app/components/cards/EditFolderSheet.tsx
git commit -m "Extract NewFolderSheet (fix stale allCards bug), add EditFolderSheet"
```

---

## Task 15: Extract and modify `FolderDetailView`

**Files:**
- Create: `src/app/components/cards/FolderDetailView.tsx`

Extracts App.tsx lines 1060-1190. Same `allCards` prop bug as Task 14: the "Add Cards" grid (line 1133) and "Choose Thumbnail" grid (line 1168) both read the module-level `ALL_CARDS` instead of the `allCards` prop — fixed below. Also adds: a "⋯" menu next to Share for Edit folder / Delete folder (wired to new required `onEdit`/`onDelete` props, owned by the caller in `App.tsx` — this view doesn't render `EditFolderSheet`/`ConfirmDialog` itself, it just asks its parent to open them), and passes the same edit/delete-card wiring into its nested `DetailSheet` that Task 11 added.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from "react";
import { ChevronLeft, Folder, Plus, Share2, X, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Card, FolderType } from "../../types";
import { CardTile } from "./CardTile";
import { DetailSheet } from "./DetailSheet";
import { ShareSheet } from "../shared/ShareSheet";

interface FolderDetailViewProps {
  folder: FolderType;
  onBack: () => void;
  onUpdate: (updated: FolderType) => void;
  allCards: Card[];
  onEdit: () => void;
  onDelete: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: number) => void;
}

export function FolderDetailView({ folder, onBack, onUpdate, allCards, onEdit, onDelete, onEditCard, onDeleteCard }: FolderDetailViewProps) {
  const [selected, setSelected] = useState<Card | null>(null);
  const [sharing, setSharing] = useState(false);
  const [addingCards, setAddingCards] = useState(false);
  const [changingThumb, setChangingThumb] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cards = allCards.filter(c => folder.cardIds.includes(c.id));
  const folderValue = cards.reduce((s, c) => s + c.value, 0);

  const toggleCard = (id: number) => {
    const next = folder.cardIds.includes(id)
      ? folder.cardIds.filter(x => x !== id)
      : [...folder.cardIds, id];
    onUpdate({ ...folder, cardIds: next });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={() => setChangingThumb(true)} className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 relative">
          {folder.thumbnail
            ? <img src={folder.thumbnail} alt="" className="w-full h-full object-contain" style={{ background: folder.color }} />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: folder.color }}><Folder className="w-4 h-4 text-white" /></div>
          }
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <Plus className="w-3 h-3 text-white" />
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 leading-tight">{folder.name}</h2>
          <p className="text-[11px] text-gray-400">{cards.length} cards · ${folderValue.toLocaleString()} <span className="text-gray-300">· eBay</span></p>
        </div>
        <button onClick={() => setSharing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold flex-shrink-0">
          <Share2 className="w-3 h-3" />Share
        </button>
        <div className="relative flex-shrink-0">
          <button onClick={() => setMenuOpen(o => !o)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-10 w-40 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
              <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 text-left">
                <Pencil className="w-3.5 h-3.5" />Edit folder
              </button>
              <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 text-left border-t border-gray-100">
                <Trash2 className="w-3.5 h-3.5" />Delete folder
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Folder className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">No cards in this folder</p>
            <button onClick={() => setAddingCards(true)} className="px-4 py-2 rounded-full bg-gray-950 text-white text-xs font-semibold">Add Cards</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              {cards.map((card, i) => (
                <CardTile key={card.id} card={card} index={i} onClick={() => setSelected(card)} />
              ))}
            </div>
            <button onClick={() => setAddingCards(true)} className="w-full py-3 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />Add Cards
            </button>
          </>
        )}
      </div>

      {addingCards && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={() => setAddingCards(false)}>
          <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "80vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <h2 className="text-base font-semibold text-gray-900">Add Cards</h2>
              <button onClick={() => setAddingCards(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", maxHeight: "calc(80vh - 80px)" }}>
              {allCards.map(card => (
                <button key={card.id} onClick={() => toggleCard(card.id)} className="relative focus:outline-none">
                  <div className="overflow-hidden" style={{ outline: folder.cardIds.includes(card.id) ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                    <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                  </div>
                  {folder.cardIds.includes(card.id) && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-950 flex items-center justify-center">
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {changingThumb && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={() => setChangingThumb(false)}>
          <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "70vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <h2 className="text-base font-semibold text-gray-900">Choose Thumbnail</h2>
              <button onClick={() => setChangingThumb(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", maxHeight: "calc(70vh - 80px)" }}>
              <button onClick={() => { onUpdate({ ...folder, thumbnail: undefined }); setChangingThumb(false); }}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{ background: folder.color, outline: !folder.thumbnail ? "2px solid #111" : "none", outlineOffset: "2px" }}>
                <Folder className="w-5 h-5 text-white" />
              </button>
              {allCards.map(card => (
                <button key={card.id} onClick={() => { onUpdate({ ...folder, thumbnail: card.img }); setChangingThumb(false); }}
                  className="overflow-hidden"
                  style={{ outline: folder.thumbnail === card.img ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                  <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <DetailSheet
          onClose={() => setSelected(null)}
          cards={cards}
          initialIndex={cards.findIndex(c => c.id === selected.id)}
          onEdit={onEditCard}
          onDelete={onDeleteCard}
        />
      )}
      {sharing && (
        <ShareSheet
          title={folder.name}
          subtitle={`${cards.length} cards · Est. $${folderValue.toLocaleString()}`}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep FolderDetailView`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/cards/FolderDetailView.tsx
git commit -m "Extract FolderDetailView, fix stale allCards bug, add folder edit/delete menu"
```

---

## Task 16: Extract and modify `MarketCardDetailSheet`, create `BuyConfirmSheet`

**Files:**
- Create: `src/app/components/market/MarketCardDetailSheet.tsx`
- Create: `src/app/components/market/BuyConfirmSheet.tsx`

Extracts App.tsx lines 1208-1277 and adds a watchlist heart toggle plus wires the existing "Buy" button to a new `onBuy` prop (the caller opens `BuyConfirmSheet`, which is new — App.tsx lines never had a purchase confirmation at all, "Buy" did nothing).

- [ ] **Step 1: Create `components/market/MarketCardDetailSheet.tsx`**

```tsx
import { Heart } from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { MarketItem } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";

interface MarketCardDetailSheetProps {
  item: MarketItem;
  onClose: () => void;
  onBuy: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
}

export function MarketCardDetailSheet({ item, onClose, onBuy, isWatchlisted, onToggleWatchlist }: MarketCardDetailSheetProps) {
  const gradeColor = GRADER_COLOR[item.grader] || "#111";
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="overflow-y-auto pb-10" style={{ maxHeight: "calc(90vh - 20px)", scrollbarWidth: "none" }}>
          <div className="flex justify-center px-6 pt-4 pb-4 relative">
            <img src={item.img} alt={item.player} className="w-40" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
            <button
              onClick={onToggleWatchlist}
              className="absolute top-4 right-6 w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center"
            >
              <Heart className="w-4 h-4" style={{ fill: isWatchlisted ? "#dc2626" : "none", color: isWatchlisted ? "#dc2626" : "#9ca3af" }} />
            </button>
          </div>
          <div className="flex items-start justify-between px-6 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{item.player}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{item.year} · {item.brand}</p>
            </div>
            <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl flex-shrink-0" style={{ background: gradeColor }}>
              <span className="text-xl font-bold text-white leading-none">{item.grade}</span>
              <span className="text-[9px] font-bold tracking-widest text-white/70 uppercase">{item.grader}</span>
            </div>
          </div>
          <div className="mx-6 rounded-2xl bg-gray-50 px-4 py-3.5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Price</p>
                <p className="text-2xl font-bold text-gray-900">${item.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 mb-0.5">Source</p>
                <p className="text-xs font-semibold text-gray-700">{item.source}</p>
                <span className={`text-xs font-semibold ${item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-400" : "text-gray-400"}`}>
                  {item.change > 0 ? "+" : ""}{item.change}% 30d
                </span>
              </div>
            </div>
          </div>
          <div className="mx-6 rounded-2xl border border-gray-100 px-4 pt-3.5 pb-2 mb-4">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Price History · {item.source}</p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={item.priceHistory}>
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Price"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f0f0f0" }} />
                <Line type="monotone" dataKey="v" stroke="#111" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mx-6 mb-5">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Recent Sales</p>
            {item.recentSales.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < item.recentSales.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                <p className="text-xs text-gray-500">{s.date}</p>
                <p className="text-xs text-gray-400">{s.source}</p>
                <p className="text-sm font-semibold text-gray-900">${s.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 px-6">
            <button onClick={onBuy} className="flex-1 py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Buy · {item.source}</button>
            <button className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/market/BuyConfirmSheet.tsx`**

```tsx
import { X } from "lucide-react";
import type { MarketItem } from "../../types";

interface BuyConfirmSheetProps {
  item: MarketItem;
  onClose: () => void;
  onConfirm: () => void;
}

export function BuyConfirmSheet({ item, onClose, onConfirm }: BuyConfirmSheetProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Buy this card?</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 mb-5">
          <img src={item.img} alt={item.player} className="w-12 flex-shrink-0" style={{ objectFit: "contain", background: "#ebebeb" }} draggable={false} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.player}</p>
            <p className="text-xs text-gray-400">{item.year} · {item.grader} {item.grade}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          This adds the card to your collection for <span className="font-semibold text-gray-900">${item.price.toLocaleString()}</span>. No real payment is made — Card Champs doesn't process real purchases.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Buy · ${item.price.toLocaleString()}</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep -E "MarketCardDetailSheet|BuyConfirmSheet"`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/market/MarketCardDetailSheet.tsx src/app/components/market/BuyConfirmSheet.tsx
git commit -m "Extract MarketCardDetailSheet, add watchlist toggle and BuyConfirmSheet"
```

---

## Task 17: Extract and modify `SellFlow`

**Files:**
- Create: `src/app/components/market/SellFlow.tsx`

Extracts App.tsx lines 1962-2155 (`SELL_PLATFORMS` + `SellFlow`). The only behavior change: "List for Sale" (step 3) currently just flips `done` to `true` with nowhere for the listing to go — it's purely decorative. It now calls a new `onCreate` prop with a real `Listing` object before showing the success screen, so `MarketView`'s "My Listings" tab (Task 18) has something real to display.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from "react";
import { X, Search, Check } from "lucide-react";
import type { Card, Listing } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";

const SELL_PLATFORMS = ["eBay", "Fanatics", "COMC", "MySlabs", "StockX"];

interface SellFlowProps {
  onClose: () => void;
  allCards: Card[];
  onCreate: (listing: Listing) => void;
}

export function SellFlow({ onClose, allCards, onCreate }: SellFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [platform, setPlatform] = useState("eBay");
  const [askingPrice, setAskingPrice] = useState("");
  const [condition] = useState("As graded");
  const [shipsFrom, setShipsFrom] = useState("United States");
  const [done, setDone] = useState(false);
  const [cardSearch, setCardSearch] = useState("");

  const filteredCards = allCards.filter(c =>
    c.player.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.year.includes(cardSearch)
  );

  const STEPS = ["Card", "Listing", "Review"];

  const handleList = () => {
    if (!selectedCard) return;
    onCreate({
      id: Date.now(),
      cardId: selectedCard.id,
      platform,
      askingPrice: parseFloat(askingPrice) || 0,
      condition,
      shipsFrom,
      status: "active",
      views: 0,
      createdAt: Date.now(),
    });
    setDone(true);
  };

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #111 0%, #333 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mb-5">
            <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-2">Listed</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Your card is live!</h2>
          {selectedCard && <p className="text-white/60 text-sm mb-1">{selectedCard.player} · {selectedCard.year}</p>}
          <p className="text-white font-semibold text-lg mb-6">${parseFloat(askingPrice || "0").toLocaleString()} · {platform}</p>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-white text-gray-900 text-sm font-semibold">Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ background: step > i ? "#111" : "#f0f0f0" }} />)}
          </div>
          <span className="text-xs text-gray-400 mr-3">{step}/{STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 88px)", scrollbarWidth: "none" }}>

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Which card are you selling?</h2>
              <p className="text-sm text-gray-400 mb-4">Pick from your collection.</p>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3.5 py-2.5 mb-4">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={cardSearch} onChange={e => setCardSearch(e.target.value)} placeholder="Search cards…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
                {cardSearch && <button onClick={() => setCardSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-5">
                {filteredCards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCard(card)} className="relative focus:outline-none group">
                    <div className="overflow-hidden transition-all" style={{ outline: selectedCard?.id === card.id ? "2px solid #111" : "2px solid transparent", outlineOffset: 2 }}>
                      {card.img
                        ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                        : <div className="w-full flex items-center justify-center py-4" style={{ background: GRADER_COLOR[card.grader]||"#888", aspectRatio:"2.5/3.5" }}><span className="text-white text-[9px] text-center px-1">{card.player}</span></div>
                      }
                    </div>
                    {selectedCard?.id === card.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <p className="text-[9px] text-gray-500 text-center mt-1 truncate">{card.player.split(" ").pop()}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} disabled={!selectedCard}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {step === 2 && selectedCard && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Set your listing</h2>
              <p className="text-sm text-gray-400 mb-4">Price it and choose where to list.</p>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 mb-5">
                {selectedCard.img
                  ? <img src={selectedCard.img} alt={selectedCard.player} className="w-12 flex-shrink-0" style={{ objectFit: "contain", background: "#ebebeb" }} draggable={false} />
                  : <div className="w-12 h-16 flex-shrink-0 flex items-center justify-center rounded" style={{ background: GRADER_COLOR[selectedCard.grader]||"#888" }}><span className="text-white text-[8px] text-center px-0.5">{selectedCard.player}</span></div>
                }
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedCard.player}</p>
                  <p className="text-xs text-gray-400">{selectedCard.year} · {selectedCard.grader} {selectedCard.grade}</p>
                  <p className="text-xs text-gray-400">Est. value: <span className="font-semibold text-gray-700">${selectedCard.value.toLocaleString()}</span></p>
                </div>
              </div>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Platform</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {SELL_PLATFORMS.map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                    style={{ background: platform === p ? "#111" : "#f4f4f5", color: platform === p ? "#fff" : "#888" }}>
                    {p}
                  </button>
                ))}
              </div>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Asking Price *</p>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder={selectedCard.value.toLocaleString()}
                  inputMode="decimal" type="number"
                  className="w-full rounded-2xl bg-gray-50 pl-8 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-300 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
              </div>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Ships From</p>
              <input value={shipsFrom} onChange={e => setShipsFrom(e.target.value)} placeholder="Country / Region"
                className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }} />

              <button onClick={() => setStep(3)} disabled={!askingPrice.trim()}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {step === 3 && selectedCard && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Review your listing</h2>
              <p className="text-sm text-gray-400 mb-5">Everything looks good?</p>

              <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#f7f7f7" }}>
                <div className="h-1 w-full" style={{ background: GRADER_COLOR[selectedCard.grader] || "#111" }} />
                <div className="flex items-center gap-4 p-4">
                  {selectedCard.img
                    ? <img src={selectedCard.img} alt={selectedCard.player} className="w-16 flex-shrink-0" style={{ objectFit: "contain", background: "#ebebeb" }} draggable={false} />
                    : <div className="w-16 h-20 flex-shrink-0 flex items-center justify-center rounded" style={{ background: GRADER_COLOR[selectedCard.grader]||"#888" }}><span className="text-white text-[8px] text-center px-1">{selectedCard.player}</span></div>
                  }
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{selectedCard.player}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedCard.year} · {selectedCard.brand}</p>
                    <p className="text-xs text-gray-400">{selectedCard.grader} {selectedCard.grade} · {selectedCard.gradeLabel}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-px bg-gray-200">
                  {[
                    { label: "Price", value: `$${parseFloat(askingPrice).toLocaleString()}` },
                    { label: "Platform", value: platform },
                    { label: "Ships From", value: shipsFrom },
                  ].map(s => (
                    <div key={s.label} className="bg-white px-3 py-3 text-center">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleList}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold mb-2">
                List for Sale
              </button>
            </>
          )}

          {step > 1 && !done && (
            <button onClick={() => setStep(s => s - 1)} className="w-full mt-2 py-2.5 text-sm text-gray-400">← Back</button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep SellFlow`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/market/SellFlow.tsx
git commit -m "Extract SellFlow, persist created listings via onCreate"
```

---

## Task 18: Extract and modify `MarketView`

**Files:**
- Create: `src/app/components/market/MarketView.tsx`

Extracts App.tsx lines 1279-1480 and rebuilds three things that were previously fake: the "My Listings" tab (originally three cards hardcoded from fixed `ALL_CARDS` indices, `ALL_CARDS[1]`/`ALL_CARDS[3]`/`ALL_CARDS[0]`) now renders the real persisted `listings` store; a new "Watchlist" sub-tab shows saved market items; and every market tile (spotlight, trending scroller, shop grid, search results) gets a heart toggle. The repeated tile markup (image + player/year/price/change/source) is factored into a local `MarketTile` helper inside this file to avoid pasting the same JSX four times.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from "react";
import { TrendingUp, Tag, Search, Heart, X } from "lucide-react";
import type { Card, MarketItem, Listing } from "../../types";
import { MARKET_ITEMS } from "../../data/mockMarket";
import { AnimateIn } from "../shared/AnimateIn";
import { MarketCardDetailSheet } from "./MarketCardDetailSheet";
import { BuyConfirmSheet } from "./BuyConfirmSheet";

interface MarketTileProps {
  item: MarketItem;
  onSelect: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
  size?: "grid" | "trending";
}

function MarketTile({ item, onSelect, isWatchlisted, onToggleWatchlist, size = "grid" }: MarketTileProps) {
  return (
    <div className={`relative ${size === "trending" ? "flex-shrink-0 w-32" : "w-full"} rounded-2xl overflow-hidden`} style={{ background: "#f7f7f7" }}>
      <button onClick={onSelect} className="w-full text-left focus:outline-none">
        <img src={item.img} alt={item.player} className="w-full" style={{ objectFit: "contain", background: "#f0f0f0" }} draggable={false} />
        <div className="px-2.5 py-2">
          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{item.player}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{item.year}{size === "grid" ? ` · ${item.brand}` : ""}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold text-gray-900">${item.price.toLocaleString()}</span>
            <span className={`text-[10px] font-semibold ${item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-400" : "text-gray-400"}`}>
              {item.change > 0 ? "+" : ""}{item.change !== 0 ? `${item.change}%` : "—"}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5">{item.source}</p>
        </div>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onToggleWatchlist(); }}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center"
      >
        <Heart className="w-3 h-3" style={{ fill: isWatchlisted ? "#dc2626" : "none", color: isWatchlisted ? "#dc2626" : "#9ca3af" }} />
      </button>
    </div>
  );
}

interface MarketViewProps {
  allCards: Card[];
  listings: Listing[];
  watchlist: number[];
  onToggleWatchlist: (id: number) => void;
  onBuy: (item: MarketItem) => void;
}

export function MarketView({ allCards, listings, watchlist, onToggleWatchlist, onBuy }: MarketViewProps) {
  const [query, setQuery] = useState("");
  const [marketTab, setMarketTab] = useState<"browse" | "watchlist" | "listings">("browse");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [buyingItem, setBuyingItem] = useState<MarketItem | null>(null);
  const isSearching = query.trim().length > 0;
  const spotlight = MARKET_ITEMS[0];

  const filtered = MARKET_ITEMS.filter(item =>
    item.player.toLowerCase().includes(query.toLowerCase()) ||
    item.year.includes(query) ||
    item.brand.toLowerCase().includes(query.toLowerCase())
  );

  const watchlistedItems = MARKET_ITEMS.filter(item => watchlist.includes(item.id));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-6 mb-4">
        {([
          { id: "browse", label: "Browse", icon: TrendingUp },
          { id: "watchlist", label: "Watchlist", icon: Heart },
          { id: "listings", label: "My Listings", icon: Tag },
        ] as { id: "browse" | "watchlist" | "listings"; label: string; icon: typeof TrendingUp }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMarketTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{ background: marketTab === id ? "#111" : "transparent", color: marketTab === id ? "#fff" : "#bbb" }}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {marketTab === "listings" && (
        <div className="flex-1 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Tag className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No listings yet</p>
              <p className="text-xs text-gray-300">Use the Sell button to list a card</p>
            </div>
          ) : (
            listings.map((listing, i) => {
              const listingCard = allCards.find(c => c.id === listing.cardId);
              if (!listingCard) return null;
              return (
                <AnimateIn key={listing.id} delay={i * 80}>
                <div className="flex items-center gap-3.5 py-3.5" style={{ borderBottom: "1px solid #f4f4f5" }}>
                  <img src={listingCard.img} alt={listingCard.player} className="w-12 flex-shrink-0"
                    style={{ objectFit: "contain", background: "#f4f4f5", opacity: listing.status === "sold" ? 0.45 : 1 }} draggable={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{listingCard.player}</p>
                      <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: listing.status === "active" ? "#f0fdf4" : "#f4f4f5", color: listing.status === "active" ? "#16a34a" : "#aaa" }}>
                        {listing.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{listingCard.year} · {listingCard.grader} {listingCard.grade}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{listing.views} views</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-base font-semibold text-gray-900">${listing.askingPrice}</p>
                    <p className="text-[10px] text-gray-400">{listing.platform}</p>
                  </div>
                </div>
                </AnimateIn>
              );
            })
          )}
        </div>
      )}

      {marketTab === "watchlist" && (
        <div className="flex-1 px-6 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
          {watchlistedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Heart className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">Your watchlist is empty</p>
              <p className="text-xs text-gray-300">Tap the heart on any card to save it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {watchlistedItems.map((item, i) => (
                <AnimateIn key={item.id} delay={i * 70}>
                  <MarketTile
                    item={item}
                    onSelect={() => setSelectedItem(item)}
                    isWatchlisted
                    onToggleWatchlist={() => onToggleWatchlist(item.id)}
                  />
                </AnimateIn>
              ))}
            </div>
          )}
        </div>
      )}

      {marketTab === "browse" && (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>

          {!isSearching && (
            <AnimateIn delay={0} className="px-6 mb-5">
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase text-center mb-3">Deal of the Day</p>
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #c9a84c 0%, #e8c96e 40%, #b8903c 100%)" }}>
                <button onClick={() => setSelectedItem(spotlight)} className="w-full focus:outline-none">
                  <div className="flex flex-col items-center px-5 pt-5 pb-4 text-center">
                    <img
                      src={spotlight.img}
                      alt={spotlight.player}
                      className="w-52 mb-4"
                      style={{ objectFit: "contain", background: "rgba(255,255,255,0.15)", borderRadius: 6 }}
                      draggable={false}
                    />
                    <p className="text-base font-bold text-white leading-tight">{spotlight.player}</p>
                    <p className="text-xs text-white/70 mt-0.5">{spotlight.year} · {spotlight.brand}</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className="text-2xl font-black text-white">${spotlight.price.toLocaleString()}</span>
                      <span className="text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">+{spotlight.change}%</span>
                    </div>
                    <p className="text-[10px] text-white/60 mt-1">Price source: {spotlight.source}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/90" style={{ background: "rgba(0,0,0,0.25)" }}>
                        {spotlight.grader} {spotlight.grade}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onToggleWatchlist(spotlight.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center"
                >
                  <Heart className="w-4 h-4" style={{ fill: watchlist.includes(spotlight.id) ? "#dc2626" : "none", color: "#fff" }} />
                </button>
              </div>
            </AnimateIn>
          )}

          <AnimateIn delay={80} className="px-6 mb-5">
            <div className="flex items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-3">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Player, year, brand…"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                style={{ fontFamily: "'Google Sans', sans-serif" }} />
              {query && <button onClick={() => setQuery("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
            </div>
          </AnimateIn>

          {!isSearching ? (
            <>
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-6 mb-3">Trending</p>
                <div className="flex gap-3 px-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {MARKET_ITEMS.slice(1, 4).map((item, i) => (
                    <AnimateIn key={item.id} delay={160 + i * 80}>
                      <MarketTile
                        item={item}
                        size="trending"
                        onSelect={() => setSelectedItem(item)}
                        isWatchlisted={watchlist.includes(item.id)}
                        onToggleWatchlist={() => onToggleWatchlist(item.id)}
                      />
                    </AnimateIn>
                  ))}
                </div>
              </div>

              <div className="px-6">
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-3">Shop</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MARKET_ITEMS.slice(4).map((item, i) => (
                    <AnimateIn key={item.id} delay={i * 70}>
                      <MarketTile
                        item={item}
                        onSelect={() => setSelectedItem(item)}
                        isWatchlisted={watchlist.includes(item.id)}
                        onToggleWatchlist={() => onToggleWatchlist(item.id)}
                      />
                    </AnimateIn>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="px-6">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Search className="w-8 h-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No results for "{query}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered.map((item, i) => (
                    <AnimateIn key={item.id} delay={i * 60}>
                      <MarketTile
                        item={item}
                        onSelect={() => setSelectedItem(item)}
                        isWatchlisted={watchlist.includes(item.id)}
                        onToggleWatchlist={() => onToggleWatchlist(item.id)}
                      />
                    </AnimateIn>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <MarketCardDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onBuy={() => setBuyingItem(selectedItem)}
          isWatchlisted={watchlist.includes(selectedItem.id)}
          onToggleWatchlist={() => onToggleWatchlist(selectedItem.id)}
        />
      )}
      {buyingItem && (
        <BuyConfirmSheet
          item={buyingItem}
          onClose={() => setBuyingItem(null)}
          onConfirm={() => { onBuy(buyingItem); setBuyingItem(null); setSelectedItem(null); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep MarketView`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/market/MarketView.tsx
git commit -m "Extract MarketView, add Watchlist tab, wire My Listings to persisted listings"
```

---

## Task 19: Extract and modify `PeerProfileSheet`

**Files:**
- Create: `src/app/components/peers/PeerProfileSheet.tsx`

Extracts App.tsx lines 1509-1624. Two changes: the original has no `allCards` prop at all — `cardByImg` reads the module-level `ALL_CARDS` directly (line 1513), so it needs one now that cards live in a persisted store. And its own local "Follow" button (`useState(false)`, forgotten on close) is replaced with `isFollowing`/`onToggleFollow` props backed by the same persisted `following` store `PeersView` uses in Task 20 — so following someone reads the same either place you do it from.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from "react";
import { X } from "lucide-react";
import type { Card, Peer } from "../../types";
import { DetailSheet } from "../cards/DetailSheet";

interface PeerProfileSheetProps {
  peer: Peer;
  onClose: () => void;
  allCards: Card[];
  isFollowing: boolean;
  onToggleFollow: () => void;
}

export function PeerProfileSheet({ peer, onClose, allCards, isFollowing, onToggleFollow }: PeerProfileSheetProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const cardByImg = (img: string) => allCards.find(c => c.img === img) ?? null;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg"
        style={{ maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="overflow-y-auto pb-10" style={{ maxHeight: "calc(88vh - 20px)", scrollbarWidth: "none" }}>
          <div className="flex items-start justify-between px-6 pt-4 pb-5">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                  <img src={peer.avatar} alt={peer.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                </div>
                {peer.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#b49e63] border-2 border-white flex items-center justify-center">
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{peer.name}</h2>
                  {peer.verified && (
                    <div className="rounded-full bg-[#b49e63] flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18 }}>
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {peer.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: peer.badge === "Top Collector" ? "#fef9ec" : "#f0fdf4", color: peer.badge === "Top Collector" ? "#b45309" : "#16a34a" }}>
                      {peer.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{peer.handle} · {peer.specialty}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-6 px-6 pb-5 border-b border-gray-100">
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Cards</p>
              <p className="text-xl font-semibold text-gray-900">{peer.cards}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Value</p>
              <p className="text-xl font-semibold text-gray-900">${peer.value.toLocaleString()}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={onToggleFollow}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{ background: isFollowing ? "#f4f4f5" : "#111", color: isFollowing ? "#888" : "#fff" }}
              >
                {isFollowing ? "Following ✓" : "Follow"}
              </button>
            </div>
          </div>

          <div className="px-6 pt-5 pb-4">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Top Cards</p>
            <div className="flex gap-3">
              {peer.topCards.map((img, i) => (
                <button key={i} className="flex-1 overflow-hidden focus:outline-none active:opacity-80" style={{ background: "#f4f4f5" }}
                  onClick={() => { const c = cardByImg(img); if (c) setSelectedCard(c); }}>
                  <img src={img} alt="" className="w-full block" style={{ objectFit: "contain" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pt-1">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Collection</p>
            <div className="grid grid-cols-3 gap-2">
              {peer.snapshot.map((img, i) => (
                <button key={i} className="overflow-hidden focus:outline-none active:opacity-80" style={{ background: "#f4f4f5" }}
                  onClick={() => { const c = cardByImg(img); if (c) setSelectedCard(c); }}>
                  <img src={img} alt="" className="w-full block" style={{ objectFit: "contain" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {selectedCard && <DetailSheet onClose={() => setSelectedCard(null)} isPeer cards={[selectedCard]} initialIndex={0} />}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep PeerProfileSheet`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/peers/PeerProfileSheet.tsx
git commit -m "Extract PeerProfileSheet, back Follow with the persisted following store"
```

---

## Task 20: Extract and modify `PeersView`

**Files:**
- Create: `src/app/components/peers/PeersView.tsx`

Extracts App.tsx lines 1634-1741. The original accepts a `showToast` prop (line 1634) that its body never calls anywhere — grep confirms (`grep -n showToast src/app/App.tsx` shows it's only assigned in `App()` and passed down, never invoked inside `PeersView`), so it was dead. It's put to real use below: toggling Follow now calls it. The bigger change is the one the design calls for — `following` moves from local `useState<Record<string,boolean>>({})` (reset every time you close and reopen this view) to props (`following: string[]`, `onToggleFollow`) backed by the persisted store from Task 23, and `PeerProfileSheet` gets the same follow state instead of its own local toggle.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from "react";
import { Share2, Search, X } from "lucide-react";
import type { Card, FolderType, Peer } from "../../types";
import { PEERS, SUGGESTED } from "../../data/mockPeers";
import { AnimateIn } from "../shared/AnimateIn";
import { ShareFlow } from "../shared/ShareFlow";
import { PeerProfileSheet } from "./PeerProfileSheet";

interface PeersViewProps {
  allCards: Card[];
  folders: FolderType[];
  following: string[];
  onToggleFollow: (handle: string) => void;
  showToast: (msg: string) => void;
}

export function PeersView({ allCards, folders, following, onToggleFollow, showToast }: PeersViewProps) {
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [query, setQuery] = useState("");
  const [showShareFlow, setShowShareFlow] = useState(false);

  const filteredSuggested = SUGGESTED.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.handle.toLowerCase().includes(query.toLowerCase())
  );

  const toggleFollow = (handle: string) => {
    const willFollow = !following.includes(handle);
    onToggleFollow(handle);
    showToast(willFollow ? `Following ${handle}` : `Unfollowed ${handle}`);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>

        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase px-6 mb-3">My Peers</p>
          <div className="flex gap-6 px-6 justify-center flex-wrap">
            {PEERS.map((peer, i) => (
              <AnimateIn key={i} delay={i * 80}>
              <button
                onClick={() => setSelectedPeer(peer)}
                className="flex flex-col items-center gap-2 focus:outline-none flex-shrink-0"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-sm">
                    <img src={peer.avatar} alt={peer.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                  </div>
                  {peer.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#b49e63] border-2 border-white flex items-center justify-center">
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-gray-900 leading-tight text-center max-w-[64px] truncate">{peer.name.split(" ")[0]}</p>
                <div className="flex flex-col items-center" style={{ gap: 1 }}>
                  <p className="text-[9px] text-gray-400 leading-none">{peer.handle}</p>
                  <p className="text-[9px] text-gray-400 leading-none">{peer.cards} cards</p>
                </div>
              </button>
              </AnimateIn>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 mx-6 mb-5" />

        <div className="flex gap-2 px-6 mb-5">
          <button onClick={() => setShowShareFlow(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gray-950 text-white text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5" />Share Collection
          </button>
        </div>

        <div className="px-6 mb-5">
          <div className="flex items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-3">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search collectors…"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              style={{ fontFamily: "'Google Sans', sans-serif" }}
            />
            {query && <button onClick={() => setQuery("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
        </div>

        <div className="px-6">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Suggested</p>
          <div className="flex flex-col">
            {filteredSuggested.map((s, i) => (
              <AnimateIn key={i} delay={i * 70}>
              <div className="flex items-center gap-3 py-3" style={{ borderBottom: i < filteredSuggested.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={s.avatar} alt={s.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="text-[11px] text-gray-400">{s.handle} · {s.cards} cards</p>
                </div>
                <button
                  onClick={() => toggleFollow(s.handle)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: following.includes(s.handle) ? "#f4f4f5" : "#111",
                    color: following.includes(s.handle) ? "#888" : "#fff",
                  }}
                >
                  {following.includes(s.handle) ? "Following" : "Follow"}
                </button>
              </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>

      {selectedPeer && (
        <PeerProfileSheet
          peer={selectedPeer}
          onClose={() => setSelectedPeer(null)}
          allCards={allCards}
          isFollowing={following.includes(selectedPeer.handle)}
          onToggleFollow={() => toggleFollow(selectedPeer.handle)}
        />
      )}
      {showShareFlow && <ShareFlow onClose={() => setShowShareFlow(false)} allCards={allCards} folders={folders} />}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep PeersView`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/peers/PeersView.tsx
git commit -m "Extract PeersView, persist Follow state, use showToast for follow feedback"
```

---

## Task 21: Create `SettingsView`

**Files:**
- Create: `src/app/components/settings/SettingsView.tsx`

Entirely new — the prototype has no settings screen. Edits the profile name/handle, exports/imports a JSON backup via Task 6's `backup.ts` helpers, and resets all data back to the seed values, each destructive action gated by `ConfirmDialog`.

- [ ] **Step 1: Write the component**

```tsx
import { useRef, useState } from "react";
import { ChevronLeft, Download, Upload, RotateCcw } from "lucide-react";
import type { Card, FolderType, Listing, Profile } from "../../types";
import { buildBackup, downloadBackup, parseBackupFile } from "../../lib/backup";
import type { BackupData } from "../../lib/backup";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface SettingsViewProps {
  onBack: () => void;
  profile: Profile;
  onProfileChange: (p: Profile) => void;
  cards: Card[];
  folders: FolderType[];
  watchlist: number[];
  following: string[];
  listings: Listing[];
  onRestore: (data: BackupData) => void;
  onReset: () => void;
}

export function SettingsView({
  onBack, profile, onProfileChange, cards, folders, watchlist, following, listings, onRestore, onReset,
}: SettingsViewProps) {
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [importError, setImportError] = useState("");
  const [confirmingImport, setConfirmingImport] = useState<BackupData | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = () => {
    onProfileChange({ ...profile, name: name.trim() || profile.name, handle: handle.trim() || profile.handle });
  };

  const handleExport = () => {
    downloadBackup(buildBackup({ cards, folders, profile, watchlist, following, listings }));
  };

  const handleFileChosen = async (file: File) => {
    setImportError("");
    try {
      const data = await parseBackupFile(file);
      setConfirmingImport(data);
    } catch {
      setImportError("That file isn't a valid Card Champs backup.");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Settings</h2>
      </div>

      <div className="flex-1 px-6 overflow-y-auto max-w-lg" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Profile</p>
        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Name</p>
        <input value={name} onChange={e => setName(e.target.value)} onBlur={saveProfile}
          className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-3" />
        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Handle</p>
        <input value={handle} onChange={e => setHandle(e.target.value)} onBlur={saveProfile}
          className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-8" />

        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Backup</p>
        <button onClick={handleExport}
          className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-gray-50 mb-2 text-left">
          <Download className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Export collection</p>
            <p className="text-xs text-gray-400">Download everything as a JSON file</p>
          </div>
        </button>
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-gray-50 mb-2 text-left">
          <Upload className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Import collection</p>
            <p className="text-xs text-gray-400">Restore from a backup file</p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) void handleFileChosen(file);
            e.target.value = "";
          }}
        />
        {importError && <p className="text-xs text-red-500 mb-2">{importError}</p>}

        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3 mt-8">Danger Zone</p>
        <button onClick={() => setConfirmingReset(true)}
          className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-red-50 text-left">
          <RotateCcw className="w-4 h-4 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-600">Reset all data</p>
            <p className="text-xs text-red-400">Erase your collection and start over</p>
          </div>
        </button>
      </div>

      {confirmingImport && (
        <ConfirmDialog
          title="Restore this backup?"
          message="This replaces your current cards, folders, watchlist, follows, and listings with the contents of the imported file."
          confirmLabel="Restore"
          onConfirm={() => { onRestore(confirmingImport); setConfirmingImport(null); }}
          onCancel={() => setConfirmingImport(null)}
        />
      )}
      {confirmingReset && (
        <ConfirmDialog
          title="Reset all data?"
          message="This erases your added cards, folders, watchlist, follows, and listings, and restores the original starter collection."
          confirmLabel="Reset"
          onConfirm={() => { onReset(); setConfirmingReset(false); }}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep SettingsView`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/settings/SettingsView.tsx
git commit -m "Add SettingsView: profile edit, backup export/import, reset"
```

---

## Task 22: Wire up `react-router`

**Files:**
- Modify: `src/main.tsx`

`react-router` (v7.13.0) is already in `package.json`'s dependencies but nothing uses it — the app has no routing at all today (`mainTab` is plain `useState`, so refreshing or hitting Back always lands back on the Cards tab). Wrap the app in a `BrowserRouter`; `App.tsx` (Task 23) will read/write the URL for its four top-level destinations. Vite's dev server and `vite preview` both fall back to `index.html` for unknown paths by default, so no extra Vite config is needed for client-side routing to work on refresh.

- [ ] **Step 1: Update `src/main.tsx`**

```tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

- [ ] **Step 2: Verify the dev server still boots**

Run: `npm run dev -- --port 5183 &` then `sleep 2 && curl -sf http://localhost:5183/ > /dev/null && echo OK`; then `kill %1`.

Expected: `OK`. (`App.tsx` still imports the old `App()` from the original file at this point, so this only confirms the router wrapper itself doesn't break the boot — the real routing behavior is exercised once Task 23 lands.)

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "Wrap App in BrowserRouter"
```

---

## Task 23: Rewrite `App.tsx` as the composition root

**Files:**
- Modify: `src/app/App.tsx` (full rewrite — replaces the entire original file; everything in it has now been extracted into the modules built in Tasks 3-21)

This is where everything lands: the persisted `cards`/`folders`/`profile`/`watchlist`/`following`/`listings` stores from Task 5, seeded once from the Task 4 data; the four routes from Task 22 (`/`, `/shop`, `/peers`, `/settings`); the responsive container and horizontal-at-`md+` profile header promised in the design; and every handler that wires a component's new callback props (edit/delete card and folder, buy, watchlist, follow, create listing, restore/reset backup) to real state.

Two structural notes carried over from the original `App()` (lines 2181-2417): the previous `ALL_CARDS`/`userCards` split is gone — `cards` is now the single persisted source of truth, seeded from `ALL_CARDS` exactly once on first load. And the settings screen is handled as a full-screen replacement of the shell (same pattern the original used for `openFolder`), not as a fourth `mainTab` value, so `MainTab` stays `"cards" | "shop" | "peers"` as already defined in Task 3's `types.ts`.

- [ ] **Step 1: Replace the contents of `src/app/App.tsx`**

```tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Grid3X3, List, Scan, X, Plus, Share2, Search, TrendingUp, Users, LayoutGrid, Tag, Settings as SettingsIcon,
} from "lucide-react";
import type { Card, FolderType, Listing, MainTab, MarketItem, Profile } from "./types";
import { ALL_CARDS, DEFAULT_FOLDERS, GRADE_LABELS } from "./data/mockCards";
import { profilePic } from "./data/cardImages";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { BackupData } from "./lib/backup";
import { CardTile } from "./components/cards/CardTile";
import { CardListRow } from "./components/cards/CardListRow";
import { DetailSheet } from "./components/cards/DetailSheet";
import { ScanCardSheet } from "./components/cards/ScanCardSheet";
import { EditCardSheet } from "./components/cards/EditCardSheet";
import { NewFolderSheet } from "./components/cards/NewFolderSheet";
import { EditFolderSheet } from "./components/cards/EditFolderSheet";
import { FolderDetailView } from "./components/cards/FolderDetailView";
import { MarketView } from "./components/market/MarketView";
import { SellFlow } from "./components/market/SellFlow";
import { PeersView } from "./components/peers/PeersView";
import { SettingsView } from "./components/settings/SettingsView";
import { ShareFlow } from "./components/shared/ShareFlow";
import { ConfirmDialog } from "./components/shared/ConfirmDialog";
import { AnimateIn } from "./components/shared/AnimateIn";
import { CountUp } from "./components/shared/CountUp";

const DEFAULT_PROFILE: Profile = { name: "Andrew Cordle", handle: "@andrewcordle", avatar: profilePic, followers: 219 };

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [cards, setCards] = useLocalStorage<Card[]>("cardchamps:cards", ALL_CARDS);
  const [folders, setFolders] = useLocalStorage<FolderType[]>("cardchamps:folders", DEFAULT_FOLDERS);
  const [profile, setProfile] = useLocalStorage<Profile>("cardchamps:profile", DEFAULT_PROFILE);
  const [watchlist, setWatchlist] = useLocalStorage<number[]>("cardchamps:watchlist", []);
  const [following, setFollowing] = useLocalStorage<string[]>("cardchamps:following", []);
  const [listings, setListings] = useLocalStorage<Listing[]>("cardchamps:listings", []);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Card | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [openFolder, setOpenFolder] = useState<FolderType | null>(null);
  const [cardQuery, setCardQuery] = useState("");
  const [cardsSubView, setCardsSubView] = useState<"cards" | "folders">("cards");
  const [toast, setToast] = useState("");
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [confirmingDeleteFolder, setConfirmingDeleteFolder] = useState<FolderType | null>(null);

  const mainTab: MainTab = location.pathname === "/shop" ? "shop" : location.pathname === "/peers" ? "peers" : "cards";
  const settingsOpen = location.pathname === "/settings";
  const totalValue = cards.reduce((s, c) => s + c.value, 0);
  const displayedCards = cardQuery
    ? cards.filter(c => c.player.toLowerCase().includes(cardQuery.toLowerCase()) || c.year.includes(cardQuery) || c.team.toLowerCase().includes(cardQuery.toLowerCase()))
    : cards;

  const goTab = (tab: MainTab) => { setOpenFolder(null); navigate(tab === "cards" ? "/" : `/${tab}`); };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleAddCard = (newCard: Card) => {
    setCards(prev => [...prev, newCard]);
  };

  const handleEditCard = (updated: Card) => {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    showToast(`Updated ${updated.player}`);
  };

  const handleDeleteCard = (id: number) => {
    const card = cards.find(c => c.id === id);
    setCards(prev => prev.filter(c => c.id !== id));
    setFolders(prev => prev.map(f => ({ ...f, cardIds: f.cardIds.filter(cid => cid !== id) })));
    if (card) showToast(`Deleted ${card.player}`);
  };

  const handleUpdateFolder = (updated: FolderType) => {
    setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
    setOpenFolder(updated);
  };

  const handleCreateFolder = (name: string, color: string, thumbnail?: string, cardIds?: number[]) => {
    setFolders(prev => [...prev, { id: Date.now(), name, color, cardIds: cardIds ?? [], thumbnail }]);
  };

  const handleDeleteFolder = (folder: FolderType) => {
    setFolders(prev => prev.filter(f => f.id !== folder.id));
    setOpenFolder(null);
    showToast(`Deleted ${folder.name}`);
  };

  const handleBuy = (item: MarketItem) => {
    setCards(prev => [...prev, {
      id: Date.now(),
      img: item.img,
      player: item.player,
      year: item.year,
      brand: item.brand,
      team: "Unknown",
      grader: item.grader,
      grade: item.grade,
      gradeLabel: GRADE_LABELS[item.grade] || "",
      cert: `MKT-${item.id}-${Date.now()}`,
      value: item.price,
      change: 0,
      subGrades: null,
      autograph: false,
    }]);
    showToast(`Bought ${item.player}`);
  };

  const handleToggleWatchlist = (id: number) => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleFollow = (handle: string) => {
    setFollowing(prev => prev.includes(handle) ? prev.filter(h => h !== handle) : [...prev, handle]);
  };

  const handleCreateListing = (listing: Listing) => {
    setListings(prev => [...prev, listing]);
    showToast("Listed for sale");
  };

  const handleRestore = (data: BackupData) => {
    setCards(data.cards);
    setFolders(data.folders);
    setProfile(data.profile);
    setWatchlist(data.watchlist);
    setFollowing(data.following);
    setListings(data.listings);
    showToast("Backup restored");
  };

  const handleReset = () => {
    setCards(ALL_CARDS);
    setFolders(DEFAULT_FOLDERS);
    setProfile(DEFAULT_PROFILE);
    setWatchlist([]);
    setFollowing([]);
    setListings([]);
    setOpenFolder(null);
    showToast("Data reset");
  };

  if (settingsOpen) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
          <SettingsView
            onBack={() => navigate("/")}
            profile={profile}
            onProfileChange={setProfile}
            cards={cards}
            folders={folders}
            watchlist={watchlist}
            following={following}
            listings={listings}
            onRestore={handleRestore}
            onReset={handleReset}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
      <div className="relative w-full max-w-[430px] md:max-w-2xl lg:max-w-5xl flex flex-col min-h-screen bg-white overflow-hidden">

        <button onClick={() => navigate("/settings")} className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 z-10">
          <SettingsIcon className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex flex-col items-center px-7 pt-16 pb-5 md:flex-row md:items-center md:justify-center md:gap-6 md:pt-12">
          <div className="relative mb-3 md:mb-0">
            <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-full object-cover" />
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full border-2 border-white flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9a84c 0%, #e8c96e 50%, #b8903c 100%)" }}>
              <span className="text-[9px] font-black text-white tracking-widest">PRO</span>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-xl font-semibold text-gray-900 leading-none">{profile.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm text-gray-400">{profile.handle}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-sm text-gray-500 font-medium">{profile.followers} <span className="text-gray-400 font-normal">followers</span></span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-base text-gray-400">
                <CountUp to={cards.length} duration={1000} suffix=" cards" /> · Value $<CountUp to={totalValue} duration={1000} />
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 px-7 mb-5">
          {([
            { id: "cards", label: "Cards", icon: LayoutGrid },
            { id: "shop", label: "Shop", icon: TrendingUp },
            { id: "peers", label: "Peers", icon: Users },
          ] as { id: MainTab; label: string; icon: typeof LayoutGrid }[]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => goTab(id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ background: mainTab === id ? "#111" : "transparent", color: mainTab === id ? "#fff" : "#bbb" }}>
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {mainTab === "cards" && (
          <>
            <div className="flex items-center justify-between px-7 mb-2">
              <div className="flex-1 flex items-center gap-2 mr-2 rounded-xl bg-gray-100 px-3 py-2">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  value={cardQuery}
                  onChange={e => setCardQuery(e.target.value)}
                  placeholder="Search cards…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }}
                />
                {cardQuery && <button onClick={() => setCardQuery("")}><X className="w-3 h-3 text-gray-400" /></button>}
              </div>
              <div className="flex gap-1">
                {(["grid", "list"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors" style={{ background: view === v ? "#111" : "transparent" }}>
                    {v === "grid" ? <Grid3X3 className="w-3.5 h-3.5" style={{ color: view === v ? "#fff" : "#ccc" }} /> : <List className="w-3.5 h-3.5" style={{ color: view === v ? "#fff" : "#ccc" }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 px-7 mb-4">
              {(["cards", "folders"] as const).map(s => (
                <button key={s} onClick={() => setCardsSubView(s)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors"
                  style={{ background: cardsSubView === s ? "#111" : "transparent", color: cardsSubView === s ? "#fff" : "#bbb" }}>
                  {s === "cards" ? "Cards" : "Folders"}
                </button>
              ))}
            </div>

            {cardsSubView === "cards" && (
              <div className="flex-1 px-7 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                {view === "grid" ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {displayedCards.map((card, i) => <CardTile key={card.id} card={card} index={i} onClick={() => setSelected(card)} />)}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-50">
                    {displayedCards.map(card => <CardListRow key={card.id} card={card} onClick={() => setSelected(card)} />)}
                  </div>
                )}
              </div>
            )}

            {cardsSubView === "folders" && (
              <div className="flex-1 px-7 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400">{folders.length} folder{folders.length !== 1 ? "s" : ""}</p>
                  <button onClick={() => setShowNewFolder(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none">
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {folders.map((folder, fi) => {
                    const folderValue = cards.filter(c => folder.cardIds.includes(c.id)).reduce((s, c) => s + c.value, 0);
                    const previewCards = cards.filter(c => folder.cardIds.includes(c.id)).slice(0, 3);
                    const offsets = [
                      { rotate: "-10deg", translate: "-18px, 4px", z: 0 },
                      { rotate: "-3deg",  translate: "-4px, 2px",  z: 1 },
                      { rotate: "6deg",   translate: "12px, 0px",  z: 2 },
                    ];
                    return (
                      <AnimateIn key={folder.id} delay={fi * 80}>
                        <button onClick={() => setOpenFolder(folder)} className="rounded-2xl overflow-hidden focus:outline-none w-full" style={{ background: folder.color }}>
                          <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ height: "90px", background: `linear-gradient(160deg, ${folder.color} 0%, ${folder.color}cc 40%, #ffffff 100%)` }}>
                            {folder.thumbnail
                              ? <img src={folder.thumbnail} alt="" className="w-full h-full" style={{ objectFit: "contain" }} draggable={false} />
                              : previewCards.length > 0
                                ? previewCards.map((card, i) => (
                                    <img key={card.id} src={card.img} alt="" draggable={false} className="absolute"
                                      style={{ width: 62, objectFit: "contain", background: "#f4f4f5", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", transform: `rotate(${offsets[i].rotate}) translate(${offsets[i].translate})`, zIndex: offsets[i].z }} />
                                  ))
                                : null
                            }
                          </div>
                          <div className="px-3 py-2.5" style={{ background: "rgba(0,0,0,0.18)" }}>
                            <p className="text-xs font-semibold text-white leading-tight truncate">{folder.name}</p>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] text-white/60">{folder.cardIds.length} cards · eBay</p>
                              <p className="text-xs font-semibold text-white">${folderValue.toLocaleString()}</p>
                            </div>
                          </div>
                        </button>
                      </AnimateIn>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {openFolder && (
          <div className="absolute inset-0 bg-white z-30 flex flex-col">
            <FolderDetailView
              folder={openFolder}
              onBack={() => setOpenFolder(null)}
              allCards={cards}
              onUpdate={handleUpdateFolder}
              onEdit={() => setEditingFolder(openFolder)}
              onDelete={() => setConfirmingDeleteFolder(openFolder)}
              onEditCard={card => setEditingCard(card)}
              onDeleteCard={handleDeleteCard}
            />
          </div>
        )}

        {mainTab === "shop" && (
          <MarketView
            allCards={cards}
            listings={listings}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onBuy={handleBuy}
          />
        )}
        {mainTab === "peers" && (
          <PeersView
            allCards={cards}
            folders={folders}
            following={following}
            onToggleFollow={handleToggleFollow}
            showToast={showToast}
          />
        )}

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2.5 rounded-full bg-white z-40" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
          {[
            { label: "Scan",  icon: <Scan className="w-4 h-4" />,   active: showScan,  onClick: () => setShowScan(true)  },
            { label: "Share", icon: <Share2 className="w-4 h-4" />, active: showShare, onClick: () => setShowShare(true) },
            { label: "Sell",  icon: <Tag className="w-4 h-4" />,    active: showSell,  onClick: () => setShowSell(true)  },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold active:opacity-70 transition-all"
              style={{ background: btn.active ? "#111" : "transparent", color: btn.active ? "#fff" : "#374151", border: btn.active ? "none" : "1px solid #e5e7eb" }}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>

        {toast && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-gray-950 text-white text-xs font-semibold shadow-lg whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>

      {selected && (
        <DetailSheet
          onClose={() => setSelected(null)}
          cards={displayedCards}
          initialIndex={displayedCards.findIndex(c => c.id === selected.id)}
          onEdit={card => { setSelected(null); setEditingCard(card); }}
          onDelete={handleDeleteCard}
        />
      )}
      {showNewFolder && (
        <NewFolderSheet
          onClose={() => setShowNewFolder(false)}
          allCards={cards}
          onCreate={handleCreateFolder}
        />
      )}
      {showScan && <ScanCardSheet onClose={() => setShowScan(false)} onAdd={handleAddCard} />}
      {showShare && <ShareFlow onClose={() => setShowShare(false)} allCards={cards} folders={folders} />}
      {showSell && <SellFlow onClose={() => setShowSell(false)} allCards={cards} onCreate={handleCreateListing} />}
      {editingCard && (
        <EditCardSheet
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleEditCard}
        />
      )}
      {editingFolder && (
        <EditFolderSheet
          folder={editingFolder}
          onClose={() => setEditingFolder(null)}
          onSave={updated => { handleUpdateFolder(updated); setEditingFolder(null); }}
        />
      )}
      {confirmingDeleteFolder && (
        <ConfirmDialog
          title="Delete this folder?"
          message={`This deletes "${confirmingDeleteFolder.name}". Cards inside it stay in your collection.`}
          confirmLabel="Delete"
          onConfirm={() => { handleDeleteFolder(confirmingDeleteFolder); setConfirmingDeleteFolder(null); }}
          onCancel={() => setConfirmingDeleteFolder(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the whole project**

Run: `npm run typecheck`

Expected: no errors anywhere in `src/`. This is the first point where every file is actually wired together — fix any mismatched prop names/types you find (cross-check against the exact interfaces defined in Tasks 9-21 above) before moving on.

- [ ] **Step 3: Boot the dev server and click through it manually**

Run: `npm run dev -- --port 5183 &`, then open `http://localhost:5183/` in a browser (or `curl -sf http://localhost:5183/ > /dev/null && echo OK` as a smoke test), then `kill %1` when done.

Expected: the Cards tab loads with the 12 seed cards, tabs switch between Cards/Shop/Peers and update the URL, the bottom Scan/Share/Sell bar opens its sheets, and the browser Back button after switching tabs returns to the previous tab instead of leaving the app.

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx
git commit -m "Rewrite App.tsx as the composition root: routing, persisted stores, full wiring"
```

---

## Task 24: Finish the responsive pass on the two remaining fixed grids

**Files:**
- Modify: `src/app/components/peers/PeerProfileSheet.tsx`
- Modify: `src/app/components/cards/DetailSheet.tsx`

Every sheet-and-grid extraction from Task 9 onward already added `md:`/`lg:` grid-column and width-cap classes inline as it was extracted (`ShareSheet`, `ShareFlow`, `CardTile` grids in `FolderDetailView`/`NewFolderSheet`/`ScanCardSheet`/`SellFlow`, `MarketView`'s tile grids, and the two main grids in `App.tsx`). Two grids were left at their original fixed column count because they hadn't been touched yet: `PeerProfileSheet`'s "Collection" grid and `DetailSheet`'s stat grid. Both sheets are capped at `max-w-lg` (from Tasks 11 and 19), so a modest column bump uses that width better without needing a full redesign.

- [ ] **Step 1: Widen `PeerProfileSheet`'s Collection grid**

In `src/app/components/peers/PeerProfileSheet.tsx`, find:

```tsx
            <div className="grid grid-cols-3 gap-2">
              {peer.snapshot.map((img, i) => (
```

Replace with:

```tsx
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {peer.snapshot.map((img, i) => (
```

- [ ] **Step 2: Widen `DetailSheet`'s stat grid**

In `src/app/components/cards/DetailSheet.tsx`, find:

```tsx
            <AnimateIn delay={160}>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
```

Replace with:

```tsx
            <AnimateIn delay={160}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep -E "PeerProfileSheet|DetailSheet"`

Expected: no output (these are pure className edits, nothing type-relevant changed).

- [ ] **Step 4: Visually verify at three widths**

Run: `npm run dev -- --port 5183 &`, open `http://localhost:5183/` in a browser, and resize the window (or use devtools device toolbar) through roughly 375px, 768px, and 1280px wide. Confirm: the app is no longer a fixed phone frame floating on blank space — the cards grid goes 3 → 4 → 6 columns, the folders grid goes 2 → 3 → 4 columns, the profile header goes from stacked to horizontal around the `md` breakpoint, and no sheet's content touches both edges of the viewport at the widest size (each is capped at `max-w-lg`, `max-w-2xl`, or `max-w-5xl` depending on which container it's in). Then `kill %1`.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/peers/PeerProfileSheet.tsx src/app/components/cards/DetailSheet.tsx
git commit -m "Widen remaining fixed grids at md breakpoint"
```

---

## Task 25: Full verification pass

**Files:** none (verification only — fix forward in whichever file is at fault if something here fails, then re-run this task's checks)

This runs the automated checks one more time end-to-end and then walks the manual checklist from the design spec's "Testing / verification" section by hand in a real browser, since there is no automated UI test suite for this project.

- [ ] **Step 1: Full automated check**

Run, in order:

```bash
npm run typecheck
npm run test
npm run build
```

Expected: all three exit 0. `typecheck` and `build` cover every file touched across all 25 tasks; `test` runs the 14 unit tests from Tasks 5 and 6.

- [ ] **Step 2: Manual walkthrough**

Run: `npm run dev -- --port 5183 &`, open `http://localhost:5183/` in a browser, and work through each item below. `kill %1` when finished.

1. Add a card via Scan (manual entry path — the barcode scan is a simulated 2s delay, not a real camera), confirm it appears in the Cards grid, edit its value, confirm the change sticks, then delete it and confirm it's gone.
2. Create a folder, add/remove a couple of cards from it, rename it and change its color via the "⋯" menu, then delete the folder and confirm its cards are still in your main collection.
3. Switch to Shop, buy a market item (confirm dialog → Buy), confirm it now appears in Cards. Heart a couple of market items, switch to the Watchlist sub-tab, confirm they're there; un-heart one and confirm it drops off.
4. Use the bottom Sell button to list one of your cards, confirm it appears under Shop → My Listings with the price and platform you chose.
5. Switch to Peers, follow one of the Suggested collectors, refresh the page (`Cmd+R`/`F5`), confirm they're still shown as followed.
6. Open a card's detail sheet and tap Share → Copy Link; confirm no crash (this exercises the `card.player`-vs-`current.player` fix from Task 11) and that the browser's clipboard now contains the copied text (paste it somewhere to check).
7. Open Settings (gear icon), change the display name, go back, confirm the new name shows in the header. Export a backup, use Settings → Reset all data, confirm the collection reverts to the 12 seed cards, then Import the exported backup file and confirm your changes come back.
8. Resize the browser window through mobile/tablet/desktop widths (or use devtools device toolbar) and confirm layout holds at each — this repeats Task 24 Step 4 as a final check now that every feature is wired up, not just the two grids touched in that task.
9. Click through Cards → Shop → Peers, then press the browser Back button repeatedly, and confirm it steps back through those tabs instead of leaving the page.

- [ ] **Step 3: Fix anything that failed, then re-run Steps 1 and 2**

If a step fails, fix it in the relevant file (don't add a workaround here — Task 25 has no files of its own), then re-run the full Step 1 automated check and re-walk Step 2 from the top before considering the plan done.

- [ ] **Step 4: Final commit**

If Step 3 required any fixes:

```bash
git add -A
git commit -m "Fix issues found during full verification pass"
```

If nothing needed fixing, there's nothing to commit — the plan is complete as of Task 24's commit.


