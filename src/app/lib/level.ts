// Collector level/tier, derived from real progress (achievements earned),
// not a cosmetic placeholder. One achievement = one level, capped at
// MAX_LEVEL — matches the design's "N/10" indicator exactly: the seeded
// guest collection earns first-card + first-folder + cards-10 = 3
// achievements on first load, i.e. "3/10".

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export interface LevelInfo {
  level: number;
  maxLevel: number;
  xpFraction: number;
  tier: Tier;
  /** Gold tier or better — the threshold the visible "PRO" mark uses. */
  isPro: boolean;
  /** Whether any tier has actually been reached. Bronze at zero achievements is
   *  a starting position, not an award, so it earns no badge. */
  hasEarnedTier: boolean;
}

/** Badge artwork per tier. Bronze and silver share the plainest coin; gold and
 *  platinum get the PRO and Hall of Fame marks. */
export const TIER_BADGE_ART: Record<Tier, "bronze" | "pro" | "hof"> = {
  bronze: "bronze",
  silver: "bronze",
  gold: "pro",
  platinum: "hof",
};

export const MAX_LEVEL = 10;

export function computeLevel(achievementsEarned: number): LevelInfo {
  const level = Math.max(0, Math.min(achievementsEarned, MAX_LEVEL));
  const tier: Tier = level >= 9 ? "platinum" : level >= 6 ? "gold" : level >= 3 ? "silver" : "bronze";
  return {
    level,
    maxLevel: MAX_LEVEL,
    xpFraction: level / MAX_LEVEL,
    tier,
    // A single achievement is not PRO standing. This gates on reaching the gold
    // tier, which is the same threshold tierBadgeLabel uses, so the "PRO" mark
    // means one thing everywhere it appears.
    isPro: level >= 6,
    /** False for a brand-new account: nothing has been earned, so nothing shows. */
    hasEarnedTier: level >= 3,
  };
}

export const TIER_GRADIENTS: Record<Tier, string> = {
  bronze: "linear-gradient(135deg, #b5793f 0%, #d99f5f 50%, #a06830 100%)",
  silver: "linear-gradient(135deg, #9ca3af 0%, #e5e7eb 50%, #8a919e 100%)",
  gold: "linear-gradient(135deg, #c9a84c 0%, #e8c96e 50%, #b8903c 100%)",
  platinum: "linear-gradient(135deg, #7c8ce0 0%, #b5a6f7 50%, #6a7ad4 100%)",
};

// SVG gradient stops for the level ring, per tier. The peers list used to key a
// hardcoded colour off each mock handle; this derives it from real standing.
export const TIER_RING_STOPS: Record<Tier, { start: string; end: string }> = {
  bronze: { start: "#b5793f", end: "#d99f5f" },
  silver: { start: "#64748b", end: "#94a3b8" },
  gold: { start: "#c45a09", end: "#f6c57a" },
  platinum: { start: "#7c3aed", end: "#a78bfa" },
};

export const TIER_LABELS: Record<Tier, string> = {
  bronze: "Rookie",
  silver: "Collector",
  gold: "Pro",
  platinum: "Hall of Fame",
};

// Portfolio momentum for the second (triangle) medallion: green/up when the
// collection's 30-day value trend is positive, red/down otherwise. Mirrors
// the change% math already used in InsightsView.
export function momentumColor(changePct: number): string {
  return changePct >= 0 ? "#10b981" : "#ef4444";
}

// Small tier badge shown next to an author's name in Community — only
// gold/platinum tiers earn a visible badge, matching how PRO already only
// shows once the profile header's own tier reaches that level.
export function tierBadgeLabel(tier: Tier): "PRO" | "HOF" | null {
  return tier === "platinum" ? "HOF" : tier === "gold" ? "PRO" : null;
}
