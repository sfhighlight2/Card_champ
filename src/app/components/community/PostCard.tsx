import { ThumbsUp, MessageCircle, Flame } from "lucide-react";
import type { FeedPost } from "../../types";
import { authorBadgeFor } from "../../lib/community";
import { relativeTime } from "../../lib/relativeTime";
import { Avatar } from "../shared/Avatar";

interface PostCardProps {
  post: FeedPost;
  onOpen: () => void;
}

export function PostCard({ post, onOpen }: PostCardProps) {
  // Derived from the author's earned achievements, the same way the profile
  // header derives its own tier — no per-handle badge map.
  const badge = authorBadgeFor(post.authorAchievements);

  return (
    <button onClick={onOpen} className="navy-panel w-full text-left rounded-3xl p-4 mb-3 focus:outline-none">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* The design's topic tag: warm orange on a dark amber well. */}
          <span className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
            style={{ background: "rgba(232,130,26,0.14)", color: "#e8821a" }}>
            {post.topicEmoji} {post.topicLabel}
          </span>
          {post.hot && (
            <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
              style={{ background: "rgba(255,105,0,0.14)", color: "#ff6900" }}>
              <Flame className="w-3 h-3" />Hot take
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{relativeTime(Date.parse(post.createdAt))}</span>
      </div>

      <p className="text-[15px] font-semibold text-white mb-3 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {post.body}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar src={post.authorAvatar} name={post.authorName} size={24} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700 truncate">@{post.authorHandle.replace(/^@/, "")}</span>
          {badge && (
            <span className={`tier-tag tier-tag-${badge.toLowerCase()} text-[10px] flex-shrink-0`}>{badge}</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-gray-400">
          <span className="flex items-center gap-1 text-xs font-semibold"><ThumbsUp className="w-3.5 h-3.5" />{post.likes}</span>
          <span className="flex items-center gap-1 text-xs font-semibold"><MessageCircle className="w-3.5 h-3.5" />{post.comments}</span>
        </div>
      </div>
    </button>
  );
}
