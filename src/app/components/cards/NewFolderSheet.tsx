import { useState } from "react";
import { Folder, Check, Search, X } from "lucide-react";
import type { Card } from "../../types";
import { FOLDER_COLORS } from "../../data/mockCards";

interface NewFolderSheetProps {
  onClose: () => void;
  onCreate: (name: string, color: string, thumbnail?: string, cardIds?: number[]) => void;
  allCards: Card[];
}

export function NewFolderSheet({ onClose, onCreate, allCards }: NewFolderSheetProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [thumbnail] = useState<string | undefined>(undefined);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [cardSearch, setCardSearch] = useState("");

  const filteredCards = allCards.filter(c =>
    c.player.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.year.includes(cardSearch) ||
    c.team.toLowerCase().includes(cardSearch.toLowerCase())
  );

  const STEPS = ["Name", "Color", "Cards"];

  const previewImgs = allCards.filter(c => selectedCards.includes(c.id)).slice(0, 3).map(c => c.img);
  const offsets = [
    { rotate: "-12deg", translate: "-16px, 4px", z: 0 },
    { rotate: "-3deg",  translate: "-2px, 2px",  z: 1 },
    { rotate: "6deg",   translate: "14px, 0px",  z: 2 },
  ];
  const FolderPreview = () => (
    <div className="w-28 mx-auto rounded-2xl overflow-hidden mb-5" style={{ background: color }}>
      <div className="relative flex items-center justify-center" style={{ height: "80px", background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}>
        {previewImgs.length > 0 ? (
          previewImgs.map((img, i) => (
            <img key={i} src={img} alt="" draggable={false} className="absolute"
              style={{ width: 34, objectFit: "contain", background: "#f4f4f5", borderRadius: 3, boxShadow: "0 2px 6px rgba(0,0,0,0.3)", transform: `rotate(${offsets[i].rotate}) translate(${offsets[i].translate})`, zIndex: offsets[i].z }} />
          ))
        ) : (
          <Folder className="w-5 h-5 text-white/50" />
        )}
      </div>
      <div className="px-2.5 py-1.5" style={{ background: "rgba(0,0,0,0.18)" }}>
        <p className="text-[10px] font-semibold text-white truncate">{name || "Folder"}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: step > i ? "#111" : "#f0f0f0" }} />
            ))}
          </div>
          <span className="text-xs text-gray-400 mr-3 flex-shrink-0">{step} / {STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(85vh - 90px)", scrollbarWidth: "none" }}>

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Name your folder</h2>
              <p className="text-sm text-gray-400 mb-6">Give it a name that reflects what's inside.</p>
              <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && setStep(2)}
                placeholder="e.g. Rookies, Hall of Fame…"
                className="w-full rounded-2xl bg-gray-50 px-4 py-4 text-base text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }}
              />
              <button onClick={() => setStep(2)} disabled={!name.trim()}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30 transition-opacity">
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Pick a color</h2>
              <p className="text-sm text-gray-400 mb-6">This color will represent your folder.</p>
              <div className="grid grid-cols-4 gap-3 mb-8">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="h-14 rounded-2xl flex items-center justify-center transition-all"
                    style={{ background: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "3px" }}>
                    {color === c && <Check className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(3)} className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Continue</button>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Add cards</h2>
              <p className="text-sm text-gray-400 mb-4">Select the cards you want in this folder.</p>
              <FolderPreview />
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3.5 py-2.5 mb-4">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={cardSearch} onChange={e => setCardSearch(e.target.value)} placeholder="Search cards…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
                {cardSearch && <button onClick={() => setCardSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                {filteredCards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCards(prev => prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id])}
                    className="relative focus:outline-none">
                    <div className="overflow-hidden" style={{ outline: selectedCards.includes(card.id) ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                      <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                    </div>
                    {selectedCards.includes(card.id) && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-950 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <p className="text-[9px] text-gray-500 text-center mt-1 truncate">{card.player.split(" ").pop()}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { onCreate(name.trim(), color, thumbnail, selectedCards); onClose(); }}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                Create Folder{selectedCards.length > 0 ? ` · ${selectedCards.length} cards` : ""}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
