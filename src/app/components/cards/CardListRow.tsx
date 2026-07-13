import { ChevronRight } from "lucide-react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";

interface CardListRowProps {
  card: Card;
  onClick: () => void;
}

export function CardListRow({ card, onClick }: CardListRowProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 py-2.5 focus:outline-none">
      <img src={card.img} alt={card.player} className="w-11 flex-shrink-0" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{card.player}</p>
        <p className="text-xs text-gray-400 mt-0.5">{card.year} · {card.brand} · {card.team}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: GRADER_COLOR[card.grader] || "#111" }}>
          {card.grader} {card.grade}
        </span>
        <span className="text-sm font-semibold text-gray-800">${card.value}</span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
    </button>
  );
}
