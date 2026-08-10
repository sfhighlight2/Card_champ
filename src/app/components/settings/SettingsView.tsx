import { useEffect, useState } from "react";
import { ChevronLeft, Download, Upload, Trophy, LogOut, Sun, Moon, Monitor } from "lucide-react";
import type { Card, Chase, FolderType, Listing, Profile } from "../../types";
import { buildBackup, downloadBackup } from "../../lib/backup";
import { CountUp } from "../shared/CountUp";
import { useEscapeClose } from "../../hooks/useEscapeClose";

export interface AchievementState {
  code: string;
  label: string;
  earned: boolean;
}

interface SettingsViewProps {
  onBack: () => void;
  profile: Profile;
  onProfileChange: (p: Profile) => void;
  cards: Card[];
  folders: FolderType[];
  chases: Chase[];
  watchlist: number[];
  following: string[];
  listings: Listing[];
  /** Server-evaluated, from `achievement_definitions` + `user_achievements`. */
  achievements: AchievementState[];
  onLogout: () => void;
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function SettingsView({
  onBack, profile, onProfileChange, cards, folders, chases, watchlist, following, listings, achievements, onLogout, theme, onThemeChange,
}: SettingsViewProps) {
  useEscapeClose(onBack);
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);

  // Keep local field state in sync when the profile changes from outside this
  // form, so a stray blur can't silently overwrite fresh values with stale ones.
  useEffect(() => {
    setName(profile.name);
    setHandle(profile.handle);
  }, [profile.name, profile.handle]);

  const earnedCount = achievements.filter(a => a.earned).length;

  const saveProfile = () => {
    onProfileChange({ ...profile, name: name.trim() || profile.name, handle: handle.trim() || profile.handle });
  };

  const handleExport = () => {
    downloadBackup(buildBackup({ cards, folders, chases, profile, watchlist, following, listings }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Settings</h2>
      </div>

      <div className="flex-1 px-6 overflow-y-auto max-w-lg app-scroll-pad" style={{ scrollbarWidth: "none" }}>
        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Profile</p>
        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Name</p>
        <input value={name} onChange={e => setName(e.target.value)} onBlur={saveProfile}
          className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-3" />
        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Handle</p>
        <input value={handle} onChange={e => setHandle(e.target.value)} onBlur={saveProfile}
          className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-8" />

        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Appearance</p>
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-50 mb-8">
          {([
            { id: "light" as const, label: "Light", icon: Sun },
            { id: "dark" as const, label: "Dark", icon: Moon },
            { id: "system" as const, label: "System", icon: Monitor },
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => onThemeChange(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: theme === id ? "#111" : "transparent", color: theme === id ? "#fff" : "#888" }}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Backup</p>
        <button onClick={handleExport}
          className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-gray-50 mb-2 text-left">
          <Download className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Export collection</p>
            <p className="text-xs text-gray-400">Download everything as a JSON file</p>
          </div>
        </button>
        {/* Import writes a whole collection back, which needs the
            import_legacy_backup / restore_portable_backup functions. Until they
            exist there is no honest way to do it, so it is shown as unavailable
            rather than wired to something that would corrupt real rows. */}
        <div aria-disabled className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-gray-50 mb-2 text-left opacity-60">
          <Upload className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-500">Import collection</p>
            <p className="text-xs text-gray-400">Not available yet — restoring into a synced collection is still being built</p>
          </div>
        </div>

        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3 mt-8">Achievements</p>
        <p className="text-sm text-gray-500 mb-3">
          <CountUp to={earnedCount} duration={800} /> of {achievements.length} earned
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {achievements.map(a => (
            <div key={a.code}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ${a.earned ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-400"}`}>
              <Trophy className="w-3.5 h-3.5" />
              {a.label}
            </div>
          ))}
        </div>

        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Account</p>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-gray-50 mb-8 text-left">
          <LogOut className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Log out</p>
            <p className="text-xs text-gray-400">Return to the sign-in screen</p>
          </div>
        </button>
        {/* "Reset all data" used to reseed the localStorage stores. Against a
            real collection it would mean bulk-deleting rows, which belongs
            behind a deliberate account-deletion flow, not a settings toggle. */}
      </div>
    </div>
  );
}
