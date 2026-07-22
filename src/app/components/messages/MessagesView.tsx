import { ChevronLeft, Plus, MessageCircle } from "lucide-react";
import type { MessageThread, Profile } from "../../types";
import { ME } from "../../types";
import { PEERS } from "../../data/mockPeers";
import { resolveSender } from "../../lib/messages";
import { relativeTime } from "../../lib/relativeTime";
import { AnimateIn } from "../shared/AnimateIn";

interface MessagesViewProps {
  threads: MessageThread[];
  profile: Profile;
  onBack: () => void;
  onOpenChat: (peerHandle: string) => void;
}

export function MessagesView({ threads, profile, onBack, onOpenChat }: MessagesViewProps) {
  const sorted = [...threads].sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.createdAt ?? 0;
    const bLast = b.messages[b.messages.length - 1]?.createdAt ?? 0;
    return bLast - aLast;
  });
  const messagedHandles = new Set(threads.map(t => t.peerHandle));
  const suggested = PEERS.filter(p => !messagedHandles.has(p.handle));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Messages</h2>
        <button onClick={() => suggested[0] && onOpenChat(suggested[0].handle)} disabled={suggested.length === 0}
          className="flex items-center gap-1 text-sm font-semibold disabled:opacity-30" style={{ color: "#16a34a" }}>
          <Plus className="w-4 h-4" />New
        </button>
      </div>

      <div className="flex-1 px-6 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-900">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-[240px]">Start a conversation with one of your peers below.</p>
          </div>
        ) : (
          <div className="flex flex-col mb-6">
            {sorted.map((thread, i) => {
              const peer = resolveSender(thread.peerHandle, profile);
              const last = thread.messages[thread.messages.length - 1];
              const preview = last ? `${last.senderHandle === ME ? "You: " : ""}${last.body}` : "";
              return (
                <AnimateIn key={thread.peerHandle} delay={i * 60}>
                  <button onClick={() => onOpenChat(thread.peerHandle)}
                    className="w-full flex items-center gap-3 py-3 text-left" style={{ borderBottom: "1px solid #f4f4f5" }}>
                    <div className="relative flex-shrink-0">
                      <img src={peer.avatar} alt={peer.name} className="w-11 h-11 rounded-full object-cover" draggable={false} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{peer.name}</p>
                      <p className="text-xs text-gray-400 truncate">{preview}</p>
                    </div>
                    {last && <span className="text-[11px] text-gray-300 flex-shrink-0">{relativeTime(last.createdAt)}</span>}
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
                <AnimateIn key={peer.handle} delay={i * 60}>
                  <div className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid #f4f4f5" }}>
                    <img src={peer.avatar} alt={peer.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" draggable={false} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{peer.name}</p>
                      <p className="text-[11px] text-gray-400">{peer.handle}</p>
                    </div>
                    <button onClick={() => onOpenChat(peer.handle)}
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
