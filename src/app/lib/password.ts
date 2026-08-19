/**
 * Client-side mirror of the Supabase password policy (dashboard-configured):
 * at least 8 characters with one lowercase letter, one uppercase letter, one
 * digit, and one symbol.
 *
 * The client used to check only `length >= 6`, so a password like
 * "nabilflores1" sailed past the form and died server-side as an HTTP 422 —
 * which the error humanizer then swallowed into "Could not create the
 * account." A real signup was lost to that pairing.
 */

/** Shown under password fields before the user has typed anything. */
export const PASSWORD_HINT = "8+ characters, with an uppercase letter, a number, and a symbol.";

/** The symbol set the server policy accepts. */
const SYMBOLS = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

function listOut(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Null when the password satisfies the policy; otherwise a message naming
 * exactly what's missing — never a generic "too weak".
 */
export function passwordPolicyError(password: string): string | null {
  const missing: string[] = [];
  if (!/[a-z]/.test(password)) missing.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) missing.push("an uppercase letter");
  if (!/[0-9]/.test(password)) missing.push("a number");
  if (!SYMBOLS.test(password)) missing.push("a symbol");
  const tooShort = password.length < 8;

  if (!tooShort && missing.length === 0) return null;
  if (tooShort && missing.length > 0) {
    return `Passwords need at least 8 characters, plus ${listOut(missing)}.`;
  }
  if (tooShort) return "Passwords need at least 8 characters.";
  return `Add ${listOut(missing)}.`;
}
