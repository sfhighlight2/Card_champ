// Repository layer: every Supabase read/write the app needs, in one place.
//
// Components keep working in whole-dollar numbers and resolved image URLs; the
// conversion from the database's integer minor units and `local:`/Storage
// paths happens here, at the boundary.
//
// Reads prefer the security_invoker views (collection_copy_details,
// folder_summaries, community_feed, conversation_summaries, profile_stats) so
// derived values — current value, 30-day change, like/comment counts, unread
// counts — come from the database rather than from client arithmetic.

import { supabase, fromMinor, toMinor } from "../lib/supabase";
import { resolveImage, resolveAvatar, signCardImages } from "../lib/media";
import { uploadCardImage } from "../lib/uploads";

// ---------------------------------------------------------------------------
// shapes returned to the UI
// ---------------------------------------------------------------------------

export interface DbCard {
  id: string;
  img: string;
  player: string;
  year: string;
  brand: string;
  team: string;
  grader: string;
  grade: string;
  gradeLabel: string;
  cert: string;
  value: number;
  change: number;
  autograph: boolean;
  sellPrice?: number;
  popReport?: number;
  createdAt: string;
  catalogCardId: string | null;
}

export interface DbFolder {
  id: string;
  name: string;
  color: string;
  cardCount: number;
  value: number;
  thumbnail: string;
  thumbnailCopyId: string | null;
  cardIds: string[];
}

export interface DbChase {
  id: string;
  title: string;
  description: string;
  featuredCopyId: string | null;
  createdAt: string;
}

export interface DbProfileStats {
  profileId: string;
  handle: string;
  displayName: string;
  /** Resolved public URL, or "" when no picture has been uploaded. */
  avatar: string;
  /** The raw Storage path behind `avatar`, needed to clean up on replacement. */
  avatarPath: string | null;
  bio: string | null;
  chasing: string | null;
  collectingSince: number | null;
  isVerified: boolean;
  cardCount: number;
  totalValue: number;
  changePct: number;
  followerCount: number;
  followingCount: number;
  achievementCount: number;
}

// ---------------------------------------------------------------------------
// query keys
// ---------------------------------------------------------------------------

export const keys = {
  profile: (id: string) => ["profile", id] as const,
  stats: (id: string) => ["profile-stats", id] as const,
  cards: (owner: string) => ["cards", owner] as const,
  folders: (owner: string) => ["folders", owner] as const,
  chases: (owner: string) => ["chases", owner] as const,
  feed: () => ["community-feed"] as const,
  post: (id: string) => ["post", id] as const,
  listings: () => ["listings"] as const,
  myListings: (owner: string) => ["my-listings", owner] as const,
  watchlist: (owner: string) => ["watchlist", owner] as const,
  conversations: () => ["conversations"] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
  peers: () => ["peers"] as const,
  achievements: (owner: string) => ["achievements", owner] as const,
};

// ---------------------------------------------------------------------------
// profile
// ---------------------------------------------------------------------------

export async function fetchProfileStats(profileId: string): Promise<DbProfileStats | null> {
  const { data, error } = await supabase
    .from("profile_stats")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    profileId: data.profile_id,
    handle: data.handle,
    displayName: data.display_name,
    avatar: resolveAvatar(data.avatar_path),
    avatarPath: data.avatar_path ?? null,
    bio: data.bio,
    chasing: data.chasing,
    collectingSince: data.collecting_since,
    isVerified: data.is_verified,
    cardCount: data.card_count,
    totalValue: fromMinor(data.total_value_minor),
    changePct: Number(data.change_pct ?? 0),
    followerCount: data.follower_count,
    followingCount: data.following_count,
    achievementCount: data.achievement_count,
  };
}

export async function updateProfile(
  profileId: string,
  patch: {
    display_name?: string;
    handle?: string;
    bio?: string | null;
    chasing?: string | null;
    collecting_since?: number | null;
    avatar_path?: string | null;
  }
): Promise<void> {
  const { error } = await supabase.from("profiles").update(patch).eq("id", profileId);
  if (error) throw error;
}

/**
 * Whether a handle is free, answered by a security-definer RPC.
 *
 * A plain select cannot answer this before signup: the caller is `anon`, and
 * `profiles_select` only exposes discoverable rows — so a handle owned by a
 * non-discoverable account would look available and then be silently replaced.
 * Returns false for anything that fails the format rule too.
 */
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_handle_available", { p_handle: handle });
  if (error) throw error;
  return data === true;
}

