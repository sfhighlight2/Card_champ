import { useState } from "react";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";
import { use3DTilt } from "../../hooks/use3DTilt";

interface CardTileProps {
  card: Card;
  onClick: () => void;
  index?: number;
}

export function CardTile({ card, onClick, index = 0 }: CardTileProps) {
  const tilt = use3DTilt();
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
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
            : { ...tilt.style, transformStyle: "preserve-3d", willChange: "transform" }
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
        </div>
      </button>
    </>
  );
}
