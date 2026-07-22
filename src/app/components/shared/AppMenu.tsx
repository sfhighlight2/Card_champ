import { useState } from "react";
import {
  X, Eye, Wallet, Settings, TrendingUp, Star, Send, Bell, MapPin, Megaphone, Trophy, LogOut, ChevronRight,
} from "lucide-react";
import type { LevelInfo } from "../../lib/level";
import { TIER_GRADIENTS, TIER_LABELS, MAX_LEVEL } from "../../lib/level";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface MenuItem {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}

interface AppMenuProps {
  onClose: () => void;
  levelInfo: LevelInfo;
  onProfile: () => void;
  onSettings: () => void;
  onInvestmentOverview: () => void;
  onWatchlist: () => void;
  onMessages: () => void;
  onSignOut: () => void;
}

export function AppMenu({
  onClose, levelInfo, onProfile, onSettings, onInvestmentOverview, onWatchlist, onMessages, onSignOut,
}: AppMenuProps) {
  useEscapeClose(onClose);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const stub = (label: string) => () => setComingSoon(label);

  const account: MenuItem[] = [
    { icon: Eye, label: "Profile", onClick: onProfile },
    { icon: Wallet, label: "Wallet", onClick: stub("Wallet") },
    { icon: Settings, label: "Settings", onClick: onSettings },
  ];
  const portfolio: MenuItem[] = [
    { icon: TrendingUp, label: "Investment Overview", onClick: onInvestmentOverview },
    { icon: Star, label: "Watchlist", onClick: onWatchlist },
  ];
  const social: MenuItem[] = [
    { icon: Send, label: "Messages", onClick: onMessages },
    { icon: Bell, label: "Notifications", onClick: stub("Notifications") },
  ];
  const discover: MenuItem[] = [
    { icon: MapPin, label: "Live Events", onClick: stub("Live Events") },
    { icon: Megaphone, label: "Promotions", onClick: stub("Promotions") },
  ];

  const nextTierAt = levelInfo.tier === "bronze" ? 3 : levelInfo.tier === "silver" ? 6 : levelInfo.tier === "gold" ? 9 : null;
  const toNext = nextTierAt !== null ? nextTierAt - levelInfo.level : 0;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-sm h-full bg-white flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-8 pb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close menu">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 px-6 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <MenuSection title="Account" items={account} />
          <MenuSection title="Portfolio" items={portfolio} />
          <MenuSection title="Social" items={social} />
          <MenuSection title="Discover" items={discover} />

          <div className="rounded-3xl p-5 mt-2 mb-4" style={{ background: "linear-gradient(135deg, #6d5bd0 0%, #8b7ae8 100%)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: TIER_GRADIENTS[levelInfo.tier] }}>
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase">Level {levelInfo.level}/{MAX_LEVEL} · {TIER_LABELS[levelInfo.tier]}</p>
                <p className="text-white font-semibold text-sm leading-tight">
                  {nextTierAt !== null ? `${toNext} more to level up` : "You've reached Hall of Fame"}
                </p>
              </div>
            </div>
            <p className="text-white/70 text-xs mb-3">Unlock every award & private controls.</p>
            <button onClick={stub("Hall of Fame benefits")} className="w-full py-2.5 rounded-full bg-white/90 text-[#6d5bd0] text-xs font-bold flex items-center justify-center gap-1">
              SEE BENEFITS <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 py-3.5 mb-8 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </div>

      {comingSoon && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.5)" }} onClick={e => { e.stopPropagation(); setComingSoon(null); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center" onClick={e => e.stopPropagation()}>
            <p className="text-base font-semibold text-gray-900 mb-1.5">{comingSoon}</p>
            <p className="text-sm text-gray-500 mb-5">This is coming soon.</p>
            <button onClick={() => setComingSoon(null)} className="w-full py-3 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">{title}</p>
      <div className="flex flex-col">
        {items.map(({ icon: Icon, label, onClick }) => (
          <button key={label} onClick={onClick} className="flex items-center gap-3 py-3 text-left">
            <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
