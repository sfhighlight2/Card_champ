import type { LevelInfo } from "../../lib/level";
import { TIER_LABELS, TIER_BADGE_ART } from "../../lib/level";
import { badgePro, badgeBronze, badgeHof } from "../../data/cardImages";

const BADGE_ART = { bronze: badgeBronze, pro: badgePro, hof: badgeHof };

const GLARE = "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.75) 55%, transparent 80%)";

/**
 * Status coins beneath the profile avatar.
 *
 * Nothing renders until something has been earned. This previously drew both
 * coins unconditionally, so a brand-new account with zero achievements was shown
 * a PRO membership coin and a tier coin it had not earned — and the tier coin
 * always used the bronze artwork regardless of the actual tier, so reaching gold
 * or platinum changed only the tooltip.
 */
export function TierMedallions({ levelInfo, size = 52 }: { levelInfo: LevelInfo; size?: number }) {
  // Bronze at zero is a starting position, not an award.
  if (!levelInfo.hasEarnedTier) {
    return (
      <span className="text-[13px] font-bold text-slate-400">
        {levelInfo.level}/{levelInfo.maxLevel}
      </span>
    );
  }

  const tierArt = BADGE_ART[TIER_BADGE_ART[levelInfo.tier]];
  const tierLabel = `${TIER_LABELS[levelInfo.tier]} tier`;

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
        <span className="text-[13px] font-bold tracking-wider" style={{ color: "#b49b32" }}>PRO</span>
      )}

      <div className="flex items-center">
        {/* The PRO coin is its own award, shown only at gold or better. */}
        {levelInfo.isPro && (
          <Medallion src={badgePro} label="PRO membership" size={size} zIndex={1} />
        )}
        <Medallion
          src={tierArt}
          label={tierLabel}
          size={size}
          zIndex={2}
          overlap={levelInfo.isPro}
          glareDelay="0.6s"
        />
      </div>

      <span className="text-[13px] font-bold text-slate-500">{levelInfo.level}/{levelInfo.maxLevel}</span>
    </div>
  );
}

function Medallion({
  src, label, size, zIndex, overlap = false, glareDelay = "0s",
}: {
  src: string;
  label: string;
  size: number;
  zIndex: number;
  overlap?: boolean;
  glareDelay?: string;
}) {
  return (
    <div
      className="relative flex-shrink-0 rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        zIndex,
        marginLeft: overlap ? -size * 0.08 : 0,
        boxShadow: "0 0 0 3px #fff, 0 4px 10px rgba(0,0,0,0.18)",
      }}
    >
      <img src={src} alt={label} title={label} className="w-full h-full object-contain rounded-full bg-white" draggable={false} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: GLARE, animation: `medallionGlare 8.8s ease-in-out infinite ${glareDelay}` }}
      />
    </div>
  );
}
