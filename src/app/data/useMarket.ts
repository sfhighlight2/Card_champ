import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import type { MarketListing, MyListing } from "../types";
import * as repo from "./repositories";

/**
 * Supabase-backed replacement for `MARKET_ITEMS` and the
 * `cardchamps:watchlist` / `cardchamps:listings` localStorage stores.
 *
 * Two things change in substance, not just plumbing. The watchlist is keyed on
 * `catalog_card_id` and stored server-side, so it follows the account rather than
 * the browser. And the 30-day movement shown against a listing is derived from
 * `market_price_snapshots` instead of being a number typed into a mock file.
 */
export function useMarket() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "";
  const canWrite = !!userId && !isGuest;

  // Listings are public, so guests can browse them.
  const listingsQ = useQuery({
    queryKey: repo.keys.listings(),
    queryFn: async (): Promise<MarketListing[]> => {
      const rows = await repo.fetchListings();
      const changes = await repo.fetchPriceChanges(
        rows.map(r => r.catalogCardId).filter((id): id is string => !!id)
      );
      return rows.map(r => ({
        ...r,
        sourceType: r.sourceType,
        change: r.catalogCardId ? changes.get(r.catalogCardId) : undefined,
      }));
    },
    enabled: !!userId,
  });

  const watchlistQ = useQuery({
    queryKey: repo.keys.watchlist(userId),
    queryFn: () => repo.fetchWatchlist(userId),
    enabled: canWrite,
  });

  const myListingsQ = useQuery({
    queryKey: repo.keys.myListings(userId),
    queryFn: () => repo.fetchMyListings(userId),
    enabled: canWrite,
  });

  const invalidateMine = useCallback(() => {
    void qc.invalidateQueries({ queryKey: repo.keys.myListings(userId) });
    void qc.invalidateQueries({ queryKey: repo.keys.listings() });
  }, [qc, userId]);

  const toggleWatchlist = useMutation({
    mutationFn: (args: { catalogCardId: string; isWatched: boolean }) =>
      repo.toggleWatchlist(userId, args.catalogCardId, args.isWatched),
    onSuccess: async () => {
      try {
        await repo.evaluateAchievements();
      } catch {
        // never let achievement bookkeeping fail the user's actual action
      }
      void qc.invalidateQueries({ queryKey: repo.keys.watchlist(userId) });
      void qc.invalidateQueries({ queryKey: repo.keys.achievements(userId) });
    },
  });

  const createListing = useMutation({
    mutationFn: (args: {
      copyId: string;
      title: string;
      price: number;
      shipsFrom: string;
      catalogCardId?: string | null;
      graderCode?: string;
      grade?: string;
    }) => repo.createListing(userId, args.copyId, args),
    onSuccess: async () => {
      try {
        await repo.evaluateAchievements();
      } catch {
        // never let achievement bookkeeping fail the user's actual action
      }
      invalidateMine();
      void qc.invalidateQueries({ queryKey: repo.keys.achievements(userId) });
    },
  });

  const updateListingStatus = useMutation({
    mutationFn: (args: { id: string; status: string }) =>
      repo.updateListingStatus(args.id, args.status),
    onSuccess: invalidateMine,
  });

  const removeListing = useMutation({
    mutationFn: (id: string) => repo.removeListing(id),
    onSuccess: invalidateMine,
  });

  const watchlist = watchlistQ.data ?? [];
  const watchedSet = new Set(watchlist);
  const listings = listingsQ.data ?? [];

  return {
    ready: !listingsQ.isLoading,
    loadError: listingsQ.isError,
    retry: () => { void listingsQ.refetch(); },
    canWrite,
    listings,
    /** Listings whose catalog card the user is watching. */
    watched: listings.filter(l => l.catalogCardId && watchedSet.has(l.catalogCardId)),
    isWatched: (catalogCardId: string | null) => !!catalogCardId && watchedSet.has(catalogCardId),
    myListings: (myListingsQ.data ?? []) as MyListing[],
    toggleWatchlist,
    createListing,
    updateListingStatus,
    removeListing,
  };
}

/** Price history and recent sales for one catalog card, loaded on demand. */
export function useCardMarketDetail(catalogCardId: string | null) {
  const historyQ = useQuery({
    queryKey: ["price-history", catalogCardId],
    queryFn: () => repo.fetchPriceHistory(catalogCardId as string),
    enabled: !!catalogCardId,
  });

  const salesQ = useQuery({
    queryKey: ["recent-sales", catalogCardId],
    queryFn: () => repo.fetchRecentSales(catalogCardId as string),
    enabled: !!catalogCardId,
  });

  return {
    priceHistory: historyQ.data ?? [],
    recentSales: salesQ.data ?? [],
    isLoading: historyQ.isLoading || salesQ.isLoading,
  };
}
