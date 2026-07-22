import { describe, it, expect } from "vitest";
import { computeLevel, MAX_LEVEL, tierBadgeLabel } from "./level";

describe("computeLevel", () => {
  it("matches the design reference: 3 achievements -> level 3/10", () => {
    const info = computeLevel(3);
    expect(info.level).toBe(3);
    expect(info.maxLevel).toBe(MAX_LEVEL);
    expect(info.xpFraction).toBeCloseTo(0.3);
  });

  it("is not pro with zero achievements", () => {
    expect(computeLevel(0).isPro).toBe(false);
  });

  it("becomes pro after the first achievement", () => {
    expect(computeLevel(1).isPro).toBe(true);
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
