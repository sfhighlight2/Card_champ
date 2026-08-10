import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import type { ConversationSummary, DirectMessage } from "../types";
import * as repo from "./repositories";

/**
 * Supabase-backed replacement for the `cardchamps:threads` store.
 *
 * Conversations come from `conversation_summaries`, which derives each thread's
 * peer, last message, and unread count server-side — the prototype tracked
 * threads by peer handle and had no concept of unread at all.
 */
export function useMessages() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "";
  const canWrite = !!userId && !isGuest;

  const conversationsQ = useQuery({
    queryKey: repo.keys.conversations(),
    queryFn: repo.fetchConversations,
    enabled: canWrite,
  });

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: repo.keys.conversations() });
  }, [qc]);

  /** One stable thread per pair, whoever starts it. */
  const openConversation = useMutation({
    mutationFn: (peerId: string) => repo.openDirectConversation(peerId),
    onSuccess: invalidate,
  });

  const sendMessage = useMutation({
    mutationFn: (args: { conversationId: string; body: string }) =>
      repo.sendMessage(args.conversationId, userId, args.body),
    onSuccess: (_data, args) => {
      invalidate();
      void qc.invalidateQueries({ queryKey: repo.keys.messages(args.conversationId) });
    },
  });

  const markRead = useMutation({
    mutationFn: (conversationId: string) => repo.markConversationRead(conversationId, userId),
    onSuccess: invalidate,
  });

  const conversations = (conversationsQ.data ?? []) as ConversationSummary[];

  return {
    ready: !canWrite || !conversationsQ.isLoading,
    canWrite,
    conversations,
    unreadTotal: conversations.reduce((n, c) => n + c.unread, 0),
    openConversation,
    sendMessage,
    markRead,
  };
}

/** A thread's messages, loaded only while that chat is open. */
export function useConversationMessages(conversationId: string | null) {
  const messagesQ = useQuery({
    queryKey: repo.keys.messages(conversationId ?? ""),
    queryFn: async (): Promise<DirectMessage[]> => {
      const rows = await repo.fetchMessages(conversationId as string);
      return rows.map(m => ({
        id: m.id as string,
        senderId: m.sender_id as string,
        body: m.body as string,
        createdAt: m.created_at as string,
      }));
    },
    enabled: !!conversationId,
  });

  return { messages: messagesQ.data ?? [], isLoading: messagesQ.isLoading };
}
