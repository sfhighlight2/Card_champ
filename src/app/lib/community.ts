import { computeLevel, tierBadgeLabel } from "./level";

/**
 * An author's tier badge, derived from the achievements they have actually
 * earned.
 *
 * The prototype resolved authors against a mock peer roster and looked their
 * badge up in a hand-written per-handle map. Posts now carry their author's
 * identity and achievement count from the `community_feed` view, so every
 * author's badge is derived the same way the current user's own is — nobody's
 * standing is seeded flavour.
 */
export function authorBadgeFor(achievementsEarned: number): "PRO" | "HOF" | null {
  return tierBadgeLabel(computeLevel(achievementsEarned).tier);
}
