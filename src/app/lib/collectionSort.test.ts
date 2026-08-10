import { describe, it, expect } from "vitest";
import { filterCards, sortCards } from "./collectionSort";
import type { Card } from "../types";

function card(over: Partial<Card> & { id: string }): Card {
  return {
    img: "", player: "Player", year: "1986", brand: "Topps", team: "Royals",
    grader: "PSA", grade: "9", gradeLabel: "Mint", cert: "1", value: 100,
    change: 0, subGrades: null, autograph: false,
    createdAt: "2026-01-01T00:00:00.000Z", catalogCardId: null,
    ...over,
  };
}

describe("sortCards", () => {
  // The UUID flip is exactly why these two sorts moved off the id: a
  // lexicographic UUID order has nothing to do with when a card was added.
  const oldest = card({ id: "ffffffff-0000-0000-0000-000000000000", player: "Oldest", createdAt: "2026-01-01T00:00:00.000Z" });
  const middle = card({ id: "00000000-0000-0000-0000-000000000000", player: "Middle", createdAt: "2026-06-01T00:00:00.000Z" });
  const newest = card({ id: "88888888-0000-0000-0000-000000000000", player: "Newest", createdAt: "2026-08-01T00:00:00.000Z" });
  const all = [middle, oldest, newest];

  it("orders 'recent' newest first, regardless of id ordering", () => {
    expect(sortCards(all, "recent").map(c => c.player)).toEqual(["Newest", "Middle", "Oldest"]);
  });

  it("orders 'oldest' oldest first, regardless of id ordering", () => {
    expect(sortCards(all, "oldest").map(c => c.player)).toEqual(["Oldest", "Middle", "Newest"]);
  });

  it("does not mutate the input array", () => {
    const input = [middle, oldest, newest];
    sortCards(input, "recent");
    expect(input.map(c => c.player)).toEqual(["Middle", "Oldest", "Newest"]);
  });

  it("sorts by value in both directions", () => {
    const cards = [card({ id: "a", value: 50 }), card({ id: "b", value: 500 }), card({ id: "c", value: 5 })];
    expect(sortCards(cards, "value-desc").map(c => c.value)).toEqual([500, 50, 5]);
    expect(sortCards(cards, "value-asc").map(c => c.value)).toEqual([5, 50, 500]);
  });

  it("sorts by 30-day gain, keeping losses last", () => {
    const cards = [card({ id: "a", change: -4 }), card({ id: "b", change: 22 }), card({ id: "c", change: 0 })];
    expect(sortCards(cards, "gain-desc").map(c => c.change)).toEqual([22, 0, -4]);
  });
});

describe("filterCards", () => {
  const auto = card({ id: "a", player: "Gary Nolan", team: "Angels", year: "1978", autograph: true, grade: "9" });
  const gem = card({ id: "b", player: "Bo Jackson", team: "Royals", year: "1986", grade: "10" });
  const mintPlus = card({ id: "c", player: "Shohei Ohtani", team: "Dodgers", year: "2022", grade: "9.5" });
  const plain = card({ id: "d", player: "Don Baylor", team: "Orioles", year: "1975", grade: "1" });
  const all = [auto, gem, mintPlus, plain];

  it("returns everything when no filters are set", () => {
    expect(filterCards(all, {})).toHaveLength(4);
  });

  it("matches the query against player, year, and team", () => {
    expect(filterCards(all, { query: "ohtani" }).map(c => c.id)).toEqual(["c"]);
    expect(filterCards(all, { query: "1975" }).map(c => c.id)).toEqual(["d"]);
    expect(filterCards(all, { query: "royals" }).map(c => c.id)).toEqual(["b"]);
  });

  it("ignores a whitespace-only query", () => {
    expect(filterCards(all, { query: "   " })).toHaveLength(4);
  });

  it("keeps only autographs", () => {
    expect(filterCards(all, { autographOnly: true }).map(c => c.id)).toEqual(["a"]);
  });

  it("treats 10 and 9.5 as gems, and nothing else", () => {
    expect(filterCards(all, { gemsOnly: true }).map(c => c.id)).toEqual(["b", "c"]);
  });

  it("applies query and filters together", () => {
    expect(filterCards(all, { query: "bo", gemsOnly: true }).map(c => c.id)).toEqual(["b"]);
    expect(filterCards(all, { query: "bo", autographOnly: true })).toEqual([]);
  });
});
