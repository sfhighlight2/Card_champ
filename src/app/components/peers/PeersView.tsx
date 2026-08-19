import { useEffect, useId, useState } from "react";
import { Share2, Search, X, ChevronDown, ChevronUp, Send, Users } from "lucide-react";
import type { Card, FolderType } from "../../types";
import type { DbProfileStats } from "../../data/repositories";
import { computeLevel, tierBadgeLabel, TIER_RING_STOPS } from "../../lib/level";
import { TierTag, TIER_COIN } from "../shared/TierTag";
import { AnimateIn } from "../shared/AnimateIn";
import { ShareFlow } from "../shared/ShareFlow";
import { PeerProfileSheet } from "./PeerProfileSheet";
import { Avatar } from "../shared/Avatar";

interface PeersViewProps {
  allCards: Card[];
  folders: FolderType[];
  /** Collectors the user follows. */
  myPeers: DbProfileStats[];
  /** Discoverable collectors not yet followed. */
  suggested: DbProfileStats[];
  ready: boolean;
  /** The viewer's own display name, for titling collection shares. */
  ownerName: string;
  isFollowing: (profileId: string) => boolean;
  onToggleFollow: (peer: DbProfileStats) => void;
  onOpenChat: (peer: DbProfileStats) => void;
  onShareViaDm: (peer: DbProfileStats, message: string) => Promise<boolean>;
}

const CHASING_PREVIEW_COUNT = 3;

