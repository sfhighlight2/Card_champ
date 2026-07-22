import { useState } from "react";
import { Search, Bell, X, MessagesSquare } from "lucide-react";
import type { CommunityPost, Profile } from "../../types";
import type { Tier } from "../../lib/level";
import { COMMUNITY_TOPICS, TOPIC_EMOJI } from "../../data/mockPosts";
import { resolveAuthor } from "../../lib/community";
import { AnimateIn } from "../shared/AnimateIn";
import { PostCard } from "./PostCard";

type Filter = "all" | "trending" | (typeof COMMUNITY_TOPICS)[number];

interface CommunityViewProps {
  posts: CommunityPost[];
  profile: Profile;
  myTier: Tier;
  onOpenPost: (post: CommunityPost) => void;
  showToast: (msg: string) => void;
}

export function CommunityView({ posts, profile, myTier, onOpenPost, showToast }: CommunityViewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "trending", label: "🔥 Trending" },
    ...COMMUNITY_TOPICS.map(t => ({ id: t as Filter, label: `${TOPIC_EMOJI[t]} ${t}` })),
  ];

  const q = query.trim().toLowerCase();
  const filtered = posts
    .filter(p => (filter === "all" ? true : filter === "trending" ? p.hot : p.topic === filter))
    .filter(p => {
      if (!q) return true;
      const author = resolveAuthor(p.authorHandle, profile);
      return p.body.toLowerCase().includes(q) || author.name.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q);
    })
    .sort((a, b) => b.createdAt - a.createdAt);

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

      <div className="flex-1 px-7 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <MessagesSquare className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-900">No posts found</p>
            <p className="text-sm text-gray-400 mt-1 max-w-[240px]">Try a different topic or search term.</p>
          </div>
        ) : (
          filtered.map((post, i) => (
            <AnimateIn key={post.id} delay={Math.min(i, 6) * 60}>
              <PostCard post={post} profile={profile} myTier={myTier} onOpen={() => onOpenPost(post)} />
            </AnimateIn>
          ))
        )}
      </div>
    </div>
  );
}
