import { describe, it, expect } from "vitest";
import { buildBackup, isValidBackup, parseBackupFile, type BackupData } from "./backup";
import type { Card, FolderType, Profile } from "../types";

const sampleProfile: Profile = { name: "Andrew Cordle", handle: "@andrewcordle", avatar: "/a.png", followers: 219 };

function sampleBackup(): BackupData {
  return buildBackup({
    cards: [] as Card[],
    folders: [] as FolderType[],
    profile: sampleProfile,
    watchlist: [1, 2],
    following: ["@garyvee"],
    listings: [],
  });
}

describe("buildBackup", () => {
  it("stamps version 1", () => {
    expect(sampleBackup().version).toBe(1);
  });
});

describe("isValidBackup", () => {
  it("accepts a well-formed backup", () => {
    expect(isValidBackup(sampleBackup())).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidBackup(null)).toBe(false);
  });

  it("rejects a wrong version number", () => {
    expect(isValidBackup({ ...sampleBackup(), version: 2 })).toBe(false);
  });

  it("rejects a missing array field", () => {
    const bad = sampleBackup() as unknown as Record<string, unknown>;
    delete bad.cards;
    expect(isValidBackup(bad)).toBe(false);
  });

  it("rejects a non-object profile", () => {
    expect(isValidBackup({ ...sampleBackup(), profile: "nope" })).toBe(false);
  });
});

describe("parseBackupFile", () => {
  it("resolves with the parsed backup for a valid JSON file", async () => {
    const file = new File([JSON.stringify(sampleBackup())], "backup.json", { type: "application/json" });
    const parsed = await parseBackupFile(file);
    expect(parsed.following).toEqual(["@garyvee"]);
  });

  it("rejects for invalid JSON", async () => {
    const file = new File(["{not json"], "backup.json", { type: "application/json" });
    await expect(parseBackupFile(file)).rejects.toThrow("Invalid backup file");
  });

  it("rejects for well-formed JSON that isn't a backup", async () => {
    const file = new File([JSON.stringify({ hello: "world" })], "backup.json", { type: "application/json" });
    await expect(parseBackupFile(file)).rejects.toThrow("Invalid backup file");
  });
});
