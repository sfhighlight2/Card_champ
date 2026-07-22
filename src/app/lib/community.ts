import type { Profile } from "../types";
import { PEERS } from "../data/mockPeers";
import { PEER_TIER_BADGES } from "../data/mockPosts";
import { tierBadgeLabel, type Tier } from "./level";

export interface ResolvedAuthor {
  name: string;
  avatar: string;
  handle: string;
}

// Posts/comments only store a handle; resolve it against "me" (the current
// profile) or the mock peers roster to get a display name + avatar.
export function resolveAuthor(handle: string, profile: Profile): ResolvedAuthor {
  if (handle === profile.handle) return { name: profile.name, avatar: profile.avatar, handle };
  const peer = PEERS.find(p => p.handle === handle);
  if (peer) return { name: peer.name, avatar: peer.avatar, handle };
  return { name: handle.replace("@", ""), avatar: profile.avatar, handle };
}

// My own badge is real (derived from earned achievements); other authors
// use the seeded flavor map.
export function authorBadge(handle: string, profile: Profile, myTier: Tier): "PRO" | "HOF" | null {
  if (handle === profile.handle) return tierBadgeLabel(myTier);
  return PEER_TIER_BADGES[handle] ?? null;
}
