import type { Card } from "../../types";
import { gradingColor } from "../../lib/grading";

/**
 * A small card image that always renders something identifiable: the photo
 * when there is one, otherwise the grader-coloured placeholder with the
 * player's name. Cards added without a photo have `img === ""`, and several
 * pickers used to render them as blank or broken-image buttons — impossible
 * to tell apart when choosing a card.
 */
export function CardThumb({ card, className = "w-full" }: { card: Card; className?: string }) {
  if (card.img) {
    return (
      <img
        src={card.img}
        alt={card.player}
        className={`${className} block`}
        style={{ objectFit: "contain", background: "#f4f4f5" }}
        draggable={false}
      />
    );
  }
  return (
    <div
      className={`${className} flex flex-col items-center justify-center gap-0.5 px-1`}
      style={{ background: gradingColor(card), aspectRatio: "2.5/3.5" }}
    >
      <span className="text-white text-[9px] font-semibold text-center leading-tight">{card.player}</span>
      {card.year && <span className="text-white/70 text-[8px]">{card.year}</span>}
    </div>
  );
}
