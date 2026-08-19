import { useState } from "react";
import type { Card } from "../../types";
import { gradingColor, isGraded } from "../../lib/grading";
import { use3DTilt } from "../../hooks/use3DTilt";

interface CardTileProps {
  card: Card;
  onClick: () => void;
  index?: number;
  selectMode?: boolean;
  selected?: boolean;
}

export function CardTile({ card, onClick, index = 0, selectMode = false, selected = false }: CardTileProps) {
  const tilt = use3DTilt();
  const [pressed, setPressed] = useState(false);
  // Signed image URLs have a finite TTL; if one dies before the query refetches
  // it, the tile falls back to the grader-coloured placeholder instead of a
  // broken-image glyph. Keyed to the exact URL so a fresh signed URL retries.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const img = card.img && card.img !== failedSrc ? card.img : "";

  /**
   * Opens immediately.
   *
   * This used to start a 450ms flip animation and only call `onClick` from
   * `onAnimationEnd`, so every single card tap paid that delay before anything
   * happened — and the flip was hidden behind the detail sheet anyway. A brief
   * press-in gives the same tactile feedback without standing between the user
   * and the card they asked for.
   */
  const handleClick = () => {
    if (!selectMode) {
      setPressed(true);
      setTimeout(() => setPressed(false), 140);
    }
    onClick();
  };

  return (
    <>
      <style>{`
        @keyframes cardEnter { 0%{opacity:0;transform:perspective(600px) translateY(48px) rotateX(24deg) scale(0.92)} 100%{opacity:1;transform:perspective(600px) translateY(0) rotateX(0deg) scale(1)} }
      `}</style>
      <button
        onClick={handleClick}
        className="focus:outline-none w-full"
        style={{ perspective: "600px", animation: `cardEnter 0.6s cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${Math.min(index, 8) * 60}ms` }}
      >
        <div
          ref={tilt.ref}
          style={{
            ...tilt.style,
            transformStyle: "preserve-3d",
            willChange: "transform",
            outline: selectMode && selected ? "2px solid #dce4f6" : "2px solid transparent",
            outlineOffset: 2,
            opacity: selectMode && !selected ? 0.55 : 1,
            scale: pressed ? "0.96" : "1",
            // Appended to the tilt's own transition rather than replacing it —
            // overriding it made the hover tilt snap instead of ease.
            transition: [tilt.style.transition, "scale 140ms cubic-bezier(0.22,1,0.36,1)"]
              .filter(Boolean)
              .join(", "),
          }}
          onMouseMove={tilt.onMouseMove}
          onMouseLeave={tilt.onMouseLeave}
          className="relative w-full overflow-hidden"
        >
        {img
          ? <img src={img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#1d2534" }} draggable={false} onError={() => setFailedSrc(img)} />
          : <div className="w-full flex flex-col items-center justify-center gap-1 px-1" style={{ background: gradingColor(card), aspectRatio: "2.5/3.5" }}>
              <span className="text-white font-semibold text-[10px] text-center leading-tight">{card.player}</span>
              <span className="text-white/70 text-[9px]">{card.year}</span>
              {isGraded(card) ? (
                <>
                  <span className="text-white font-black text-xl leading-none">{card.grade}</span>
                  <span className="text-white/70 text-[9px]">{card.grader}</span>
                </>
              ) : (
                <span className="text-white/80 font-bold text-[10px] tracking-widest uppercase">Raw</span>
              )}
            </div>
        }
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.18) 0%, transparent 65%)" }} />
        {selectMode && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: selected ? "#1d2e4e" : "rgba(255,255,255,0.85)", border: selected ? "none" : "1.5px solid #4a5c82" }}>
            {selected && (
              <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
        </div>
      </button>
    </>
  );
}
