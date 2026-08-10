/**
 * @vitest-environment node
 *
 * End-to-end verification against the real Supabase project.
 *
 * Skipped unless RUN_LIVE_TESTS=1, because it needs network, credentials, and it
 * writes real rows. Run with:
 *
 *   RUN_LIVE_TESTS=1 QA_PASSWORD='...' npx vitest run src/app/data/live.integration.test.ts
 *
 * This exercises the repository layer as a signed-in user, so it covers what the
 * unit tests deliberately mock away: RLS, the security_invoker views, Storage
 * paths and signing, the RPCs, and realtime delivery.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { signCardImages } from "../lib/media";
import { uploadAvatar } from "../lib/uploads";
import { computeLevel } from "../lib/level";
import { FOLDER_COLORS } from "./cardFields";
import * as repo from "./repositories";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const LIVE = env.RUN_LIVE_TESTS === "1";
const PASSWORD = env.QA_PASSWORD ?? "";
const ALPHA = "qa.alpha@cardchamps-verify.dev";
const BETA = "qa.beta@cardchamps-verify.dev";

const d = LIVE ? describe : describe.skip;

/** 1x1 PNG, enough to prove an upload round-trips. */
const PNG_1PX_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AL+ZgAAAABJRU5ErkJggg==";

function pngFile(name: string): File {
  const bytes = Uint8Array.from(atob(PNG_1PX_BASE64), c => c.charCodeAt(0));
  return new File([bytes], name, { type: "image/png" });
}

async function signIn(email: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return data.user!.id;
}

let alphaId = "";
let collectionId = "";
const createdCardIds: string[] = [];

/**
 * Returns the QA account to a new-signup shape.
 *
 * Reruns otherwise assert against state the previous run left behind. Only what
 * RLS lets the account delete is reset: `user_achievements` has no delete policy
 * because achievements are immutable once earned, and conversations persist, so
 * assertions about those are written as invariants rather than absolutes.
 */
async function resetAccount(userId: string) {
  await supabase.from("folder_copies").delete().eq("owner_id", userId);
  await supabase.from("folders").delete().eq("owner_id", userId);
  await supabase.from("card_copies").delete().eq("owner_id", userId);
  await supabase.from("posts").delete().eq("author_id", userId);
  await supabase.from("user_follows").delete().eq("follower_id", userId);
  await supabase.from("profiles").update({ avatar_path: null }).eq("id", userId);
}

