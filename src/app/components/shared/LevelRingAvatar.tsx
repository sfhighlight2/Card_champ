import { useId, useEffect, useState } from "react";

interface LevelRingAvatarProps {
  avatar: string;
  name: string;
  size?: number;
  xpFraction: number;
}

// Shared by the profile header and the Profile detail page so the XP ring
// treatment stays identical in both places. The progress arc animates up
// from empty on mount and keeps a soft breathing glow.
export function LevelRingAvatar({ avatar, name, size = 128, xpFraction }: LevelRingAvatarProps) {
  const gradientId = `levelRingGradient-${useId()}`;
  const r = size / 2 - 4;
  const inset = size * 0.0625;
  const c = 2 * Math.PI * r;

  const [fill, setFill] = useState(0);
  useEffect(() => {
    // Start empty, then animate to the real value on the next frame so the
    // CSS transition on stroke-dashoffset actually plays.
    const id = requestAnimationFrame(() => setFill(xpFraction));
    return () => cancelAnimationFrame(id);
  }, [xpFraction]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <style>{`@keyframes levelRingGlow { 0%,100%{opacity:0.8} 50%{opacity:1} }`}</style>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f0" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - fill)}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
            animation: "levelRingGlow 2.6s ease-in-out infinite",
            filter: "drop-shadow(0 0 3px rgba(201,168,76,0.55))",
          }}
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
