import { useState } from "react";
import { X, Search, MessageCircle, Check } from "lucide-react";
import type { DbProfileStats } from "../../data/repositories";
import { useEscapeClose } from "../../hooks/useEscapeClose";
import { Avatar } from "../shared/Avatar";

interface NewMessageSheetProps {
  /** Every discoverable collector, whether followed or not. */
  collectors: DbProfileStats[];
  /** Profile ids the user already has a thread with. */
  existingPeerIds: Set<string>;
  isFollowing: (profileId: string) => boolean;
  onClose: () => void;
  onPick: (peer: DbProfileStats) => void;
}

/**
 * Starting point for a new conversation.
 *
 * Not restricted to people you follow: `get_or_create_direct_conversation` only
 * requires that the target profile exists, so gating this on a follow would be a
 * UI-invented rule. Picking someone you already have a thread with just reopens
 * it — the function returns one stable conversation per pair.
 */
export function NewMessageSheet({
  collectors, existingPeerIds, isFollowing, onClose, onPick,
}: NewMessageSheetProps) {
  useEscapeClose(onClose);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = collectors.filter(
    c => !q || c.displayName.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q)
  );

  // People you follow first — the likeliest targets — then everyone else.
  const ordered = [
    ...matches.filter(c => isFollowing(c.profileId)),
    ...matches.filter(c => !isFollowing(c.profileId)),
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="app-sheet mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "85dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <h2 className="text-base font-semibold text-gray-900">New message</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-3">
          <div className="flex items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search collectors…"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              style={{ fontFamily: "'Google Sans', sans-serif" }}
            />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
        </div>

        <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: "calc(85dvh - 150px)", scrollbarWidth: "none" }}>
          {ordered.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {query ? "No collectors found" : "No collectors to message yet"}
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                {query ? "Try a different name or handle." : "Once other collectors join, they'll show up here."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {ordered.map((peer, i) => (
                <button
                  key={peer.profileId}
                  onClick={() => onPick(peer)}
                  className="w-full flex items-center gap-3 py-3 text-left"
                  style={{ borderBottom: i < ordered.length - 1 ? "1px solid #1c2740" : "none" }}
                >
                  <Avatar src={peer.avatar} name={peer.displayName} size={40} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{peer.displayName}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      @{peer.handle}
                      {isFollowing(peer.profileId) ? " · connected" : ""}
                    </p>
                  </div>
                  {existingPeerIds.has(peer.profileId) && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 flex-shrink-0">
                      <Check className="w-3 h-3" />Existing
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
