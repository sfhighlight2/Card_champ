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

export type MainTab = "collection" | "community" | "connections";

export interface AuthState {
  email: string;
  loggedIn: boolean;
  isGuest: boolean;
}
