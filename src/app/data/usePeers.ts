import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import type { Card } from "../types";
import * as repo from "./repositories";

/**
 * Supabase-backed replacement for the `cardchamps:following` store and the
 * `PEERS` / `SUGGESTED` mock rosters.
 *
 * Every number a peer is shown with — card count, portfolio value, follower
 * count, level ring, tier badge — comes from `profile_stats`, so the hardcoded
 * per-handle xp/ring/badge maps are gone. "My Peers" is now genuinely the
 * people you follow rather than a static list.
 */
export function usePeers() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "";
  const canWrite = !!userId && !isGuest;

  const peersQ = useQuery({
    queryKey: repo.keys.peers(),
    queryFn: () => repo.fetchDiscoverableProfiles(userId),
    enabled: !!userId,
  });

  const followingQ = useQuery({
    queryKey: ["following", userId],
    queryFn: () => repo.fetchFollowing(userId),
    enabled: !!userId,
  });

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["following", userId] });
    void qc.invalidateQueries({ queryKey: repo.keys.peers() });
    void qc.invalidateQueries({ queryKey: repo.keys.stats(userId) });
  }, [qc, userId]);

  const toggleFollow = useMutation({
    mutationFn: (args: { profileId: string; isFollowing: boolean }) =>
      repo.toggleFollow(userId, args.profileId, args.isFollowing),
    onSuccess: async () => {
      try {
        await repo.evaluateAchievements();
      } catch {
        // never let achievement bookkeeping fail the user's actual action
      }
      invalidate();
      void qc.invalidateQueries({ queryKey: repo.keys.achievements(userId) });
    },
  });

  const peers = peersQ.data ?? [];
  const following = followingQ.data ?? [];
  const followingSet = new Set(following);

  return {
    ready: !peersQ.isLoading && !followingQ.isLoading,
    loadError: peersQ.isError || followingQ.isError,
    retry: () => { void peersQ.refetch(); void followingQ.refetch(); },
    canWrite,
    /** Collectors you follow. */
    myPeers: peers.filter(p => followingSet.has(p.profileId)),
    /** Discoverable collectors you don't follow yet. */
    suggested: peers.filter(p => !followingSet.has(p.profileId)),
    following,
    isFollowing: (profileId: string) => followingSet.has(profileId),
    toggleFollow,
  };
}

/** A peer's public collection, loaded only when their profile is opened. */
export function usePeerCards(profileId: string | null) {
  const cardsQ = useQuery({
    queryKey: ["peer-cards", profileId],
    queryFn: async (): Promise<Card[]> => {
      const rows = await repo.fetchPeerCards(profileId as string);
      // Sub-grades are the owner's own detail; a peer's card is shown without
      // them rather than firing a second query per profile view.
      return rows.map(r => ({ ...r, subGrades: null }));
    },
    enabled: !!profileId,
  });

  return { cards: cardsQ.data ?? [], isLoading: cardsQ.isLoading };
}
