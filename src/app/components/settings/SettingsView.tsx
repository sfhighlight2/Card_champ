import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Download, Upload, RotateCcw, Trophy, LogOut, Sun, Moon, Monitor } from "lucide-react";
import type { Card, FolderType, Listing, Profile } from "../../types";
import { buildBackup, downloadBackup, parseBackupFile } from "../../lib/backup";
import type { BackupData } from "../../lib/backup";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { CountUp } from "../shared/CountUp";
import { MILESTONES } from "../../data/achievements";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface SettingsViewProps {
  onBack: () => void;
  profile: Profile;
  onProfileChange: (p: Profile) => void;
  cards: Card[];
  folders: FolderType[];
  watchlist: number[];
  following: string[];
  listings: Listing[];
  onRestore: (data: BackupData) => void;
  onReset: () => void;
  seenAchievements: string[];
  onLogout: () => void;
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function SettingsView({
  onBack, profile, onProfileChange, cards, folders, watchlist, following, listings, onRestore, onReset, seenAchievements, onLogout, theme, onThemeChange,
}: SettingsViewProps) {
  useEscapeClose(onBack);
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [importError, setImportError] = useState("");
  const [confirmingImport, setConfirmingImport] = useState<BackupData | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local field state in sync when the profile changes from outside this
  // form (e.g. Reset all data or Import collection), so a stray blur can't
  // silently overwrite the fresh profile with stale, pre-reset/import values.
  useEffect(() => {
    setName(profile.name);
    setHandle(profile.handle);
  }, [profile.name, profile.handle]);

  const saveProfile = () => {
    onProfileChange({ ...profile, name: name.trim() || profile.name, handle: handle.trim() || profile.handle });
  };

  const handleExport = () => {
    downloadBackup(buildBackup({ cards, folders, profile, watchlist, following, listings }));
  };

  const handleFileChosen = async (file: File) => {
    setImportError("");
    try {
      const data = await parseBackupFile(file);
      setConfirmingImport(data);
    } catch {
      setImportError("That file isn't a valid Card Champs backup.");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Settings</h2>
      </div>

      <div className="flex-1 px-6 overflow-y-auto max-w-lg" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
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
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-gray-50 mb-2 text-left">
          <Upload className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Import collection</p>
            <p className="text-xs text-gray-400">Restore from a backup file</p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) void handleFileChosen(file);
            e.target.value = "";
          }}
        />
        {importError && <p className="text-xs text-red-500 mb-2">{importError}</p>}

        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3 mt-8">Achievements</p>
        <p className="text-sm text-gray-500 mb-3">
          <CountUp to={seenAchievements.length} duration={800} /> of {MILESTONES.length} earned
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {MILESTONES.map(m => {
            const earned = seenAchievements.includes(m.id);
            return (
              <div key={m.id}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ${earned ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-400"}`}>
                <Trophy className="w-3.5 h-3.5" />
                {m.label}
              </div>
            );
          })}
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

        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Danger Zone</p>
        <button onClick={() => setConfirmingReset(true)}
          className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-red-50 text-left">
          <RotateCcw className="w-4 h-4 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-600">Reset all data</p>
            <p className="text-xs text-red-400">Erase your collection and start over</p>
          </div>
        </button>
      </div>

      {confirmingImport && (
        <ConfirmDialog
          title="Restore this backup?"
          message="This replaces your current cards, folders, watchlist, follows, and listings with the contents of the imported file."
          confirmLabel="Restore"
          onConfirm={() => { onRestore(confirmingImport); setConfirmingImport(null); }}
          onCancel={() => setConfirmingImport(null)}
        />
      )}
      {confirmingReset && (
        <ConfirmDialog
          title="Reset all data?"
          message="This erases your added cards, folders, watchlist, follows, and listings, and restores the original starter collection."
          confirmLabel="Reset"
          onConfirm={() => { onReset(); setConfirmingReset(false); }}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
    </div>
  );
}
