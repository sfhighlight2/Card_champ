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
  /** Opens a collector's profile from a post's author row. */
  onOpenProfile: (profileId: string) => void;
  showToast: (msg: string) => void;
}

import topicHotTake from "@/imports/topic-hot-take.png";
import topicBasketball from "@/imports/topic-basketball.png";
import topicSoccer from "@/imports/topic-soccer.png";
import topicPokemon from "@/imports/topic-pokemon.png";
import topicVeefriends from "@/imports/topic-veefriends.png";

// The design's Frame 8 tile artwork (exported from Figma, labels cropped off so
// each topic keeps its own database label). Matched by keyword so a topic named
// "Pokémon", "pokemon", or "Pokemon TCG" all get the Pokéball card.
const TOPIC_ART: { match: RegExp; src: string }[] = [
  { match: /basketball/i, src: topicBasketball },
  { match: /soccer|football/i, src: topicSoccer },
  { match: /pok[eé]mon/i, src: topicPokemon },
  { match: /veefriends/i, src: topicVeefriends },
  { match: /hot.?take/i, src: topicHotTake },
];

const topicArtFor = (t: CommunityTopic): string | undefined =>
  TOPIC_ART.find(a => a.match.test(t.label) || a.match.test(t.slug))?.src;

/** One rail card: the design's Frame 8 artwork when the topic has it, a
 *  gradient + emoji tile in the same frame when it doesn't. */
function TopicTile({ label, emoji, art, gradient, active, onClick }: {
  label: string;
  emoji?: string;
  art?: string;
  gradient?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 w-[92px] h-[140px] rounded-2xl overflow-hidden transition-transform active:scale-95"
      style={{
        background: art ? "#101828" : gradient,
        outline: active ? "2px solid #dce4f6" : "2px solid transparent",
        outlineOffset: 2,
        boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
      }}
    >
      {art ? (
        <img src={art} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", objectPosition: "top" }} draggable={false} />
      ) : (
        <span className="absolute left-1/2 -translate-x-1/2 top-7 text-4xl" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>{emoji || "🃏"}</span>
      )}
      {/* Scrim so the label reads on any art. */}
      <span className="absolute inset-x-0 bottom-0 h-12" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />
      <span className="absolute inset-x-0 bottom-2.5 text-xs font-bold text-white px-1.5 truncate">{label}</span>
    </button>
  );
}

// Fallback gradients for topics the design has no card for, cycled by index.
const TOPIC_TILE_GRADIENTS = [
  "linear-gradient(160deg, #38bdf8 0%, #1e3a8a 100%)",
  "linear-gradient(160deg, #f472b6 0%, #9d174d 100%)",
  "linear-gradient(160deg, #34d399 0%, #065f46 100%)",
  "linear-gradient(160deg, #8b7ae8 0%, #4c1d95 100%)",
];

export function CommunityView({ posts, topics, ready, onOpenPost, onOpenProfile, showToast }: CommunityViewProps) {
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
          {/* The design's leading "Hot Take!" card is the trending filter. */}
          <TopicTile
            label="Hot Take!"
            art={topicHotTake}
            active={filter === "trending"}
            onClick={() => setFilter(filter === "trending" ? "all" : "trending")}
          />
          {topics.map((t, i) => (
            <TopicTile
              key={t.slug}
              label={t.label}
              emoji={t.emoji}
              art={topicArtFor(t)}
              gradient={TOPIC_TILE_GRADIENTS[i % TOPIC_TILE_GRADIENTS.length]}
              active={filter === t.slug}
              onClick={() => setFilter(filter === t.slug ? "all" : t.slug)}
            />
          ))}
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
              <PostCard post={post} onOpen={() => onOpenPost(post)} onAuthorClick={() => onOpenProfile(post.authorId)} />
            </AnimateIn>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
