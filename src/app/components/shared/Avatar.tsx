import type { CSSProperties } from "react";

/**
 * An avatar that degrades to initials instead of a broken image.
 *
 * A freshly signed-up account has no `avatar_path`, so `resolveAvatar` returns
 * "" — and `<img src="">` renders the browser's broken-image glyph. Every avatar
 * in the app goes through here so a new user sees their initials until they
 * upload a picture.
 */

// Muted, deliberately un-branded. Picked by hashing the name so a given
// collector keeps the same colour everywhere they appear.
const PLACEHOLDER_COLORS = [
  { bg: "#e8eaf0", fg: "#5b6478" },
  { bg: "#e6efe9", fg: "#4a6b57" },
  { bg: "#f1e9e4", fg: "#7a6252" },
  { bg: "#e9e7f2", fg: "#5d5680" },
  { bg: "#f2ece0", fg: "#7a6a45" },
  { bg: "#e4eef2", fg: "#4d6875" },
];

export function avatarInitials(name: string): string {
  const cleaned = name.replace(/^@/, "").trim();
  if (!cleaned) return "?";

  const words = cleaned.split(/[\s_.-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

interface AvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  style?: CSSProperties;
  /** Rendered pixel size, used only to scale the initials. */
  size?: number;
}

export function Avatar({ src, name, className, style, size = 40 }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={className}
        style={style}
        draggable={false}
      />
    );
  }

  const { bg, fg } = colorFor(name);
  return (
    <div
      className={`flex items-center justify-center select-none ${className ?? ""}`}
      style={{ ...style, background: bg, color: fg }}
      role="img"
      aria-label={name}
      title={name}
    >
      <span style={{ fontSize: Math.max(9, Math.round(size * 0.38)), fontWeight: 700, letterSpacing: "0.02em" }}>
        {avatarInitials(name)}
      </span>
    </div>
  );
}
