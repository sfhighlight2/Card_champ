import { ChevronLeft, MessageCircle, Plus } from "lucide-react";
import type { ConversationSummary } from "../../types";
import type { DbProfileStats } from "../../data/repositories";
import { relativeTime } from "../../lib/relativeTime";
import { AnimateIn } from "../shared/AnimateIn";
import { Avatar } from "../shared/Avatar";

interface MessagesViewProps {
  conversations: ConversationSummary[];
  /** Collectors you follow who you haven't messaged yet. */
  suggested: DbProfileStats[];
  ready: boolean;
  currentUserId: string;
  onBack: () => void;
  onOpenConversation: (conversationId: string) => void;
  onStartConversation: (peer: DbProfileStats) => void;
  /** Tapping a conversation's avatar opens the peer's profile; the row itself
   *  still opens the chat. */
  onOpenProfile: (peerId: string) => void;
  /** Opens the full collector picker. */
  onNewMessage: () => void;
}

export function MessagesView({
  conversations, suggested, ready, currentUserId, onBack, onOpenConversation, onStartConversation, onNewMessage, onOpenProfile,
}: MessagesViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Messages</h2>
        <button onClick={onNewMessage}
          className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#16a34a" }}>
          <Plus className="w-4 h-4" />New
        </button>
      </div>

      <div className="flex-1 px-6 overflow-y-auto app-scroll-pad" style={{ scrollbarWidth: "none" }}>
        {!ready ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-900">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-5 max-w-[240px]">
              {suggested.length > 0
                ? "Start a conversation with one of your peers below, or search for anyone."
                : "Find a collector and start a conversation."}
            </p>
            <button onClick={onNewMessage}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gray-950 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" />New message
            </button>
          </div>
        ) : (
          <div className="flex flex-col mb-6">
            {conversations.map((c, i) => {
              const mineLast = c.lastSenderId === currentUserId;
              const preview = c.lastBody ? `${mineLast ? "You: " : ""}${c.lastBody}` : "No messages yet";
              return (
                <AnimateIn key={c.id} delay={i * 60}>
                  <button onClick={() => onOpenConversation(c.id)}
                    className="w-full flex items-center gap-3 py-3 text-left" style={{ borderBottom: "1px solid #1c2740" }}>
                    <span
                      role={c.peerId ? "button" : undefined}
                      onClick={c.peerId ? e => { e.stopPropagation(); onOpenProfile(c.peerId as string); } : undefined}
                      className="relative flex-shrink-0 block"
                      aria-label={c.peerId ? `View ${c.peerName}'s profile` : undefined}
                    >
                      <Avatar src={c.peerAvatar} name={c.peerName} size={44} className="w-11 h-11 rounded-full object-cover" />
                      {c.unread > 0 && (
                        <span
                          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 border-2 border-white text-[10px] font-bold text-white flex items-center justify-center"
                          aria-label={`${c.unread} unread`}
                        >
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-gray-900 ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>{c.peerName}</p>
                      <p className={`text-xs truncate ${c.unread > 0 ? "text-gray-600 font-medium" : "text-gray-400"}`}>{preview}</p>
                    </div>
                    {c.lastAt && (
                      <span className="text-[11px] text-gray-300 flex-shrink-0">{relativeTime(Date.parse(c.lastAt))}</span>
                    )}
                  </button>
                </AnimateIn>
              );
            })}
          </div>
        )}

        {suggested.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Suggested</p>
            <div className="flex flex-col">
              {suggested.map((peer, i) => (
                <AnimateIn key={peer.profileId} delay={i * 60}>
                  <div className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid #1c2740" }}>
                    <Avatar src={peer.avatar} name={peer.displayName} size={40} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{peer.displayName}</p>
                      <p className="text-[11px] text-gray-400">@{peer.handle}</p>
                    </div>
                    <button onClick={() => onStartConversation(peer)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: "#f0fdf4", color: "#16a34a" }}>
                      <MessageCircle className="w-3 h-3" />Message
                    </button>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