export async function fetchDiscoverableProfiles(excludeId?: string): Promise<DbProfileStats[]> {
  let q = supabase.from("profile_stats").select("*").eq("is_discoverable", true);
  if (excludeId) q = q.neq("profile_id", excludeId);
  // The New Message picker and Connections search filter this list client-side,
  // so it needs to cover the community, not just the top-50 collections.
  const { data, error } = await q.order("card_count", { ascending: false }).limit(500);
  if (error) throw error;

  return (data ?? []).map(d => ({
    profileId: d.profile_id,
    handle: d.handle,
    displayName: d.display_name,
    avatar: resolveAvatar(d.avatar_path),
    avatarPath: d.avatar_path ?? null,
    bio: d.bio,
    chasing: d.chasing,
    collectingSince: d.collecting_since,
    isVerified: d.is_verified,
    cardCount: d.card_count,
    totalValue: fromMinor(d.total_value_minor),
    changePct: Number(d.change_pct ?? 0),
    followerCount: d.follower_count,
    followingCount: d.following_count,
    achievementCount: d.achievement_count,
  }));
}

// ---------------------------------------------------------------------------
// collection
// ---------------------------------------------------------------------------

/** PostgREST silently caps any response at the server's max-rows (1000), so an
 *  unbounded select over a big collection would drop the tail without any
 *  error. Paging until a short page is the only way to actually get every row. */
const PAGE_SIZE = 1000;

