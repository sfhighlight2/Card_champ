import { ThumbsUp, MessageCircle, Flame } from "lucide-react";
import type { CommunityPost, Profile } from "../../types";
import type { Tier } from "../../lib/level";
import { resolveAuthor, authorBadge } from "../../lib/community";
import { TOPIC_EMOJI } from "../../data/mockPosts";
import { relativeTime } from "../../lib/relativeTime";

interface PostCardProps {
  post: CommunityPost;
  profile: Profile;
  myTier: Tier;
  onOpen: () => void;
}

export function PostCard({ post, profile, myTier, onOpen }: PostCardProps) {
  const author = resolveAuthor(post.authorHandle, profile);
  const badge = authorBadge(post.authorHandle, profile, myTier);

  return (
    <button onClick={onOpen} className="w-full text-left rounded-3xl bg-gray-50 p-4 mb-3 focus:outline-none">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white text-gray-700 flex-shrink-0">
            {TOPIC_EMOJI[post.topic] ?? ""} {post.topic}
          </span>
          {post.hot && (
            <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full text-orange-600 flex-shrink-0" style={{ background: "#fff4ea" }}>
              <Flame className="w-3 h-3" />Hot
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{relativeTime(post.createdAt)}</span>
      </div>

      <p className="text-sm text-gray-900 mb-3 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {post.body}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img src={author.avatar} alt={author.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" draggable={false} />
          <span className="text-xs font-semibold text-gray-700 truncate">{author.name.split(" ")[0]}</span>
          {badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: badge === "HOF" ? "#f3e8ff" : "#fef9ec", color: badge === "HOF" ? "#7c3aed" : "#b45309" }}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-gray-400">
          <span className="flex items-center gap-1 text-xs font-semibold"><ThumbsUp className="w-3.5 h-3.5" />{post.likes}</span>
          <span className="flex items-center gap-1 text-xs font-semibold"><MessageCircle className="w-3.5 h-3.5" />{post.comments.length}</span>
        </div>
      </div>
    </button>
  );
}
