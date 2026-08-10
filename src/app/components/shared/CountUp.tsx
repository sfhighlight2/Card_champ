import { useState, useEffect, useRef } from "react";

interface CountUpProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function CountUp({ to, duration = 1000, prefix = "", suffix = "" }: CountUpProps) {
  const [value, setValue] = useState(0);
  // The value currently on screen, so a change animates from where the number
  // already is. Restarting from zero — the old behaviour — made the header roll
  // "$0 → $8,542" after every single edit, since any mutation refreshes stats.
  const displayed = useRef(0);

  useEffect(() => {
    const from = displayed.current;
    if (from === to) return;

    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (to - from) * eased);
      displayed.current = next;
      setValue(next);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return <>{prefix}{value.toLocaleString()}{suffix}</>;
}
