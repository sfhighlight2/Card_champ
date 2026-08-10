import type { Card } from "../types";

export type SortKey = "recent" | "oldest" | "value-desc" | "value-asc" | "gain-desc" | "name" | "year";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recently added" },
  { key: "oldest", label: "Oldest added" },
  { key: "value-desc", label: "Highest value" },
  { key: "value-asc", label: "Lowest value" },
  { key: "gain-desc", label: "Highest gain" },
  { key: "name", label: "Player name" },
  { key: "year", label: "Year" },
];

export interface CardFilters {
  query?: string;
  autographOnly?: boolean;
  gemsOnly?: boolean;
}

/** Grades the "Gems" filter treats as gem/mint+. */
const GEM_GRADES = new Set(["10", "9.5"]);

export function filterCards(cards: Card[], filters: CardFilters): Card[] {
  const q = filters.query?.trim().toLowerCase() ?? "";
  return cards.filter(c => {
    if (filters.autographOnly && !c.autograph) return false;
    if (filters.gemsOnly && !GEM_GRADES.has(c.grade)) return false;
    if (!q) return true;
    return (
      c.player.toLowerCase().includes(q) ||
      c.year.includes(q) ||
      c.team.toLowerCase().includes(q)
    );
  });
}

/**
 * Returns a sorted copy, never mutating the input.
 *
 * "recent"/"oldest" sort on `createdAt`. They used to sort on a numeric id,
 * which UUIDs made meaningless — a lexicographic UUID order has nothing to do
 * with when a card was added.
 */
export function sortCards(cards: Card[], sortBy: SortKey): Card[] {
  const sorted = [...cards];
  switch (sortBy) {
    case "value-desc": sorted.sort((a, b) => b.value - a.value); break;
    case "value-asc": sorted.sort((a, b) => a.value - b.value); break;
    case "gain-desc": sorted.sort((a, b) => b.change - a.change); break;
    case "name": sorted.sort((a, b) => a.player.localeCompare(b.player)); break;
    case "year": sorted.sort((a, b) => a.year.localeCompare(b.year)); break;
    case "oldest": sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
    case "recent": sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
  }
  return sorted;
}
