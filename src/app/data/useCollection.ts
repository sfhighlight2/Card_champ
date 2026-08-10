import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import * as repo from "./repositories";

// UUID-shaped mirrors of the app's presentation types. These live here rather
// than in ../types because src/app/types.ts still carries the prototype's
// numeric ids; that file flips to string ids as part of the UI rewire, at
// which point these can be deleted and re-imported from there instead.
export interface SubGrades {
  centering: string;
  corners: string;
  edges: string;
  surface: string;
}

export interface Card extends repo.DbCard {
  subGrades: SubGrades | null;
}

export interface FolderType {
  id: string;
  name: string;
  color: string;
  cardIds: string[];
  thumbnail?: string;
}

export interface Chase {
  id: string;
  title: string;
  description: string;
  pinnedCardId?: string;
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

/**
 * Supabase-backed replacement for the `cardchamps:cards|folders|chases|profile`
 * localStorage stores. Exposes the same shapes the existing components take, so
 * the presentation layer did not need to change alongside the data source.
 */
export function useCollection() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const ownerId = user?.id ?? "";
  const enabled = !!ownerId && !isGuest;

  const collectionQ = useQuery({
    queryKey: ["default-collection", ownerId],
    queryFn: () => repo.fetchDefaultCollectionId(ownerId),
    enabled,
  });
  const collectionId = collectionQ.data ?? null;

  const cardsQ = useQuery({
    queryKey: repo.keys.cards(ownerId),
    queryFn: async (): Promise<Card[]> => {
      const rows = await repo.fetchCards(ownerId);
      if (rows.length === 0) return [];

      // Sub-grades live in their own table; fold them onto the cards so
      // DetailSheet keeps rendering them exactly as before.
      const { data: subs } = await supabase
        .from("card_copy_subgrades")
        .select("copy_id, dimension, score")
        .in("copy_id", rows.map(r => r.id));

      const byCopy = new Map<string, Partial<SubGrades>>();
      for (const s of subs ?? []) {
        const entry = byCopy.get(s.copy_id) ?? {};
        (entry as Record<string, string>)[s.dimension] = String(Number(s.score));
        byCopy.set(s.copy_id, entry);
      }

      return rows.map(r => {
        const sg = byCopy.get(r.id);
        return {
          ...r,
          subGrades: sg
            ? {
                centering: sg.centering ?? "—",
                corners: sg.corners ?? "—",
                edges: sg.edges ?? "—",
                surface: sg.surface ?? "—",
              }
            : null,
        };
      });
    },
    enabled,
  });

  const foldersQ = useQuery({
    queryKey: repo.keys.folders(ownerId),
    queryFn: async (): Promise<FolderType[]> => {
      const rows = await repo.fetchFolders(ownerId);
      return rows.map(f => ({
        id: f.id,
        name: f.name,
        color: f.color,
        cardIds: f.cardIds,
        thumbnail: f.thumbnail || undefined,
      }));
    },
    enabled,
  });

