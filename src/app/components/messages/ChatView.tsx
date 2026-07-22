import { useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import type { MessageThread, Profile } from "../../types";
import { ME } from "../../types";
import { resolveSender } from "../../lib/messages";
import { relativeTime } from "../../lib/relativeTime";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface ChatViewProps {
  thread: MessageThread;
  profile: Profile;
  onBack: () => void;
  onSend: (text: string) => void;
}

export function ChatView({ thread, profile, onBack, onSend }: ChatViewProps) {
  useEscapeClose(onBack);
  const [text, setText] = useState("");
  const peer = resolveSender(thread.peerHandle, profile);

  const submit = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid #f4f4f5" }}>
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <img src={peer.avatar} alt={peer.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" draggable={false} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{peer.name}</p>
          <p className="text-[11px] text-gray-400 truncate">{peer.handle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {thread.messages.map(msg => {
          const mine = msg.senderHandle === ME;
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
                <p className={`text-[10px] text-gray-300 mt-1 ${mine ? "text-right" : "text-left"}`}>{relativeTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-6 py-3 flex-shrink-0" style={{ borderTop: "1px solid #f4f4f5" }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
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