async function fetchAllCopyRows(ownerId: string): Promise<Record<string, any>[]> {
  const rows: Record<string, any>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("collection_copy_details")
      .select("*")
      .eq("owner_id", ownerId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function fetchCards(ownerId: string): Promise<DbCard[]> {
  const rows = await fetchAllCopyRows(ownerId);
  // `card-images` is a private bucket, so real uploads need signed URLs. One
  // batch request covers the whole collection.
  const images = await signCardImages(rows.map(r => r.image_path));

  return rows.map(r => mapCard(r, images));
}

function mapCard(d: Record<string, any>, images?: Map<string, string>): DbCard {
  return {
    id: d.id,
    img: (d.image_path && images?.get(d.image_path)) ?? resolveImage(d.image_path),
    player: d.player ?? "",
    year: d.year != null ? String(d.year) : "",
    brand: d.brand ?? "",
    team: d.team ?? "",
    grader: d.grader ?? "",
    grade: d.grade != null ? String(Number(d.grade)) : "",
    gradeLabel: d.grade_label ?? "",
    cert: d.certificate_number ?? "",
    value: fromMinor(d.value_minor),
    change: Number(d.change_pct ?? 0),
    autograph: !!d.autograph,
    sellPrice: d.sell_amount_minor == null ? undefined : fromMinor(d.sell_amount_minor),
    popReport: d.pop_report ?? undefined,
    createdAt: d.created_at,
    catalogCardId: d.catalog_card_id ?? null,
  };
}

/** Returns the caller's default collection id, creating nothing — the auth
 *  trigger already provisioned it for every permanent account. */
export async function fetchDefaultCollectionId(ownerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("collections")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("is_default", true)
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export interface NewCardInput {
  player: string;
  year: string;
  brand: string;
  team: string;
  graderCode: string;
  grade: string;
  gradeLabel: string;
  cert: string;
  value: number;
  /** What a marketplace would pay for this copy. `null` clears a stored figure;
   *  omitting the key on an update leaves it alone. */
  sellPrice?: number | null;
  /** The owner's own population figure for this copy. Same null/omit contract. */
  popReport?: number | null;
  autograph?: boolean;
  imageDataUrl?: string;
}

export async function addCard(
  ownerId: string,
  collectionId: string,
  input: NewCardInput
): Promise<string> {
  const graderId = await lookupGraderId(input.graderCode);

  // Uploaded first, deliberately: if Storage rejects the image there is no
  // half-created card to clean up, and the user just retries. That is also why
  // the object name is a fresh uuid rather than the copy id.
  const imagePath = input.imageDataUrl
    ? await uploadCardImage(input.imageDataUrl, ownerId)
    : null;

  const { data, error } = await supabase
    .from("card_copies")
    .insert({
      owner_id: ownerId,
      collection_id: collectionId,
      raw_title: input.player,
      raw_year: input.year ? Number(input.year) : null,
      raw_brand: input.brand || null,
      raw_team: input.team || null,
      grading_company_id: graderId,
      grade: input.grade ? Number(input.grade) : null,
      grade_label: input.gradeLabel || null,
      certificate_number: input.cert || null,
      autograph: input.autograph ?? false,
      sell_amount_minor: input.sellPrice == null ? null : toMinor(input.sellPrice),
      pop_report: input.popReport ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  const copyId = data.id as string;

  // The follow-up rows share the copy's fate: if any of them fails, the copy is
  // deleted again and the whole add reports failure, instead of resolving with
  // a card that silently lost its value, photo, or history. (These errors used
  // to be dropped entirely — the app toasted "Added" over a $0, photoless card.)
  try {
    const valuation = await supabase.from("card_copy_valuations").insert({
      copy_id: copyId,
      amount_minor: toMinor(input.value),
      source: "user",
      created_by: ownerId,
    });
    if (valuation.error) throw valuation.error;

    if (imagePath) {
      const media = await supabase.from("card_copy_media").insert({
        copy_id: copyId,
        uploaded_by: ownerId,
        storage_path: imagePath,
        media_type: "front",
        is_primary: true,
      });
      if (media.error) throw media.error;
    }

    const event = await supabase.from("copy_ownership_events").insert({
      copy_id: copyId,
      new_owner_id: ownerId,
      event_type: "added",
    });
    if (event.error) throw event.error;
  } catch (err) {
    await supabase.from("card_copies").delete().eq("id", copyId);
    if (imagePath) await supabase.storage.from("card-images").remove([imagePath]);
    throw err;
  }

  return copyId;
}

export async function updateCard(
  copyId: string,
  ownerId: string,
  patch: Partial<NewCardInput>
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.player !== undefined) update.raw_title = patch.player;
  if (patch.year !== undefined) update.raw_year = patch.year ? Number(patch.year) : null;
  if (patch.brand !== undefined) update.raw_brand = patch.brand || null;
  if (patch.team !== undefined) update.raw_team = patch.team || null;
  if (patch.grade !== undefined) update.grade = patch.grade ? Number(patch.grade) : null;
  if (patch.gradeLabel !== undefined) update.grade_label = patch.gradeLabel || null;
  if (patch.cert !== undefined) update.certificate_number = patch.cert || null;
  if (patch.autograph !== undefined) update.autograph = patch.autograph;
  if (patch.sellPrice !== undefined) update.sell_amount_minor = patch.sellPrice == null ? null : toMinor(patch.sellPrice);
  if (patch.popReport !== undefined) update.pop_report = patch.popReport ?? null;
  if (patch.graderCode !== undefined) update.grading_company_id = await lookupGraderId(patch.graderCode);

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("card_copies").update(update).eq("id", copyId);
    if (error) throw error;
  }

  // Value changes append to history rather than overwriting it.
  if (patch.value !== undefined) {
    const { error } = await supabase.from("card_copy_valuations").insert({
      copy_id: copyId,
      amount_minor: toMinor(patch.value),
      source: "user",
      created_by: ownerId,
    });
    if (error) throw error;
  }
}

/** Soft-delete: archiving preserves ownership history and any order that
 *  referenced the copy. */
export async function archiveCard(copyId: string): Promise<void> {
  const { error } = await supabase
    .from("card_copies")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", copyId);
  if (error) throw error;
}

export async function archiveCards(copyIds: string[]): Promise<void> {
  if (copyIds.length === 0) return;
  const { error } = await supabase
    .from("card_copies")
    .update({ archived_at: new Date().toISOString() })
    .in("id", copyIds);
  if (error) throw error;
}

let graderCache: Map<string, string> | null = null;

async function lookupGraderId(code: string): Promise<string | null> {
  if (!code) return null;
  if (!graderCache) {
    const { data, error } = await supabase.from("grading_companies").select("id, code");
    if (error) throw error;
    graderCache = new Map((data ?? []).map(g => [g.code as string, g.id as string]));
  }
  return graderCache.get(code) ?? null;
}

// ---------------------------------------------------------------------------
// folders
// ---------------------------------------------------------------------------

/** `cardIds` is raw membership, archived copies included — `folder_summaries`
 *  already excludes them from `card_count`/`total_value_minor`, and
 *  `useCollection` intersects the ids with the live card set so the count the UI
 *  renders and the cards it renders cannot disagree. */
export async function fetchFolders(ownerId: string): Promise<DbFolder[]> {
  const { data, error } = await supabase
    .from("folder_summaries")
    .select("*")
    .eq("owner_id", ownerId)
    .is("archived_at", null)
    .order("created_at");
  if (error) throw error;

  const folders = data ?? [];
  if (folders.length === 0) return [];

  // Same private-bucket treatment as the card grid: a folder thumbnail is a
  // card image.
  const thumbnails = await signCardImages(folders.map(f => f.thumbnail_path));

  // thumbnail_copy_id lives on `folders`, not the summary view, and the picker
  // needs it to show which copy is currently selected.
  const { data: chosen, error: chosenError } = await supabase
    .from("folders")
    .select("id, thumbnail_copy_id")
    .eq("owner_id", ownerId)
    .is("archived_at", null);
  if (chosenError) throw chosenError;

  const thumbCopyByFolder = new Map<string, string | null>(
    (chosen ?? []).map(f => [f.id as string, (f.thumbnail_copy_id as string | null) ?? null])
  );

  const { data: links, error: linkError } = await supabase
    .from("folder_copies")
    .select("folder_id, copy_id, position")
    .eq("owner_id", ownerId)
    .order("position");
  if (linkError) throw linkError;

  const byFolder = new Map<string, string[]>();
  for (const l of links ?? []) {
    const list = byFolder.get(l.folder_id) ?? [];
    list.push(l.copy_id);
    byFolder.set(l.folder_id, list);
  }

  return folders.map(f => ({
    id: f.id,
    name: f.name,
    color: f.color,
    cardCount: f.card_count ?? 0,
    value: fromMinor(f.total_value_minor),
    thumbnail: (f.thumbnail_path && thumbnails.get(f.thumbnail_path)) ?? resolveImage(f.thumbnail_path),
    thumbnailCopyId: thumbCopyByFolder.get(f.id) ?? null,
    cardIds: byFolder.get(f.id) ?? [],
  }));
}

export async function createFolder(
  ownerId: string,
  collectionId: string,
  name: string,
  color: string,
  cardIds: string[] = []
): Promise<string> {
  const { data, error } = await supabase
    .from("folders")
    .insert({ owner_id: ownerId, collection_id: collectionId, name, color })
    .select("id")
    .single();
  if (error) throw error;

  const folderId = data.id as string;
  if (cardIds.length > 0) await setFolderCards(folderId, ownerId, collectionId, cardIds);
  return folderId;
}

export async function updateFolder(
  folderId: string,
  patch: { name?: string; color?: string; thumbnail_copy_id?: string | null }
): Promise<void> {
  const { error } = await supabase.from("folders").update(patch).eq("id", folderId);
  if (error) throw error;
}

export async function archiveFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from("folders")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", folderId);
  if (error) throw error;
}

/** Replaces a folder's membership wholesale. The composite foreign keys reject
 *  any copy that isn't the caller's own in the same collection. */
export async function setFolderCards(
  folderId: string,
  ownerId: string,
  collectionId: string,
  cardIds: string[]
): Promise<void> {
  const { error: delError } = await supabase
    .from("folder_copies")
    .delete()
    .eq("folder_id", folderId);
  if (delError) throw delError;

  if (cardIds.length === 0) return;

  const { error } = await supabase.from("folder_copies").insert(
    cardIds.map((copyId, i) => ({
      folder_id: folderId,
      copy_id: copyId,
      owner_id: ownerId,
      collection_id: collectionId,
      position: i,
    }))
  );
  if (error) throw error;
}

export async function addCardsToFolder(
  folderId: string,
  ownerId: string,
  collectionId: string,
  cardIds: string[]
): Promise<void> {
  if (cardIds.length === 0) return;
  const { error } = await supabase.from("folder_copies").upsert(
    cardIds.map((copyId, i) => ({
      folder_id: folderId,
      copy_id: copyId,
      owner_id: ownerId,
      collection_id: collectionId,
      position: i,
    })),
    { onConflict: "folder_id,copy_id", ignoreDuplicates: true }
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// chases
// ---------------------------------------------------------------------------

export async function fetchChases(ownerId: string): Promise<DbChase[]> {
  const { data, error } = await supabase
    .from("chases")
    .select("id, title, description, featured_copy_id, created_at")
    .eq("owner_id", ownerId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    featuredCopyId: c.featured_copy_id,
    createdAt: c.created_at,
  }));
}

export async function createChase(
  ownerId: string,
  input: { title: string; description: string; featuredCopyId?: string | null }
): Promise<void> {
  const { error } = await supabase.from("chases").insert({
    owner_id: ownerId,
    title: input.title,
    description: input.description,
    featured_copy_id: input.featuredCopyId ?? null,
  });
  if (error) throw error;
}

export async function updateChase(
  chaseId: string,
  patch: { title?: string; description?: string; featured_copy_id?: string | null }
): Promise<void> {
  const { error } = await supabase.from("chases").update(patch).eq("id", chaseId);
  if (error) throw error;
}

export async function deleteChase(chaseId: string): Promise<void> {
  const { error } = await supabase.from("chases").delete().eq("id", chaseId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// community
// ---------------------------------------------------------------------------

export async function fetchTopics() {
  const { data, error } = await supabase
    .from("community_topics")
    .select("slug, label, emoji")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;

  return (data ?? []).map(t => ({
    slug: t.slug as string,
    label: t.label as string,
    emoji: (t.emoji as string) ?? "",
  }));
}

export async function fetchFeed() {
  const { data, error } = await supabase
    .from("community_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  return (data ?? []).map(p => ({
    id: p.id,
    authorId: p.author_id,
    authorHandle: `@${p.author_handle}`,
    authorName: p.author_name,
    authorAvatar: resolveAvatar(p.author_avatar_path),
    authorAchievements: p.author_achievements ?? 0,
    topicSlug: p.topic_slug,
    topicLabel: p.topic_label,
    topicEmoji: p.topic_emoji,
    body: p.body,
    // Derived from real engagement. `hot_score` looked authoritative but
    // nothing server-side ever writes it, so a >=80 threshold made Trending
    // permanently empty and the Hot badge unreachable.
    hot: isHotPost(p),
    createdAt: p.created_at,
    likes: p.like_count ?? 0,
    dislikes: p.dislike_count ?? 0,
    comments: p.comment_count ?? 0,
    myReaction: p.my_reaction as "like" | "dislike" | null,
  }));
}

/** Hot = real engagement while the post is still fresh: likes and comments
 *  (comments weighted double) totalling 5+ within the last 7 days. */
function isHotPost(p: Record<string, any>): boolean {
  const ageDays = (Date.now() - Date.parse(p.created_at)) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays > 7) return false;
  return (p.like_count ?? 0) + (p.comment_count ?? 0) * 2 >= 5;
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id, profiles!comments_author_id_fkey(handle, display_name, avatar_path)")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at");
  if (error) throw error;

  return (data ?? []).map((c: Record<string, any>) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    authorId: c.author_id,
    authorHandle: `@${c.profiles?.handle ?? ""}`,
    authorName: c.profiles?.display_name ?? "",
    authorAvatar: resolveAvatar(c.profiles?.avatar_path),
  }));
}

