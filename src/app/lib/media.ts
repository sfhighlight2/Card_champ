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
 * Resolves a stored image reference to something an <img src> can use.
 * Returns "" for a missing reference so callers can fall back to a placeholder.
 */
export function resolveImage(path: string | null | undefined, bucket = "card-images"): string {
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