d("live: a brand-new account", () => {
  beforeAll(async () => {
    alphaId = await signIn(ALPHA);
    collectionId = (await repo.fetchDefaultCollectionId(alphaId)) ?? "";
    await resetAccount(alphaId);
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  it("is provisioned with a default collection by the auth trigger", () => {
    expect(alphaId).toMatch(/^[0-9a-f-]{36}$/);
    expect(collectionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("starts with no avatar, so the UI must fall back to initials", async () => {
    const stats = await repo.fetchProfileStats(alphaId);
    expect(stats).not.toBeNull();
    expect(stats!.avatarPath).toBeNull();
    expect(stats!.avatar).toBe("");
  });

  it("shows no badge until a tier is earned", async () => {
    const stats = await repo.fetchProfileStats(alphaId);
    // The live counter only ever grows (achievements are immutable once
    // earned), so the gate is asserted at its boundary and cross-checked
    // against whatever this account currently has.
    expect(computeLevel(0).hasEarnedTier).toBe(false);
    expect(computeLevel(0).isPro).toBe(false);
    expect(computeLevel(2).hasEarnedTier).toBe(false);
    const live = computeLevel(stats!.achievementCount);
    expect(live.hasEarnedTier).toBe(stats!.achievementCount >= 3);
  });

  it("starts with an empty collection and zeroed derived stats", async () => {
    const cards = await repo.fetchCards(alphaId);
    const stats = await repo.fetchProfileStats(alphaId);
    expect(cards).toEqual([]);
    expect(stats!.cardCount).toBe(0);
    expect(stats!.totalValue).toBe(0);
    expect(stats!.changePct).toBe(0);
  });

  it("has no folders, so the folders tab shows its empty state", async () => {
    expect(await repo.fetchFolders(alphaId)).toEqual([]);
  });
});

d("live: collection writes under RLS", () => {
  beforeAll(async () => {
    alphaId = await signIn(ALPHA);
    collectionId = (await repo.fetchDefaultCollectionId(alphaId)) ?? "";
    await resetAccount(alphaId);
    createdCardIds.length = 0;
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  it("adds a card with sell price and pop report, and reads them back", async () => {
    const id = await repo.addCard(alphaId, collectionId, {
      player: "QA Testcard",
      year: "1991",
      brand: "Topps",
      team: "Yankees",
      graderCode: "PSA",
      grade: "9",
      gradeLabel: "Mint",
      cert: "QA-0001",
      value: 125.5,
      sellPrice: 150,
      popReport: 42,
    });
    createdCardIds.push(id);

    const cards = await repo.fetchCards(alphaId);
    const card = cards.find(c => c.id === id)!;
    expect(card.player).toBe("QA Testcard");
    expect(card.grader).toBe("PSA");
    expect(card.value).toBe(125.5);
    expect(card.sellPrice).toBe(150);
    expect(card.popReport).toBe(42);
    expect(card.createdAt).toBeTruthy();
  });

  it("accepts a raw, ungraded card — no grader, grade, or cert", async () => {
    const id = await repo.addCard(alphaId, collectionId, {
      player: "QA Raw Card",
      year: "1989",
      brand: "Donruss",
      team: "Cubs",
      graderCode: "",
      grade: "",
      gradeLabel: "",
      cert: "",
      value: 12,
    });
    createdCardIds.push(id);

    const card = (await repo.fetchCards(alphaId)).find(c => c.id === id)!;
    expect(card.player).toBe("QA Raw Card");
    expect(card.grader).toBe("");
    expect(card.grade).toBe("");
    expect(card.cert).toBe("");
    // The wizard required all three before, so this path had never been written.
    expect(card.value).toBe(12);
  });

  it("clears sell price and pop report when the edit sends explicit nulls", async () => {
    const id = createdCardIds[0];
    await repo.updateCard(id, alphaId, { sellPrice: null, popReport: null });

    const card = (await repo.fetchCards(alphaId)).find(c => c.id === id)!;
    expect(card.sellPrice).toBeUndefined();
    expect(card.popReport).toBeUndefined();
  });

  it("appends value history rather than overwriting, and stats follow", async () => {
    const id = createdCardIds[0];
    await repo.updateCard(id, alphaId, { value: 200 });

    const cards = await repo.fetchCards(alphaId);
    const card = cards.find(c => c.id === id)!;
    expect(card.value).toBe(200);

    // Asserted as an invariant against the live rows rather than a fixed count,
    // so adding a case earlier in this block cannot break it.
    const stats = await repo.fetchProfileStats(alphaId);
    expect(stats!.cardCount).toBe(cards.length);
    expect(stats!.totalValue).toBeCloseTo(cards.reduce((sum, c) => sum + c.value, 0), 2);
  });

  it("counts a folder from the view, and stops counting an archived card", async () => {
    const extra = await repo.addCard(alphaId, collectionId, {
      player: "QA Second",
      year: "1992",
      brand: "Topps",
      team: "Mets",
      graderCode: "BGS",
      grade: "10",
      gradeLabel: "Gem Mint",
      cert: "QA-0002",
      value: 50,
    });
    createdCardIds.push(extra);

    const folderId = await repo.createFolder(alphaId, collectionId, "QA Folder", FOLDER_COLORS[0], [
      createdCardIds[0],
      extra,
    ]);

    let folder = (await repo.fetchFolders(alphaId)).find(f => f.id === folderId)!;
    expect(folder.cardCount).toBe(2);
    expect(folder.value).toBe(250);

    // This is the folder_summaries bug the collection pass fixed: an archived
    // copy used to keep inflating card_count and total_value_minor.
    await repo.archiveCard(extra);

    folder = (await repo.fetchFolders(alphaId)).find(f => f.id === folderId)!;
    expect(folder.cardCount).toBe(1);
    expect(folder.value).toBe(200);

    await repo.archiveFolder(folderId);
  });

  it("awards achievements server-side from real counts", async () => {
    // evaluate_achievements reads live counts, so the folder has to exist now —
    // the previous test archived the one it made.
    await repo.createFolder(alphaId, collectionId, "QA Achievement Folder", FOLDER_COLORS[1], []);
    const earned = await repo.evaluateAchievements();
    const all = await repo.fetchAchievements(alphaId);
    const earnedCodes = all.filter(a => a.earned).map(a => a.code);

    expect(earnedCodes).toContain("first-card");
    expect(earnedCodes).toContain("first-folder");
    // The RPC returns only what it newly inserted, so it must be a subset.
    for (const code of earned) expect(earnedCodes).toContain(code);
  });
});

d("live: Storage uploads", () => {
  beforeAll(async () => {
    alphaId = await signIn(ALPHA);
    collectionId = (await repo.fetchDefaultCollectionId(alphaId)) ?? "";
    await supabase.from("profiles").update({ avatar_path: null }).eq("id", alphaId);
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  it("uploads a card image and serves it back through a signed URL", async () => {
    const dataUrl = `data:image/png;base64,${PNG_1PX_BASE64}`;
    const id = await repo.addCard(alphaId, collectionId, {
      player: "QA Imaged",
      year: "1993",
      brand: "Topps",
      team: "Cubs",
      graderCode: "SGC",
      grade: "8",
      gradeLabel: "NM-MT",
      cert: "QA-0003",
      value: 10,
      imageDataUrl: dataUrl,
    });
    createdCardIds.push(id);

    const card = (await repo.fetchCards(alphaId)).find(c => c.id === id)!;
    // A private bucket means this has to be a signed URL, not a public one.
    expect(card.img).toContain("/storage/v1/object/sign/card-images/");
    expect(card.img).toContain("token=");

    const res = await fetch(card.img);
    expect(res.status).toBe(200);
  });

  it("refuses to sign a path that is not ours", async () => {
    const stolen = await signCardImages([`00000000-0000-4000-8000-000000000000/nope.jpg`]);
    expect(stolen.size).toBe(0);
  });

  it("uploads an avatar and serves it from the public bucket", async () => {
    const path = await uploadAvatar(pngFile("avatar.png"), alphaId, null);
    expect(path.startsWith(`${alphaId}/`)).toBe(true);

    await repo.updateProfile(alphaId, { avatar_path: path });
    const stats = await repo.fetchProfileStats(alphaId);
    expect(stats!.avatarPath).toBe(path);
    expect(stats!.avatar).toContain("/storage/v1/object/public/avatars/");

    const res = await fetch(stats!.avatar);
    expect(res.status).toBe(200);
  });
});

d("live: community", () => {
  beforeAll(async () => {
    alphaId = await signIn(ALPHA);
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  it("reads the seeded feed with derived counts and topics", async () => {
    const topics = await repo.fetchTopics();
    const feed = await repo.fetchFeed();

    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].slug).toBeTruthy();
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].authorHandle.startsWith("@")).toBe(true);
    expect(typeof feed[0].likes).toBe("number");
    expect(typeof feed[0].comments).toBe("number");
  });

  it("posts, reacts, and un-reacts with counts recomputed by the view", async () => {
    const topics = await repo.fetchTopics();
    await repo.createPost(alphaId, topics[0].slug, "QA verification post — please ignore.");

    let feed = await repo.fetchFeed();
    const mine = feed.find(p => p.authorId === alphaId)!;
    expect(mine.body).toContain("QA verification post");
    expect(mine.likes).toBe(0);
    expect(mine.myReaction).toBeNull();

    await repo.setPostReaction(mine.id, alphaId, "like", null);
    feed = await repo.fetchFeed();
    let updated = feed.find(p => p.id === mine.id)!;
    expect(updated.likes).toBe(1);
    expect(updated.myReaction).toBe("like");

    // Setting the same reaction twice clears it — the count cannot go negative
    // because the view recomputes it.
    await repo.setPostReaction(mine.id, alphaId, "like", "like");
    feed = await repo.fetchFeed();
    updated = feed.find(p => p.id === mine.id)!;
    expect(updated.likes).toBe(0);
    expect(updated.myReaction).toBeNull();

    await repo.addComment(mine.id, alphaId, "QA comment.");
    const comments = await repo.fetchComments(mine.id);
    expect(comments.map(c => c.body)).toContain("QA comment.");

    feed = await repo.fetchFeed();
    expect(feed.find(p => p.id === mine.id)!.comments).toBe(1);
  });
});

d("live: peers and their collections", () => {
  beforeAll(async () => {
    alphaId = await signIn(ALPHA);
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  it("lists discoverable collectors excluding the caller", async () => {
    const peers = await repo.fetchDiscoverableProfiles(alphaId);
    expect(peers.length).toBeGreaterThan(0);
    expect(peers.map(p => p.profileId)).not.toContain(alphaId);
  });

  it("follows and unfollows, with follower counts derived", async () => {
    const peers = await repo.fetchDiscoverableProfiles(alphaId);
    const target = peers.find(p => p.handle === "garyvee")!;
    const before = target.followerCount;

    await repo.toggleFollow(alphaId, target.profileId, false);
    expect(await repo.fetchFollowing(alphaId)).toContain(target.profileId);

    let after = (await repo.fetchDiscoverableProfiles(alphaId)).find(p => p.profileId === target.profileId)!;
    expect(after.followerCount).toBe(before + 1);

    await repo.toggleFollow(alphaId, target.profileId, true);
    after = (await repo.fetchDiscoverableProfiles(alphaId)).find(p => p.profileId === target.profileId)!;
    expect(after.followerCount).toBe(before);
  });

  it("reads a peer's public collection but not a private one", async () => {
    const peers = await repo.fetchDiscoverableProfiles(alphaId);

    // garyvee's collection is public and seeded with six cards.
    const publicPeer = peers.find(p => p.handle === "garyvee")!;
    const publicCards = await repo.fetchPeerCards(publicPeer.profileId);
    expect(publicCards.length).toBeGreaterThan(0);

    // djkhaled's is private, so RLS should yield nothing rather than error.
    const privatePeer = peers.find(p => p.handle === "djkhaled")!;
    expect(await repo.fetchPeerCards(privatePeer.profileId)).toEqual([]);
  });
});

d("live: messaging", () => {
  let betaId = "";

  beforeAll(async () => {
    // Learn beta's id while signed in as beta, then switch back to alpha.
    betaId = await signIn(BETA);
    await supabase.auth.signOut();
    alphaId = await signIn(ALPHA);
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  it("creates one stable conversation per pair, whoever asks", async () => {
    const first = await repo.openDirectConversation(betaId);
    const second = await repo.openDirectConversation(betaId);
    expect(second).toBe(first);
  });

  it("sends a message the recipient sees as unread", async () => {
    await supabase.auth.signOut();
    alphaId = await signIn(ALPHA);
    const conversationId = await repo.openDirectConversation(betaId);
    await repo.sendMessage(conversationId, alphaId, "QA hello from alpha.");

    const mine = (await repo.fetchConversations()).find(c => c.id === conversationId)!;
    expect(mine.lastBody).toBe("QA hello from alpha.");
    expect(mine.lastSenderId).toBe(alphaId);
    // My own message is not unread to me.
    expect(mine.unread).toBe(0);

    await supabase.auth.signOut();
    await signIn(BETA);

    const theirs = (await repo.fetchConversations()).find(c => c.id === conversationId)!;
    // Exact counts accumulate across runs; what matters is that the recipient
    // has unread mail and that reading clears it.
    expect(theirs.unread).toBeGreaterThan(0);
    expect(theirs.peerId).toBe(alphaId);

    // Reading it clears the badge, because unread derives from last_read_at.
    await repo.markConversationRead(conversationId, betaId);
    const afterRead = (await repo.fetchConversations()).find(c => c.id === conversationId)!;
    expect(afterRead.unread).toBe(0);

    await supabase.auth.signOut();
    await signIn(ALPHA);
  });

  it("delivers a new message over realtime to the other member", async () => {
    await supabase.auth.signOut();
    alphaId = await signIn(ALPHA);
    const conversationId = await repo.openDirectConversation(betaId);

    // A second client stays signed in as beta and listens.
    const betaClient = createBetaClient();
    const { error: betaAuthError } = await betaClient.auth.signInWithPassword({
      email: BETA, password: PASSWORD,
    });
    expect(betaAuthError).toBeNull();

    const received = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("no realtime event within 15s")), 15_000);
      betaClient
        .channel(`qa-inbox-${conversationId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          payload => {
            clearTimeout(timer);
            resolve((payload.new as { body: string }).body);
          }
        )
        .subscribe();
    });

    // Give the channel a moment to finish subscribing before writing.
    await new Promise(r => setTimeout(r, 2000));
    await repo.sendMessage(conversationId, alphaId, "QA realtime ping.");

    expect(await received).toBe("QA realtime ping.");
    await betaClient.auth.signOut();
  }, 30_000);
});

/** A second, independent client so two sessions can be live at once. */
function createBetaClient() {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
