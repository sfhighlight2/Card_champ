import type { Profile } from "../types";
import { ME } from "../types";
import { PEERS } from "../data/mockPeers";

export interface ResolvedSender {
  name: string;
  avatar: string;
  handle: string;
}

export function resolveSender(handle: string, profile: Profile): ResolvedSender {
  if (handle === ME) return { name: profile.name, avatar: profile.avatar, handle: profile.handle };
  const peer = PEERS.find(p => p.handle === handle);
  if (peer) return { name: peer.name, avatar: peer.avatar, handle: peer.handle };
  return { name: handle.replace("@", ""), avatar: profile.avatar, handle };
}