  const chasesQ = useQuery({
    queryKey: repo.keys.chases(ownerId),
    queryFn: async (): Promise<Chase[]> => {
      const rows = await repo.fetchChases(ownerId);
      return rows.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        pinnedCardId: c.featuredCopyId ?? undefined,
        createdAt: new Date(c.createdAt).getTime(),
      }));
    },
    enabled,
  });

  const statsQ = useQuery({
    queryKey: repo.keys.stats(ownerId),
    queryFn: () => repo.fetchProfileStats(ownerId),
    enabled: !!ownerId,
  });

  const achievementsQ = useQuery({
    queryKey: repo.keys.achievements(ownerId),
    queryFn: () => repo.fetchAchievements(ownerId),
    enabled,
  });

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: repo.keys.cards(ownerId) });
    void qc.invalidateQueries({ queryKey: repo.keys.folders(ownerId) });
    void qc.invalidateQueries({ queryKey: repo.keys.chases(ownerId) });
    void qc.invalidateQueries({ queryKey: repo.keys.stats(ownerId) });
    void qc.invalidateQueries({ queryKey: repo.keys.achievements(ownerId) });
  }, [qc, ownerId]);

  /** Achievements are recomputed server-side from real counts after any change
   *  that could earn one. */
  const afterMutation = useCallback(async () => {
    try {
      await repo.evaluateAchievements();
    } catch {
      // never let achievement bookkeeping fail the user's actual action
    }
    invalidate();
  }, [invalidate]);

  const addCard = useMutation({
    mutationFn: async (input: repo.NewCardInput) => {
      if (!collectionId) throw new Error("No collection available");
      return repo.addCard(ownerId, collectionId, input);
    },
    onSuccess: afterMutation,
  });

  const editCard = useMutation({
    mutationFn: (args: { id: string; patch: Partial<repo.NewCardInput> }) =>
      repo.updateCard(args.id, ownerId, args.patch),
    onSuccess: afterMutation,
  });

  const deleteCard = useMutation({
    mutationFn: (id: string) => repo.archiveCard(id),
    onSuccess: afterMutation,
  });

  const deleteCards = useMutation({
    mutationFn: (ids: string[]) => repo.archiveCards(ids),
    onSuccess: afterMutation,
  });

  const createFolder = useMutation({
    mutationFn: (args: { name: string; color: string; cardIds?: string[] }) => {
      if (!collectionId) throw new Error("No collection available");
      return repo.createFolder(ownerId, collectionId, args.name, args.color, args.cardIds ?? []);
    },
    onSuccess: afterMutation,
  });

  const updateFolder = useMutation({
    mutationFn: async (args: { id: string; name?: string; color?: string; cardIds?: string[] }) => {
      const { id, cardIds, ...patch } = args;
      if (Object.keys(patch).length > 0) await repo.updateFolder(id, patch);
      if (cardIds && collectionId) await repo.setFolderCards(id, ownerId, collectionId, cardIds);
    },
    onSuccess: afterMutation,
  });

  const deleteFolder = useMutation({
    mutationFn: (id: string) => repo.archiveFolder(id),
    onSuccess: afterMutation,
  });

  const addCardsToFolder = useMutation({
    mutationFn: (args: { folderId: string; cardIds: string[] }) => {
      if (!collectionId) throw new Error("No collection available");
      return repo.addCardsToFolder(args.folderId, ownerId, collectionId, args.cardIds);
    },
    onSuccess: afterMutation,
  });

  const createChase = useMutation({
    mutationFn: (args: { title: string; description: string; pinnedCardId?: string }) =>
      repo.createChase(ownerId, {
        title: args.title,
        description: args.description,
        featuredCopyId: args.pinnedCardId ?? null,
      }),
    onSuccess: afterMutation,
  });

  const updateChase = useMutation({
    mutationFn: (args: { id: string; title: string; description: string; pinnedCardId?: string }) =>
      repo.updateChase(args.id, {
        title: args.title,
        description: args.description,
        featured_copy_id: args.pinnedCardId ?? null,
      }),
    onSuccess: afterMutation,
  });

  const deleteChase = useMutation({
    mutationFn: (id: string) => repo.deleteChase(id),
    onSuccess: afterMutation,
  });

  const saveProfile = useMutation({
    mutationFn: (p: Profile) =>
      repo.updateProfile(ownerId, {
        display_name: p.name,
        handle: p.handle.replace(/^@/, ""),
        bio: p.bio ?? null,
        chasing: p.chasing ?? null,
        collecting_since: p.collectingSince ? Number(p.collectingSince) : null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: repo.keys.stats(ownerId) });
    },
  });

  const stats = statsQ.data ?? null;

  const profile = useMemo<Profile>(
    () => ({
      name: stats?.displayName ?? "Collector",
      handle: stats?.handle ? `@${stats.handle}` : "@collector",
      avatar: stats?.avatar ?? "",
      followers: stats?.followerCount ?? 0,
      bio: stats?.bio ?? undefined,
      chasing: stats?.chasing ?? undefined,
      collectingSince: stats?.collectingSince ? String(stats.collectingSince) : undefined,
    }),
    [stats]
  );

  return {
    ready: !enabled || (!cardsQ.isLoading && !foldersQ.isLoading && !statsQ.isLoading),
    collectionId,
    cards: cardsQ.data ?? [],
    folders: foldersQ.data ?? [],
    chases: chasesQ.data ?? [],
    achievements: achievementsQ.data ?? [],
    earnedCount: (achievementsQ.data ?? []).filter(a => a.earned).length,
    profile,
    stats,
    addCard,
    editCard,
    deleteCard,
    deleteCards,
    createFolder,
    updateFolder,
    deleteFolder,
    addCardsToFolder,
    createChase,
    updateChase,
    deleteChase,
    saveProfile,
  };
}
