import { useState } from "react";
import { TrendingUp, Tag, Search, Heart, X } from "lucide-react";
import type { Card, MarketItem, Listing } from "../../types";
import { MARKET_ITEMS } from "../../data/mockMarket";
import { AnimateIn } from "../shared/AnimateIn";
import { MarketCardDetailSheet } from "./MarketCardDetailSheet";
import { BuyConfirmSheet } from "./BuyConfirmSheet";

interface MarketTileProps {
  item: MarketItem;
  onSelect: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: () => void;
  size?: "grid" | "trending";
}

function MarketTile({ item, onSelect, isWatchlisted, onToggleWatchlist, size = "grid" }: MarketTileProps) {
  return (
    <div className={`relative ${size === "trending" ? "flex-shrink-0 w-32" : "w-full"} rounded-2xl overflow-hidden bg-gray-50`}>
      <button onClick={onSelect} className="w-full text-left focus:outline-none">
        <img src={item.img} alt={item.player} className="w-full" style={{ objectFit: "contain", background: "#f0f0f0" }} draggable={false} />
        <div className="px-2.5 py-2">
          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{item.player}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{item.year}{size === "grid" ? ` · ${item.brand}` : ""}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold text-gray-900">${item.price.toLocaleString()}</span>
            <span className={`text-[10px] font-semibold ${item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-400" : "text-gray-400"}`}>
              {item.change > 0 ? "+" : ""}{item.change !== 0 ? `${item.change}%` : "—"}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5">{item.source}</p>
        </div>
      </button>
      <button
        onClick={e => { e.stopPropagation(); onToggleWatchlist(); }}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center"
        aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Heart className="w-3 h-3" style={{ fill: isWatchlisted ? "#dc2626" : "none", color: isWatchlisted ? "#dc2626" : "#9ca3af" }} />
      </button>
    </div>
  );
}

interface MarketViewProps {
  allCards: Card[];
  listings: Listing[];
  watchlist: number[];
  onToggleWatchlist: (id: number) => void;
  onBuy: (item: MarketItem) => void;
  onUpdateListingStatus: (id: number, status: Listing["status"]) => void;
  onRemoveListing: (id: number) => void;
  initialTab?: "browse" | "watchlist" | "listings";
  initialQuery?: string;
}

