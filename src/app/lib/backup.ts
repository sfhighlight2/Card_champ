import type { Card, FolderType, Listing, Profile } from "../types";

export interface BackupData {
  version: 1;
  cards: Card[];
  folders: FolderType[];
  profile: Profile;
  watchlist: number[];
  following: string[];
  listings: Listing[];
}

export function buildBackup(data: Omit<BackupData, "version">): BackupData {
  return { version: 1, ...data };
}

export function isValidBackup(value: unknown): value is BackupData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.cards) &&
    Array.isArray(v.folders) &&
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
