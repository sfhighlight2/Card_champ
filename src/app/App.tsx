import { useCallback, useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Scan, X, Plus, Share2, Search, TrendingUp, TrendingDown, Users, UserPlus, LayoutGrid, Tag, ChevronLeft, ChevronUp, ChevronDown, Folder, SlidersHorizontal, Trash2, FolderPlus, Menu as MenuIcon, MessageCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { Card, Chase, FeedPost, FolderType, Listing, MainTab } from "./types";
import { MARKET_ITEMS } from "./data/mockMarket";
import { useAuth } from "./auth/AuthProvider";
import { useCollection } from "./data/useCollection";
import { useCommunity, usePostComments } from "./data/useCommunity";
import { usePeers } from "./data/usePeers";
import { useMessages, useConversationMessages } from "./data/useMessages";
import type { DbProfileStats } from "./data/repositories";
import type { NewCardInput } from "./data/repositories";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { computeLevel } from "./lib/level";
import { formatCompact } from "./lib/format";
import { filterCards, sortCards, SORT_OPTIONS, type SortKey } from "./lib/collectionSort";
import { LoginScreen } from "./components/auth/LoginScreen";
import { ResetPasswordScreen } from "./components/auth/ResetPasswordScreen";
import { AppMenu } from "./components/shared/AppMenu";
import { LevelRingAvatar } from "./components/shared/LevelRingAvatar";
import { Money } from "./components/shared/Money";
import { TierMedallions } from "./components/shared/TierMedallions";
import { CollectionDropdown } from "./components/shared/CollectionDropdown";
import type { CollectionSection } from "./components/shared/CollectionDropdown";
import { CollectionFilterMenu } from "./components/shared/CollectionFilterMenu";
import { BulkAddToFolderSheet } from "./components/cards/BulkAddToFolderSheet";
import { CardTile } from "./components/cards/CardTile";
import { CardListRow } from "./components/cards/CardListRow";
import { DetailSheet } from "./components/cards/DetailSheet";
import { EditCardSheet } from "./components/cards/EditCardSheet";
import { NewFolderSheet } from "./components/cards/NewFolderSheet";
import { EditFolderSheet } from "./components/cards/EditFolderSheet";
import { FolderDetailView } from "./components/cards/FolderDetailView";
import { FolderGrid } from "./components/cards/FolderGrid";
import { ChaseView } from "./components/cards/ChaseView";
import { SellFlow } from "./components/market/SellFlow";
import { ShareFlow } from "./components/shared/ShareFlow";
import { ConfirmDialog } from "./components/shared/ConfirmDialog";
import { CountUp } from "./components/shared/CountUp";

// Code-split: these pull in recharts (~charts) and @zxing/library (barcode
// scanning) which most sessions never touch on first paint, plus the two
// full route-level views — keeping them out of the main bundle.
const InsightsView = lazy(() => import("./components/cards/InsightsView").then(m => ({ default: m.InsightsView })));
const ScanCardSheet = lazy(() => import("./components/cards/ScanCardSheet").then(m => ({ default: m.ScanCardSheet })));
const MarketView = lazy(() => import("./components/market/MarketView").then(m => ({ default: m.MarketView })));
const PeersView = lazy(() => import("./components/peers/PeersView").then(m => ({ default: m.PeersView })));
const SettingsView = lazy(() => import("./components/settings/SettingsView").then(m => ({ default: m.SettingsView })));
const CommunityView = lazy(() => import("./components/community/CommunityView").then(m => ({ default: m.CommunityView })));
const NewPostSheet = lazy(() => import("./components/community/NewPostSheet").then(m => ({ default: m.NewPostSheet })));
const ThreadView = lazy(() => import("./components/community/ThreadView").then(m => ({ default: m.ThreadView })));
const MessagesView = lazy(() => import("./components/messages/MessagesView").then(m => ({ default: m.MessagesView })));
const ChatView = lazy(() => import("./components/messages/ChatView").then(m => ({ default: m.ChatView })));
const ProfileView = lazy(() => import("./components/profile/ProfileView").then(m => ({ default: m.ProfileView })));
const EditProfileSheet = lazy(() => import("./components/profile/EditProfileSheet").then(m => ({ default: m.EditProfileSheet })));

const LOADING_FALLBACK = (
  <div className="flex-1 flex items-center justify-center py-20">
    <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
  </div>
);

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    user, ready: authReady, isSignedIn, isGuest, isRecovering,
    signIn, signUp, continueAsGuest, signOut, resetPassword, updatePassword,
  } = useAuth();
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Codes the server reported as newly earned; turned into a toast once the
  // achievement labels are on hand.
  const [newlyEarned, setNewlyEarned] = useState<string[]>([]);
  const handleAchievementsEarned = useCallback((codes: string[]) => setNewlyEarned(codes), []);

  const {
    ready: collectionReady, canWrite,
    cards, folders, chases, achievements, earnedCount, profile, stats,
    addCard, editCard, deleteCard, deleteCards,
    createFolder, updateFolder, deleteFolder, addCardsToFolder,
    createChase, updateChase, deleteChase, saveProfile,
  } = useCollection({ onAchievementsEarned: handleAchievementsEarned });

  const {
    ready: communityReady, posts, topics, createPost, setReaction, addComment,
  } = useCommunity();

  const {
    ready: peersReady, myPeers, suggested, following, isFollowing, toggleFollow,
  } = usePeers();

  const {
    ready: messagesReady, conversations, unreadTotal,
    openConversation, sendMessage, markRead,
  } = useMessages();

  // Everything above is Supabase-backed. What remains local belongs to the
  // marketplace (still mock) or is genuinely device-local preference.
  const [watchlist, setWatchlist] = useLocalStorage<number[]>("cardchamps:watchlist", []);
  const [listings, setListings] = useLocalStorage<Listing[]>("cardchamps:listings", []);
  const [dismissedMovers, setDismissedMovers] = useLocalStorage<string[]>("cardchamps:watchlist-banner-dismissed", []);
  const [theme, setTheme] = useLocalStorage<"light" | "dark" | "system">("cardchamps:theme", "system");
  const [hideValues, setHideValues] = useLocalStorage<boolean>("cardchamps:privacy", false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
      setIsDark(dark);
    };
    apply();
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [theme]);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [shopInitialTab, setShopInitialTab] = useState<"browse" | "watchlist" | "listings" | undefined>(undefined);
  const [shopInitialQuery, setShopInitialQuery] = useState<string | undefined>(undefined);
  // Sheets hold ids, not row snapshots: every mutation now round-trips through
  // the server, so a captured object would go stale the moment it succeeded.
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [cardQuery, setCardQuery] = useState("");
  const [cardsSubView, setCardsSubView] = useState<CollectionSection>("cards");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [filterAuto, setFilterAuto] = useState(false);
  const [filterGems, setFilterGems] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [bulkPickingFolder, setBulkPickingFolder] = useState(false);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [toast, setToast] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [confirmingDeleteFolderId, setConfirmingDeleteFolderId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSelectMode(false);
    setSelectedCardIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsSubView]);

  useEffect(() => {
    setOpenFolderId(null);
    setSelectedCardId(null);
    setEditingCardId(null);
    setEditingFolderId(null);
    setConfirmingDeleteFolderId(null);
    setShowScan(false);
    setShowShare(false);
    setShowSell(false);
    setShowNewPost(false);
    setViewingPostId(null);
    setActiveConversationId(null);
    setEditingProfile(false);
    setShowNewFolder(false);
    setSelectMode(false);
    setSelectedCardIds([]);
    setBulkPickingFolder(false);
    setConfirmingBulkDelete(false);
    setMenuOpen(false);
    if (location.pathname !== "/marketplace") { setShopInitialTab(undefined); setShopInitialQuery(undefined); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const mainTab: MainTab = location.pathname === "/community" ? "community" : location.pathname === "/connections" ? "connections" : "collection";
  const settingsOpen = location.pathname === "/settings";
  const marketplaceOpen = location.pathname === "/marketplace";
  const profileOpen = location.pathname === "/profile";
  const messagesOpen = location.pathname === "/messages";
  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null;
  const { messages: activeMessages, isLoading: messagesLoading } = useConversationMessages(activeConversationId);

  // Peers you follow but haven't messaged, offered as a starting point.
  const peersWithConversation = new Set(conversations.map(c => c.peerId).filter(Boolean));
  const peersWithoutConversation = myPeers.filter(p => !peersWithConversation.has(p.profileId));
  // Derived collection numbers come from profile_stats, not client arithmetic.
  // While the stats query is in flight, the local sum keeps the header from
  // flashing zero.
  const cardCount = stats?.cardCount ?? cards.length;
  const totalValue = stats?.totalValue ?? cards.reduce((s, c) => s + c.value, 0);
  const changePct = stats?.changePct ?? 0;
  const levelInfo = computeLevel(earnedCount);
  const followersLabel = formatCompact(profile.followers);

  const watchlistMovers = MARKET_ITEMS.filter(item => watchlist.includes(item.id) && Math.abs(item.change) >= 5)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const topMover = watchlistMovers[0];
  const moverSignature = topMover ? `${topMover.id}:${topMover.change}` : null;
  const showMoverBanner = !!topMover && !!moverSignature && !dismissedMovers.includes(moverSignature);

  const filtersActive = filterAuto || filterGems;
  const visibleCards = sortCards(
    filterCards(cards, { query: cardQuery, autographOnly: filterAuto, gemsOnly: filterGems }),
    sortBy
  );

  const displayedFolders = cardQuery
    ? folders.filter(f => f.name.toLowerCase().includes(cardQuery.toLowerCase()))
    : folders;

  // Resolved from the live rows each render, so an edit or delete is reflected
  // in whatever sheet is open rather than lingering as a stale snapshot.
  const selected = cards.find(c => c.id === selectedCardId) ?? null;
  const editingCard = cards.find(c => c.id === editingCardId) ?? null;
  const openFolder = folders.find(f => f.id === openFolderId) ?? null;
  const editingFolder = folders.find(f => f.id === editingFolderId) ?? null;
  const confirmingDeleteFolder = folders.find(f => f.id === confirmingDeleteFolderId) ?? null;

  const handleClearFilters = () => {
    setSortBy("recent");
    setFilterAuto(false);
    setFilterGems(false);
    setView("grid");
    setHideValues(false);
    setSelectMode(false);
    setSelectedCardIds([]);
  };

  const goTab = (tab: MainTab) => navigate(tab === "collection" ? "/" : `/${tab}`);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  /** Guests authenticate as `authenticated` but every write policy rejects them,
   *  so the UI explains that up front instead of opening a sheet that fails. */
  const guardWrite = (open: () => void) => () => {
    if (!canWrite) {
      showToast("Create an account to do that");
      return;
    }
    open();
  };

  const viewingPost = viewingPostId !== null ? posts.find(p => p.id === viewingPostId) ?? null : null;
  const { comments: viewingPostComments, isLoading: commentsLoading } = usePostComments(viewingPostId);

  // The server decides what has been earned, from real counts, so the
  // celebration can only fire for something it actually recorded.
  useEffect(() => {
    if (newlyEarned.length === 0) return;
    const label = achievements.find(a => a.code === newlyEarned[0])?.label;
    showToast(`🏆 ${label ?? "Achievement unlocked"}`);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setNewlyEarned([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyEarned, achievements]);

  /** Runs a write and reports the outcome, so a rejected policy or lost
   *  connection surfaces instead of failing silently. */
  const runWrite = async (work: Promise<unknown>, success: string) => {
    try {
      await work;
      if (success) showToast(success);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      await signIn(email, password);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const { needsConfirmation } = await signUp(email, password);
      // The auth trigger provisions the profile and default collection, so
      // there is nothing for the client to seed.
      if (needsConfirmation) setAwaitingConfirmation(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not send the reset email.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGuest = async () => {
    setAuthBusy(true);
    setAuthError("");
    try {
      await continueAsGuest();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not continue as guest.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    void signOut();
  };

  const handleAddCard = (input: NewCardInput) => {
    void runWrite(addCard.mutateAsync(input), `Added ${input.player}`);
  };

  const handleEditCard = (id: string, patch: Partial<NewCardInput>) => {
    setEditingCardId(null);
    void runWrite(editCard.mutateAsync({ id, patch }), `Updated ${patch.player ?? "card"}`);
  };

  // Archiving, not deleting: ownership history and any order that referenced
  // the copy survive. Listings are still local, so they are pruned here.
  const handleDeleteCard = (id: string) => {
    const card = cards.find(c => c.id === id);
    setListings(prev => prev.filter(l => l.cardId !== id));
    void runWrite(deleteCard.mutateAsync(id), card ? `Deleted ${card.player}` : "Card deleted");
  };

  const toggleCardSelect = (id: string) => {
    setSelectedCardIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDeleteCards = (ids: string[]) => {
    const idSet = new Set(ids);
    setListings(prev => prev.filter(l => !idSet.has(l.cardId)));
    setSelectMode(false);
    setSelectedCardIds([]);
    void runWrite(deleteCards.mutateAsync(ids), `Deleted ${ids.length} card${ids.length !== 1 ? "s" : ""}`);
  };

  const handleBulkAddToFolder = (folderId: string, ids: string[]) => {
    const folder = folders.find(f => f.id === folderId);
    setBulkPickingFolder(false);
    setSelectMode(false);
    setSelectedCardIds([]);
    void runWrite(
      addCardsToFolder.mutateAsync({ folderId, cardIds: ids }),
      `Added ${ids.length} card${ids.length !== 1 ? "s" : ""}${folder ? ` to ${folder.name}` : ""}`
    );
  };

  const handleSetFolderCards = (folderId: string, cardIds: string[]) => {
    void runWrite(updateFolder.mutateAsync({ id: folderId, cardIds }), "");
  };

  const handleSetFolderThumbnail = (folderId: string, thumbnailCopyId: string | null) => {
    void runWrite(updateFolder.mutateAsync({ id: folderId, thumbnailCopyId }), "Thumbnail updated");
  };

  const handleEditFolder = (folderId: string, name: string, color: string) => {
    setEditingFolderId(null);
    void runWrite(updateFolder.mutateAsync({ id: folderId, name, color }), "Folder updated");
  };

  const handleCreateFolder = (name: string, color: string, cardIds: string[]) => {
    void runWrite(createFolder.mutateAsync({ name, color, cardIds }), `Created ${name}`);
  };

  const handleDeleteFolder = (folder: FolderType) => {
    setOpenFolderId(null);
    void runWrite(deleteFolder.mutateAsync(folder.id), `Deleted ${folder.name}`);
  };

  const handleCreateChase = (data: { title: string; description: string; pinnedCardId?: string }) => {
    void runWrite(createChase.mutateAsync(data), "Chase saved");
  };

  const handleUpdateChase = (updated: Chase) => {
    void runWrite(
      updateChase.mutateAsync({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        pinnedCardId: updated.pinnedCardId,
      }),
      "Chase updated"
    );
  };

  const handleDeleteChase = (id: string) => {
    void runWrite(deleteChase.mutateAsync(id), "Chase removed");
  };

  const handleToggleWatchlist = (id: number) => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleFollow = (peer: DbProfileStats) => {
    if (!canWrite) {
      showToast("Create an account to connect with collectors");
      return;
    }
    const following = isFollowing(peer.profileId);
    void runWrite(
      toggleFollow.mutateAsync({ profileId: peer.profileId, isFollowing: following }),
      following ? `Disconnected from @${peer.handle}` : `Connected with @${peer.handle}`
    );
  };

  const handleCreateListing = (listing: Listing) => {
    setListings(prev => [...prev, listing]);
    showToast("Listed for sale");
  };

  const handleCreatePost = (topicSlug: string, body: string) => {
    setShowNewPost(false);
    void runWrite(createPost.mutateAsync({ topicSlug, body }), "Posted to Community");
  };

  // The view recomputes the counts, so toggling can never leave them adrift.
  const handleToggleReaction = (post: FeedPost, reaction: "like" | "dislike") => {
    if (!canWrite) {
      showToast("Create an account to react");
      return;
    }
    void runWrite(
      setReaction.mutateAsync({ postId: post.id, reaction, current: post.myReaction }),
      ""
    );
  };

  const handleAddComment = (postId: string, text: string) => {
    void runWrite(addComment.mutateAsync({ postId, body: text }), "");
  };

  const handleSendMessage = (conversationId: string, text: string) => {
    void runWrite(sendMessage.mutateAsync({ conversationId, body: text }), "");
  };

  /** Resolves the pair's thread, then posts the share into it as a real message. */
  const handleShareViaDm = async (peer: DbProfileStats, message: string) => {
    try {
      const conversationId = await openConversation.mutateAsync(peer.profileId);
      await sendMessage.mutateAsync({ conversationId, body: message });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send that message");
    }
  };

  /** One stable thread per pair, resolved server-side, so opening a chat from
   *  Connections and from Messages lands in the same conversation. */
  const openChatWith = async (peer: DbProfileStats) => {
    if (!canWrite) {
      showToast("Create an account to send messages");
      return;
    }
    try {
      const conversationId = await openConversation.mutateAsync(peer.profileId);
      setActiveConversationId(conversationId);
      navigate("/messages");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not open that conversation");
    }
  };

  const handleShopCard = (card: Card) => {
    setSelectedCardId(null);
    setShopInitialTab("browse");
    setShopInitialQuery(card.player);
    navigate("/marketplace");
  };

  const handleUpdateListingStatus = (id: number, status: Listing["status"]) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    showToast(status === "sold" ? "Marked as sold" : "Listing updated");
  };

  const handleRemoveListing = (id: number) => {
    setListings(prev => prev.filter(l => l.id !== id));
    showToast("Listing removed");
  };

  // Restore and Reset used to rewrite the localStorage stores wholesale. With
  // the collection in Postgres they need the import_legacy_backup /
  // restore_portable_backup RPCs, which do not exist yet, so SettingsView
  // presents them as unavailable rather than corrupting real rows.

  if (!authReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
      </div>
    );
  }

  // Ahead of the sign-in gate: a recovery link arrives with its own session, and
  // without this the user would land on their collection with the token stranded
  // in the URL and no way to set a password.
  if (location.pathname === "/reset-password") {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
          <ResetPasswordScreen
            hasRecoverySession={isRecovering || isSignedIn}
            onSubmit={updatePassword}
            onBackToSignIn={() => navigate("/")}
            isDark={isDark}
          />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
          <LoginScreen
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            onGuest={handleGuest}
            onForgotPassword={handleForgotPassword}
            isDark={isDark}
            authError={authError}
            busy={authBusy}
            awaitingConfirmation={awaitingConfirmation}
            resetEmailSent={resetEmailSent}
          />
        </div>
      </div>
    );
  }

  if (settingsOpen) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
          <Suspense fallback={LOADING_FALLBACK}>
            <SettingsView
              onBack={() => navigate("/")}
              profile={profile}
              onProfileChange={updated => void runWrite(saveProfile.mutateAsync(updated), "Profile updated")}
              cards={cards}
              folders={folders}
              chases={chases}
              watchlist={watchlist}
              following={following}
              listings={listings}
              achievements={achievements}
              onLogout={handleLogout}
              theme={theme}
              onThemeChange={setTheme}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  if (marketplaceOpen) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
          <div className="flex items-center gap-3 px-6 pt-6 pb-2 flex-shrink-0">
            <button onClick={() => navigate("/")} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="text-base font-semibold text-gray-900">Marketplace</h2>
          </div>
          <Suspense fallback={LOADING_FALLBACK}>
            <MarketView
              allCards={cards}
              listings={listings}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onUpdateListingStatus={handleUpdateListingStatus}
              onRemoveListing={handleRemoveListing}
              initialTab={shopInitialTab}
              initialQuery={shopInitialQuery}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  if (profileOpen) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
          <Suspense fallback={LOADING_FALLBACK}>
            <ProfileView
              profile={profile}
              cards={cards}
              levelInfo={levelInfo}
              changePct={changePct}
              onBack={() => navigate("/")}
              onEdit={() => setEditingProfile(true)}
            />
          </Suspense>
          {editingProfile && (
            <Suspense fallback={LOADING_FALLBACK}>
              <EditProfileSheet
                profile={profile}
                onClose={() => setEditingProfile(false)}
                onSave={updated => {
                  setEditingProfile(false);
                  void runWrite(saveProfile.mutateAsync(updated), "Profile updated");
                }}
              />
            </Suspense>
          )}
        </div>
      </div>
    );
  }

  if (messagesOpen) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
          <Suspense fallback={LOADING_FALLBACK}>
            <MessagesView
              conversations={conversations}
              suggested={peersWithoutConversation}
              ready={messagesReady}
              currentUserId={user?.id ?? ""}
              onBack={() => navigate("/")}
              onOpenConversation={setActiveConversationId}
              onStartConversation={openChatWith}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
      <div className="relative w-full max-w-[430px] md:max-w-2xl lg:max-w-5xl flex flex-col min-h-screen bg-white overflow-hidden">

        {!openFolder && (
          <button onClick={() => setMenuOpen(true)} className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 z-10" aria-label="Menu">
            <MenuIcon className="w-4 h-4 text-gray-500" />
          </button>
        )}

        <div className="flex flex-col items-center px-7 pt-14 pb-3">
          <div className="relative mb-14">
            <LevelRingAvatar avatar={profile.avatar} name={profile.name} xpFraction={levelInfo.xpFraction} />
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -34 }}>
              <TierMedallions levelInfo={levelInfo} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-none tracking-tight">{profile.handle}</h1>
          <p className="text-[15px] font-medium text-slate-500 mt-2 flex items-center gap-1.5 flex-wrap justify-center">
            <span>
              <CountUp to={cardCount} duration={1000} suffix=" cards" />
            </span>
            <span className="text-gray-300">·</span>
            <span className="font-bold text-gray-900">
              {hideValues ? <Money value={totalValue} hidden /> : <>$<CountUp to={totalValue} duration={1000} /></>}
            </span>
            <span className={`font-bold inline-flex items-center gap-0.5 ${changePct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {changePct >= 0 ? <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" /> : <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />}
              {Math.abs(changePct).toFixed(1)}%
            </span>
            <span className="text-gray-300">·</span>
            <span>{followersLabel} followers</span>
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-1.5 px-7 md:w-auto md:justify-center md:gap-5 md:px-6 mb-4">
          <CollectionDropdown
            active={mainTab === "collection"}
            value={cardsSubView}
            onChange={setCardsSubView}
            onActivate={() => navigate("/")}
          />
          {([
            { id: "community", label: "Community", icon: Users },
            { id: "connections", label: "Connections", icon: UserPlus },
          ] as { id: MainTab; label: string; icon: typeof LayoutGrid }[]).map(({ id, label, icon: Icon }) => {
            const active = mainTab === id;
            return (
              <button key={id} onClick={() => goTab(id)}
                className={`flex flex-shrink-0 items-center gap-1.5 md:gap-2 text-xs md:text-[15px] font-semibold transition-all ${
                  active ? "pl-3 pr-2.5 py-2 rounded-full bg-[#0d0d11] text-white font-bold shadow-sm md:pl-4 md:pr-3.5 md:py-2.5" : "text-slate-400 hover:text-slate-600"
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0 text-slate-400" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {showMoverBanner && topMover && (
          <div className={`mx-7 mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl ${topMover.change > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: topMover.change > 0 ? "#10b981" : "#ef4444" }}>
              {topMover.change > 0 ? <TrendingUp className="w-4 h-4 text-white" /> : <TrendingDown className="w-4 h-4 text-white" />}
            </div>
            <button onClick={() => { setShopInitialTab("watchlist"); navigate("/marketplace"); }} className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {topMover.player} is {topMover.change > 0 ? "up" : "down"} {Math.abs(topMover.change)}%
              </p>
              <p className="text-[11px] text-gray-500">
                On your watchlist{watchlistMovers.length > 1 ? ` · +${watchlistMovers.length - 1} more moved` : ""}
              </p>
            </button>
            <button onClick={() => moverSignature && setDismissedMovers(prev => [...prev, moverSignature])}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center" aria-label="Dismiss">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        )}

        {mainTab === "collection" && (
          <>
            {cardsSubView === "cards" && (
              <div className="flex items-center gap-2 px-7 mb-4">
                <div className="flex-1 flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input value={cardQuery} onChange={e => setCardQuery(e.target.value)} placeholder="Search..."
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none" style={{ fontFamily: "'Google Sans', sans-serif" }} />
                  {cardQuery && <button onClick={() => setCardQuery("")} aria-label="Clear search"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
                </div>
                <CollectionFilterMenu
                  sortOptions={SORT_OPTIONS}
                  sortBy={sortBy}
                  onSortChange={k => setSortBy(k as SortKey)}
                  filterAuto={filterAuto}
                  onToggleAuto={setFilterAuto}
                  filterGems={filterGems}
                  onToggleGems={setFilterGems}
                  view={view}
                  onViewChange={setView}
                  selectMode={selectMode}
                  onToggleSelect={v => { setSelectMode(v); setSelectedCardIds([]); }}
                  selectAvailable={cards.length > 0}
                  hideValues={hideValues}
                  onToggleHideValues={setHideValues}
                  onClearAll={handleClearFilters}
                />
              </div>
            )}

            {cardsSubView === "folders" && (
              <div className="flex items-center gap-2 px-7 mb-4">
                <div className="flex-1 flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input value={cardQuery} onChange={e => setCardQuery(e.target.value)} placeholder="Search folders…"
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none" style={{ fontFamily: "'Google Sans', sans-serif" }} />
                  {cardQuery && <button onClick={() => setCardQuery("")} aria-label="Clear search"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
                </div>
                <button onClick={guardWrite(() => setShowNewFolder(true))} aria-label="New folder"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {cardsSubView === "cards" && (
              <div className="flex-1 px-7 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                {!collectionReady ? (
                  LOADING_FALLBACK
                ) : isGuest ? (
                  <div className="flex flex-col items-center text-center pt-16">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <UserPlus className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">Browsing as a guest</p>
                    <p className="text-sm text-gray-400 mt-1 mb-5 max-w-[260px]">
                      Create an account to start a collection of your own. You can keep browsing the community and
                      marketplace either way.
                    </p>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-gray-950 text-white text-sm font-semibold">
                      Create an account
                    </button>
                  </div>
                ) : cards.length === 0 ? (
                  <div className="flex flex-col items-center text-center pt-16">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <Scan className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">No cards yet</p>
                    <p className="text-sm text-gray-400 mt-1 mb-5 max-w-[240px]">Scan a slab or add a card to start building your collection.</p>
                    <button onClick={guardWrite(() => setShowScan(true))}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-gray-950 text-white text-sm font-semibold">
                      <Scan className="w-4 h-4" /> Scan your first card
                    </button>
                  </div>
                ) : visibleCards.length === 0 ? (
                  <div className="flex flex-col items-center text-center pt-16">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <SlidersHorizontal className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">No matches</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-[240px]">No cards match your current search or filters.</p>
                    {filtersActive && (
                      <button onClick={() => { setFilterAuto(false); setFilterGems(false); }}
                        className="mt-4 px-4 py-2 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : view === "grid" ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {visibleCards.map((card, i) => (
                      <CardTile key={card.id} card={card} index={i}
                        onClick={() => selectMode ? toggleCardSelect(card.id) : setSelectedCardId(card.id)}
                        selectMode={selectMode} selected={selectedCardIds.includes(card.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-50">
                    {visibleCards.map(card => (
                      <CardListRow key={card.id} card={card}
                        onClick={() => selectMode ? toggleCardSelect(card.id) : setSelectedCardId(card.id)}
                        selectMode={selectMode} selected={selectedCardIds.includes(card.id)} hideValues={hideValues} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {cardsSubView === "insights" && (
              <Suspense fallback={LOADING_FALLBACK}>
                <InsightsView cards={cards} changePct={changePct} />
              </Suspense>
            )}

            {cardsSubView === "chase" && (
              <ChaseView
                chases={chases}
                cards={cards}
                onCreate={handleCreateChase}
                onUpdate={handleUpdateChase}
                onDelete={handleDeleteChase}
              />
            )}

            {cardsSubView === "folders" && (
              <div className="flex-1 px-7 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                <p className="text-xs text-gray-400 mb-3">{displayedFolders.length} folder{displayedFolders.length !== 1 ? "s" : ""}</p>
                {displayedFolders.length === 0 && (
                  <div className="flex flex-col items-center text-center pt-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <Folder className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">{cardQuery ? "No folders found" : "No folders yet"}</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-[240px]">{cardQuery ? "Try a different search." : "Tap + to create your first folder."}</p>
                  </div>
                )}
                <FolderGrid
                  folders={displayedFolders}
                  cards={cards}
                  hideValues={hideValues}
                  onOpen={folder => setOpenFolderId(folder.id)}
                />
              </div>
            )}
          </>
        )}

        {openFolder && (
          <div className="absolute inset-0 bg-white flex flex-col">
            <FolderDetailView
              folder={openFolder}
              onBack={() => setOpenFolderId(null)}
              allCards={cards}
              onSetCards={cardIds => handleSetFolderCards(openFolder.id, cardIds)}
              onSetThumbnail={copyId => handleSetFolderThumbnail(openFolder.id, copyId)}
              onEdit={() => setEditingFolderId(openFolder.id)}
              onDelete={() => setConfirmingDeleteFolderId(openFolder.id)}
              onEditCard={card => setEditingCardId(card.id)}
              onDeleteCard={handleDeleteCard}
            />
          </div>
        )}

        {mainTab === "community" && (
          <Suspense fallback={LOADING_FALLBACK}>
            <CommunityView
              posts={posts}
              topics={topics}
              ready={communityReady}
              onOpenPost={post => setViewingPostId(post.id)}
              showToast={showToast}
            />
          </Suspense>
        )}
        {mainTab === "connections" && (
          <Suspense fallback={LOADING_FALLBACK}>
            <PeersView
              allCards={cards}
              folders={folders}
              myPeers={myPeers}
              suggested={suggested}
              ready={peersReady}
              isFollowing={isFollowing}
              onToggleFollow={handleToggleFollow}
              onOpenChat={openChatWith}
              onShareViaDm={handleShareViaDm}
            />
          </Suspense>
        )}

        {selectMode ? (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2.5 rounded-full bg-gray-950 z-40" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <button onClick={() => { setSelectMode(false); setSelectedCardIds([]); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 flex-shrink-0" aria-label="Cancel selection">
              <X className="w-4 h-4 text-white" />
            </button>
            <span className="text-xs font-semibold text-white/70 px-1 whitespace-nowrap">{selectedCardIds.length} selected</span>
            <button onClick={() => setBulkPickingFolder(true)} disabled={selectedCardIds.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-opacity">
              <FolderPlus className="w-4 h-4" />Add
            </button>
            <button onClick={() => setConfirmingBulkDelete(true)} disabled={selectedCardIds.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold text-red-400 disabled:opacity-40 transition-opacity">
              <Trash2 className="w-4 h-4" />Delete
            </button>
          </div>
        ) : (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2.5 rounded-full bg-white z-40" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            {(mainTab === "community"
              ? [
                  { label: "Scan",  icon: <Scan className="w-4 h-4" />,  active: showScan,    onClick: guardWrite(() => setShowScan(true))    },
                  { label: "Post",  icon: <Plus className="w-4 h-4" />,  active: showNewPost, onClick: guardWrite(() => setShowNewPost(true)) },
                  { label: "Share", icon: <Share2 className="w-4 h-4" />, active: showShare,  onClick: () => setShowShare(true)   },
                ]
              : mainTab === "connections"
              ? [
                  { label: "Share",    icon: <Share2 className="w-4 h-4" />,        active: showShare, onClick: () => setShowShare(true)      },
                  {
                    label: unreadTotal > 0 ? `Messages (${unreadTotal > 9 ? "9+" : unreadTotal})` : "Messages",
                    icon: <MessageCircle className="w-4 h-4" />,
                    active: false,
                    onClick: () => navigate("/messages"),
                  },
                ]
              : [
                  { label: "Scan",  icon: <Scan className="w-4 h-4" />,   active: showScan,  onClick: guardWrite(() => setShowScan(true))  },
                  { label: "Share", icon: <Share2 className="w-4 h-4" />, active: showShare, onClick: () => setShowShare(true) },
                  { label: "Sell",  icon: <Tag className="w-4 h-4" />,    active: showSell,  onClick: guardWrite(() => setShowSell(true))  },
                ]
            ).map(btn => (
              <button key={btn.label} onClick={btn.onClick}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold active:opacity-70 transition-all"
                style={{ background: btn.active ? "#111" : "transparent", color: btn.active ? "#fff" : "#374151", border: btn.active ? "none" : "1px solid #e5e7eb" }}>
                {btn.icon}{btn.label}
              </button>
            ))}
          </div>
        )}

        {toast && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-gray-950 text-white text-xs font-semibold shadow-lg whitespace-nowrap z-50">
            {toast}
          </div>
        )}
      </div>

      {menuOpen && (
        <AppMenu
          onClose={() => setMenuOpen(false)}
          levelInfo={levelInfo}
          onProfile={() => { setMenuOpen(false); navigate("/profile"); }}
          onSettings={() => { setMenuOpen(false); navigate("/settings"); }}
          onInvestmentOverview={() => { setMenuOpen(false); setCardsSubView("insights"); navigate("/"); }}
          onWatchlist={() => { setMenuOpen(false); setShopInitialTab("watchlist"); navigate("/marketplace"); }}
          onMarketplace={() => { setMenuOpen(false); setShopInitialTab("browse"); navigate("/marketplace"); }}
          onMessages={() => { setMenuOpen(false); navigate("/messages"); }}
          onSignOut={() => { setMenuOpen(false); handleLogout(); }}
        />
      )}

      {selected && (
        <DetailSheet
          onClose={() => setSelectedCardId(null)}
          cards={visibleCards}
          initialIndex={visibleCards.findIndex(c => c.id === selected.id)}
          onEdit={card => { setSelectedCardId(null); setEditingCardId(card.id); }}
          onDelete={handleDeleteCard}
          onShop={handleShopCard}
        />
      )}
      {showNewFolder && (
        <NewFolderSheet
          onClose={() => setShowNewFolder(false)}
          allCards={cards}
          onCreate={(name, color, cardIds) => handleCreateFolder(name, color, cardIds)}
        />
      )}
      {showScan && (
        <Suspense fallback={LOADING_FALLBACK}>
          <ScanCardSheet onClose={() => setShowScan(false)} onAdd={handleAddCard} />
        </Suspense>
      )}
      {showShare && (
        <ShareFlow
          onClose={() => setShowShare(false)}
          allCards={cards}
          folders={folders}
          dmPeers={myPeers}
          onShareViaDm={handleShareViaDm}
        />
      )}
      {showSell && <SellFlow onClose={() => setShowSell(false)} allCards={cards} onCreate={handleCreateListing} />}
      {showNewPost && (
        <Suspense fallback={LOADING_FALLBACK}>
          <NewPostSheet onClose={() => setShowNewPost(false)} topics={topics} onCreate={handleCreatePost} />
        </Suspense>
      )}
      {viewingPost && (
        <Suspense fallback={LOADING_FALLBACK}>
          <ThreadView
            post={viewingPost}
            comments={viewingPostComments}
            commentsLoading={commentsLoading}
            profile={profile}
            canWrite={canWrite}
            onClose={() => setViewingPostId(null)}
            onToggleLike={() => handleToggleReaction(viewingPost, "like")}
            onToggleDislike={() => handleToggleReaction(viewingPost, "dislike")}
            onAddComment={text => handleAddComment(viewingPost.id, text)}
          />
        </Suspense>
      )}
      {activeConversation && (
        <Suspense fallback={LOADING_FALLBACK}>
          <ChatView
            conversation={activeConversation}
            messages={activeMessages}
            isLoading={messagesLoading}
            currentUserId={user?.id ?? ""}
            onBack={() => setActiveConversationId(null)}
            onSend={text => handleSendMessage(activeConversation.id, text)}
            onMarkRead={() => markRead.mutate(activeConversation.id)}
          />
        </Suspense>
      )}
      {editingCard && (
        <EditCardSheet
          card={editingCard}
          onClose={() => setEditingCardId(null)}
          onSave={patch => handleEditCard(editingCard.id, patch)}
        />
      )}
      {editingFolder && (
        <EditFolderSheet
          folder={editingFolder}
          onClose={() => setEditingFolderId(null)}
          onSave={(name, color) => handleEditFolder(editingFolder.id, name, color)}
        />
      )}
      {confirmingDeleteFolder && (
        <ConfirmDialog
          title="Delete this folder?"
          message={`This deletes "${confirmingDeleteFolder.name}". Cards inside it stay in your collection.`}
          confirmLabel="Delete"
          onConfirm={() => { handleDeleteFolder(confirmingDeleteFolder); setConfirmingDeleteFolderId(null); }}
          onCancel={() => setConfirmingDeleteFolderId(null)}
        />
      )}
      {bulkPickingFolder && (
        <BulkAddToFolderSheet
          folders={folders}
          count={selectedCardIds.length}
          onClose={() => setBulkPickingFolder(false)}
          onPick={folderId => handleBulkAddToFolder(folderId, selectedCardIds)}
        />
      )}
      {confirmingBulkDelete && (
        <ConfirmDialog
          title={`Delete ${selectedCardIds.length} card${selectedCardIds.length !== 1 ? "s" : ""}?`}
          message="This removes the selected cards from your collection, any folders, and any active listings."
          confirmLabel="Delete"
          onConfirm={() => { handleBulkDeleteCards(selectedCardIds); setConfirmingBulkDelete(false); }}
          onCancel={() => setConfirmingBulkDelete(false)}
        />
      )}
    </div>
  );
}
