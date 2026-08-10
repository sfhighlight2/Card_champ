import { X, Heart, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { MarketListing } from "../../types";
import { useCardMarketDetail } from "../../data/useMarket";
import { gradingBadge, gradingColor } from "../../lib/grading";
import { formatDollars } from "../../lib/format";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface MarketCardDetailSheetProps {
  listing: MarketListing;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
}

export function MarketCardDetailSheet({
  listing, onClose, isWatchlisted, onToggleWatchlist,
}: MarketCardDetailSheetProps) {
  useEscapeClose(onClose);

  // Real snapshots and comps, loaded only when a listing is opened.
  const { priceHistory, recentSales, isLoading } = useCardMarketDetail(listing.catalogCardId);

  const badgeColor = gradingColor({ grader: listing.grader, grade: listing.grade });
  const up = (listing.change ?? 0) >= 0;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="app-sheet mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "90dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="flex items-start justify-between px-6 pt-4 pb-3">
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">{listing.title}</h2>
            {/* Native listings have no provider — they ARE Card Champs listings,
                and used to be mislabeled "an external marketplace". */}
            <p className="text-xs text-gray-400 mt-1">
              Listed on {listing.sourceType === "external" ? (listing.source || "an external marketplace") : "Card Champs"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: "calc(90dvh - 90px)", scrollbarWidth: "none" }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: badgeColor }}>
              {gradingBadge({ grader: listing.grader, grade: listing.grade })}
            </span>
            <span className="text-2xl font-bold text-gray-900">{formatDollars(listing.price)}</span>
            {listing.change !== undefined && (
              <span className={`flex items-center gap-0.5 text-sm font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
                {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {up ? "+" : ""}{listing.change}%
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
            </div>
          ) : (
            <>
              {priceHistory.length > 1 ? (
                <div className="rounded-3xl bg-gray-950 p-5 mb-4">
                  <p className="text-[10px] font-medium text-white/50 tracking-widest uppercase mb-3">Price history</p>
                  <ResponsiveContainer width="100%" height={110}>
                    <AreaChart data={priceHistory} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="marketTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="d" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <Tooltip
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Price"]}
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", background: "#fff", color: "#111" }}
                        labelStyle={{ color: "#9ca3af" }}
                      />
                      <Area type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2} fill="url(#marketTrendFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-4">
                  Not enough price history recorded for this card yet.
                </p>
              )}

              {recentSales.length > 0 && (
                <div className="rounded-3xl border border-gray-100 p-5 mb-4">
                  <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Recent sales</p>
                  <div className="flex flex-col divide-y divide-gray-50">
                    {recentSales.map((sale, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">${sale.price.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{sale.source}</p>
                        </div>
                        <span className="text-xs text-gray-400">{sale.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={onToggleWatchlist}
              disabled={!listing.catalogCardId}
              className="flex-1 py-3.5 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
              style={{
                borderColor: isWatchlisted ? "#dc2626" : "#e5e7eb",
                color: isWatchlisted ? "#dc2626" : "#374151",
              }}
            >
              <Heart className="w-3.5 h-3.5" style={{ fill: isWatchlisted ? "#dc2626" : "none" }} />
              {isWatchlisted ? "Watching" : "Watch"}
            </button>

            {/* External listings are the only real way to transact today, so the
                primary action is the seller's own page rather than a Buy button
                this app cannot honour. */}
            {listing.externalUrl && (
              <a
                href={listing.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on {listing.source || "site"}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
