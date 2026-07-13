import { useRef, useEffect } from "react";
import type { CSSProperties } from "react";

interface ScrollPickerProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  width?: string;
}

export function ScrollPicker({ items, value, onChange, width }: ScrollPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ITEM_H = 44;

  useEffect(() => {
    const idx = items.indexOf(value);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H;
    }
  }, []);

  const onScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (items[clamped] && items[clamped] !== value) onChange(items[clamped]);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ height: ITEM_H * 5, width: width || "100%" }}>
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: "linear-gradient(to bottom, #fff 20%, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: "linear-gradient(to top, #fff 20%, transparent)" }} />
      <div className="absolute left-0 right-0 z-0 rounded-xl" style={{ top: ITEM_H * 2, height: ITEM_H, background: "#f4f4f5" }} />
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as CSSProperties}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map(item => (
          <div
            key={item}
            onClick={() => { onChange(item); if (ref.current) ref.current.scrollTop = items.indexOf(item) * ITEM_H; }}
            style={{ height: ITEM_H, scrollSnapAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: item === value ? 600 : 400, color: item === value ? "#111" : "#aaa", cursor: "pointer", userSelect: "none", transition: "color 0.15s, font-weight 0.15s", fontFamily: "'Google Sans', sans-serif" }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}
