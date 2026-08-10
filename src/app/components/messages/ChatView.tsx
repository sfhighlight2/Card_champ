import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import type { ConversationSummary, DirectMessage } from "../../types";
import { relativeTime } from "../../lib/relativeTime";
import { useEscapeClose } from "../../hooks/useEscapeClose";
import { Avatar } from "../shared/Avatar";

interface ChatViewProps {
  conversation: ConversationSummary;
  messages: DirectMessage[];
  isLoading: boolean;
  currentUserId: string;
  onBack: () => void;
  onSend: (text: string) => void;
  /** Advances `last_read_at`, which is what the unread count derives from. */
  onMarkRead: () => void;
}

export function ChatView({
  conversation, messages, isLoading, currentUserId, onBack, onSend, onMarkRead,
}: ChatViewProps) {
  useEscapeClose(onBack);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reading the thread is what marks it read. Keyed to the message count, not
  // just the conversation id, so a message that arrives while the chat is open
  // doesn't back out to a phantom unread badge.
  useEffect(() => {
    if (conversation.unread > 0) onMarkRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, conversation.unread, messages.length]);

  // A chat belongs at its newest message: jump there on open, follow as
  // messages arrive or get sent.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [isLoading, messages.length]);

  const submit = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="app-safe-top flex-shrink-0" />
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid #f4f4f5" }}>
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <Avatar src={conversation.peerAvatar} name={conversation.peerName} size={32} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{conversation.peerName}</p>
          <p className="text-[11px] text-gray-400 truncate">{conversation.peerHandle}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map(msg => {
            const mine = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%]">
                  <div
                    className="px-4 py-2.5 rounded-2xl text-sm"
                    style={{
                      background: mine ? "#111" : "#f4f4f5",
                      color: mine ? "#fff" : "#111",
                      borderBottomRightRadius: mine ? 4 : undefined,
                      borderBottomLeftRadius: mine ? undefined : 4,
                    }}
                  >
                    {msg.body}
                  </div>
                  <p className={`text-[10px] text-gray-300 mt-1 ${mine ? "text-right" : "text-left"}`}>
                    {relativeTime(Date.parse(msg.createdAt))}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="app-sheet flex items-center gap-2 px-6 py-3 flex-shrink-0" style={{ borderTop: "1px solid #f4f4f5" }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          maxLength={4000}
          placeholder="Message…"
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
          style={{ fontFamily: "'Google Sans', sans-serif" }}
        />
        <button onClick={submit} disabled={!text.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-950 disabled:opacity-30 flex-shrink-0 transition-opacity"
          aria-label="Send message">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
