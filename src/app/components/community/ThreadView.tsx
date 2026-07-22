import { useState } from "react";
import { ChevronLeft, ThumbsUp, ThumbsDown, MessageCircle, Send } from "lucide-react";
import type { CommunityPost, Profile } from "../../types";
import type { Tier } from "../../lib/level";
import { resolveAuthor, authorBadge } from "../../lib/community";
import { relativeTime } from "../../lib/relativeTime";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface ThreadViewProps {
  post: CommunityPost;
  profile: Profile;
  myTier: Tier;
  onClose: () => void;
  onToggleLike: () => void;
  onToggleDislike: () => void;
  onAddComment: (text: string) => void;
}

function Badge({ label, size = "xs" }: { label: "PRO" | "HOF"; size?: "xs" | "2xs" }) {
  return (
    <span
      className={`font-bold rounded-full flex-shrink-0 ${size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[8px] px-1.5 py-0.5"}`}
      style={{ background: label === "HOF" ? "#f3e8ff" : "#fef9ec", color: label === "HOF" ? "#7c3aed" : "#b45309" }}
    >
      {label}
    </span>
  );
}

export function ThreadView({ post, profile, myTier, onClose, onToggleLike, onToggleDislike, onAddComment }: ThreadViewProps) {
  useEscapeClose(onClose);
  const [commentText, setCommentText] = useState("");
  const author = resolveAuthor(post.authorHandle, profile);
  const badge = authorBadge(post.authorHandle, profile, myTier);

  const submitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid #f4f4f5" }}>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Thread</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: "none" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" draggable={false} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900 truncate">{author.name}</span>
              {badge && <Badge label={badge} />}
            </div>
            <p className="text-xs text-gray-400">{author.handle} · {relativeTime(post.createdAt)}</p>
          </div>
        </div>

        <p className="text-sm text-gray-800 mb-4 leading-relaxed">{post.body}</p>

        {post.cardImage && (
          <img src={post.cardImage} alt="" className="w-32 rounded-xl mb-4" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
        )}

        <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: "1px solid #f4f4f5" }}>
          <button onClick={onToggleLike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            style={{ background: post.likedByMe ? "#111" : "#f3f4f6", color: post.likedByMe ? "#fff" : "#374151" }}>
            <ThumbsUp className="w-3.5 h-3.5" />{post.likes}
          </button>
          <button onClick={onToggleDislike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            style={{ background: post.dislikedByMe ? "#111" : "#f3f4f6", color: post.dislikedByMe ? "#fff" : "#374151" }}>
            <ThumbsDown className="w-3.5 h-3.5" />{post.dislikes}
          </button>
          <span className="flex items-center gap-1.5 text-gray-400 text-sm ml-1">
            <MessageCircle className="w-3.5 h-3.5" />{post.comments.length}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {post.comments.map(c => {
            const cAuthor = resolveAuthor(c.authorHandle, profile);
            const cBadge = authorBadge(c.authorHandle, profile, myTier);
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <img src={cAuthor.avatar} alt={cAuthor.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" draggable={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900">{cAuthor.name}</span>
                    {cBadge && <Badge label={cBadge} size="2xs" />}
                    <span className="text-[10px] text-gray-300">{relativeTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{c.body}</p>
                  <p className="text-[10px] text-gray-300 mt-1 flex items-center gap-1"><ThumbsUp className="w-2.5 h-2.5" />{c.likes}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 flex-shrink-0" style={{ borderTop: "1px solid #f4f4f5" }}>
        <img src={profile.avatar} alt={profile.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" draggable={false} />
        <input
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submitComment(); }}
          placeholder="Add a comment…"
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
          style={{ fontFamily: "'Google Sans', sans-serif" }}
        />
        <button onClick={submitComment} disabled={!commentText.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-950 disabled:opacity-30 flex-shrink-0 transition-opacity"
          aria-label="Send comment">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
