import { useState } from "react";
import { X, Check, Share2, Link, Mail, MessageCircle, ChevronRight, ChevronLeft, Folder, Send } from "lucide-react";
import type { Card, FolderType, Peer } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";
import { PEERS } from "../../data/mockPeers";

const SHARE_PLATFORMS = [
  { id: "dm",    label: "Direct message", sub: "Send to a collector you follow", icon: <Send className="w-4 h-4 text-violet-500" /> },
  { id: "link",  label: "Copy Link",   sub: "Anyone with the link can view", icon: <Link className="w-4 h-4 text-gray-600" /> },
  { id: "msg",   label: "Messages",    sub: "iMessage or SMS",               icon: <MessageCircle className="w-4 h-4 text-green-500" /> },
  { id: "mail",  label: "Email",       sub: "Share as an email",             icon: <Mail className="w-4 h-4 text-blue-500" /> },
  { id: "more",  label: "More",        sub: "Instagram, Twitter & more",     icon: <Share2 className="w-4 h-4 text-gray-400" /> },
];

interface ShareFlowProps {
  onClose: () => void;
  allCards: Card[];
  folders: FolderType[];
}

export function ShareFlow({ onClose, allCards, folders }: ShareFlowProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<"collection" | "folder" | "card" | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [dmPicking, setDmPicking] = useState(false);
  const [dmRecipient, setDmRecipient] = useState<Peer | null>(null);

  const shareTitle = type === "collection" ? "Andrew's Collection"
    : type === "folder" ? selectedFolder?.name ?? ""
    : selectedCard ? `${selectedCard.player} ${selectedCard.year}` : "";

  const shareSubtitle = type === "collection" ? `${allCards.length} cards · Est. $${allCards.reduce((s,c)=>s+c.value,0).toLocaleString()}`
    : type === "folder" ? `${selectedFolder?.cardIds.length} cards`
    : selectedCard ? `${selectedCard.grader} ${selectedCard.grade} · $${selectedCard.value.toLocaleString()}` : "";

  const canContinue = type === "collection" || (type === "folder" && selectedFolder) || (type === "card" && selectedCard);

  const shareViaLink = () => {
    void navigator.clipboard?.writeText(`${shareTitle} — ${shareSubtitle}`).catch(() => {});
    setCopied(true);
    setTimeout(() => { setCopied(false); setDone(true); }, 800);
  };

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #c9a84c 0%, #e8c96e 45%, #b8903c 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          {type === "card" && selectedCard?.img && (
            <img src={selectedCard.img} alt={selectedCard.player} className="w-36 mb-5 rounded-xl"
              style={{ objectFit: "contain", boxShadow: "0 12px 32px rgba(0,0,0,0.3)", transform: "rotate(-2deg)" }} draggable={false} />
          )}
          {type === "folder" && selectedFolder && (
            <div className="w-28 h-28 rounded-2xl mb-5 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.25)", boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
              <Folder className="w-12 h-12 text-white" />
            </div>
          )}
          {type === "collection" && (
            <div className="flex gap-1 mb-5">
              {allCards.filter(c => c.img).slice(0, 3).map((c, i) => (
                <img key={c.id} src={c.img} alt={c.player} className="w-20 rounded-lg"
                  style={{ objectFit: "contain", background: "rgba(255,255,255,0.2)", boxShadow: "0 8px 20px rgba(0,0,0,0.25)", transform: `rotate(${[-6,0,6][i]}deg)` }} draggable={false} />
              ))}
            </div>
          )}

          <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-2">{dmRecipient ? "Sent" : "Shared"}</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
            {dmRecipient
              ? `Sent to ${dmRecipient.name}!`
              : type === "card" ? `Look at this card!` : type === "folder" ? `Check out ${selectedFolder?.name}!` : "Look at my collection!"}
          </h2>
          <p className="text-white/70 text-sm mb-8">{dmRecipient ? shareTitle : shareSubtitle}</p>

          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm mb-3"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>
            Share Again
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm"
            style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.8)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "88vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {[1,2].map(i => <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ background: step >= i ? "#111" : "#f0f0f0" }} />)}
          </div>
          <span className="text-xs text-gray-400 mr-3">{step}/2</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(88vh - 88px)", scrollbarWidth: "none" }}>

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">What do you want to share?</h2>
              <p className="text-sm text-gray-400 mb-5">Choose what you'd like to send.</p>

              {[
                { id: "collection" as const, label: "Entire Collection", sub: `${allCards.length} cards · $${allCards.reduce((s,c)=>s+c.value,0).toLocaleString()}` },
                { id: "folder" as const, label: "A Folder", sub: "Select one of your folders" },
                { id: "card" as const, label: "A Single Card", sub: "Pick one card to share" },
              ].map(opt => (
                <button key={opt.id} onClick={() => { setType(opt.id); setSelectedFolder(null); setSelectedCard(null); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl mb-2 text-left transition-all"
                  style={{ background: type === opt.id ? "#111" : "#f7f7f7" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: type === opt.id ? "#fff" : "#111" }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: type === opt.id ? "rgba(255,255,255,0.6)" : "#aaa" }}>{opt.sub}</p>
                  </div>
                  {type === opt.id && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                </button>
              ))}

              {type === "folder" && (
                <div className="flex flex-col gap-2 mt-3 mb-4">
                  {folders.map(f => (
                    <button key={f.id} onClick={() => setSelectedFolder(f)}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                      style={{ background: selectedFolder?.id === f.id ? f.color : "#f4f4f5" }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selectedFolder?.id === f.id ? "rgba(255,255,255,0.7)" : f.color }} />
                      <span className="text-sm font-semibold" style={{ color: selectedFolder?.id === f.id ? "#fff" : "#111" }}>{f.name}</span>
                      <span className="text-xs ml-auto" style={{ color: selectedFolder?.id === f.id ? "rgba(255,255,255,0.6)" : "#aaa" }}>{f.cardIds.length} cards</span>
                    </button>
                  ))}
                </div>
              )}

              {type === "card" && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-3 mb-4">
                  {allCards.map(card => (
                    <button key={card.id} onClick={() => setSelectedCard(card)} className="relative focus:outline-none">
                      <div className="overflow-hidden" style={{ outline: selectedCard?.id === card.id ? "2px solid #111" : "2px solid transparent", outlineOffset: 2 }}>
                        {card.img
                          ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                          : <div className="w-full flex items-center justify-center py-4" style={{ background: GRADER_COLOR[card.grader]||"#888", aspectRatio:"2.5/3.5" }}><span className="text-white text-[9px] text-center px-1">{card.player}</span></div>
                        }
                      </div>
                      {selectedCard?.id === card.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(2)} disabled={!canContinue}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30 transition-opacity mt-2">
                Continue
              </button>
            </>
          )}

          {step === 2 && !dmPicking && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Share via</h2>
              <div className="rounded-2xl bg-gray-50 px-4 py-3 mb-5">
                <p className="text-sm font-semibold text-gray-900">{shareTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{shareSubtitle}</p>
              </div>
              {SHARE_PLATFORMS.map((p, i) => (
                <button key={p.id} onClick={() => { if (p.id === "dm") setDmPicking(true); else if (p.id === "link") shareViaLink(); else setDone(true); }}
                  className="w-full flex items-center gap-4 py-3.5 text-left"
                  style={{ borderBottom: i < SHARE_PLATFORMS.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                  <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {p.id === "link" && copied ? <Check className="w-4 h-4 text-emerald-500" /> : p.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{p.id === "link" && copied ? "Copied!" : p.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </>
          )}

          {step === 2 && dmPicking && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Send to</h2>
              <p className="text-sm text-gray-400 mb-4">Pick a collector to direct message.</p>
              {PEERS.map((peer, i) => (
                <button key={peer.handle} onClick={() => { setDmRecipient(peer); setDone(true); }}
                  className="w-full flex items-center gap-3 py-3 text-left"
                  style={{ borderBottom: i < PEERS.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={peer.avatar} alt={peer.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{peer.name}</p>
                    <p className="text-[11px] text-gray-400">{peer.handle}</p>
                  </div>
                  <Send className="w-4 h-4 text-violet-500 flex-shrink-0" />
                </button>
              ))}
            </>
          )}

          {step === 2 && (
            <button
              onClick={() => (dmPicking ? setDmPicking(false) : setStep(1))}
              className="w-full mt-4 py-2.5 text-sm text-gray-400 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