export function PeersView({
  allCards, folders, myPeers, suggested, ready, ownerName, isFollowing, onToggleFollow, onOpenChat, onShareViaDm,
}: PeersViewProps) {
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showShareFlow, setShowShareFlow] = useState(false);
  const [showAllChasing, setShowAllChasing] = useState(false);

  const matches = (p: DbProfileStats) =>
    p.displayName.toLowerCase().includes(query.toLowerCase()) ||
    p.handle.toLowerCase().includes(query.toLowerCase());

  const filteredSuggested = suggested.filter(matches);
  const filteredPeers = myPeers.filter(matches);

  // Only peers who have actually said what they're hunting.
  const chasingPeers = myPeers.filter(p => !!p.chasing);
  const visibleChasing = showAllChasing ? chasingPeers : chasingPeers.slice(0, CHASING_PREVIEW_COUNT);

  const selectedPeer =
    [...myPeers, ...suggested].find(p => p.profileId === selectedPeerId) ?? null;

  return (
    <>
      <div className="flex-1 overflow-y-auto app-scroll-pad" style={{ scrollbarWidth: "none" }}>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase px-6 mb-4">My Peers</p>
          {!ready ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
            </div>
          ) : myPeers.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-6">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900">No connections yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[240px]">Connect with a collector below and they'll show up here.</p>
            </div>
          ) : (
            // The design's 3-across grid of ringed avatars, each with its coin
            // medal and tier mark under the handle.
            <div className="grid grid-cols-3 gap-y-6 px-6">
              {myPeers.map((peer, i) => {
                const level = computeLevel(peer.achievementCount);
                return (
                  <AnimateIn key={peer.profileId} delay={i * 80}>
                    <button
                      onClick={() => setSelectedPeerId(peer.profileId)}
                      className="w-full flex flex-col items-center gap-2 focus:outline-none"
                    >
                      <div className="relative">
                        <LevelRingAvatar
                          avatar={peer.avatar}
                          name={peer.displayName}
                          progress={level.xpFraction}
                          colors={TIER_RING_STOPS[level.tier]}
                        />
                        {level.hasEarnedTier && (
                          <img
                            src={TIER_COIN[level.tier]}
                            alt={`${tierBadgeLabel(level.tier) ?? "tier"} medal`}
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8"
                            style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.4))" }}
                            draggable={false}
                          />
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-tight text-center max-w-[100px] truncate">@{peer.handle}</p>
                      <TierTag levelInfo={level} />
                    </button>
                  </AnimateIn>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 mx-6 mb-5" />

        <div className="flex gap-2 px-6 mb-5">
          <button onClick={() => setShowShareFlow(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gray-950 text-white text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5" />Share Collection
          </button>
        </div>

        {chasingPeers.length > 0 && (
          <div className="px-6 mb-6">
            <div className="navy-panel rounded-3xl p-4">
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-sm font-bold text-white">What are they chasing</p>
                <span className="text-xs text-gray-400">{chasingPeers.length} total</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {visibleChasing.map((peer, i) => (
                  <AnimateIn key={peer.profileId} delay={i * 60}>
                    <div className="chase-row flex items-center gap-3 rounded-2xl px-4 py-3">
                      <Avatar src={peer.avatar} name={peer.displayName} size={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>@{peer.handle}</p>
                        <p className="text-sm font-semibold text-white truncate">{peer.chasing}</p>
                      </div>
                      <button onClick={() => onOpenChat(peer)}
                        className="dm-btn flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold">
                        <Send className="w-3 h-3" />DM
                      </button>
                    </div>
                  </AnimateIn>
                ))}
              </div>
              {chasingPeers.length > CHASING_PREVIEW_COUNT && (
                <button onClick={() => setShowAllChasing(v => !v)} className="w-full flex items-center justify-center gap-1 pt-3 text-xs font-semibold text-gray-400">
                  {showAllChasing
                    ? <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                    : <>Load more chases ({chasingPeers.length - CHASING_PREVIEW_COUNT} more) <ChevronDown className="w-3.5 h-3.5" /></>}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="px-6 mb-5">
          <div className="flex items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-3">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search collectors…"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              style={{ fontFamily: "'Google Sans', sans-serif" }}
            />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
        </div>

        {query && filteredPeers.length > 0 && (
          <div className="px-6 mb-5">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">My Peers</p>
            <div className="flex flex-col">
              {filteredPeers.map((p, i) => (
                <AnimateIn key={p.profileId} delay={i * 60}>
                  <button onClick={() => setSelectedPeerId(p.profileId)} className="w-full flex items-center gap-3 py-3 text-left" style={{ borderBottom: "1px solid #1c2740" }}>
                    <Avatar src={p.avatar} name={p.displayName} size={40} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{p.displayName}</p>
                      <p className="text-[11px] text-gray-400">@{p.handle} · {p.cardCount} cards</p>
                    </div>
                  </button>
                </AnimateIn>
              ))}
            </div>
          </div>
        )}

        <div className="px-6">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Suggested</p>
          {filteredSuggested.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              {query ? "No collectors match that search." : "You're connected with everyone we can suggest."}
            </p>
          ) : (
            <div className="flex flex-col">
              {filteredSuggested.map((s, i) => (
                <AnimateIn key={s.profileId} delay={i * 70}>
                  <div className="flex items-center gap-3 py-3" style={{ borderBottom: i < filteredSuggested.length - 1 ? "1px solid #1c2740" : "none" }}>
                    <button onClick={() => setSelectedPeerId(s.profileId)} className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <Avatar src={s.avatar} name={s.displayName} size={40} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} />
                    </button>
                    <button onClick={() => setSelectedPeerId(s.profileId)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-gray-900">{s.displayName}</p>
                      <p className="text-[11px] text-gray-400">@{s.handle} · {s.cardCount} cards</p>
                    </button>
                    <button
                      onClick={() => onToggleFollow(s)}
                      className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: isFollowing(s.profileId) ? "#1d2534" : "#1d2e4e",
                        color: isFollowing(s.profileId) ? "#8492ac" : "#fff",
                      }}
                    >
                      {isFollowing(s.profileId) ? "Connected" : "Connect"}
                    </button>
                  </div>
                </AnimateIn>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPeer && (
        <PeerProfileSheet
          peer={selectedPeer}
          onClose={() => setSelectedPeerId(null)}
          isFollowing={isFollowing(selectedPeer.profileId)}
          onToggleFollow={() => onToggleFollow(selectedPeer)}
        />
      )}
      {showShareFlow && (
        <ShareFlow
          onClose={() => setShowShareFlow(false)}
          allCards={allCards}
          folders={folders}
          ownerName={ownerName}
          dmPeers={myPeers}
          onShareViaDm={onShareViaDm}
        />
      )}
    </>
  );
}

function LevelRingAvatar({
  avatar, name, progress, colors,
}: {
  avatar: string;
  name: string;
  progress: number;
  colors: { start: string; end: string };
}) {
  const gradientId = `peerRingGradient-${useId()}`;
  const size = 88;
  const stroke = 6;
  const r = size / 2 - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  const inset = 9;
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFill(progress));
    return () => cancelAnimationFrame(id);
  }, [progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(220,228,246,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fill)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
      </svg>
      <Avatar
        src={avatar}
        name={name}
        size={size - inset * 2}
        className="absolute rounded-full object-cover"
        style={{
          top: inset,
          left: inset,
          width: size - inset * 2,
          height: size - inset * 2,
          boxShadow: "0 0 0 3px rgba(16,24,40,0.9)",
        }}
      />
    </div>
  );
}

