import { useRef, useState, useCallback, useEffect } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";

export function use3DTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  const applyTilt = useCallback((clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setStyle({
      transform: `perspective(600px) rotateX(${(y - 0.5) * -20}deg) rotateY(${(x - 0.5) * 20}deg) scale3d(1.04,1.04,1.04)`,
      transition: "transform 0.05s ease",
      "--glare-x": `${Math.round(x * 100)}%`,
      "--glare-y": `${Math.round(y * 100)}%`,
    } as CSSProperties);
  }, []);

  const resetTilt = useCallback(() => {
    setStyle({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)", transition: "transform 0.4s ease" });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      applyTilt(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => resetTilt();
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [applyTilt, resetTilt]);

  const onMouseMove = useCallback((e: ReactMouseEvent) => applyTilt(e.clientX, e.clientY), [applyTilt]);
  const onMouseLeave = useCallback(() => resetTilt(), [resetTilt]);

  return { ref, style, onMouseMove, onMouseLeave };
}
