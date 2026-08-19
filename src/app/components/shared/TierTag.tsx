import { Crown, Star, Trophy } from "lucide-react";
import type { LevelInfo, Tier } from "../../lib/level";
import gemBronze from "@/imports/gem-bronze.png";
import gemSilver from "@/imports/gem-silver.png";
import gemGold from "@/imports/gem-gold.png";
import gemDiamond from "@/imports/gem-diamond.png";
import medalBronze from "@/imports/medal-bronze.png";
import medalSilver from "@/imports/medal-silver.png";
import medalGold from "@/imports/medal-gold.png";
import medalDiamond from "@/imports/medal-diamond.png";

/** Laurel-wreath medals (Figma "gem" art) — the big medal under an avatar. */
export const TIER_LAUREL: Record<Tier, string> = {
  bronze: gemBronze,
  silver: gemSilver,
  gold: gemGold,
  platinum: gemDiamond,
};

/** Plain coin medals — small tier badges on peer avatars and award strips. */
export const TIER_COIN: Record<Tier, string> = {
  bronze: medalBronze,
  silver: medalSilver,
  gold: medalGold,
  platinum: medalDiamond,
};

export type TierTagLabel = "HOF" | "PRO" | "RKE";

/** Nothing until a tier is actually earned — a brand-new account shows no mark. */
export function tierTagLabel(levelInfo: LevelInfo): TierTagLabel | null {
  if (!levelInfo.hasEarnedTier) return null;
  if (levelInfo.tier === "platinum") return "HOF";
  if (levelInfo.tier === "gold") return "PRO";
  return "RKE";
}

/**
 * The PRO / HOF / RKE mark from the Figma tag spec: a tiny icon beside
 * gradient text (cyan for PRO, purple for HOF, mint for RKE).
 */
export function TierTag({ levelInfo, className = "" }: { levelInfo: LevelInfo; className?: string }) {
  const tag = tierTagLabel(levelInfo);
  if (!tag) return null;

  const icon =
    tag === "HOF" ? <Crown className="w-3 h-3" style={{ color: "#f2c14e", fill: "#f2c14e" }} />
    : tag === "PRO" ? <Star className="w-3 h-3" style={{ color: "#75ebf7", fill: "#75ebf7" }} />
    : <Trophy className="w-3 h-3" style={{ color: "#f6c57a" }} />;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {icon}
      <span className={`tier-tag tier-tag-${tag.toLowerCase()} text-xs`}>{tag}</span>
    </span>
  );
}
