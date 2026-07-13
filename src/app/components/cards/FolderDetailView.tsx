import { useState } from "react";
import { ChevronLeft, Folder, Plus, Share2, X, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Card, FolderType } from "../../types";
import { CardTile } from "./CardTile";
import { DetailSheet } from "./DetailSheet";
import { ShareSheet } from "../shared/ShareSheet";

interface FolderDetailViewProps {
  folder: FolderType;
  onBack: () => void;
  onUpdate: (updated: FolderType) => void;
  allCards: Card[];
  onEdit: () => void;
  onDelete: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: number) => void;
}

export function FolderDetailView({ folder, onBack, onUpdate, allCards, onEdit, onDelete, onEditCard, onDeleteCard }: FolderDetailViewProps) {
  const [selected, setSelected] = useState<Card | null>(null);
  const [sharing, setSharing] = useState(false);
  const [addingCards, setAddingCards] = useState(false);
  const [changingThumb, setChangingThumb] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cards = allCards.filter(c => folder.cardIds.includes(c.id));
  const folderValue = cards.reduce((s, c) => s + c.value, 0);

  const toggleCard = (id: number) => {
    const next = folder.cardIds.includes(id)
      ? folder.cardIds.filter(x => x !== id)
      : [...folder.cardIds, id];
    onUpdate({ ...folder, cardIds: next });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={() => setChangingThumb(true)} className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 relative">
          {folder.thumbnail
            ? <img src={folder.thumbnail} alt="" className="w-full h-full object-contain" style={{ background: folder.color }} />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: folder.color }}><Folder className="w-4 h-4 text-white" /></div>
          }
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <Plus className="w-3 h-3 text-white" />
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 leading-tight">{folder.name}</h2>
          <p className="text-[11px] text-gray-400">{cards.length} cards · ${folderValue.toLocaleString()} <span className="text-gray-300">· eBay</span></p>
        </div>
        <button onClick={() => setSharing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold flex-shrink-0">
          <Share2 className="w-3 h-3" />Share
        </button>
        <div className="relative flex-shrink-0">
          <button onClick={() => setMenuOpen(o => !o)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-10 w-40 rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
              <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 text-left">
                <Pencil className="w-3.5 h-3.5" />Edit folder
              </button>
              <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 text-left border-t border-gray-100">
                <Trash2 className="w-3.5 h-3.5" />Delete folder
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Folder className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">No cards in this folder</p>
            <button onClick={() => setAddingCards(true)} className="px-4 py-2 rounded-full bg-gray-950 text-white text-xs font-semibold">Add Cards</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              {cards.map((card, i) => (
                <CardTile key={card.id} card={card} index={i} onClick={() => setSelected(card)} />
              ))}
            </div>
            <button onClick={() => setAddingCards(true)} className="w-full py-3 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />Add Cards
            </button>
          </>
        )}
      </div>

      {addingCards && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={() => setAddingCards(false)}>
          <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "80vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <h2 className="text-base font-semibold text-gray-900">Add Cards</h2>
              <button onClick={() => setAddingCards(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", maxHeight: "calc(80vh - 80px)" }}>
              {allCards.map(card => (
                <button key={card.id} onClick={() => toggleCard(card.id)} className="relative focus:outline-none">
                  <div className="overflow-hidden" style={{ outline: folder.cardIds.includes(card.id) ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                    <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                  </div>
                  {folder.cardIds.includes(card.id) && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-950 flex items-center justify-center">
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {changingThumb && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={() => setChangingThumb(false)}>
          <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "70vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <h2 className="text-base font-semibold text-gray-900">Choose Thumbnail</h2>
              <button onClick={() => setChangingThumb(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", maxHeight: "calc(70vh - 80px)" }}>
              <button onClick={() => { onUpdate({ ...folder, thumbnail: undefined }); setChangingThumb(false); }}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{ background: folder.color, outline: !folder.thumbnail ? "2px solid #111" : "none", outlineOffset: "2px" }}>
                <Folder className="w-5 h-5 text-white" />
              </button>
              {allCards.map(card => (
                <button key={card.id} onClick={() => { onUpdate({ ...folder, thumbnail: card.img }); setChangingThumb(false); }}
                  className="overflow-hidden"
                  style={{ outline: folder.thumbnail === card.img ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                  <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <DetailSheet
          onClose={() => setSelected(null)}
          cards={cards}
          initialIndex={cards.findIndex(c => c.id === selected.id)}
          onEdit={onEditCard}
          onDelete={onDeleteCard}
        />
      )}
      {sharing && (
        <ShareSheet
          title={folder.name}
          subtitle={`${cards.length} cards · Est. $${folderValue.toLocaleString()}`}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
