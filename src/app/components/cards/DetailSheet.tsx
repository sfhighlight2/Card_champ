import { useState, useRef } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import { X, Share2, Pencil, Trash2 } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";
import { use3DTilt } from "../../hooks/use3DTilt";
import { useEscapeClose } from "../../hooks/useEscapeClose";
import { AnimateIn } from "../shared/AnimateIn";
import { ShareSheet } from "../shared/ShareSheet";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface DetailSheetProps {
  card?: Card;
  onClose: () => void;
  isPeer?: boolean;
  cards?: Card[];
  initialIndex?: number;
  onEdit?: (card: Card) => void;
  onDelete?: (id: number) => void;
}

export function DetailSheet({ card, onClose, isPeer = false, cards = [], initialIndex = 0, onEdit, onDelete }: DetailSheetProps) {
  useEscapeClose(onClose);
  const [idx, setIdx] = useState(initialIndex);
  const current = cards.length > 0 ? cards[idx] : card!;
  const gradeColor = GRADER_COLOR[current.grader] || "#111";
  const tilt = use3DTilt();
  const [sharing, setSharing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const touchStartX = useRef(0);
  const onTouchStart = (e: ReactTouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: ReactTouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 50 || cards.length < 2) return;
    if (dx < 0 && idx < cards.length - 1) setIdx(i => i + 1);
    if (dx > 0 && idx > 0) setIdx(i => i - 1);
  };

  const canManage = !isPeer && (onEdit || onDelete);
  const editDeleteDelay = current.subGrades ? 320 : 240;
  const actionsDelay = current.subGrades ? (canManage ? 400 : 320) : (canManage ? 320 : 240);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <div
          className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg"
          style={{ maxHeight: "92vh" }}
          onClick={e => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex justify-center pt-3 md:hidden">
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>
          <div className="flex items-center justify-between px-5 pt-2 pb-0">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            {cards.length > 1 && (
              <div className="flex items-center gap-1">
                {cards.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: i === idx ? "#111" : "#e0e0e0", width: i === idx ? 16 : 6 }} />
                ))}
              </div>
            )}
            <div className="w-8" />
          </div>

          <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 64px)", scrollbarWidth: "none" }}>
            <AnimateIn delay={0}>
            <div className="flex justify-center mb-6 mt-4" style={{ perspective: "800px" }}>
              <div
                ref={tilt.ref}
                style={{ ...tilt.style, transformStyle: "preserve-3d", willChange: "transform", width: "58%" }}
                onMouseMove={tilt.onMouseMove}
                onMouseLeave={tilt.onMouseLeave}
                className="relative overflow-hidden"
              >
                {current.img
                  ? <img src={current.img} alt={current.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                  : <div className="w-full flex flex-col items-center justify-center gap-1 px-2" style={{ background: gradeColor, aspectRatio: "2.5/3.5" }}>
                      <span className="text-white font-semibold text-xs text-center">{current.player}</span>
                      <span className="text-white font-black text-2xl">{current.grade}</span>
                      <span className="text-white/70 text-[10px]">{current.grader}</span>
                    </div>
                }
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.2) 0%, transparent 65%)" }} />
              </div>
            </div>
            </AnimateIn>

            <AnimateIn delay={80}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 leading-tight">{current.player}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{current.year} {current.brand} · {current.team}</p>
                {current.autograph && (
                  <span className="inline-block mt-1.5 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Autograph</span>
                )}
              </div>
              <div className="flex flex-col items-center px-3.5 py-2 rounded-2xl" style={{ background: gradeColor }}>
                <span className="text-2xl font-bold text-white leading-none">{current.grade}</span>
                <span className="text-[9px] font-semibold tracking-widest text-white/70 mt-0.5 uppercase">{current.grader}</span>
              </div>
            </div>
            </AnimateIn>

            <AnimateIn delay={160}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Est. Value</p>
                  <p className="text-[9px] text-gray-400">eBay</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">${current.value.toLocaleString()}</p>
                {current.change !== 0 ? (
                  <div className={`flex items-center gap-1 mt-1.5 px-2 py-1 rounded-lg w-fit ${current.change > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                      {current.change > 0
                        ? <path d="M5 8V2M2 5l3-3 3 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        : <path d="M5 2v6M2 5l3 3 3-3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                    </svg>
                    <span className={`text-[10px] font-bold ${current.change > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {current.change > 0 ? "+" : ""}{current.change}% 30d
                    </span>
                  </div>
                ) : <p className="text-[10px] text-gray-300 mt-1">No change</p>}
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Condition</p>
                <p className="text-sm font-semibold text-gray-800">{current.gradeLabel}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Grader</p>
                <p className="text-sm font-semibold text-gray-800">{current.grader}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Cert #</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{current.cert}</p>
              </div>

              {current.popReport && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                  <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Pop Report</p>
                  <p className="text-sm font-semibold text-gray-800">{current.popReport.toLocaleString()}</p>
                </div>
              )}

              {current.sellPrice && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Sell Price</p>
                    <p className="text-[9px] text-gray-400">Fanatics</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">${current.sellPrice.toLocaleString()}</p>
                </div>
              )}
            </div>
            </AnimateIn>

            {current.subGrades && (
            <AnimateIn delay={240}>
              <div className="rounded-2xl border border-gray-100 px-4 py-3.5 mb-4">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Sub-grades</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {Object.entries(current.subGrades!).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-base font-semibold text-gray-900">{v}</p>
                      <p className="text-[9px] text-gray-400 capitalize mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
            )}

            {canManage && (
              <AnimateIn delay={editDeleteDelay}>
                <div className="flex gap-2 mb-2">
                  {onEdit && (
                    <button onClick={() => onEdit(current)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />Edit
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => setConfirmingDelete(true)} className="flex-1 py-3 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold flex items-center justify-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  )}
                </div>
              </AnimateIn>
            )}

            <AnimateIn delay={actionsDelay}>
            <div className="flex gap-2">
              <button onClick={() => setSharing(true)} className="flex-1 py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold flex items-center justify-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />Share
              </button>
              <button className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Shop</button>
            </div>
            </AnimateIn>
          </div>
        </div>
      </div>

      {sharing && (
        <ShareSheet
          title={`${current.player} — ${current.year} ${current.brand}`}
          subtitle={`${current.grader} ${current.grade} · Est. $${current.value.toLocaleString()}`}
          onClose={() => setSharing(false)}
        />
      )}

      {confirmingDelete && onDelete && (
        <ConfirmDialog
          title="Delete this card?"
          message={`This removes ${current.player} (${current.year}) from your collection and any folders it's in. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => { onDelete(current.id); setConfirmingDelete(false); onClose(); }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
