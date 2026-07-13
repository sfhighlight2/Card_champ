import { Heart } from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { MarketItem } from "../../types";
import { GRADER_COLOR } from "../../data/mockCards";

interface MarketCardDetailSheetProps {
  item: MarketItem;
  onClose: () => void;
  onBuy: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
}

export function MarketCardDetailSheet({ item, onClose, onBuy, isWatchlisted, onToggleWatchlist }: MarketCardDetailSheetProps) {
  const gradeColor = GRADER_COLOR[item.grader] || "#111";
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="overflow-y-auto pb-10" style={{ maxHeight: "calc(90vh - 20px)", scrollbarWidth: "none" }}>
          <div className="flex justify-center px-6 pt-4 pb-4 relative">
            <img src={item.img} alt={item.player} className="w-40" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
            <button
              onClick={onToggleWatchlist}
              className="absolute top-4 right-6 w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center"
            >
              <Heart className="w-4 h-4" style={{ fill: isWatchlisted ? "#dc2626" : "none", color: isWatchlisted ? "#dc2626" : "#9ca3af" }} />
            </button>
          </div>
          <div className="flex items-start justify-between px-6 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{item.player}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{item.year} · {item.brand}</p>
            </div>
            <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl flex-shrink-0" style={{ background: gradeColor }}>
              <span className="text-xl font-bold text-white leading-none">{item.grade}</span>
              <span className="text-[9px] font-bold tracking-widest text-white/70 uppercase">{item.grader}</span>
            </div>
          </div>
          <div className="mx-6 rounded-2xl bg-gray-50 px-4 py-3.5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Price</p>
                <p className="text-2xl font-bold text-gray-900">${item.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 mb-0.5">Source</p>
                <p className="text-xs font-semibold text-gray-700">{item.source}</p>
                <span className={`text-xs font-semibold ${item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-400" : "text-gray-400"}`}>
                  {item.change > 0 ? "+" : ""}{item.change}% 30d
                </span>
              </div>
            </div>
          </div>
          <div className="mx-6 rounded-2xl border border-gray-100 px-4 pt-3.5 pb-2 mb-4">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Price History · {item.source}</p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={item.priceHistory}>
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Price"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f0f0f0" }} />
                <Line type="monotone" dataKey="v" stroke="#111" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mx-6 mb-5">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Recent Sales</p>
            {item.recentSales.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < item.recentSales.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                <p className="text-xs text-gray-500">{s.date}</p>
                <p className="text-xs text-gray-400">{s.source}</p>
                <p className="text-sm font-semibold text-gray-900">${s.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 px-6">
            <button onClick={onBuy} className="flex-1 py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Buy · {item.source}</button>
            <button className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}
