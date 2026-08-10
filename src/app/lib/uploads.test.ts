import { describe, it, expect, vi } from "vitest";

// uploads.ts imports the real client, which throws at import time without env vars.
vi.mock("./supabase", () => ({ supabase: { storage: { from: () => ({}) } } }));

import { decodeImageDataUrl } from "./uploads";

/** 1x1 transparent PNG. */
const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AL+ZgAAAABJRU5ErkJggg==";

describe("decodeImageDataUrl", () => {
  it("decodes a base64 image into a typed Blob", () => {
    const { blob, mime } = decodeImageDataUrl(PNG_1PX);
    expect(mime).toBe("image/png");
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("accepts the JPEG the card scanner produces", () => {
    const jpeg = `data:image/jpeg;base64,${btoa("not-a-real-jpeg-but-bytes-are-bytes")}`;
    expect(decodeImageDataUrl(jpeg).mime).toBe("image/jpeg");
  });

  it("rejects a mime type the bucket does not allow", () => {
    // The bucket's allowed_mime_types would reject this too; failing here gives
    // a message a user can act on.
    const gif = `data:image/gif;base64,${btoa("gif89a")}`;
    expect(() => decodeImageDataUrl(gif)).toThrow(/JPEG, PNG, or WebP/);
  });

  it("rejects a non-image payload disguised as a data URL", () => {
    const svg = `data:image/svg+xml;base64,${btoa("<svg onload=alert(1)>")}`;
    expect(() => decodeImageDataUrl(svg)).toThrow(/JPEG, PNG, or WebP/);
  });

  it("rejects something that isn't a data URL at all", () => {
    expect(() => decodeImageDataUrl("https://example.com/card.png")).toThrow(/could not be read/);
    expect(() => decodeImageDataUrl("")).toThrow(/could not be read/);
  });

  it("rejects an image past the bucket's 8 MB limit", () => {
    // 9 MB of base64-encoded zero bytes.
    const oversized = `data:image/png;base64,${"A".repeat(12 * 1024 * 1024)}`;
    expect(() => decodeImageDataUrl(oversized)).toThrow(/8 MB/);
  });
});
