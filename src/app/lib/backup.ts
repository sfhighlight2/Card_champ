import type { Card, Chase, FolderType, Profile } from "../types";

export interface BackupData {
  version: 1 | 2;
  cards: Card[];
  folders: FolderType[];
  chases?: Chase[];
  profile: Profile;
  /** Kept for compatibility with version 1 and 2 files. The watchlist, follows,
   *  and listings all live in Postgres now, so fresh exports carry them empty. */
  watchlist: unknown[];
  following: string[];
  listings: unknown[];
}

export function buildBackup(data: Omit<BackupData, "version">): BackupData {
  return { version: 2, ...data };
}

export function isValidBackup(value: unknown): value is BackupData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.version === 1 || v.version === 2) &&
    Array.isArray(v.cards) &&
    Array.isArray(v.folders) &&
    (v.chases === undefined || Array.isArray(v.chases)) &&
    typeof v.profile === "object" && v.profile !== null &&
    Array.isArray(v.watchlist) &&
    Array.isArray(v.following) &&
    Array.isArray(v.listings)
  );
}

export function downloadBackup(data: BackupData, filename = "card-champs-backup.json"): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        if (!isValidBackup(parsed)) {
          reject(new Error("Invalid backup file"));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error("Invalid backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}
