import { useState } from "react";
import { X, Lock } from "lucide-react";
import type { Card } from "../../types";
import type { DbProfileStats } from "../../data/repositories";
import { usePeerCards } from "../../data/usePeers";
import { computeLevel, tierBadgeLabel } from "../../lib/level";
import { DetailSheet } from "../cards/DetailSheet";
import { useEscapeClose } from "../../hooks/useEscapeClose";
import { Avatar } from "../shared/Avatar";

interface PeerProfileSheetProps {
  peer: DbProfileStats;
  onClose: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
}

const TOP_CARD_COUNT = 3;

export function PeerProfileSheet({ peer, onClose, isFollowing, onToggleFollow }: PeerProfileSheetProps) {
  useEscapeClose(onClose);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Only returns rows if their collection is public; a private one yields an
  // empty list rather than an error.
  const { cards, isLoading } = usePeerCards(peer.profileId);
  const selectedCard = cards.find(c => c.id === selectedCardId) ?? null;

  const badge = tierBadgeLabel(computeLevel(peer.achievementCount).tier);
  const topCards = [...cards].sort((a, b) => b.value - a.value).slice(0, TOP_CARD_COUNT);

  const CardButton = ({ card, className }: { card: Card; className?: string }) => (
    <button
      className={`overflow-hidden focus:outline-none active:opacity-80 ${className ?? ""}`}
      style={{ background: "#f4f4f5" }}
      onClick={() => setSelectedCardId(card.id)}
    >
      {card.img
        ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain" }} draggable={false} />
        : <div className="w-full flex items-center justify-center text-[9px] font-semibold text-gray-400 px-1 text-center" style={{ aspectRatio: "2.5/3.5" }}>
            {card.player}
          </div>}
    </button>
  );

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg"
        style={{ maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="overflow-y-auto pb-10" style={{ maxHeight: "calc(88vh - 20px)", scrollbarWidth: "none" }}>
          <div className="flex items-start justify-between px-6 pt-4 pb-5">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                  <Avatar src={peer.avatar} name={peer.displayName} size={56} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} />
                </div>
                {peer.isVerified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#b49e63] border-2 border-white flex items-center justify-center">
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{peer.displayName}</h2>
                  {badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: badge === "HOF" ? "#f3e8ff" : "#fef9ec", color: badge === "HOF" ? "#7c3aed" : "#b45309" }}>
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  @{peer.handle}
                  {peer.collectingSince ? ` · collecting since ${peer.collectingSince}` : ""}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0" aria-label="Close">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {peer.bio && <p className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{peer.bio}</p>}

          <div className="flex items-center gap-6 px-6 pb-5 border-b border-gray-100">
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Cards</p>
              <p className="text-xl font-semibold text-gray-900">{peer.cardCount}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Value</p>
              <p className="text-xl font-semibold text-gray-900">${peer.totalValue.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Followers</p>
              <p className="text-xl font-semibold text-gray-900">{peer.followerCount}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={onToggleFollow}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{ background: isFollowing ? "#f4f4f5" : "#111", color: isFollowing ? "#888" : "#fff" }}
              >
                {isFollowing ? "Following ✓" : "Follow"}
              </button>
            </div>
          </div>

          {peer.chasing && (
            <div className="px-6 pt-5">
              <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-2">Chasing</p>
              <p className="text-sm font-semibold text-gray-900">{peer.chasing}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-10">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900">This collection is private</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                {peer.displayName.split(" ")[0]} hasn't made their collection public.
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 pt-5 pb-4">
                <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Top Cards</p>
                <div className="flex gap-3">
                  {topCards.map(card => <CardButton key={card.id} card={card} className="flex-1" />)}
                </div>
              </div>

              <div className="px-6 pt-1">
                <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Collection</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {cards.map(card => <CardButton key={card.id} card={card} />)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {selectedCard && <DetailSheet onClose={() => setSelectedCardId(null)} isPeer cards={[selectedCard]} initialIndex={0} />}
    </>
  );
}
