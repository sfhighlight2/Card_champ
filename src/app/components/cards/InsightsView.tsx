import { useMemo } from "react";
import { TrendingUp, TrendingDown, Award, PenLine, Layers } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Card } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";
import { CountUp } from "../shared/CountUp";
import { AnimateIn } from "../shared/AnimateIn";

interface InsightsViewProps {
  cards: Card[];
}

// A collection with no history can't chart a real trend, so we derive a
// plausible 30-day portfolio curve from each card's stored 30-day change:
// value 30 days ago = value / (1 + change/100). Points between are eased,
// with a small deterministic wiggle (no per-render randomness).
function buildTrend(cards: Card[]): { d: string; v: number }[] {
  const now = cards.reduce((s, c) => s + c.value, 0);
  const start = cards.reduce((s, c) => s + c.value / (1 + c.change / 100), 0);
  const points = 12;
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const eased = 1 - Math.pow(1 - t, 2);
    const wiggle = Math.sin(i * 1.7) * (now - start) * 0.04;
    const v = start + (now - start) * eased + (i === 0 || i === points - 1 ? 0 : wiggle);
    const daysAgo = Math.round(30 - t * 30);
    return { d: daysAgo === 0 ? "Now" : `${daysAgo}d`, v: Math.max(0, Math.round(v)) };
  });
}

export function InsightsView({ cards }: InsightsViewProps) {
  const { totalValue, startValue, changePct, trend, byGrader, movers, autos, gems, avgValue } = useMemo(() => {
    const totalValue = cards.reduce((s, c) => s + c.value, 0);
    const startValue = cards.reduce((s, c) => s + c.value / (1 + c.change / 100), 0);
    const changePct = startValue > 0 ? ((totalValue - startValue) / startValue) * 100 : 0;

    const graderMap = new Map<string, number>();
    for (const c of cards) graderMap.set(c.grader, (graderMap.get(c.grader) ?? 0) + c.value);
    const byGrader = [...graderMap.entries()]
      .map(([grader, value]) => ({ grader, value }))
      .sort((a, b) => b.value - a.value);

    const movers = [...cards].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
    const autos = cards.filter(c => c.autograph).length;
    const gems = cards.filter(c => c.grade === "10" || c.grade === "9.5").length;
    const avgValue = cards.length ? Math.round(totalValue / cards.length) : 0;

    return { totalValue, startValue, changePct, trend: buildTrend(cards), byGrader, movers, autos, gems, avgValue };
  }, [cards]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center text-center pt-16 px-7">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <TrendingUp className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-900">No insights yet</p>
        <p className="text-sm text-gray-400 mt-1 max-w-[240px]">Add a few cards and your collection analytics will appear here.</p>
      </div>
    );
  }

  const up = changePct >= 0;
  const maxGrader = byGrader[0]?.value ?? 1;

  return (
    <div className="flex-1 px-7 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
      {/* Portfolio value + trend */}
      <AnimateIn>
        <div className="rounded-3xl bg-gray-950 text-white p-5 mb-4">
          <p className="text-[10px] font-medium text-white/50 tracking-widest uppercase mb-1">Portfolio value</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold leading-none">$<CountUp to={totalValue} duration={1000} /></p>
            <span className={`text-sm font-semibold mb-0.5 flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
              {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {up ? "+" : ""}{changePct.toFixed(1)}% · 30d
            </span>
          </div>
          <div className="mt-4 -mx-1">
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} interval={2} />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", background: "#fff", color: "#111" }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Area type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2} fill="url(#trendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AnimateIn>

      {/* Quick stats */}
      <AnimateIn delay={60}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Cards", value: cards.length, icon: Layers },
            { label: "Autos", value: autos, icon: PenLine },
            { label: "Gem/Mint+", value: gems, icon: Award },
          ].map(s => (
            <div key={s.label} className="rounded-2xl bg-gray-50 p-3.5">
              <s.icon className="w-4 h-4 text-gray-400 mb-2" />
              <p className="text-xl font-bold text-gray-900 leading-none"><CountUp to={s.value} duration={800} /></p>
              <p className="text-[11px] text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </AnimateIn>

      {/* Value by grader */}
      <AnimateIn delay={120}>
        <div className="rounded-3xl border border-gray-100 p-5 mb-4">
          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-4">Value by grader</p>
          <div className="flex flex-col gap-3">
            {byGrader.map(g => (
              <div key={g.grader}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{g.grader}</span>
                  <span className="text-xs font-semibold text-gray-900">${g.value.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(g.value / maxGrader) * 100}%`, background: GRADER_COLOR[g.grader] || "#111" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimateIn>

      {/* Top movers */}
      <AnimateIn delay={180}>
        <div className="rounded-3xl border border-gray-100 p-5">
          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Top movers · 30d</p>
          <div className="flex flex-col divide-y divide-gray-50">
            {movers.map(c => {
              const cUp = c.change > 0, flat = c.change === 0;
              return (
                <div key={c.id} className="flex items-center gap-3 py-2.5">
                  {c.img
                    ? <img src={c.img} alt="" className="w-8 h-10 object-contain rounded bg-gray-50 flex-shrink-0" draggable={false} />
                    : <div className="w-8 h-10 rounded flex-shrink-0" style={{ background: GRADER_COLOR[c.grader] || "#888" }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.player}</p>
                    <p className="text-xs text-gray-400">{c.year} · {c.grader} {c.grade}</p>
                  </div>
                  <span className={`text-sm font-semibold ${cUp ? "text-emerald-500" : flat ? "text-gray-400" : "text-red-400"}`}>
                    {cUp ? "+" : ""}{c.change}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AnimateIn>
    </div>
  );
}
