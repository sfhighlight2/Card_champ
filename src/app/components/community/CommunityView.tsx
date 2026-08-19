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

// Tile gradients for the topics rail, cycled by index — the design gives each
// topic its own saturated card (fire red, basketball orange, purple, green…).
const TOPIC_TILE_GRADIENTS = [
  "linear-gradient(160deg, #ff5a3c 0%, #b81c1c 100%)",
  "linear-gradient(160deg, #ffa43d 0%, #c2410c 100%)",
  "linear-gradient(160deg, #8b7ae8 0%, #4c1d95 100%)",
  "linear-gradient(160deg, #34d399 0%, #065f46 100%)",
  "linear-gradient(160deg, #38bdf8 0%, #1e3a8a 100%)",
  "linear-gradient(160deg, #f472b6 0%, #9d174d 100%)",
];

export function CommunityView({ posts, topics, ready, onOpenPost, showToast }: CommunityViewProps) {
  /** "all" | "trending" | a topic slug. */
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

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
      <div className="flex-1 overflow-y-auto app-scroll-pad" style={{ scrollbarWidth: "none" }}>
        {/* Community Topics rail — the design's tall gradient tiles double as
            the topic filter: tap to focus a topic, tap again for everything. */}
        <div className="flex items-baseline justify-between px-7 mb-3">
          <h2 className="text-base font-bold text-white">Community Topics</h2>
          <span className="text-xs text-gray-400">{topics.length} total</span>
        </div>
        <div className="flex gap-3 px-7 mb-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {topics.map((t, i) => {
            const active = filter === t.slug;
            return (
              <button
                key={t.slug}
                onClick={() => setFilter(active ? "all" : t.slug)}
                className="relative flex-shrink-0 w-[92px] h-[140px] rounded-2xl overflow-hidden flex flex-col items-center justify-between py-3 transition-transform active:scale-95"
                style={{
                  background: TOPIC_TILE_GRADIENTS[i % TOPIC_TILE_GRADIENTS.length],
                  outline: active ? "2px solid #dce4f6" : "2px solid transparent",
                  outlineOffset: 2,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                }}
              >
                <span className="text-4xl mt-4" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>{t.emoji || "🃏"}</span>
                <span className="text-xs font-bold text-white px-1.5 truncate max-w-full">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline justify-between px-7 mb-3">
          <h2 className="text-base font-bold text-white">Recent Threads</h2>
          <span className="text-xs text-gray-400">{filtered.length} total</span>
        </div>

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
          {/* Same wording as the AppMenu stub — "No new notifications" implied a
              notification system that doesn't exist yet. */}
          <button onClick={() => showToast("Notifications are coming soon")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0" aria-label="Notifications">
            <Bell className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-7 mb-4">
          {[{ id: "all", label: "All" }, { id: "trending", label: "🔥 Trending" }].map(chip => (
            <button key={chip.id} onClick={() => setFilter(chip.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${filter === chip.id ? "pill-active" : ""}`}
              style={filter === chip.id ? undefined : { background: "#1d2534", color: "#8492ac" }}>
              {chip.label}
            </button>
          ))}
        </div>

        <div className="px-7">
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
    </div>
  );
}
