// Compact "1.2K" style formatting, shared by the profile header's follower
// count and the Profile detail page's stat row.
export function formatCompact(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}K` : `${n}`;
}