export function MarketView({ allCards, listings, watchlist, onToggleWatchlist, onBuy, onUpdateListingStatus, onRemoveListing, initialTab, initialQuery }: MarketViewProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [marketTab, setMarketTab] = useState<"browse" | "watchlist" | "listings">(initialTab ?? "browse");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [buyingItem, setBuyingItem] = useState<MarketItem | null>(null);
  const isSearching = query.trim().length > 0;
  const spotlight = MARKET_ITEMS[0];

  const filtered = MARKET_ITEMS.filter(item =>
    item.player.toLowerCase().includes(query.toLowerCase()) ||
    item.year.includes(query) ||
    item.brand.toLowerCase().includes(query.toLowerCase())
  );

  const watchlistedItems = MARKET_ITEMS.filter(item => watchlist.includes(item.id));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-6 mb-4">
        {([
          { id: "browse", label: "Browse", icon: TrendingUp },
          { id: "watchlist", label: "Watchlist", icon: Heart },
          { id: "listings", label: "My Listings", icon: Tag },
        ] as { id: "browse" | "watchlist" | "listings"; label: string; icon: typeof TrendingUp }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMarketTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{ background: marketTab === id ? "#111" : "transparent", color: marketTab === id ? "#fff" : "#bbb" }}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {marketTab === "listings" && (
        <div className="flex-1 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Tag className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No listings yet</p>
              <p className="text-xs text-gray-300">Use the Sell button to list a card</p>
            </div>
          ) : (
            listings.map((listing, i) => {
              const listingCard = allCards.find(c => c.id === listing.cardId);
              if (!listingCard) return null;
              return (
                <AnimateIn key={listing.id} delay={i * 80}>
                <div className="flex items-center gap-3.5 py-3.5" style={{ borderBottom: "1px solid #f4f4f5" }}>
                  <img src={listingCard.img} alt={listingCard.player} className="w-12 flex-shrink-0"
                    style={{ objectFit: "contain", background: "#f4f4f5", opacity: listing.status === "sold" ? 0.45 : 1 }} draggable={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{listingCard.player}</p>
                      <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: listing.status === "active" ? "#f0fdf4" : "#f4f4f5", color: listing.status === "active" ? "#16a34a" : "#aaa" }}>
                        {listing.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{listingCard.year} · {listingCard.grader} {listingCard.grade}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{listing.views} views</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-base font-semibold text-gray-900">${listing.askingPrice.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">{listing.platform}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {listing.status === "active" && (
                        <button onClick={() => onUpdateListingStatus(listing.id, "sold")} className="text-[10px] font-semibold text-emerald-600">
                          Mark sold
                        </button>
                      )}
                      <button onClick={() => onRemoveListing(listing.id)} className="text-[10px] font-semibold text-gray-400">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                </AnimateIn>
              );
            })
          )}
        </div>
      )}

      {marketTab === "watchlist" && (
        <div className="flex-1 px-6 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
          {watchlistedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Heart className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">Your watchlist is empty</p>
              <p className="text-xs text-gray-300">Tap the heart on any card to save it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {watchlistedItems.map((item, i) => (
                <AnimateIn key={item.id} delay={i * 70}>
                  <MarketTile
                    item={item}
                    onSelect={() => setSelectedItem(item)}
                    isWatchlisted
                    onToggleWatchlist={() => onToggleWatchlist(item.id)}
                  />
                </AnimateIn>
              ))}
            </div>
          )}
        </div>
      )}

      {marketTab === "browse" && (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>

          {!isSearching && (
            <AnimateIn delay={0} className="px-6 mb-5">
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase text-center mb-3">Deal of the Day</p>
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #c9a84c 0%, #e8c96e 40%, #b8903c 100%)" }}>
                <button onClick={() => setSelectedItem(spotlight)} className="w-full focus:outline-none">
                  <div className="flex flex-col items-center px-5 pt-5 pb-4 text-center">
                    <img
                      src={spotlight.img}
                      alt={spotlight.player}
                      className="w-52 mb-4"
                      style={{ objectFit: "contain", background: "rgba(255,255,255,0.15)", borderRadius: 6 }}
                      draggable={false}
                    />
                    <p className="text-base font-bold text-white leading-tight">{spotlight.player}</p>
                    <p className="text-xs text-white/70 mt-0.5">{spotlight.year} · {spotlight.brand}</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className="text-2xl font-black text-white">${spotlight.price.toLocaleString()}</span>
                      <span className="text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">+{spotlight.change}%</span>
                    </div>
                    <p className="text-[10px] text-white/60 mt-1">Price source: {spotlight.source}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/90" style={{ background: "rgba(0,0,0,0.25)" }}>
                        {spotlight.grader} {spotlight.grade}
                      </span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onToggleWatchlist(spotlight.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center"
                  aria-label={watchlist.includes(spotlight.id) ? "Remove from watchlist" : "Add to watchlist"}
                >
                  <Heart className="w-4 h-4" style={{ fill: watchlist.includes(spotlight.id) ? "#dc2626" : "none", color: "#fff" }} />
                </button>
              </div>
            </AnimateIn>
          )}

          <AnimateIn delay={80} className="px-6 mb-5">
            <div className="flex items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-3">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Player, year, brand…"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                style={{ fontFamily: "'Google Sans', sans-serif" }} />
              {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
            </div>
          </AnimateIn>

          {!isSearching ? (
            <>
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-6 mb-3">Trending</p>
                <div className="flex gap-3 px-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {MARKET_ITEMS.slice(1, 4).map((item, i) => (
                    <AnimateIn key={item.id} delay={160 + i * 80}>
                      <MarketTile
                        item={item}
                        size="trending"
                        onSelect={() => setSelectedItem(item)}
                        isWatchlisted={watchlist.includes(item.id)}
                        onToggleWatchlist={() => onToggleWatchlist(item.id)}
                      />
                    </AnimateIn>
                  ))}
                </div>
              </div>

              <div className="px-6">
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-3">Shop</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MARKET_ITEMS.slice(4).map((item, i) => (
                    <AnimateIn key={item.id} delay={i * 70}>
                      <MarketTile
                        item={item}
                        onSelect={() => setSelectedItem(item)}
                        isWatchlisted={watchlist.includes(item.id)}
                        onToggleWatchlist={() => onToggleWatchlist(item.id)}
                      />
                    </AnimateIn>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="px-6">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Search className="w-8 h-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No results for "{query}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filtered.map((item, i) => (
                    <AnimateIn key={item.id} delay={i * 60}>
                      <MarketTile
                        item={item}
                        onSelect={() => setSelectedItem(item)}
                        isWatchlisted={watchlist.includes(item.id)}
                        onToggleWatchlist={() => onToggleWatchlist(item.id)}
                      />
                    </AnimateIn>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <MarketCardDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onBuy={() => setBuyingItem(selectedItem)}
          isWatchlisted={watchlist.includes(selectedItem.id)}
          onToggleWatchlist={() => onToggleWatchlist(selectedItem.id)}
        />
      )}
      {buyingItem && (
        <BuyConfirmSheet
          item={buyingItem}
          onClose={() => setBuyingItem(null)}
          onConfirm={() => { onBuy(buyingItem); setBuyingItem(null); setSelectedItem(null); }}
        />
      )}
    </div>
  );
}
