import type { ReactNode } from "react";
import { Crown, Triangle } from "lucide-react";
import type { LevelInfo } from "../../lib/level";
import { TIER_GRADIENTS, TIER_LABELS } from "../../lib/level";

// A single premium "coin" medallion: metallic base with a glossy top
// highlight and an inset rim, so it reads as a 3D minted coin rather than
// a flat chip.
function Coin({ gradient, children, title, size = 52 }: { gradient: string; children: ReactNode; title: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center relative flex-shrink-0"
      title={title}
      style={{
        width: size,
        height: size,
        background: gradient,
        border: "3px solid #fff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.18), inset 0 -2px 4px rgba(0,0,0,0.25), inset 0 2px 3px rgba(255,255,255,0.55)",
      }}
    >
      {/* glossy top highlight */}
      <span
        className="absolute rounded-full pointer-events-none"
        style={{ top: 4, left: "50%", transform: "translateX(-50%)", width: size * 0.6, height: size * 0.34, background: "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0))" }}
      />
      {children}
    </div>
  );
}

const GOLD = "radial-gradient(circle at 50% 30%, #f4dd97 0%, #e8c96e 45%, #b8903c 100%)";

// The two overlapping status coins (membership crown + achievement tier)
// that straddle the bottom edge of the profile avatar.
export function TierMedallions({ levelInfo, size = 52 }: { levelInfo: LevelInfo; size?: number }) {
  const iconSize = size * 0.42;
  return (
    <div className="flex items-center" style={{ gap: 6 }}>
      {levelInfo.isPro && (
        <span className="text-xs font-black tracking-widest" style={{ color: "#b8903c" }}>PRO</span>
      )}
      <div className="flex items-center">
        <div className="relative" style={{ zIndex: 2 }}>
          <Coin gradient={GOLD} title="PRO membership" size={size}>
            <Crown style={{ width: iconSize, height: iconSize }} className="text-white relative" />
          </Coin>
        </div>
        <div className="relative" style={{ zIndex: 1, marginLeft: -size * 0.3 }}>
          <Coin gradient={TIER_GRADIENTS[levelInfo.tier]} title={`${TIER_LABELS[levelInfo.tier]} tier`} size={size}>
            <Triangle style={{ width: iconSize * 0.9, height: iconSize * 0.9 }} className="text-white relative" fill="currentColor" />
          </Coin>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-400">{levelInfo.level}/{levelInfo.maxLevel}</span>
    </div>
  );
}
