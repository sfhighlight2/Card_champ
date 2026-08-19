import { useMemo, useState } from "react";
import { Plus, Search, X, Zap } from "lucide-react";
import type { Card, Chase } from "../../types";
import { gradingColor } from "../../lib/grading";
import { AnimateIn } from "../shared/AnimateIn";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import medalChase from "@/imports/medal-chase.png";

interface ChaseViewProps {
  chases: Chase[];
  cards: Card[];
  /** False for guests, whose chase writes the server would reject — the form
   *  must not open, collect typing, and then lose it to an RLS error. */
  canWrite: boolean;
  onGuestBlocked: () => void;
  onCreate: (chase: Omit<Chase, "id" | "createdAt">) => void;
  onUpdate: (chase: Chase) => void;
  onDelete: (id: string) => void;
}

export function ChaseView({ chases, cards, canWrite, onGuestBlocked, onCreate, onUpdate, onDelete }: ChaseViewProps) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Chase | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const visibleChases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chases;
    return chases.filter(chase =>
      chase.title.toLowerCase().includes(q) ||
      chase.description.toLowerCase().includes(q) ||
      cards.find(card => card.id === chase.pinnedCardId)?.player.toLowerCase().includes(q)
    );
  }, [cards, chases, query]);

  const startNew = () => {
    if (!canWrite) {
      onGuestBlocked();
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  const startEdit = (chase: Chase) => {
    setEditing(chase);
    setFormOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 px-7 mb-4">
        <div className="flex-1 flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
            style={{ fontFamily: "'Google Sans', sans-serif" }}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 md:px-7 overflow-y-auto app-scroll-pad" style={{ scrollbarWidth: "none" }}>
        <AnimateIn>
          <div className="navy-panel flex items-center gap-4 rounded-[28px] px-5 md:px-4 py-5 md:py-4 mb-6 md:mb-5">
            <img src={medalChase} alt="" className="w-11 h-11 flex-shrink-0" draggable={false} />
            <p className="text-[15px] md:text-base font-medium text-slate-600 leading-relaxed">
              Your chases are <span className="font-bold text-slate-700">public</span> to connections and refresh weekly.
            </p>
          </div>
        </AnimateIn>

        <div className="flex flex-col gap-5 md:gap-5">
          {visibleChases.map((chase, index) => (
            <AnimateIn key={chase.id} delay={index * 70}>
              <ChaseCard chase={chase} onEdit={() => startEdit(chase)} onDelete={() => setConfirmingDeleteId(chase.id)} />
            </AnimateIn>
          ))}
        </div>

        {!formOpen && (
          <button
            onClick={startNew}
            className="mt-10 md:mt-5 w-full h-[96px] md:h-[72px] rounded-[28px] border-2 border-dashed border-gray-200 text-gray-400 flex items-center justify-center gap-3 text-lg md:text-base font-bold hover:border-emerald-200 hover:text-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Chase
          </button>
        )}

        {formOpen && (
          <ChaseForm
            key={editing?.id ?? "new"}
            cards={cards}
            chase={editing}
            onCancel={() => { setFormOpen(false); setEditing(null); }}
            onSave={data => {
              if (editing) onUpdate({ ...editing, ...data });
              else onCreate(data);
              setFormOpen(false);
              setEditing(null);
            }}
          />
        )}

        {confirmingDeleteId && (
          <ConfirmDialog
            title="Remove this chase?"
            message="Connections will no longer see it. This can't be undone."
            confirmLabel="Remove"
            onConfirm={() => { onDelete(confirmingDeleteId); setConfirmingDeleteId(null); }}
            onCancel={() => setConfirmingDeleteId(null)}
          />
        )}

        {visibleChases.length === 0 && !formOpen && (
          <div className="flex flex-col items-center text-center pt-12">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-emerald-500 fill-emerald-500" />
            </div>
            <p className="text-base font-semibold text-gray-900">{query ? "No chases found" : "No chases yet"}</p>
            <p className="text-sm text-gray-400 mt-1 max-w-[240px]">{query ? "Try a different search." : "Add the card you're hunting next."}</p>
          </div>
        )}
      </div>
    </>
  );
}

function ChaseCard({ chase, onEdit, onDelete }: { chase: Chase; onEdit: () => void; onDelete: () => void }) {
  // The design's chase card: green→navy gradient, lightning medal, CHASING in
  // bright mint caps, white title.
  return (
    <div className="chase-card rounded-[24px] px-5 md:px-4 py-6 md:py-5 shadow-lg">
      <div className="grid grid-cols-[72px_minmax(0,1fr)_58px] md:grid-cols-[80px_1fr_58px] gap-4 items-center">
        <img src={medalChase} alt="" className="w-16 h-16 md:w-16 md:h-16" draggable={false}
          style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }} />
        <div className="min-w-0">
          <p className="text-[12px] md:text-[11px] font-black tracking-[0.24em] uppercase mb-1.5" style={{ color: "#5bf092" }}>Chasing</p>
          <h3 className="text-lg font-bold text-white leading-tight">{chase.title}</h3>
          {chase.description && (
            <p className="text-[15px] font-medium leading-relaxed mt-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>{chase.description}</p>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 md:gap-2">
          <button onClick={onEdit} className="text-sm font-bold hover:text-white" style={{ color: "rgba(255,255,255,0.7)" }}>Edit</button>
          <button onClick={onDelete} className="text-sm font-bold text-red-400 hover:text-red-300">Remove</button>
        </div>
      </div>
    </div>
  );
}

function ChaseForm({
  cards, chase, onCancel, onSave,
}: {
  cards: Card[];
  chase: Chase | null;
  onCancel: () => void;
  onSave: (data: Omit<Chase, "id" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState(chase?.title ?? "");
  const [description, setDescription] = useState(chase?.description ?? "");
  const [pinnedCardId, setPinnedCardId] = useState<string | undefined>(chase?.pinnedCardId ?? cards[0]?.id);
  const canSave = title.trim().length > 0 && description.trim().length > 0;

  return (
    <AnimateIn className="mt-5">
      <div className="rounded-[28px] border border-gray-200 bg-white px-4 py-5 shadow-md">
        <p className="text-[13px] font-black text-gray-400 tracking-[0.2em] uppercase mb-4">{chase ? "Edit Chase" : "New Chase"}</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Chase title (e.g. Bo Jackson PSA 10)"
          className="w-full rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none mb-3"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What are you hunting? Be as specific as you like..."
          rows={3}
          className="w-full resize-none rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none mb-6"
        />

        <p className="text-[11px] font-black text-gray-400 tracking-[0.18em] uppercase mb-3">Pin a card from your collection</p>
        <div className="-mx-4 px-4 pb-4 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => setPinnedCardId(card.id)}
              aria-label={`Pin ${card.player}`}
              className="relative flex-shrink-0 w-[58px] md:w-[68px] rounded-lg transition-transform"
              style={{
                transform: pinnedCardId === card.id ? "translateY(-4px)" : "translateY(0)",
                outline: pinnedCardId === card.id ? "2px solid #10b981" : "2px solid transparent",
                outlineOffset: 3,
              }}
            >
              {card.img ? (
                <img src={card.img} alt="" className="w-full block rounded-md bg-gray-100" draggable={false} />
              ) : (
                <div className="w-full rounded-md flex items-center justify-center px-1"
                  style={{ background: gradingColor(card), aspectRatio: "2.5/3.5" }}>
                  <span className="text-white text-[8px] font-semibold text-center leading-tight">{card.player}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <button onClick={onCancel} className="h-14 rounded-[20px] bg-gray-100 text-slate-500 text-base font-bold">
            Cancel
          </button>
          <button
            onClick={() => canSave && onSave({ title: title.trim(), description: description.trim(), pinnedCardId })}
            disabled={!canSave}
            className="h-14 rounded-[20px] bg-slate-950 text-white text-base font-bold disabled:opacity-40"
          >
            Save Chase
          </button>
        </div>
      </div>
    </AnimateIn>
  );
}

