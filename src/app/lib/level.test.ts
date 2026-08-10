import { describe, it, expect } from "vitest";
import { computeLevel, MAX_LEVEL, tierBadgeLabel } from "./level";

describe("computeLevel", () => {
  it("matches the design reference: 3 achievements -> level 3/10", () => {
    const info = computeLevel(3);
    expect(info.level).toBe(3);
    expect(info.maxLevel).toBe(MAX_LEVEL);
    expect(info.xpFraction).toBeCloseTo(0.3);
  });

  // isPro used to be `achievementsEarned >= 1`, which showed the PRO mark to
  // anyone who had added a single card while tierBadgeLabel reserved it for
  // gold. Both now agree on the gold threshold.
  it.each([0, 1, 3, 5])("is not pro at %i achievements", n => {
    expect(computeLevel(n).isPro).toBe(false);
  });

  it.each([6, 9, 10])("is pro from the gold tier upward (%i)", n => {
    expect(computeLevel(n).isPro).toBe(true);
  });

  it("agrees with tierBadgeLabel about who is PRO", () => {
    for (let n = 0; n <= MAX_LEVEL; n++) {
      const info = computeLevel(n);
      expect(info.isPro).toBe(tierBadgeLabel(info.tier) !== null);
    }
  });

  // A brand-new account is bronze by default, which is a starting position
  // rather than an award, so it earns no badge.
  it.each([0, 1, 2])("has earned no tier at %i achievements", n => {
    expect(computeLevel(n).hasEarnedTier).toBe(false);
  });

  it.each([3, 6, 9])("has earned a tier from silver upward (%i)", n => {
    expect(computeLevel(n).hasEarnedTier).toBe(true);
  });

  it("caps level at MAX_LEVEL even with more achievements than that", () => {
    const info = computeLevel(25);
    expect(info.level).toBe(MAX_LEVEL);
    expect(info.xpFraction).toBe(1);
  });

  it("never goes negative", () => {
    expect(computeLevel(-5).level).toBe(0);
  });

  it.each([
    [0, "bronze"], [2, "bronze"],
    [3, "silver"], [5, "silver"],
    [6, "gold"], [8, "gold"],
    [9, "platinum"], [10, "platinum"],
  ] as const)("tier for level %i is %s", (n, tier) => {
    expect(computeLevel(n).tier).toBe(tier);
  });
});

describe("tierBadgeLabel", () => {
  it("shows no badge for bronze or silver", () => {
    expect(tierBadgeLabel("bronze")).toBeNull();
    expect(tierBadgeLabel("silver")).toBeNull();
  });
  it("shows PRO for gold, HOF for platinum", () => {
    expect(tierBadgeLabel("gold")).toBe("PRO");
    expect(tierBadgeLabel("platinum")).toBe("HOF");
  });
});
