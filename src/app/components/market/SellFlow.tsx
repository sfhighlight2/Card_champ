import { useState } from "react";
import { X, Search, Check, Store } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/cardFields";
import { gradingBadge, gradingSummary } from "../../lib/grading";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface SellFlowProps {
  onClose: () => void;
  allCards: Card[];
  /** Creates a real `marketplace_listings` row owned by the seller. Resolves
   *  true only when the row actually landed. */
  onCreate: (input: {
    copyId: string;
    title: string;
    price: number;
    shipsFrom: string;
    catalogCardId: string | null;
    graderCode: string;
    grade: string;
  }) => Promise<boolean>;
}

export function SellFlow({ onClose, allCards, onCreate }: SellFlowProps) {
  useEscapeClose(onClose);
  const [step, setStep] = useState(1);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [askingPrice, setAskingPrice] = useState("");
  const [shipsFrom, setShipsFrom] = useState("United States");
  const [done, setDone] = useState(false);
  const [listing, setListing] = useState(false);
  const [cardSearch, setCardSearch] = useState("");

  const filteredCards = allCards.filter(c =>
    c.player.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.year.includes(cardSearch)
  );

  // A real positive dollar amount, or null. "0", "-3", "1e", and "" all fail —
  // the DB would accept a $0 listing, and "1e" used to reach Review as "$NaN".
  const parsedPrice = (() => {
    const n = Number(askingPrice);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const STEPS = ["Card", "Listing", "Review"];

  const handleList = async () => {
    if (!selectedCard || parsedPrice == null || listing) return;
    setListing(true);
    // A native listing on Card Champs itself — the seller's own copy, offered
    // here rather than on a third-party platform this app cannot post to.
    // The success screen waits for the server: a rejected insert (say, this
    // copy already has a live listing) must not be celebrated as "live".
    const ok = await onCreate({
      copyId: selectedCard.id,
      title: [selectedCard.year, selectedCard.brand, selectedCard.player].filter(Boolean).join(" "),
      price: parsedPrice,
      shipsFrom,
      catalogCardId: selectedCard.catalogCardId,
      graderCode: selectedCard.grader,
      grade: selectedCard.grade,
    });
    setListing(false);
    if (ok) setDone(true);
  };

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #111 0%, #333 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mb-5">
            <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-2">Listed</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Your card is live!</h2>
          {selectedCard && <p className="text-white/60 text-sm mb-1">{selectedCard.player} · {selectedCard.year}</p>}
          <p className="text-white font-semibold text-lg mb-6">${(parsedPrice ?? 0).toLocaleString()}</p>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-white text-gray-900 text-sm font-semibold">Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="app-sheet mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ background: step > i ? "#111" : "#f0f0f0" }} />)}
          </div>
          <span className="text-xs text-gray-400 mr-3">{step}/{STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92dvh - 88px)", scrollbarWidth: "none" }}>

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Which card are you selling?</h2>
              <p className="text-sm text-gray-400 mb-4">Pick from your collection.</p>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3.5 py-2.5 mb-4">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={cardSearch} onChange={e => setCardSearch(e.target.value)} placeholder="Search cards…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
                {cardSearch && <button onClick={() => setCardSearch("")} aria-label="Clear search"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              {filteredCards.length === 0 && (
                <p className="text-sm text-gray-400 py-6 text-center">
                  {allCards.length === 0 ? "Add a card to your collection first — then you can list it here." : "No cards match that search."}
                </p>
              )}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-5">
                {filteredCards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCard(card)} className="relative focus:outline-none group">
                    <div className="overflow-hidden transition-all" style={{ outline: selectedCard?.id === card.id ? "2px solid #111" : "2px solid transparent", outlineOffset: 2 }}>
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
                    <p className="text-[9px] text-gray-500 text-center mt-1 truncate">{card.player.split(" ").pop()}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} disabled={!selectedCard}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {step === 2 && selectedCard && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Set your listing</h2>
              <p className="text-sm text-gray-400 mb-4">Price it and choose where to list.</p>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 mb-5">
                {selectedCard.img
                  ? <img src={selectedCard.img} alt={selectedCard.player} className="w-12 flex-shrink-0" style={{ objectFit: "contain", background: "#ebebeb" }} draggable={false} />
                  : <div className="w-12 h-16 flex-shrink-0 flex items-center justify-center rounded" style={{ background: GRADER_COLOR[selectedCard.grader]||"#888" }}><span className="text-white text-[8px] text-center px-0.5">{selectedCard.player}</span></div>
                }
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedCard.player}</p>
                  <p className="text-xs text-gray-400">{selectedCard.year} · {gradingBadge(selectedCard)}</p>
                  <p className="text-xs text-gray-400">Est. value: <span className="font-semibold text-gray-700">${selectedCard.value.toLocaleString()}</span></p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl mb-4" style={{ background: "#f8fafc" }}>
                <Store className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  This lists the card on Card Champs, visible to other collectors. It doesn't post to
                  eBay or Fanatics.
                </p>
              </div>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Asking Price *</p>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder={selectedCard.value.toLocaleString()}
                  inputMode="decimal" type="number"
                  className="w-full rounded-2xl bg-gray-50 pl-8 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-300 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
              </div>

              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Ships From</p>
              <input value={shipsFrom} onChange={e => setShipsFrom(e.target.value)} placeholder="Country / Region"
                className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }} />

              {askingPrice.trim() !== "" && parsedPrice == null && (
                <p className="text-xs text-red-500 mb-2">Enter a price above $0.</p>
              )}
              <button onClick={() => setStep(3)} disabled={parsedPrice == null}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {step === 3 && selectedCard && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Review your listing</h2>
              <p className="text-sm text-gray-400 mb-5">Everything looks good?</p>

              <div className="rounded-2xl overflow-hidden mb-5 bg-gray-50">
                <div className="h-1 w-full" style={{ background: GRADER_COLOR[selectedCard.grader] || "#111" }} />
                <div className="flex items-center gap-4 p-4">
                  {selectedCard.img
                    ? <img src={selectedCard.img} alt={selectedCard.player} className="w-16 flex-shrink-0" style={{ objectFit: "contain", background: "#ebebeb" }} draggable={false} />
                    : <div className="w-16 h-20 flex-shrink-0 flex items-center justify-center rounded" style={{ background: GRADER_COLOR[selectedCard.grader]||"#888" }}><span className="text-white text-[8px] text-center px-1">{selectedCard.player}</span></div>
                  }
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{selectedCard.player}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedCard.year} · {selectedCard.brand}</p>
                    <p className="text-xs text-gray-400">{gradingSummary(selectedCard)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-gray-200">
                  {[
                    { label: "Price", value: `$${(parsedPrice ?? 0).toLocaleString()}` },
                    { label: "Ships From", value: shipsFrom },
                  ].map(s => (
                    <div key={s.label} className="bg-white px-3 py-3 text-center">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => void handleList()} disabled={listing}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold mb-2 disabled:opacity-50">
                {listing ? "Listing…" : "List for Sale"}
              </button>
            </>
          )}

          {step > 1 && !done && (
            <button onClick={() => setStep(s => s - 1)} className="w-full mt-2 py-2.5 text-sm text-gray-400">← Back</button>
          )}
        </div>
      </div>
    </div>
  );
}
