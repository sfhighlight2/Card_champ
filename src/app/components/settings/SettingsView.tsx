import { useEffect, useState } from "react";
import { ChevronLeft, Download, Upload, Trophy, LogOut, KeyRound } from "lucide-react";
import type { Card, Chase, FolderType, Profile } from "../../types";
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
  watchlist: unknown[];
  following: string[];
  listings: unknown[];
  /** Server-evaluated, from `achievement_definitions` + `user_achievements`. */
  achievements: AchievementState[];
  /** Opens the change-password sheet. Absent for guests, who have no password. */
  onChangePassword?: () => void;
  onLogout: () => void;
}

export function SettingsView({
  onBack, profile, onProfileChange, cards, folders, chases, watchlist, following, listings, achievements, onChangePassword, onLogout,
}: SettingsViewProps) {
  useEscapeClose(onBack);
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [handleError, setHandleError] = useState("");

  // Keep local field state in sync when the profile changes from outside this
  // form, so a stray blur can't silently overwrite fresh values with stale ones.
  useEffect(() => {
    setName(profile.name);
    setHandle(profile.handle);
  }, [profile.name, profile.handle]);

  const earnedCount = achievements.filter(a => a.earned).length;

  const saveProfile = () => {
    // Same normalization and format rule as signup — this field used to send
    // raw text straight at the profiles_handle_format constraint, surfacing
    // invalid handles only as a server-error toast.
    const nextName = name.trim() || profile.name;
    const candidate = handle.trim().toLowerCase().replace(/^@/, "").replace(/[\s-]+/g, "_")
      || profile.handle.replace(/^@/, "");
    if (!/^[a-z0-9_]{3,30}$/.test(candidate)) {
      setHandleError("Handles are 3–30 characters: letters, numbers, underscores.");
      return;
    }
    setHandleError("");
    const nextHandle = `@${candidate}`;
    setHandle(nextHandle);
    // A blur with nothing changed shouldn't fire a write at all.
    if (nextName === profile.name && nextHandle === profile.handle) return;
    onProfileChange({ ...profile, name: nextName, handle: nextHandle });
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
          autoCapitalize="none" spellCheck={false}
          className={`w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none ${handleError ? "mb-1" : "mb-8"}`} />
        {handleError && <p className="text-xs text-red-500 mb-8">{handleError}</p>}

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
        {onChangePassword && (
          <button onClick={onChangePassword}
            className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-gray-50 mb-2 text-left">
            <KeyRound className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Change password</p>
              <p className="text-xs text-gray-400">Set a new password without signing out</p>
            </div>
          </button>
        )}
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
