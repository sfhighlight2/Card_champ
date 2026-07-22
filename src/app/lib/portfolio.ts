import type { Card } from "../types";

// A collection with no history can't chart a real trend, so 30-day change
// is derived from each card's stored 30-day change: value 30 days ago =
// value / (1 + change/100). Shared by the profile header and InsightsView
// so both agree on the same number.
export function computePortfolioChangePct(cards: Card[]): number {
  const totalValue = cards.reduce((s, c) => s + c.value, 0);
  const startValue = cards.reduce((s, c) => s + c.value / (1 + c.change / 100), 0);
  return startValue > 0 ? ((totalValue - startValue) / startValue) * 100 : 0;
}
