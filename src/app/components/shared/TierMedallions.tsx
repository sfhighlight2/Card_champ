import type { LevelInfo } from "../../lib/level";
import { TIER_LABELS } from "../../lib/level";
import { badgePro, badgeBronze } from "../../data/cardImages";

// The two overlapping status coins (membership crown + achievement tier)
// that straddle the bottom edge of the profile avatar. Rendered from the
// pre-designed badge artwork rather than CSS shapes.
export function TierMedallions({ levelInfo, size = 52 }: { levelInfo: LevelInfo; size?: number }) {
  return (
    <div className="flex items-center" style={{ gap: 6 }}>
      {levelInfo.isPro && (
        <span className="text-xs font-black tracking-widest" style={{ color: "#b8903c" }}>PRO</span>
      )}
      <div className="flex items-center">
        <img
          src={badgePro}
          alt="PRO membership"
          title="PRO membership"
          className="relative flex-shrink-0 object-contain rounded-full bg-white"
          style={{ width: size, height: size, minWidth: size, zIndex: 2, boxShadow: "0 0 0 3px #fff, 0 3px 6px rgba(0,0,0,0.24)" }}
          draggable={false}
        />
        <img
          src={badgeBronze}
          alt={`${TIER_LABELS[levelInfo.tier]} tier`}
          title={`${TIER_LABELS[levelInfo.tier]} tier`}
          className="relative flex-shrink-0 object-contain rounded-full bg-white"
          style={{ width: size, height: size, minWidth: size, zIndex: 1, marginLeft: -size * 0.3, boxShadow: "0 0 0 3px #fff, 0 3px 6px rgba(0,0,0,0.24)" }}
          draggable={false}
        />
      </div>
      <span className="text-xs font-semibold text-gray-400">{levelInfo.level}/{levelInfo.maxLevel}</span>
    </div>
  );
}
