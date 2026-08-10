// Compact "1.2K" style formatting, shared by the profile header's follower
// count and the Profile detail page's stat row.
export function formatCompact(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}K` : `${n}`;
}

/** Dollar amounts: whole dollars stay clean ("$1,250"), fractional amounts get
 *  both cent digits ("$12.50") — bare `toLocaleString()` rendered "$12.5". */
export function formatDollars(v: number): string {
  const fractional = !Number.isInteger(v);
  return `$${v.toLocaleString(undefined, {
    minimumFractionDigits: fractional ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
