import { useId, useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "./Avatar";

interface LevelRingAvatarProps {
  avatar: string;
  name: string;
  size?: number;
  xpFraction: number;
  tier?: "bronze" | "silver" | "gold" | "platinum";
  /** When given, the whole avatar becomes a button — on the dashboard it
   *  opens the profile page. */
  onPress?: () => void;
  /** Shows the camera affordance, so it is discoverable that the avatar is
   *  tappable rather than decoration. */
  showCameraBadge?: boolean;
  /** When given, the camera badge is its own tap target (change the photo)
   *  separate from the avatar itself (open the profile). */
  onCameraPress?: () => void;
}

const TIER_STOPS: Record<"bronze" | "silver" | "gold" | "platinum", { start: string; end: string }> = {
  bronze: { start: "#a05a2c", end: "#e09e67" },
  silver: { start: "#71717a", end: "#e4e4e7" },
  gold: { start: "#b45309", end: "#f59e0b" },
  platinum: { start: "#6366f1", end: "#a5b4fc" },
};

// Shared by the profile header, Profile detail page, and Peers list so the XP ring
// treatment stays identical in both places. The progress arc animates up
// from empty on mount and keeps a soft breathing glow.
export function LevelRingAvatar({ avatar, name, size = 128, xpFraction, tier, onPress, showCameraBadge = false, onCameraPress }: LevelRingAvatarProps) {
  const gradientId = `levelRingGradient-${useId()}`;
  const stroke = size >= 120 ? 8 : 6;
  const r = size / 2 - stroke / 2 - 1;
  const inset = size * 0.07;
  const c = 2 * Math.PI * r;

  const [fill, setFill] = useState(0);
  useEffect(() => {
    // Start empty, then animate to the real value on the next frame so the
    // CSS transition on stroke-dashoffset actually plays.
    const id = requestAnimationFrame(() => setFill(xpFraction));
    return () => cancelAnimationFrame(id);
  }, [xpFraction]);

  const stops = TIER_STOPS[tier || "gold"];

  const Root = onPress ? "button" : "div";

  return (
    <Root
      {...(onPress
        ? { onClick: onPress, type: "button" as const, "aria-label": `View ${name}'s profile` }
        : {})}
      className="relative block focus:outline-none"
      style={{ width: size, height: size }}
    >
      <style>{`@keyframes levelRingGlow { 0%,100%{opacity:0.85} 50%{opacity:1} }`}</style>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        {/* Track tuned for the navy ground rather than the old white page. */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(220,228,246,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - fill)}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
            animation: "levelRingGlow 2.6s ease-in-out infinite",
            filter: `drop-shadow(0 0 3px ${tier === "platinum" ? "rgba(99,102,241,0.45)" : tier === "silver" ? "rgba(113,113,122,0.45)" : tier === "bronze" ? "rgba(160,90,44,0.45)" : "rgba(180,83,9,0.45)"})`,
          }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stops.start} /><stop offset="100%" stopColor={stops.end} />
          </linearGradient>
        </defs>
      </svg>
      <Avatar
        src={avatar} name={name} size={size - inset * 2}
        className="absolute rounded-full object-cover"
        style={{
          top: inset, left: inset, width: size - inset * 2, height: size - inset * 2,
          boxShadow: "0 0 0 3px rgba(16,24,40,0.9), 0 4px 12px rgba(0,0,0,0.4)",
        }}
      />
      {showCameraBadge && (
        // span with role=button, not <button>: the avatar root is already a
        // button and buttons can't nest.
        <span
          {...(onCameraPress
            ? {
                role: "button" as const,
                tabIndex: 0,
                "aria-label": "Change profile picture",
                onClick: (e: ReactMouseEvent) => { e.stopPropagation(); onCameraPress(); },
                onKeyDown: (e: ReactKeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onCameraPress(); }
                },
              }
            : {})}
          className="absolute rounded-full bg-gray-950 flex items-center justify-center"
          style={{
            width: size * 0.24,
            height: size * 0.24,
            right: size * 0.02,
            bottom: size * 0.02,
            boxShadow: "0 0 0 3px rgba(16,24,40,0.9)",
          }}
        >
          <Camera style={{ width: size * 0.12, height: size * 0.12 }} className="text-white" />
        </span>
      )}
    </Root>
  );
}
