import type { CommunityPost } from "../types";
import { card8 } from "./cardImages";

export const COMMUNITY_TOPICS = ["Baseball", "Basketball", "Pokémon", "Soccer", "Anime"] as const;
export type CommunityTopic = typeof COMMUNITY_TOPICS[number];

export const TOPIC_EMOJI: Record<string, string> = {
  Baseball: "⚾",
  Basketball: "🏀",
  "Pokémon": "🎮",
  Soccer: "⚽",
  Anime: "🎌",
};

// Tier badges for the mock peers who post/comment in the seeded feed —
// the current user's own badge is computed for real from their level
// (see lib/level.ts tierBadgeLabel), this map is just seed-data flavor.
export const PEER_TIER_BADGES: Record<string, "PRO" | "HOF"> = {
  "@loganpaul": "HOF",
  "@garyvee": "HOF",
  "@barbaracorcoran": "PRO",
  "@kevinoleary": "PRO",
};

const HOUR = 60 * 60 * 1000;
const now = Date.now();

export const MOCK_POSTS: CommunityPost[] = [
  {
    id: 1,
    authorHandle: "@loganpaul",
    topic: "Baseball",
    hot: true,
    body: "Just pulled a 1952 Topps Mickey Mantle from a sealed wax pack. The condition is insane for its age — might be the best I've ever seen.",
    cardImage: card8,
    createdAt: now - 2 * HOUR,
    likes: 284,
    dislikes: 3,
    comments: [
      { id: 1, authorHandle: "@garyvee", body: "What's the estimated grade? That surface looks clean.", createdAt: now - 1 * HOUR, likes: 42 },
      { id: 2, authorHandle: "@kevinoleary", body: "If that's a 9+ don't list it — hold forever.", createdAt: now - 45 * 60 * 1000, likes: 18 },
    ],
  },
  {
    id: 2,
    authorHandle: "@garyvee",
    topic: "Basketball",
    hot: true,
    body: "Hot take: rookie cards of players who haven't peaked yet are the single best investment you can make in this hobby right now.",
    createdAt: now - 5 * HOUR,
    likes: 512,
    dislikes: 11,
    comments: [
      { id: 1, authorHandle: "@loganpaul", body: "Which rookies are you loading up on right now?", createdAt: now - 4 * HOUR, likes: 26 },
    ],
  },
  {
    id: 3,
    authorHandle: "@barbaracorcoran",
    topic: "Pokémon",
    hot: false,
    body: "My daughter convinced me to buy a Charizard. I told her it was a terrible investment. Then I checked the going rate — I owe her an apology and a bigger safe.",
    createdAt: now - 24 * HOUR,
    likes: 1203,
    dislikes: 8,
    comments: [
      { id: 1, authorHandle: "@kevinoleary", body: "Never bet against a kid with better instincts than a shark.", createdAt: now - 20 * HOUR, likes: 64 },
    ],
  },
  {
    id: 4,
    authorHandle: "@kevinoleary",
    topic: "Baseball",
    hot: false,
    body: "Bo Jackson PSA 10 Topps Traded. If you don't own one you should. The pop report is tightening every quarter and the demand isn't slowing down.",
    createdAt: now - 27 * HOUR,
    likes: 389,
    dislikes: 5,
    comments: [],
  },
];
