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

  // Deliberately no touch handling. The previous version listened for touchmove
  // with preventDefault, which hijacked the scroll gesture: a drag that began on
  // a card tile tilted the card instead of scrolling the page, and the grid
  // covers most of the screen — so on a phone the collection barely scrolled at
  // all. Tilt is a hover flourish; it belongs to pointers that can hover.

  const onMouseMove = useCallback((e: ReactMouseEvent) => applyTilt(e.clientX, e.clientY), [applyTilt]);
  const onMouseLeave = useCallback(() => resetTilt(), [resetTilt]);

  return { ref, style, onMouseMove, onMouseLeave };
}
