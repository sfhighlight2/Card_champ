import type { LevelInfo } from "../../lib/level";
import { TIER_LABELS } from "../../lib/level";
import { badgePro, badgeBronze } from "../../data/cardImages";

// The two overlapping status coins (membership crown + achievement tier)
// that straddle the bottom edge of the profile avatar. Rendered from the
// pre-designed badge artwork rather than CSS shapes.
export function TierMedallions({ levelInfo, size = 52 }: { levelInfo: LevelInfo; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <style>{`
        @keyframes medallionGlare {
          0%, 70% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
          75% { opacity: 0.7; }
          85% { opacity: 0.95; }
          90%, 100% { transform: translateX(220%) skewX(-25deg); opacity: 0; }
        }
      `}</style>
      {levelInfo.isPro && (
        <span className="text-[13px] font-bold tracking-wider" style={{ color: "#b45309" }}>PRO</span>
      )}
      <div className="flex items-center">
        <div
          className="relative flex-shrink-0 rounded-full overflow-hidden"
          style={{ width: size, height: size, zIndex: 2, boxShadow: "0 0 0 3px #fff, 0 4px 10px rgba(0,0,0,0.18)" }}
        >
          <img
            src={badgePro}
            alt="PRO membership"
            title="PRO membership"
            className="w-full h-full object-contain rounded-full bg-white"
            draggable={false}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.75) 55%, transparent 80%)",
              animation: "medallionGlare 5.8s ease-in-out infinite",
            }}
          />
        </div>
        <div
          className="relative flex-shrink-0 rounded-full overflow-hidden"
          style={{ width: size, height: size, zIndex: 1, marginLeft: -size * 0.08, boxShadow: "0 0 0 3px #fff, 0 4px 10px rgba(0,0,0,0.18)" }}
        >
          <img
            src={badgeBronze}
            alt={`${TIER_LABELS[levelInfo.tier]} tier`}
            title={`${TIER_LABELS[levelInfo.tier]} tier`}
            className="w-full h-full object-contain rounded-full bg-white"
            draggable={false}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.75) 55%, transparent 80%)",
              animation: "medallionGlare 5.8s ease-in-out infinite 0.4s",
            }}
          />
        </div>
      </div>
      <span className="text-[13px] font-bold text-slate-500">{levelInfo.level}/{levelInfo.maxLevel}</span>
    </div>
  );
}