export async function createPost(authorId: string, topicSlug: string, body: string): Promise<void> {
  const { data: topic, error: topicError } = await supabase
    .from("community_topics")
    .select("id")
    .eq("slug", topicSlug)
    .single();
  if (topicError) throw topicError;

  const { error } = await supabase
    .from("posts")
    .insert({ author_id: authorId, topic_id: topic.id, body });
  if (error) throw error;
}

/** Setting the same reaction twice clears it; switching updates in place. The
 *  counts are recomputed by the view, so they can never drift or go negative. */
export async function setPostReaction(
  postId: string,
  userId: string,
  reaction: "like" | "dislike",
  current: "like" | "dislike" | null
): Promise<void> {
  if (current === reaction) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("post_reactions")
    .upsert({ post_id: postId, user_id: userId, reaction }, { onConflict: "post_id,user_id" });
  if (error) throw error;
}

export async function addComment(postId: string, authorId: string, body: string): Promise<void> {
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: authorId,
    body,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// marketplace
// ---------------------------------------------------------------------------

export async function fetchListings() {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*, marketplace_providers(code, name), grading_companies(code)")
    .eq("status", "active")
    .order("published_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((l: Record<string, any>) => ({
    id: l.id,
    catalogCardId: l.catalog_card_id,
    title: l.title_snapshot,
    grader: l.grading_companies?.code ?? "",
    grade: l.grade != null ? String(Number(l.grade)) : "",
    price: fromMinor(l.asking_amount_minor),
    source: l.marketplace_providers?.name ?? "",
    externalUrl: (l.external_url as string | null) ?? null,
    sourceType: l.source_type as "native" | "external",
  }));
}

