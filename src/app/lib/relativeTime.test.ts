import { describe, it, expect } from "vitest";
import { relativeTime } from "./relativeTime";

describe("relativeTime", () => {
  const now = 1_700_000_000_000;

  it("shows 'now' for under a minute", () => {
    expect(relativeTime(now - 20_000, now)).toBe("now");
  });
  it("shows minutes under an hour", () => {
    expect(relativeTime(now - 45 * 60_000, now)).toBe("45m");
  });
  it("shows hours under a day", () => {
    expect(relativeTime(now - 5 * 3_600_000, now)).toBe("5h");
  });
  it("shows days under a week", () => {
    expect(relativeTime(now - 3 * 86_400_000, now)).toBe("3d");
  });
  it("shows weeks beyond that", () => {
    expect(relativeTime(now - 20 * 86_400_000, now)).toBe("3w");
  });
  it("never goes negative for a future timestamp", () => {
    expect(relativeTime(now + 60_000, now)).toBe("now");
  });
});
