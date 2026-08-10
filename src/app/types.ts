export interface SubGrades {
  centering: string;
  corners: string;
  edges: string;
  surface: string;
}

// Collection ids are Supabase UUIDs. The surfaces still running on mock data
// (market, community, messaging) keep their numeric ids until they are rewired.
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
  chasing: string;
}

export interface SuggestedPeer {
  name: string;
  handle: string;
  cards: number;
  avatar: string;
}

export interface Listing {
  id: number;
  /** A card copy's UUID. */
  cardId: string;
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
  bio?: string;
  tags?: string[];
  collectingSince?: string;
  chasing?: string;
}

export type MainTab = "collection" | "community" | "connections";

export interface CommunityComment {
  id: number;
  authorHandle: string;
  body: string;
  createdAt: number;
  likes: number;
}

export const ME = "__me__";

export interface DirectMessage {
  id: number;
  senderHandle: string;
  body: string;
  createdAt: number;
}

export interface MessageThread {
  peerHandle: string;
  messages: DirectMessage[];
}

export interface CommunityPost {
  id: number;
  authorHandle: string;
  topic: string;
  hot: boolean;
  body: string;
  cardImage?: string;
  createdAt: number;
  likes: number;
  dislikes: number;
  likedByMe?: boolean;
  dislikedByMe?: boolean;
  comments: CommunityComment[];
}