/**
 * Real 30-day movement per catalog card, from `market_price_snapshots`.
 *
 * The mock marketplace carried an invented `change` on every item. This derives
 * it from the oldest and newest snapshot instead, batched into one query rather
 * than one per listing. Cards without at least two snapshots simply have no
 * change to report, and are omitted rather than shown as 0%.
 */
export async function fetchPriceChanges(catalogCardIds: string[]): Promise<Map<string, number>> {
  const ids = [...new Set(catalogCardIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  // The 30-day window isn't just the semantics of the number shown — it also
  // bounds the row count. Fetching every snapshot ever would cross PostgREST's
  // silent 1000-row cap and drop the NEWEST rows, quietly corrupting the
  // computed change.
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("market_price_snapshots")
    .select("catalog_card_id, amount_minor, observed_at")
    .in("catalog_card_id", ids)
    .gte("observed_at", windowStart)
    .order("observed_at");
  if (error) throw error;

  const byCard = new Map<string, { first: number; last: number; count: number }>();
  for (const row of data ?? []) {
    const id = row.catalog_card_id as string;
    const amount = Number(row.amount_minor);
    const entry = byCard.get(id);
    if (!entry) byCard.set(id, { first: amount, last: amount, count: 1 });
    else { entry.last = amount; entry.count += 1; }
  }

  const changes = new Map<string, number>();
  for (const [id, { first, last, count }] of byCard) {
    if (count < 2 || first === 0) continue;
    changes.set(id, Math.round(((last - first) / first) * 1000) / 10);
  }
  return changes;
}

export async function fetchPriceHistory(catalogCardId: string) {
  const { data, error } = await supabase
    .from("market_price_snapshots")
    .select("amount_minor, observed_at")
    .eq("catalog_card_id", catalogCardId)
    .order("observed_at");
  if (error) throw error;

  return (data ?? []).map(p => ({
    d: new Date(p.observed_at).toLocaleDateString(undefined, { month: "short" }),
    v: fromMinor(p.amount_minor),
  }));
}

export async function fetchRecentSales(catalogCardId: string) {
  const { data, error } = await supabase
    .from("market_sale_comps")
    .select("sold_amount_minor, sold_at, marketplace_providers(name)")
    .eq("catalog_card_id", catalogCardId)
    .order("sold_at", { ascending: false })
    .limit(5);
  if (error) throw error;

  return (data ?? []).map((s: Record<string, any>) => ({
    date: new Date(s.sold_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    price: fromMinor(s.sold_amount_minor),
    source: s.marketplace_providers?.name ?? "",
  }));
}

export async function fetchWatchlist(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("catalog_card_id")
    .eq("user_id", userId)
    .not("catalog_card_id", "is", null);
  if (error) throw error;
  return (data ?? []).map(w => w.catalog_card_id as string);
}

export async function toggleWatchlist(
  userId: string,
  catalogCardId: string,
  isWatched: boolean
): Promise<void> {
  if (isWatched) {
    const { error } = await supabase
      .from("watchlist_items")
      .delete()
      .eq("user_id", userId)
      .eq("catalog_card_id", catalogCardId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("watchlist_items")
      .insert({ user_id: userId, catalog_card_id: catalogCardId });
    if (error) throw error;
  }
}

export async function fetchMyListings(sellerId: string) {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*, grading_companies(code)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((l: Record<string, any>) => ({
    id: l.id,
    copyId: l.copy_id,
    title: l.title_snapshot,
    price: fromMinor(l.asking_amount_minor),
    status: l.status as string,
    views: l.view_count ?? 0,
    shipsFrom: l.ships_from ?? "",
    createdAt: l.created_at,
  }));
}

export async function createListing(
  sellerId: string,
  copyId: string,
  input: { title: string; price: number; shipsFrom: string; catalogCardId?: string | null; graderCode?: string; grade?: string }
): Promise<void> {
  const { error } = await supabase.from("marketplace_listings").insert({
    source_type: "native",
    seller_id: sellerId,
    copy_id: copyId,
    catalog_card_id: input.catalogCardId ?? null,
    grading_company_id: input.graderCode ? await lookupGraderId(input.graderCode) : null,
    grade: input.grade ? Number(input.grade) : null,
    title_snapshot: input.title,
    asking_amount_minor: toMinor(input.price),
    ships_from: input.shipsFrom,
    status: "active",
    published_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function updateListingStatus(listingId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("marketplace_listings")
    .update({ status })
    .eq("id", listingId);
  if (error) throw error;
}

/**
 * Deletes a listing, and complains if nothing was deleted.
 *
 * `listings_delete_own` only permits draft, cancelled, or expired listings — an
 * active or sold one must not be erasable, since a sold listing may have an order
 * against it. A plain delete against a disallowed row succeeds with zero rows
 * affected, so without this check the UI would report success and change nothing.
 */
export async function removeListing(listingId: string): Promise<void> {
  const { data, error } = await supabase
    .from("marketplace_listings")
    .delete()
    .eq("id", listingId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Only cancelled or expired listings can be removed. Cancel it first.");
  }
}

// ---------------------------------------------------------------------------
// follows
// ---------------------------------------------------------------------------

/**
 * Another collector's cards. Readable only when their collection is public —
 * `card_copies_select` pairs ownership with `private.can_read_collection`, so a
 * private collection simply returns nothing rather than erroring.
 *
 * Their card images are a different matter: `card-images` is private and its
 * read policy is own-files-only, so an image a peer uploaded cannot be signed
 * by us and the tile falls back to its placeholder. Seeded demo peers use
 * bundled `local:` artwork, which resolves fine.
 */
export async function fetchPeerCards(profileId: string): Promise<DbCard[]> {
  const rows = await fetchAllCopyRows(profileId);
  const images = await signCardImages(rows.map(r => r.image_path));
  return rows.map(r => mapCard(r, images));
}

export async function fetchFollowing(followerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_follows")
    .select("followee_id")
    .eq("follower_id", followerId);
  if (error) throw error;
  return (data ?? []).map(f => f.followee_id as string);
}

export async function toggleFollow(
  followerId: string,
  followeeId: string,
  isFollowing: boolean
): Promise<void> {
  if (isFollowing) {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("followee_id", followeeId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("user_follows")
      .insert({ follower_id: followerId, followee_id: followeeId });
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// messaging
// ---------------------------------------------------------------------------

export async function fetchConversations() {
  const { data, error } = await supabase
    .from("conversation_summaries")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;

  return (data ?? []).map(c => ({
    id: c.id,
    peerId: c.peer_id,
    peerHandle: `@${c.peer_handle ?? ""}`,
    peerName: c.peer_name ?? "",
    peerAvatar: resolveAvatar(c.peer_avatar_path),
    lastBody: c.last_message_body ?? "",
    lastSenderId: c.last_message_sender_id,
    lastAt: c.last_message_at_exact,
    unread: c.unread_count ?? 0,
  }));
}

export async function fetchMessages(conversationId: string) {
  // Newest 500, then flipped back to chronological order: an unbounded
  // ascending query would be truncated by PostgREST at 1000 rows — cutting off
  // the NEWEST messages of a long thread, which is exactly the wrong end.
  const { data, error } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).reverse();
}

/** One stable thread per pair, regardless of who starts it. */
export async function openDirectConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    p_other_user_id: otherUserId,
  });
  if (error) throw error;
  return data as string;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body,
  });
  if (error) throw error;
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// achievements
// ---------------------------------------------------------------------------

export async function fetchAchievements(userId: string) {
  const [defs, earned] = await Promise.all([
    supabase.from("achievement_definitions").select("code, label, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("user_achievements").select("achievement_code").eq("user_id", userId),
  ]);
  if (defs.error) throw defs.error;
  if (earned.error) throw earned.error;

  const earnedSet = new Set((earned.data ?? []).map(e => e.achievement_code as string));
  return (defs.data ?? []).map(d => ({
    code: d.code as string,
    label: d.label as string,
    earned: earnedSet.has(d.code as string),
  }));
}

/** Re-evaluated server-side from real counts; safe to call after any mutation. */
export async function evaluateAchievements(): Promise<string[]> {
  const { data, error } = await supabase.rpc("evaluate_achievements");
  if (error) throw error;
  return (data as string[] | null) ?? [];
}
