import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// The real client throws at import time when VITE_SUPABASE_URL is unset, and the
// hook reaches past the repository layer for sub-grades.
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [] }) }) }),
  },
  fromMinor: (m: number | null | undefined) => (m == null ? 0 : m / 100),
  toMinor: (a: number) => Math.round(a * 100),
}));

const mockAuth = { user: { id: "owner-1" } as { id: string } | null, isGuest: false };
vi.mock("../auth/AuthProvider", () => ({ useAuth: () => mockAuth }));

vi.mock("./repositories", async importOriginal => {
  const actual = await importOriginal<typeof import("./repositories")>();
  return {
    ...actual,
    fetchDefaultCollectionId: vi.fn(),
    fetchCards: vi.fn(),
    fetchFolders: vi.fn(),
    fetchChases: vi.fn(),
    fetchProfileStats: vi.fn(),
    fetchAchievements: vi.fn(),
    evaluateAchievements: vi.fn(),
    archiveCard: vi.fn(),
  };
});

import * as repo from "./repositories";
import { useCollection } from "./useCollection";

const LIVE = "11111111-1111-1111-1111-111111111111";
const ARCHIVED = "22222222-2222-2222-2222-222222222222";

function dbCard(id: string): repo.DbCard {
  return {
    id, img: "", player: "Bo Jackson", year: "1986", brand: "Topps", team: "Royals",
    grader: "PSA", grade: "10", gradeLabel: "Gem Mint", cert: "1", value: 1745,
    change: 7, autograph: false, createdAt: "2026-01-01T00:00:00.000Z", catalogCardId: null,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(repo.fetchDefaultCollectionId).mockResolvedValue("collection-1");
  vi.mocked(repo.fetchCards).mockResolvedValue([dbCard(LIVE)]);
  vi.mocked(repo.fetchChases).mockResolvedValue([]);
  vi.mocked(repo.fetchProfileStats).mockResolvedValue(null);
  vi.mocked(repo.fetchAchievements).mockResolvedValue([]);
  vi.mocked(repo.fetchFolders).mockResolvedValue([]);
  mockAuth.user = { id: "owner-1" };
  mockAuth.isGuest = false;
});

describe("useCollection folder derivation", () => {
  it("drops membership ids whose copy is no longer live, keeping the view's own totals", async () => {
    // folder_copies keeps a row after a copy is archived; folder_summaries
    // already excludes it from card_count and total_value_minor.
    vi.mocked(repo.fetchFolders).mockResolvedValue([
      {
        id: "folder-1", name: "Rookies", color: "#1a6cc4",
        cardCount: 1, value: 1745, thumbnail: "", thumbnailCopyId: null,
        cardIds: [LIVE, ARCHIVED],
      },
    ]);

    const { result } = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(result.current.folders).toHaveLength(1));

    const folder = result.current.folders[0];
    expect(folder.cardIds).toEqual([LIVE]);
    // The count comes from the view, not from cardIds.length.
    expect(folder.cardCount).toBe(1);
    expect(folder.value).toBe(1745);
  });

  it("surfaces the chosen thumbnail copy so the picker can show the selection", async () => {
    vi.mocked(repo.fetchFolders).mockResolvedValue([
      {
        id: "folder-1", name: "Rookies", color: "#1a6cc4",
        cardCount: 1, value: 1745, thumbnail: "http://img/1.png", thumbnailCopyId: LIVE,
        cardIds: [LIVE],
      },
    ]);

    const { result } = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(result.current.folders).toHaveLength(1));

    expect(result.current.folders[0].thumbnailCopyId).toBe(LIVE);
    expect(result.current.folders[0].thumbnail).toBe("http://img/1.png");
  });
});

describe("useCollection guest gating", () => {
  it("reads nothing and refuses writes for an anonymous user", async () => {
    mockAuth.isGuest = true;

    const { result } = renderHook(() => useCollection(), { wrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.canWrite).toBe(false);
    expect(result.current.cards).toEqual([]);
    expect(result.current.folders).toEqual([]);
    expect(repo.fetchCards).not.toHaveBeenCalled();
    expect(repo.fetchFolders).not.toHaveBeenCalled();
  });

  it("reads and allows writes for a signed-in user", async () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    await waitFor(() => expect(result.current.cards).toHaveLength(1));
    expect(result.current.canWrite).toBe(true);
  });
});

describe("useCollection achievements", () => {
  it("counts only the earned definitions", async () => {
    vi.mocked(repo.fetchAchievements).mockResolvedValue([
      { code: "first-card", label: "Added your first card", earned: true },
      { code: "first-folder", label: "Created your first folder", earned: true },
      { code: "cards-50", label: "50 cards collected", earned: false },
    ]);

    const { result } = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(result.current.achievements).toHaveLength(3));

    expect(result.current.earnedCount).toBe(2);
  });

  it("reports server-recorded new achievements to the caller after a write", async () => {
    vi.mocked(repo.evaluateAchievements).mockResolvedValue(["cards-10"]);
    vi.mocked(repo.archiveCard).mockResolvedValue(undefined);
    const onAchievementsEarned = vi.fn();

    const { result } = renderHook(() => useCollection({ onAchievementsEarned }), { wrapper });
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    await result.current.deleteCard.mutateAsync(LIVE);

    await waitFor(() => expect(onAchievementsEarned).toHaveBeenCalledWith(["cards-10"]));
  });

  it("never lets achievement bookkeeping fail the user's actual action", async () => {
    vi.mocked(repo.evaluateAchievements).mockRejectedValue(new Error("rpc down"));
    vi.mocked(repo.archiveCard).mockResolvedValue(undefined);

    const { result } = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    await expect(result.current.deleteCard.mutateAsync(LIVE)).resolves.toBeUndefined();
  });
});
