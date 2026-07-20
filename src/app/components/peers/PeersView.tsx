import { useState } from "react";
import { Share2, Search, X } from "lucide-react";
import type { Card, FolderType, Peer } from "../../types";
import { PEERS, SUGGESTED } from "../../data/mockPeers";
import { AnimateIn } from "../shared/AnimateIn";
import { ShareFlow } from "../shared/ShareFlow";
import { PeerProfileSheet } from "./PeerProfileSheet";

interface PeersViewProps {
  allCards: Card[];
  folders: FolderType[];
  following: string[];
  onToggleFollow: (handle: string) => void;
  showToast: (msg: string) => void;
}

export function PeersView({ allCards, folders, following, onToggleFollow, showToast }: PeersViewProps) {
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [query, setQuery] = useState("");
  const [showShareFlow, setShowShareFlow] = useState(false);

  const filteredSuggested = SUGGESTED.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.handle.toLowerCase().includes(query.toLowerCase())
  );

  const toggleFollow = (handle: string) => {
    const willFollow = !following.includes(handle);
    onToggleFollow(handle);
    showToast(willFollow ? `Following ${handle}` : `Unfollowed ${handle}`);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>

        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase px-6 mb-3">My Peers</p>
          <div className="flex gap-6 px-6 justify-center flex-wrap">
            {PEERS.map((peer, i) => (
              <AnimateIn key={i} delay={i * 80}>
              <button
                onClick={() => setSelectedPeer(peer)}
                className="flex flex-col items-center gap-2 focus:outline-none flex-shrink-0"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-sm">
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
                <p className="text-[10px] font-semibold text-gray-900 leading-tight text-center max-w-[64px] truncate">{peer.name.split(" ")[0]}</p>
                <div className="flex flex-col items-center" style={{ gap: 1 }}>
                  <p className="text-[9px] text-gray-400 leading-none">{peer.handle}</p>
                  <p className="text-[9px] text-gray-400 leading-none">{peer.cards} cards</p>
                </div>
              </button>
              </AnimateIn>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 mx-6 mb-5" />

        <div className="flex gap-2 px-6 mb-5">
          <button onClick={() => setShowShareFlow(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gray-950 text-white text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5" />Share Collection
          </button>
        </div>

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

        <div className="px-6">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Suggested</p>
          <div className="flex flex-col">
            {filteredSuggested.map((s, i) => (
              <AnimateIn key={i} delay={i * 70}>
              <div className="flex items-center gap-3 py-3" style={{ borderBottom: i < filteredSuggested.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={s.avatar} alt={s.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="text-[11px] text-gray-400">{s.handle} · {s.cards} cards</p>
                </div>
                <button
                  onClick={() => toggleFollow(s.handle)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: following.includes(s.handle) ? "#f4f4f5" : "#111",
                    color: following.includes(s.handle) ? "#888" : "#fff",
                  }}
                >
                  {following.includes(s.handle) ? "Following" : "Follow"}
                </button>
              </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>

      {selectedPeer && (
        <PeerProfileSheet
          peer={selectedPeer}
          onClose={() => setSelectedPeer(null)}
          allCards={allCards}
          isFollowing={following.includes(selectedPeer.handle)}
          onToggleFollow={() => toggleFollow(selectedPeer.handle)}
        />
      )}
      {showShareFlow && <ShareFlow onClose={() => setShowShareFlow(false)} allCards={allCards} folders={folders} />}
    </>
  );
}
