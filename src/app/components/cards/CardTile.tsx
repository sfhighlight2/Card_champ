import { useState } from "react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";
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
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    if (selectMode) { onClick(); return; }
    if (spinning) return;
    setSpinning(true);
  };

  return (
    <>
      <style>{`
        @keyframes cardFlip { 0%{transform:perspective(600px) rotateY(0deg) scale(1)} 50%{transform:perspective(600px) rotateY(180deg) scale(1.06)} 100%{transform:perspective(600px) rotateY(360deg) scale(1)} }
        @keyframes cardEnter { 0%{opacity:0;transform:perspective(600px) translateY(48px) rotateX(24deg) scale(0.92)} 100%{opacity:1;transform:perspective(600px) translateY(0) rotateX(0deg) scale(1)} }
      `}</style>
      <button
        onClick={handleClick}
        className="focus:outline-none w-full"
        style={{ perspective: "600px", animation: `cardEnter 0.6s cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${index * 70}ms` }}
      >
        <div
          ref={spinning ? undefined : tilt.ref}
          style={spinning
            ? { animation: "cardFlip 0.45s cubic-bezier(0.4,0,0.2,1) forwards", willChange: "transform" }
            : { ...tilt.style, transformStyle: "preserve-3d", willChange: "transform", outline: selectMode && selected ? "2px solid #111" : "2px solid transparent", outlineOffset: 2, opacity: selectMode && !selected ? 0.55 : 1 }
          }
          onMouseMove={spinning ? undefined : tilt.onMouseMove}
          onMouseLeave={spinning ? undefined : tilt.onMouseLeave}
          onAnimationEnd={() => { setSpinning(false); onClick(); }}
          className="relative w-full overflow-hidden"
        >
        {card.img
          ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
          : <div className="w-full flex flex-col items-center justify-center gap-1 px-1" style={{ background: GRADER_COLOR[card.grader] || "#888", aspectRatio: "2.5/3.5" }}>
              <span className="text-white font-semibold text-[10px] text-center leading-tight">{card.player}</span>
              <span className="text-white/70 text-[9px]">{card.year}</span>
              <span className="text-white font-black text-xl leading-none">{card.grade}</span>
              <span className="text-white/70 text-[9px]">{card.grader}</span>
            </div>
        }
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.18) 0%, transparent 65%)" }} />
        {selectMode && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: selected ? "#111" : "rgba(255,255,255,0.85)", border: selected ? "none" : "1.5px solid #d1d5db" }}>
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
