import { useState } from "react";
import { X } from "lucide-react";
import type { Card, Peer } from "../../types";
import { DetailSheet } from "../cards/DetailSheet";

interface PeerProfileSheetProps {
  peer: Peer;
  onClose: () => void;
  allCards: Card[];
  isFollowing: boolean;
  onToggleFollow: () => void;
}

export function PeerProfileSheet({ peer, onClose, allCards, isFollowing, onToggleFollow }: PeerProfileSheetProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const cardByImg = (img: string) => allCards.find(c => c.img === img) ?? null;

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
                  <img src={peer.avatar} alt={peer.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                </div>
                {peer.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#b49e63] border-2 border-white flex items-center justify-center">
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{peer.name}</h2>
                  {peer.verified && (
                    <div className="rounded-full bg-[#b49e63] flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18 }}>
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {peer.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: peer.badge === "Top Collector" ? "#fef9ec" : "#f0fdf4", color: peer.badge === "Top Collector" ? "#b45309" : "#16a34a" }}>
                      {peer.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{peer.handle} · {peer.specialty}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center gap-6 px-6 pb-5 border-b border-gray-100">
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Cards</p>
              <p className="text-xl font-semibold text-gray-900">{peer.cards}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Value</p>
              <p className="text-xl font-semibold text-gray-900">${peer.value.toLocaleString()}</p>
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

          <div className="px-6 pt-5 pb-4">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Top Cards</p>
            <div className="flex gap-3">
              {peer.topCards.map((img, i) => (
                <button key={i} className="flex-1 overflow-hidden focus:outline-none active:opacity-80" style={{ background: "#f4f4f5" }}
                  onClick={() => { const c = cardByImg(img); if (c) setSelectedCard(c); }}>
                  <img src={img} alt="" className="w-full block" style={{ objectFit: "contain" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pt-1">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Collection</p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {peer.snapshot.map((img, i) => (
                <button key={i} className="overflow-hidden focus:outline-none active:opacity-80" style={{ background: "#f4f4f5" }}
                  onClick={() => { const c = cardByImg(img); if (c) setSelectedCard(c); }}>
                  <img src={img} alt="" className="w-full block" style={{ objectFit: "contain" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {selectedCard && <DetailSheet onClose={() => setSelectedCard(null)} isPeer cards={[selectedCard]} initialIndex={0} />}
    </>
  );
}
