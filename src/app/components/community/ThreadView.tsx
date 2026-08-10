import { useState } from "react";
import { ChevronLeft, ThumbsUp, ThumbsDown, MessageCircle, Send } from "lucide-react";
import type { FeedPost, PostComment, Profile } from "../../types";
import { authorBadgeFor } from "../../lib/community";
import { relativeTime } from "../../lib/relativeTime";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface ThreadViewProps {
  post: FeedPost;
  comments: PostComment[];
  commentsLoading: boolean;
  profile: Profile;
  canWrite: boolean;
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

export function ThreadView({
  post, comments, commentsLoading, profile, canWrite,
  onClose, onToggleLike, onToggleDislike, onAddComment,
}: ThreadViewProps) {
  useEscapeClose(onClose);
  const [commentText, setCommentText] = useState("");
  const badge = authorBadgeFor(post.authorAchievements);

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
          <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" draggable={false} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900 truncate">{post.authorName}</span>
              {badge && <Badge label={badge} />}
            </div>
            <p className="text-xs text-gray-400">{post.authorHandle} · {relativeTime(Date.parse(post.createdAt))}</p>
          </div>
        </div>

        <p className="text-sm text-gray-800 mb-4 leading-relaxed">{post.body}</p>

        <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: "1px solid #f4f4f5" }}>
          <button onClick={onToggleLike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            style={{ background: post.myReaction === "like" ? "#111" : "#f3f4f6", color: post.myReaction === "like" ? "#fff" : "#374151" }}>
            <ThumbsUp className="w-3.5 h-3.5" />{post.likes}
          </button>
          <button onClick={onToggleDislike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            style={{ background: post.myReaction === "dislike" ? "#111" : "#f3f4f6", color: post.myReaction === "dislike" ? "#fff" : "#374151" }}>
            <ThumbsDown className="w-3.5 h-3.5" />{post.dislikes}
          </button>
          <span className="flex items-center gap-1.5 text-gray-400 text-sm ml-1">
            <MessageCircle className="w-3.5 h-3.5" />{post.comments}
          </span>
        </div>

        {commentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-2.5">
                <img src={c.authorAvatar} alt={c.authorName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" draggable={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900">{c.authorName}</span>
                    <span className="text-[10px] text-gray-300">{relativeTime(Date.parse(c.createdAt))}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-6 py-3 flex-shrink-0" style={{ borderTop: "1px solid #f4f4f5" }}>
        <img src={profile.avatar} alt={profile.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" draggable={false} />
        <input
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submitComment(); }}
          placeholder={canWrite ? "Add a comment…" : "Create an account to comment"}
          disabled={!canWrite}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none disabled:opacity-60"
          style={{ fontFamily: "'Google Sans', sans-serif" }}
        />
        <button onClick={submitComment} disabled={!canWrite || !commentText.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-950 disabled:opacity-30 flex-shrink-0 transition-opacity"
          aria-label="Send comment">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
