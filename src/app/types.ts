export interface SubGrades {
  centering: string;
  corners: string;
  edges: string;
  surface: string;
}

// Collection ids are Supabase UUIDs. Only the marketplace still runs on mock
// data, and it keeps its numeric ids until it is rewired.
export interface Card {
  id: string;
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
  /** ISO timestamp from card_copies.created_at — the only honest "recently added" sort key. */
  createdAt: string;
  catalogCardId: string | null;
}

export interface FolderType {
  id: string;
  name: string;
  color: string;
  cardIds: string[];
  /** Resolved image URL of the folder's thumbnail copy, if one is set. */
  thumbnail?: string;
  /** Copy backing `thumbnail`, so a change can be persisted as folders.thumbnail_copy_id. */
  thumbnailCopyId?: string;
  /** From folder_summaries — excludes archived copies. */
  cardCount: number;
  value: number;
}

export interface Chase {
  id: string;
  title: string;
  description: string;
  pinnedCardId?: string;
  createdAt: number;
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

export interface Profile {
  name: string;
  handle: string;
  avatar: string;
  followers: number;
  bio?: string;
  tags?: string[];
  collectingSince?: string;
  chasing?: string;
}

export type MainTab = "collection" | "community" | "connections";

// ---------------------------------------------------------------------------
// marketplace — shapes from `marketplace_listings` and the price tables
// ---------------------------------------------------------------------------

export interface MarketListing {
  id: string;
  catalogCardId: string | null;
  title: string;
  grader: string;
  grade: string;
  price: number;
  /** Provider name, e.g. "eBay". */
  source: string;
  externalUrl: string | null;
  sourceType: "native" | "external";
  /** Real 30-day movement from market_price_snapshots; absent when a card has
   *  fewer than two snapshots, rather than shown as a fabricated 0%. */
  change?: number;
}

/** One of the current user's own listings. */
export interface MyListing {
  id: string;
  copyId: string | null;
  title: string;
  price: number;
  status: string;
  views: number;
  shipsFrom: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// community — shapes returned by the `community_feed` view
// ---------------------------------------------------------------------------

export interface FeedPost {
  id: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string;
  /** Drives the author's tier badge, derived rather than seeded per-handle. */
  authorAchievements: number;
  topicSlug: string;
  topicLabel: string;
  topicEmoji: string;
  body: string;
  hot: boolean;
  createdAt: string;
  likes: number;
  dislikes: number;
  /** Comment count from the view; the comments themselves load on demand. */
  comments: number;
  myReaction: "like" | "dislike" | null;
}

export interface PostComment {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  authorAvatar: string;
}

export interface CommunityTopic {
  slug: string;
  label: string;
  emoji: string;
}

// ---------------------------------------------------------------------------
// messaging — shapes returned by `conversation_summaries` and `messages`
// ---------------------------------------------------------------------------

export interface ConversationSummary {
  id: string;
  peerId: string | null;
  peerHandle: string;
  peerName: string;
  peerAvatar: string;
  lastBody: string;
  lastSenderId: string | null;
  lastAt: string | null;
  /** Derived from `last_read_at`, so it cannot be faked by a client. */
  unread: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

