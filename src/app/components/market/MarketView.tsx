import { useState } from "react";
import { Search, X, Heart, Tag, TrendingUp, TrendingDown, Store, ExternalLink } from "lucide-react";
import type { MarketListing, MyListing } from "../../types";
import { gradingBadge, gradingColor } from "../../lib/grading";
import { formatDollars } from "../../lib/format";
import { relativeTime } from "../../lib/relativeTime";
import { AnimateIn } from "../shared/AnimateIn";
import { MarketCardDetailSheet } from "./MarketCardDetailSheet";

type Tab = "browse" | "watchlist" | "listings";

interface MarketViewProps {
  listings: MarketListing[];
  watched: MarketListing[];
  myListings: MyListing[];
  ready: boolean;
  canWrite: boolean;
  isWatched: (catalogCardId: string | null) => boolean;
  onToggleWatchlist: (listing: MarketListing) => void;
  onUpdateListingStatus: (id: string, status: string) => void;
  onRemoveListing: (id: string) => void;
  initialTab?: Tab;
  initialQuery?: string;
}

/**
 * The marketplace, reading real `marketplace_listings`.
 *
 * Two honest differences from the mock it replaces. Real listings carry no
 * image — `catalog_cards` has no image column — so tiles are text-forward
 * instead of pretending to a picture. And the 30-day movement comes from
 * `market_price_snapshots`, so it is absent rather than 0% when a card has too
 * little history.
 */
export function MarketView({
  listings, watched, myListings, ready, canWrite,
  isWatched, onToggleWatchlist, onUpdateListingStatus, onRemoveListing,
  initialTab, initialQuery,
}: MarketViewProps) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "browse");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [openListingId, setOpenListingId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = listings.filter(
    l => !q || l.title.toLowerCase().includes(q) || l.source.toLowerCase().includes(q)
  );

  const openListing = listings.find(l => l.id === openListingId) ?? null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-1.5 px-6 mb-4">
        {([
          { id: "browse" as Tab, label: "Browse", icon: Store },
          { id: "watchlist" as Tab, label: "Watchlist", icon: Heart },
          { id: "listings" as Tab, label: "My Listings", icon: Tag },
        ]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors"
            style={{ background: tab === id ? "#111" : "#f3f4f6", color: tab === id ? "#fff" : "#6b7280" }}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <div className="px-6 mb-4">
          <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search listings…"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              style={{ fontFamily: "'Google Sans', sans-serif" }}
            />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
        </div>
      )}

      <div className="flex-1 px-6 overflow-y-auto app-scroll-pad" style={{ scrollbarWidth: "none" }}>
        {!ready ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
          </div>
        ) : tab === "browse" ? (
          filtered.length === 0 ? (
            <Empty icon={Store} title={listings.length === 0 ? "No listings yet" : "No matches"}
              blurb={listings.length === 0 ? "Listings will appear here as they're indexed." : "Try a different search."} />
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((listing, i) => (
                <AnimateIn key={listing.id} delay={Math.min(i, 6) * 50}>
                  <ListingRow
                    listing={listing}
                    watched={isWatched(listing.catalogCardId)}
                    canWrite={canWrite}
                    onOpen={() => setOpenListingId(listing.id)}
                    onToggleWatchlist={() => onToggleWatchlist(listing)}
                  />
                </AnimateIn>
              ))}
            </div>
          )
        ) : tab === "watchlist" ? (
          watched.length === 0 ? (
            <Empty icon={Heart} title="Your watchlist is empty"
              blurb={canWrite ? "Tap the heart on a listing to follow its price." : "Create an account to track prices."} />
          ) : (
            <div className="flex flex-col gap-2">
              {watched.map((listing, i) => (
                <AnimateIn key={listing.id} delay={Math.min(i, 6) * 50}>
                  <ListingRow
                    listing={listing}
                    watched
                    canWrite={canWrite}
                    onOpen={() => setOpenListingId(listing.id)}
                    onToggleWatchlist={() => onToggleWatchlist(listing)}
                  />
                </AnimateIn>
              ))}
            </div>
          )
        ) : myListings.length === 0 ? (
          <Empty icon={Tag} title="You're not selling anything"
            blurb={canWrite ? "Use Sell on your collection to list a card." : "Create an account to list cards."} />
        ) : (
          <div className="flex flex-col gap-2">
            {myListings.map((listing, i) => (
              <AnimateIn key={listing.id} delay={Math.min(i, 6) * 50}>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
                      {/* relativeTime returns "now" for fresh timestamps, which
                          must not gain an "ago" suffix — "listed now ago". */}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDollars(listing.price)}
                        {listing.shipsFrom ? ` · ships from ${listing.shipsFrom}` : ""}
                        {relativeTime(Date.parse(listing.createdAt)) === "now"
                          ? " · listed just now"
                          : ` · listed ${relativeTime(Date.parse(listing.createdAt))} ago`}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 uppercase tracking-wider"
                      style={{
                        background: listing.status === "active" ? "#ecfdf5" : "#f3f4f6",
                        color: listing.status === "active" ? "#047857" : "#6b7280",
                      }}>
                      {listing.status}
                    </span>
                  </div>
                  {/* Only draft, cancelled, and expired listings may be deleted —
                      a sold listing can have an order against it. So an active
                      listing is cancelled first, and a sold one is history. */}
                  <div className="flex items-center gap-2">
                    {listing.status === "active" && (
                      <>
                        <button onClick={() => onUpdateListingStatus(listing.id, "sold")}
                          className="px-3 py-1.5 rounded-full bg-gray-950 text-white text-xs font-semibold">
                          Mark sold
                        </button>
                        <button onClick={() => onUpdateListingStatus(listing.id, "cancelled")}
                          className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold">
                          Cancel
                        </button>
                      </>
                    )}
                    {(listing.status === "cancelled" || listing.status === "expired" || listing.status === "draft") && (
                      <button onClick={() => onRemoveListing(listing.id)}
                        className="px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-xs font-semibold">
                        Remove
                      </button>
                    )}
                    {listing.status === "sold" && (
                      <span className="text-xs text-gray-400">Kept as a record of the sale</span>
                    )}
                    {/* Nothing increments view_count yet; a permanent "0 views"
                        presented as a real stat undermines the ones that are. */}
                    {listing.views > 0 && (
                      <span className="text-xs text-gray-400 ml-auto">{listing.views} views</span>
                    )}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        )}
      </div>

      {openListing && (
        <MarketCardDetailSheet
          listing={openListing}
          onClose={() => setOpenListingId(null)}
          isWatchlisted={isWatched(openListing.catalogCardId)}
          onToggleWatchlist={() => onToggleWatchlist(openListing)}
        />
      )}
    </div>
  );
}

