import { describe, it, expect } from "vitest";
import { authorBadgeFor } from "./community";

describe("authorBadgeFor", () => {
  // The prototype looked each author's badge up in a hand-written per-handle
  // map; it is now derived from achievements the server recorded, on the same
  // thresholds the current user's own badge uses.
  it("gives no badge below the gold tier", () => {
    expect(authorBadgeFor(0)).toBeNull();
    expect(authorBadgeFor(3)).toBeNull();
    expect(authorBadgeFor(5)).toBeNull();
  });

  it("gives PRO at the gold tier", () => {
    expect(authorBadgeFor(6)).toBe("PRO");
    expect(authorBadgeFor(8)).toBe("PRO");
  });

  it("gives HOF at the platinum tier", () => {
    expect(authorBadgeFor(9)).toBe("HOF");
    expect(authorBadgeFor(10)).toBe("HOF");
  });

  it("does not exceed HOF past the level cap", () => {
    expect(authorBadgeFor(99)).toBe("HOF");
  });
});
