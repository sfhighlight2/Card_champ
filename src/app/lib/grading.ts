import type { Card } from "../types";
import { GRADER_COLOR } from "../data/cardFields";

/**
 * Presentation for graded vs. raw cards.
 *
 * The add-card wizard used to require a grader, a grade, and a certificate
 * number before it would let you continue, so an ungraded card — most of most
 * collections — could not be added at all. Those fields are optional now, which
 * means every place that rendered `{card.grader} {card.grade}` had to stop
 * producing an empty badge.
 */

/** Neutral slate for raw cards, so they read as deliberate rather than broken. */
export const RAW_COLOR = "#64748b";

export const RAW_LABEL = "Raw";

export function isGraded(card: Pick<Card, "grader" | "grade">): boolean {
  return card.grader.trim().length > 0 && card.grade.trim().length > 0;
}

/** Badge colour for a card, falling back to the raw slate. */
export function gradingColor(card: Pick<Card, "grader" | "grade">): string {
  if (!isGraded(card)) return RAW_COLOR;
  return GRADER_COLOR[card.grader] || "#111111";
}

/** Short badge text: "PSA 10", or "Raw" when ungraded. */
export function gradingBadge(card: Pick<Card, "grader" | "grade">): string {
  if (!isGraded(card)) return RAW_LABEL;
  return `${card.grader} ${card.grade}`;
}

/** Longer form used in share text and subtitles. */
export function gradingSummary(card: Pick<Card, "grader" | "grade" | "gradeLabel">): string {
  if (!isGraded(card)) return "Ungraded";
  return card.gradeLabel ? `${card.grader} ${card.grade} · ${card.gradeLabel}` : `${card.grader} ${card.grade}`;
}
