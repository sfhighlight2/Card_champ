import { useState } from "react";
import { X } from "lucide-react";
import type { CommunityTopic } from "../../types";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface NewPostSheetProps {
  onClose: () => void;
  topics: CommunityTopic[];
  /** Receives the topic's slug, which is what `posts.topic_id` resolves from. */
  onCreate: (topicSlug: string, body: string) => void;
}

export function NewPostSheet({ onClose, topics, onCreate }: NewPostSheetProps) {
  useEscapeClose(onClose);
  const [topic, setTopic] = useState<string>(topics[0]?.slug ?? "");
  const [body, setBody] = useState("");
  const canPost = body.trim().length > 0 && topic.length > 0;

  const submit = () => {
    if (!canPost) return;
    onCreate(topic, body.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="app-sheet mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "88dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-4">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">New Post</h2>
          <button onClick={submit} disabled={!canPost}
            className="px-4 py-2 rounded-full text-xs font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ background: "#1d2e4e" }}>
            Post
          </button>
        </div>

        <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: "calc(88dvh - 76px)", scrollbarWidth: "none" }}>
          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Topic</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {topics.map(t => (
              <button key={t.slug} onClick={() => setTopic(t.slug)}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                style={{ background: topic === t.slug ? "#1d2e4e" : "#1d2534", color: topic === t.slug ? "#fff" : "#8492ac" }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">What's on your mind?</p>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 500))}
            placeholder="Share a card, market insight, or story…"
            rows={6}
            className="w-full rounded-2xl bg-gray-50 p-4 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none"
            style={{ fontFamily: "'Google Sans', sans-serif" }}
          />
          <p className="text-xs text-gray-300 text-right mt-1.5">{body.length}/500</p>
        </div>
      </div>
    </div>
  );
}
