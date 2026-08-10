/**
 * Turns a database or storage error into something worth showing a user.
 *
 * Writes previously surfaced `err.message` straight into a toast, so a failed
 * save read as
 *
 *   new row for relation "folders" violates check constraint "folders_color_check"
 *
 * which tells the user nothing they can act on and leaks schema detail. The
 * original is still logged for debugging; only the display text changes.
 */

interface MaybePostgrestError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/** Constraint-specific wording, since the constraint name says exactly what broke. */
const BY_CONSTRAINT: Record<string, string> = {
  profiles_handle_key: "That handle is already taken.",
  profiles_handle_format: "Handles use 3–30 lowercase letters, numbers, or underscores.",
  profiles_display_name_check: "Your name needs to be between 1 and 60 characters.",
  profiles_bio_check: "That bio is too long — 200 characters maximum.",
  profiles_chasing_check: "That's too long — 200 characters maximum.",
  profiles_collecting_since_check: "Enter a year between 1850 and 2200.",
  folders_color_check: "That folder colour isn't valid.",
  folders_name_check: "Folder names need to be between 1 and 80 characters.",
  card_copies_grade_check: "Grades run from 0 to 10.",
  card_copies_raw_year_check: "Enter a year between 1850 and 2200.",
  card_copies_has_identity: "A card needs at least a player name.",
  card_copy_valuations_amount_minor_check: "A value can't be negative.",
  folder_copies_pkey: "That card is already in this folder.",
};

/** Postgres SQLSTATE fallbacks when the constraint isn't one we know by name. */
const BY_CODE: Record<string, string> = {
  "23505": "That already exists.",
  "23514": "Some of those details aren't valid.",
  "23503": "That refers to something that no longer exists.",
  "42501": "You don't have permission to do that.",
  "22023": "Some of those details aren't valid.",
  "55000": "That's no longer available.",
  P0002: "That couldn't be found.",
};

/** Storage errors arrive as plain messages rather than SQLSTATEs. */
function storageMessage(raw: string): string | null {
  const lower = raw.toLowerCase();
  if (lower.includes("mime type")) return "That file type isn't supported — use a JPEG, PNG, or WebP image.";
  if (lower.includes("exceeded the maximum allowed size") || lower.includes("payload too large")) {
    return "That image is too large.";
  }
  if (lower.includes("duplicate") && lower.includes("resource")) return "That file already exists.";
  return null;
}

export function humanizeError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;

  const err = error as MaybePostgrestError;
  const raw = typeof err.message === "string" ? err.message : String(error);

  // Keep the real thing reachable — the point is to stop showing it, not to lose it.
  console.error("[cardchamps] operation failed:", error);

  const storage = storageMessage(raw);
  if (storage) return storage;

  // Constraint names appear in the message text, not a dedicated field.
  const haystack = `${raw} ${err.details ?? ""}`;
  for (const [constraint, message] of Object.entries(BY_CONSTRAINT)) {
    if (haystack.includes(constraint)) return message;
  }

  if (err.code && BY_CODE[err.code]) return BY_CODE[err.code];

  // Messages raised deliberately by our own RPCs are already written for people
  // ("Sign in to buy", "You cannot buy your own listing"), so they pass through.
  // Anything mentioning schema internals does not.
  const looksInternal =
    /relation |constraint |column |violates |syntax error|permission denied for|jwt|postgrest/i.test(raw);
  if (!looksInternal && raw.length > 0 && raw.length <= 120) return raw;

  return fallback;
}