function ListingRow({
  listing, watched, canWrite, onOpen, onToggleWatchlist,
}: {
  listing: MarketListing;
  watched: boolean;
  canWrite: boolean;
  onOpen: () => void;
  onToggleWatchlist: () => void;
}) {
  const up = (listing.change ?? 0) >= 0;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3.5">
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
            style={{ background: gradingColor({ grader: listing.grader, grade: listing.grade }) }}>
            {gradingBadge({ grader: listing.grader, grade: listing.grade })}
          </span>
          {listing.sourceType === "external" && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
              <ExternalLink className="w-2.5 h-2.5" />{listing.source}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-bold text-gray-900">{formatDollars(listing.price)}</span>
          {listing.change !== undefined && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {up ? "+" : ""}{listing.change}%
            </span>
          )}
        </div>
      </button>
      <button
        onClick={onToggleWatchlist}
        disabled={!canWrite || !listing.catalogCardId}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white flex-shrink-0 disabled:opacity-40"
        aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Heart className="w-4 h-4" style={{ fill: watched ? "#dc2626" : "none", color: watched ? "#dc2626" : "#9ca3af" }} />
      </button>
    </div>
  );
}

function Empty({ icon: Icon, title, blurb }: { icon: typeof Store; title: string; blurb: string }) {
  return (
    <div className="flex flex-col items-center text-center pt-16">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-base font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-400 mt-1 max-w-[240px]">{blurb}</p>
    </div>
  );
}
