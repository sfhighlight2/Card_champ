import { useState } from "react";
import { Search, Bell, X, MessagesSquare } from "lucide-react";
import type { CommunityTopic, FeedPost } from "../../types";
import { AnimateIn } from "../shared/AnimateIn";
import { PostCard } from "./PostCard";

interface CommunityViewProps {
  posts: FeedPost[];
  topics: CommunityTopic[];
  ready: boolean;
  onOpenPost: (post: FeedPost) => void;
  showToast: (msg: string) => void;
}

export function CommunityView({ posts, topics, ready, onOpenPost, showToast }: CommunityViewProps) {
  /** "all" | "trending" | a topic slug. */
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const chips = [
    { id: "all", label: "All" },
    { id: "trending", label: "🔥 Trending" },
    ...topics.map(t => ({ id: t.slug, label: `${t.emoji} ${t.label}` })),
  ];

  const q = query.trim().toLowerCase();
  // The view already returns newest-first, so no client re-sort.
  const filtered = posts
    .filter(p => (filter === "all" ? true : filter === "trending" ? p.hot : p.topicSlug === filter))
    .filter(p => {
      if (!q) return true;
      return (
        p.body.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.topicLabel.toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-7 mb-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
            style={{ fontFamily: "'Google Sans', sans-serif" }}
          />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X className="w-3 h-3 text-gray-400" /></button>}
        </div>
        <button onClick={() => showToast("No new notifications")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0" aria-label="Notifications">
          <Bell className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 px-7 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {chips.map(chip => (
          <button key={chip.id} onClick={() => setFilter(chip.id)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
            style={{ background: filter === chip.id ? "#111" : "#f3f4f6", color: filter === chip.id ? "#fff" : "#6b7280" }}>
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-7 overflow-y-auto app-scroll-pad" style={{ scrollbarWidth: "none" }}>
        {!ready ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MessagesSquare className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-900">
              {posts.length === 0 ? "No posts yet" : "No posts found"}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-[240px]">
              {posts.length === 0 ? "Be the first to post something." : "Try a different topic or search term."}
            </p>
          </div>
        ) : (
          filtered.map((post, i) => (
            <AnimateIn key={post.id} delay={Math.min(i, 6) * 60}>
              <PostCard post={post} onOpen={() => onOpenPost(post)} />
            </AnimateIn>
          ))
        )}
      </div>
    </div>
  );
}
