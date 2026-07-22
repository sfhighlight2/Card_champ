import { useId } from "react";

interface LevelRingAvatarProps {
  avatar: string;
  name: string;
  size?: number;
  xpFraction: number;
}

// Shared by the profile header and the Profile detail page so the XP ring
// treatment stays identical in both places.
export function LevelRingAvatar({ avatar, name, size = 128, xpFraction }: LevelRingAvatarProps) {
  const gradientId = `levelRingGradient-${useId()}`;
  const r = size / 2 - 4;
  const inset = size * 0.0625;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f0" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - xpFraction)}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a84c" /><stop offset="100%" stopColor="#e8c96e" />
          </linearGradient>
        </defs>
      </svg>
      <img
        src={avatar} alt={name} className="absolute rounded-full object-cover"
        style={{ top: inset, left: inset, width: size - inset * 2, height: size - inset * 2 }}
        draggable={false}
      />
    </div>
  );
}
