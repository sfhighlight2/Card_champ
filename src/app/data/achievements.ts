export interface MilestoneCtx {
  cardCount: number;
  folderCount: number;
  listingCount: number;
  watchlistCount: number;
}

export interface Milestone {
  id: string;
  label: string;
  check: (ctx: MilestoneCtx) => boolean;
}

export const MILESTONES: Milestone[] = [
  { id: "first-card", label: "Added your first card", check: ctx => ctx.cardCount >= 1 },
  { id: "first-folder", label: "Created your first folder", check: ctx => ctx.folderCount >= 1 },
  { id: "first-watchlist", label: "Started a watchlist", check: ctx => ctx.watchlistCount >= 1 },
  { id: "first-listing", label: "Listed your first card for sale", check: ctx => ctx.listingCount >= 1 },
  { id: "cards-10", label: "10 cards collected", check: ctx => ctx.cardCount >= 10 },
  { id: "cards-50", label: "50 cards collected", check: ctx => ctx.cardCount >= 50 },
  { id: "cards-100", label: "100 cards collected", check: ctx => ctx.cardCount >= 100 },
];
