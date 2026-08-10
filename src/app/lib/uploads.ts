// Storage uploads for user-supplied images.
//
// Every user-writable bucket uses the `{user_id}/...` path convention, because
// the Storage policies check the first path segment against auth.uid(). A path
// that does not start with the caller's own id is rejected.

import { supabase } from "./supabase";

const CARD_IMAGES_BUCKET = "card-images";
const AVATARS_BUCKET = "avatars";

/** Mirrors the bucket's allowed_mime_types; rejecting here gives a better
 *  message than the storage API's own error. */
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 8 MB, matching the card-images bucket's file_size_limit. */
const MAX_BYTES = 8 * 1024 * 1024;

/** The avatars bucket is capped lower, at 2 MB. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

interface DecodedDataUrl {
  blob: Blob;
  mime: string;
}

/** Turns a `data:image/...;base64,...` URL into a Blob without a network round
 *  trip through fetch(). */
export function decodeImageDataUrl(dataUrl: string): DecodedDataUrl {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("That image could not be read.");

  const [, mime, isBase64, payload] = match;
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error(`Images must be JPEG, PNG, or WebP (got ${mime}).`);
  }

  let bytes: Uint8Array;
  if (isBase64) {
    const binary = atob(payload);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } else {
    bytes = new TextEncoder().encode(decodeURIComponent(payload));
  }

  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("That image is larger than the 8 MB limit.");
  }

  return { blob: new Blob([bytes], { type: mime }), mime };
}

/**
 * Uploads a captured card image and returns the Storage path to record in
 * `card_copy_media.storage_path`.
 *
 * Called before the `card_copies` row is inserted, so a failed upload leaves
 * nothing behind for the user to clean up — they simply retry. That is why the
 * filename is a fresh uuid rather than the copy id.
 */
export async function uploadCardImage(dataUrl: string, userId: string): Promise<string> {
  const { blob, mime } = decodeImageDataUrl(dataUrl);
  const path = `${userId}/${crypto.randomUUID()}.${EXTENSION[mime]}`;

  const { error } = await supabase.storage
    .from(CARD_IMAGES_BUCKET)
    .upload(path, blob, { contentType: mime, upsert: false });
  if (error) throw error;

  return path;
}

/**
 * Replaces the caller's profile picture and returns the path to store in
 * `profiles.avatar_path`.
 *
 * Each upload gets a fresh filename rather than overwriting a stable one. The
 * `avatars` bucket is public, so a stable name would keep returning the same
 * public URL and browsers would serve the old picture from cache indefinitely —
 * the new avatar simply would not appear. A new name sidesteps caching entirely.
 *
 * The previous object is then deleted on a best-effort basis: losing the cleanup
 * is a stray 2 MB file, whereas failing the whole operation would lose the user
 * their new picture for no good reason.
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  previousPath?: string | null
): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Profile pictures must be a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("That image is larger than the 2 MB limit for profile pictures.");
  }

  const path = `${userId}/${crypto.randomUUID()}.${EXTENSION[file.type]}`;
  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  // Only ever remove something inside the caller's own folder, and never a
  // bundled `local:` demo reference.
  if (previousPath && previousPath.startsWith(`${userId}/`)) {
    await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]).catch(() => {});
  }

  return path;
}
