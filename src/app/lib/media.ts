import {
  card1, card2, card3, card4, card5, card6,
  card7, card8, card9, card10, card11, card12,
  profilePic, loganPaul, barbaraCorcoran, garyVee, kevinOLeary,
} from "../data/cardImages";
import { supabase } from "./supabase";

// Demo rows store image references as `local:<key>` rather than a Storage
// path, so the seeded content renders from the bundled artwork without needing
// anything uploaded. Real user uploads store a genuine Storage path and fall
// through to the public-URL branch below.
const LOCAL_ASSETS: Record<string, string> = {
  card1, card2, card3, card4, card5, card6,
  card7, card8, card9, card10, card11, card12,
  profilePic, loganPaul, barbaraCorcoran, garyVee, kevinOLeary,
};

const LOCAL_PREFIX = "local:";

/**
 * True when a reference is a real Storage object path, rather than a bundled
 * `local:` asset, an inline data: URI, or an absolute URL.
 */
export function isStoragePath(path: string | null | undefined): path is string {
  if (!path) return false;
  return (
    !path.startsWith(LOCAL_PREFIX) &&
    !path.startsWith("http://") &&
    !path.startsWith("https://") &&
    !path.startsWith("data:")
  );
}

/**
 * Resolves a stored image reference to something an <img src> can use.
 * Returns "" for a missing reference so callers can fall back to a placeholder.
 *
 * Only valid for the PUBLIC buckets (`avatars`, `community-media`,
 * `catalog-media`). `card-images` is private — a collection is private by
 * default and its images must not be guessable by URL — so those paths need
 * `signCardImages` instead. Passing one here yields a URL that 403s.
 */
export function resolveImage(path: string | null | undefined, bucket = "catalog-media"): string {
  if (!path) return "";

  if (path.startsWith(LOCAL_PREFIX)) {
    return LOCAL_ASSETS[path.slice(LOCAL_PREFIX.length)] ?? "";
  }

  // Already a full URL or an inline data: URI (e.g. a fresh camera capture).
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export const resolveAvatar = (path: string | null | undefined): string =>
  resolveImage(path, "avatars");

/** Signed card-image URLs live an hour — comfortably longer than a session's
 *  worth of react-query caching, and short enough that a leaked link expires. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Batch-signs private card-image paths in one request and returns a
 * path → URL map. References that need no signing (bundled `local:` assets,
 * data: URIs, absolute URLs) are resolved directly into the same map, so
 * callers can look up every reference in one place.
 */
export async function signCardImages(
  paths: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const toSign = new Set<string>();

  for (const path of paths) {
    if (!path || resolved.has(path)) continue;
    if (isStoragePath(path)) toSign.add(path);
    else resolved.set(path, resolveImage(path));
  }

  if (toSign.size === 0) return resolved;

  const { data, error } = await supabase.storage
    .from("card-images")
    .createSignedUrls([...toSign], SIGNED_URL_TTL_SECONDS);

  // A signing failure should cost the images, not the whole collection read —
  // the tiles fall back to their grader-coloured placeholder.
  if (error || !data) return resolved;

  for (const entry of data) {
    if (entry.path && entry.signedUrl) resolved.set(entry.path, entry.signedUrl);
  }

  return resolved;
}
