import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import type { CommunityTopic, FeedPost, PostComment } from "../types";
import * as repo from "./repositories";

/**
 * Supabase-backed replacement for the `cardchamps:posts` localStorage store.
 *
 * Like/dislike/comment counts come from the `community_feed` view rather than
 * client arithmetic, so they cannot drift or go negative — the prototype
 * incremented and decremented them by hand.
 */
export function useCommunity() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "";
  const canWrite = !!userId && !isGuest;

  // The feed is public: guests browse it, they just cannot post or react.
  const feedQ = useQuery({
    queryKey: repo.keys.feed(),
    queryFn: repo.fetchFeed,
    enabled: !!userId,
  });

  const topicsQ = useQuery({
    queryKey: ["community-topics"],
    queryFn: repo.fetchTopics,
    // Topics are a fixed vocabulary; no need to refetch them constantly.
    staleTime: 60 * 60 * 1000,
    enabled: !!userId,
  });

  const invalidateFeed = useCallback(() => {
    void qc.invalidateQueries({ queryKey: repo.keys.feed() });
  }, [qc]);

  const createPost = useMutation({
    mutationFn: (args: { topicSlug: string; body: string }) =>
      repo.createPost(userId, args.topicSlug, args.body),
    onSuccess: async () => {
      try {
        await repo.evaluateAchievements();
      } catch {
        // never let achievement bookkeeping fail the user's actual action
      }
      invalidateFeed();
      void qc.invalidateQueries({ queryKey: repo.keys.achievements(userId) });
    },
  });

  /** Setting the same reaction twice clears it; switching updates in place. */
  const setReaction = useMutation({
    mutationFn: (args: {
      postId: string;
      reaction: "like" | "dislike";
      current: "like" | "dislike" | null;
    }) => repo.setPostReaction(args.postId, userId, args.reaction, args.current),
    onSuccess: invalidateFeed,
  });

  const addComment = useMutation({
    mutationFn: (args: { postId: string; body: string }) =>
      repo.addComment(args.postId, userId, args.body),
    onSuccess: (_data, args) => {
      invalidateFeed();
      void qc.invalidateQueries({ queryKey: repo.keys.post(args.postId) });
    },
  });

  return {
    ready: !feedQ.isLoading && !topicsQ.isLoading,
    canWrite,
    posts: (feedQ.data ?? []) as FeedPost[],
    topics: (topicsQ.data ?? []) as CommunityTopic[],
    createPost,
    setReaction,
    addComment,
  };
}

/** Comments load only when a thread is opened, rather than riding along with
 *  every feed row. */
export function usePostComments(postId: string | null) {
  const commentsQ = useQuery({
    queryKey: repo.keys.post(postId ?? ""),
    queryFn: () => repo.fetchComments(postId as string),
    enabled: !!postId,
  });

  return {
    comments: (commentsQ.data ?? []) as PostComment[],
    isLoading: commentsQ.isLoading,
  };
}
