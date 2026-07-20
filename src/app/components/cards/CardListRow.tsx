import { ChevronRight } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";

interface CardListRowProps {
  card: Card;
  onClick: () => void;
  selectMode?: boolean;
  selected?: boolean;
}

export function CardListRow({ card, onClick, selectMode = false, selected = false }: CardListRowProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 py-2.5 focus:outline-none" style={{ opacity: selectMode && !selected ? 0.55 : 1 }}>
      {selectMode && (
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: selected ? "#111" : "transparent", border: selected ? "none" : "1.5px solid #d1d5db" }}>
          {selected && (
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}
      <img src={card.img} alt={card.player} className="w-11 flex-shrink-0" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{card.player}</p>
        <p className="text-xs text-gray-400 mt-0.5">{card.year} · {card.brand} · {card.team}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: GRADER_COLOR[card.grader] || "#111" }}>
          {card.grader} {card.grade}
        </span>
        <span className="text-sm font-semibold text-gray-800">${card.value.toLocaleString()}</span>
      </div>
      {!selectMode && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
    </button>
  );
}
