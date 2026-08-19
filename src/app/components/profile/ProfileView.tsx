import { ChevronLeft, Settings } from "lucide-react";
import type { Card, Profile } from "../../types";
import type { LevelInfo } from "../../lib/level";
import { TIER_LABELS } from "../../lib/level";
import { formatCompact } from "../../lib/format";
import { LevelRingAvatar } from "../shared/LevelRingAvatar";
import { TierTag, TIER_LAUREL } from "../shared/TierTag";
import { CardThumb } from "../cards/CardThumb";
import medalChase from "@/imports/medal-chase.png";

interface ProfileViewProps {
  profile: Profile;
  cards: Card[];
  levelInfo: LevelInfo;
  changePct: number;
  onBack: () => void;
  onEdit: () => void;
}

export function ProfileView({ profile, cards, levelInfo, changePct, onBack, onEdit }: ProfileViewProps) {
  const totalValue = cards.reduce((s, c) => s + c.value, 0);
  const featured = [...cards].sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">My Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-7 pb-10" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative mb-4">
            <LevelRingAvatar avatar={profile.avatar} name={profile.name} size={104} xpFraction={levelInfo.xpFraction} />
            {levelInfo.hasEarnedTier && (
              <img src={TIER_LAUREL[levelInfo.tier]} alt={`${TIER_LABELS[levelInfo.tier]} tier`}
                className="absolute left-1/2 -translate-x-1/2 w-11 h-auto pointer-events-none"
                style={{ bottom: -14, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))" }} draggable={false} />
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{profile.name}</h1>
          <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-1.5 flex-wrap">
            <span>{profile.handle}</span>
            <TierTag levelInfo={levelInfo} />
            <span>· {formatCompact(profile.followers)} followers</span>
            {profile.collectingSince && <span>· Collecting since {profile.collectingSince}</span>}
          </p>

          {profile.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed max-w-sm">{profile.bio}</p>}

          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {profile.tags.map(tag => (
                <span key={tag} className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: "Cards", value: `${cards.length}` },
            { label: "Value", value: `$${formatCompact(totalValue)}` },
            { label: "Return", value: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`, positive: changePct >= 0 },
            { label: "Followers", value: formatCompact(profile.followers) },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl bg-gray-50 py-3 text-center">
              <p className="text-sm font-bold" style={stat.positive !== undefined ? { color: stat.positive ? "#10b981" : "#ef4444" } : undefined}>
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {profile.chasing && (
          <div className="chase-card flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-6">
            <img src={medalChase} alt="" className="w-10 h-10 flex-shrink-0" draggable={false} />
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "#5bf092" }}>Chasing</p>
              <p className="text-sm font-semibold text-white truncate">{profile.chasing}</p>
            </div>
          </div>
        )}

        <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">
          Featured Cards {levelInfo.isPro && `· ${TIER_LABELS[levelInfo.tier]}`}
        </p>
        {featured.length === 0 ? (
          <p className="text-sm text-gray-400 mb-6">Add cards to your collection to feature them here.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {featured.map(card => (
              <div key={card.id} className="rounded-xl overflow-hidden" style={{ background: "#1d2534" }}>
                <CardThumb card={card} />
              </div>
            ))}
          </div>
        )}

        <button onClick={onEdit} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
          <Settings className="w-4 h-4" />Edit Profile
        </button>
      </div>
    </div>
  );
}
