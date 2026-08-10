import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import type { Card, Chase, FolderType, Profile, SubGrades } from "../types";
import { uploadAvatar } from "../lib/uploads";
import * as repo from "./repositories";

export type { Card, Chase, FolderType, Profile, SubGrades };

export interface UseCollectionOptions {
  /** Fired with the achievement codes the server recorded as newly earned. */
  onAchievementsEarned?: (codes: string[]) => void;
}

/**
 * Supabase-backed replacement for the `cardchamps:cards|folders|chases|profile`
 * localStorage stores. Exposes the same shapes the existing components take, so
 * the presentation layer did not need to change alongside the data source.
 *
 * Everything derived — card count, portfolio value, 30-day change, follower
 * count, level — comes from `profile_stats` and `folder_summaries` rather than
 * client arithmetic, so a client cannot inflate its own standing.
 */
export function useCollection(options: UseCollectionOptions = {}) {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const ownerId = user?.id ?? "";
  const enabled = !!ownerId && !isGuest;

  // Held in a ref so a fresh closure each render never re-creates the mutations.
  const onEarned = useRef(options.onAchievementsEarned);
  useEffect(() => {
    onEarned.current = options.onAchievementsEarned;
  }, [options.onAchievementsEarned]);

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
    queryFn: () => repo.fetchFolders(ownerId),
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

  const cards = cardsQ.data ?? [];

  // `fetchFolders` returns raw membership, which keeps archived copies. The
  // summary view already excludes them from card_count/total_value_minor;
  // intersecting here means the ids the UI renders agree with that count.
  const liveCardIds = useMemo(() => new Set(cards.map(c => c.id)), [cards]);

  const folders = useMemo<FolderType[]>(
    () =>
      (foldersQ.data ?? []).map(f => ({
        id: f.id,
        name: f.name,
        color: f.color,
        cardIds: f.cardIds.filter(id => liveCardIds.has(id)),
        thumbnail: f.thumbnail || undefined,
        thumbnailCopyId: f.thumbnailCopyId ?? undefined,
        cardCount: f.cardCount,
        value: f.value,
      })),
    [foldersQ.data, liveCardIds]
  );

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: repo.keys.cards(ownerId) });
    void qc.invalidateQueries({ queryKey: repo.keys.folders(ownerId) });
    void qc.invalidateQueries({ queryKey: repo.keys.chases(ownerId) });
    void qc.invalidateQueries({ queryKey: repo.keys.stats(ownerId) });
    void qc.invalidateQueries({ queryKey: repo.keys.achievements(ownerId) });
  }, [qc, ownerId]);

  /** Achievements are recomputed server-side from real counts after any change
   *  that could earn one, so the celebration can only fire for something the
   *  database actually recorded. */
  const afterMutation = useCallback(async () => {
    try {
      const earned = await repo.evaluateAchievements();
      if (earned.length > 0) onEarned.current?.(earned);
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
    mutationFn: async (args: {
      id: string;
      name?: string;
      color?: string;
      cardIds?: string[];
      /** `null` clears the folder's chosen thumbnail. */
      thumbnailCopyId?: string | null;
    }) => {
      const { id, cardIds, thumbnailCopyId, ...patch } = args;
      const columns: { name?: string; color?: string; thumbnail_copy_id?: string | null } = { ...patch };
      if (thumbnailCopyId !== undefined) columns.thumbnail_copy_id = thumbnailCopyId;
      if (Object.keys(columns).length > 0) await repo.updateFolder(id, columns);
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
    mutationFn: async (args: { profile: Profile; avatarFile?: File }) => {
      const { profile: p, avatarFile } = args;

      // Uploaded first so a rejected image fails before any field is written —
      // the user retries with the form still intact rather than finding half
      // their edit saved.
      const avatarPath = avatarFile
        ? await uploadAvatar(avatarFile, ownerId, statsQ.data?.avatarPath ?? null)
        : undefined;

      await repo.updateProfile(ownerId, {
        display_name: p.name,
        handle: p.handle.replace(/^@/, ""),
        bio: p.bio ?? null,
        chasing: p.chasing ?? null,
        collecting_since: p.collectingSince ? Number(p.collectingSince) : null,
        ...(avatarPath ? { avatar_path: avatarPath } : {}),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: repo.keys.stats(ownerId) });
      // The user's avatar and handle also appear on their posts, comments, and
      // conversation rows, all of which are cached separately.
      void qc.invalidateQueries({ queryKey: repo.keys.feed() });
      void qc.invalidateQueries({ queryKey: repo.keys.conversations() });
      void qc.invalidateQueries({ queryKey: repo.keys.peers() });
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

  const achievements = achievementsQ.data ?? [];

  return {
    ready: !enabled || (!cardsQ.isLoading && !foldersQ.isLoading && !statsQ.isLoading),
    /** False for guests, whose every write policy would reject them anyway. */
    canWrite: enabled,
    collectionId,
    cards,
    folders,
    chases: chasesQ.data ?? [],
    achievements,
    earnedCount: achievements.filter(a => a.earned).length,
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
