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
  isPro: boolean;
}

export const MAX_LEVEL = 10;

export function computeLevel(achievementsEarned: number): LevelInfo {
  const level = Math.max(0, Math.min(achievementsEarned, MAX_LEVEL));
  const tier: Tier = level >= 9 ? "platinum" : level >= 6 ? "gold" : level >= 3 ? "silver" : "bronze";
  return { level, maxLevel: MAX_LEVEL, xpFraction: level / MAX_LEVEL, tier, isPro: achievementsEarned >= 1 };
}

export const TIER_GRADIENTS: Record<Tier, string> = {
  bronze: "linear-gradient(135deg, #b5793f 0%, #d99f5f 50%, #a06830 100%)",
  silver: "linear-gradient(135deg, #9ca3af 0%, #e5e7eb 50%, #8a919e 100%)",
  gold: "linear-gradient(135deg, #c9a84c 0%, #e8c96e 50%, #b8903c 100%)",
  platinum: "linear-gradient(135deg, #7c8ce0 0%, #b5a6f7 50%, #6a7ad4 100%)",
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
