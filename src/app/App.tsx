import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Scan, X, Plus, Share2, Search, TrendingUp, TrendingDown, Users, UserPlus, LayoutGrid, Tag, ChevronLeft, Folder, SlidersHorizontal, Trash2, FolderPlus, Menu as MenuIcon, MessageCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import type { AuthState, Card, CommunityComment, CommunityPost, DirectMessage, FolderType, Listing, MainTab, MarketItem, MessageThread, Profile } from "./types";
import { ME } from "./types";
import { ALL_CARDS, DEFAULT_FOLDERS, GRADE_LABELS } from "./data/mockCards";
import { MARKET_ITEMS } from "./data/mockMarket";
import { MOCK_POSTS } from "./data/mockPosts";
import { MOCK_THREADS } from "./data/mockThreads";
import { MILESTONES } from "./data/achievements";
import { profilePic } from "./data/cardImages";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { BackupData } from "./lib/backup";
import { computeLevel } from "./lib/level";
import { computePortfolioChangePct } from "./lib/portfolio";
import { formatCompact } from "./lib/format";
import { LoginScreen } from "./components/auth/LoginScreen";
import { AppMenu } from "./components/shared/AppMenu";
import { LevelRingAvatar } from "./components/shared/LevelRingAvatar";
import { Money } from "./components/shared/Money";
import { TierMedallions } from "./components/shared/TierMedallions";
import { CollectionDropdown } from "./components/shared/CollectionDropdown";
import { CollectionFilterMenu } from "./components/shared/CollectionFilterMenu";
import { BulkAddToFolderSheet } from "./components/cards/BulkAddToFolderSheet";
import { CardTile } from "./components/cards/CardTile";
import { CardListRow } from "./components/cards/CardListRow";
import { DetailSheet } from "./components/cards/DetailSheet";
import { EditCardSheet } from "./components/cards/EditCardSheet";
import { NewFolderSheet } from "./components/cards/NewFolderSheet";
import { EditFolderSheet } from "./components/cards/EditFolderSheet";
import { FolderDetailView } from "./components/cards/FolderDetailView";
import { SellFlow } from "./components/market/SellFlow";
import { ShareFlow } from "./components/shared/ShareFlow";
import { ConfirmDialog } from "./components/shared/ConfirmDialog";
import { AnimateIn } from "./components/shared/AnimateIn";
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

const DEFAULT_PROFILE: Profile = {
  name: "Andrew Cordle", handle: "@andrewcordle", avatar: profilePic, followers: 219,
  bio: "Collector since 2018. Focused on vintage baseball and modern graded rookies.",
  tags: ["Baseball", "Graded", "Vintage", "Rookies", "Yankees"],
  collectingSince: "2018",
  chasing: "Mickey Mantle 1952 Topps PSA 10",
};

type SortKey = "recent" | "oldest" | "value-desc" | "value-asc" | "gain-desc" | "name" | "year";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recently added" },
  { key: "oldest", label: "Oldest added" },
  { key: "value-desc", label: "Highest value" },
  { key: "value-asc", label: "Lowest value" },
  { key: "gain-desc", label: "Highest gain" },
  { key: "name", label: "Player name" },
  { key: "year", label: "Year" },
];

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [cards, setCards] = useLocalStorage<Card[]>("cardchamps:cards", ALL_CARDS);
  const [folders, setFolders] = useLocalStorage<FolderType[]>("cardchamps:folders", DEFAULT_FOLDERS);
  const [profile, setProfile] = useLocalStorage<Profile>("cardchamps:profile", DEFAULT_PROFILE);
  const [watchlist, setWatchlist] = useLocalStorage<number[]>("cardchamps:watchlist", []);
  const [following, setFollowing] = useLocalStorage<string[]>("cardchamps:following", []);
  const [listings, setListings] = useLocalStorage<Listing[]>("cardchamps:listings", []);
  const [posts, setPosts] = useLocalStorage<CommunityPost[]>("cardchamps:posts", MOCK_POSTS);
  const [threads, setThreads] = useLocalStorage<MessageThread[]>("cardchamps:threads", MOCK_THREADS);
  const [auth, setAuth] = useLocalStorage<AuthState | null>("cardchamps:auth", null);
  const [seenAchievements, setSeenAchievements] = useLocalStorage<string[]>("cardchamps:achievements-seen", []);
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
  const [selected, setSelected] = useState<Card | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [viewingPostId, setViewingPostId] = useState<number | null>(null);
  const [activeChatHandle, setActiveChatHandle] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [openFolder, setOpenFolder] = useState<FolderType | null>(null);
  const [cardQuery, setCardQuery] = useState("");
  const [cardsSubView, setCardsSubView] = useState<"cards" | "folders" | "insights">("cards");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [filterAuto, setFilterAuto] = useState(false);
  const [filterGems, setFilterGems] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [bulkPickingFolder, setBulkPickingFolder] = useState(false);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [toast, setToast] = useState("");
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [confirmingDeleteFolder, setConfirmingDeleteFolder] = useState<FolderType | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSelectMode(false);
    setSelectedCardIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsSubView]);

  useEffect(() => {
    setOpenFolder(null);
    setSelected(null);
    setEditingCard(null);
    setEditingFolder(null);
    setConfirmingDeleteFolder(null);
    setShowScan(false);
    setShowShare(false);
    setShowSell(false);
    setShowNewPost(false);
    setViewingPostId(null);
    setActiveChatHandle(null);
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
  const activeThread = activeChatHandle
    ? threads.find(t => t.peerHandle === activeChatHandle) ?? { peerHandle: activeChatHandle, messages: [] }
    : null;
  const totalValue = cards.reduce((s, c) => s + c.value, 0);
  const changePct = computePortfolioChangePct(cards);
  const levelInfo = computeLevel(seenAchievements.length);
  const followersLabel = formatCompact(profile.followers);
  const displayedCards = cardQuery
    ? cards.filter(c => c.player.toLowerCase().includes(cardQuery.toLowerCase()) || c.year.includes(cardQuery) || c.team.toLowerCase().includes(cardQuery.toLowerCase()))
    : cards;

  const watchlistMovers = MARKET_ITEMS.filter(item => watchlist.includes(item.id) && Math.abs(item.change) >= 5)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const topMover = watchlistMovers[0];
  const moverSignature = topMover ? `${topMover.id}:${topMover.change}` : null;
  const showMoverBanner = !!topMover && !!moverSignature && !dismissedMovers.includes(moverSignature);

  const filtersActive = filterAuto || filterGems;
  const visibleCards = (() => {
    let list = displayedCards;
    if (filterAuto) list = list.filter(c => c.autograph);
    if (filterGems) list = list.filter(c => c.grade === "10" || c.grade === "9.5");
    const sorted = [...list];
    switch (sortBy) {
      case "value-desc": sorted.sort((a, b) => b.value - a.value); break;
      case "value-asc": sorted.sort((a, b) => a.value - b.value); break;
      case "gain-desc": sorted.sort((a, b) => b.change - a.change); break;
      case "name": sorted.sort((a, b) => a.player.localeCompare(b.player)); break;
      case "year": sorted.sort((a, b) => a.year.localeCompare(b.year)); break;
      case "oldest": sorted.sort((a, b) => a.id - b.id); break;
      case "recent": sorted.sort((a, b) => b.id - a.id); break;
    }
    return sorted;
  })();

  const displayedFolders = cardQuery
    ? folders.filter(f => f.name.toLowerCase().includes(cardQuery.toLowerCase()))
    : folders;

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

  const myPostCount = posts.filter(p => p.authorHandle === profile.handle).length;
  const viewingPost = viewingPostId !== null ? posts.find(p => p.id === viewingPostId) ?? null : null;

  useEffect(() => {
    if (!auth?.loggedIn) return;
    const ctx = { cardCount: cards.length, folderCount: folders.length, listingCount: listings.length, watchlistCount: watchlist.length, postCount: myPostCount };
    const newlyEarned = MILESTONES.filter(m => m.check(ctx) && !seenAchievements.includes(m.id));
    if (newlyEarned.length === 0) return;
    setSeenAchievements(prev => [...prev, ...newlyEarned.map(m => m.id)]);
    showToast(`🏆 ${newlyEarned[0].label}`);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.loggedIn, cards.length, folders.length, listings.length, watchlist.length, myPostCount]);

  const handleSignIn = (email: string) => {
    setAuth({ email, loggedIn: true, isGuest: false });
  };

  const handleSignUp = (email: string) => {
    const uname = email.split("@")[0] || "collector";
    setCards([]);
    setFolders([]);
    setWatchlist([]);
    setFollowing([]);
    setListings([]);
    setSeenAchievements([]);
    setProfile({ name: uname, handle: `@${uname}`, avatar: profilePic, followers: 0 });
    setAuth({ email, loggedIn: true, isGuest: false });
  };

  const handleGuest = () => {
    setAuth({ email: "", loggedIn: true, isGuest: true });
  };

  const handleLogout = () => {
    setAuth(null);
  };

  const handleAddCard = (newCard: Card) => {
    setCards(prev => [...prev, newCard]);
  };

  const handleEditCard = (updated: Card) => {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    showToast(`Updated ${updated.player}`);
  };

  const handleDeleteCard = (id: number) => {
    const card = cards.find(c => c.id === id);
    setCards(prev => prev.filter(c => c.id !== id));
    setFolders(prev => prev.map(f => ({ ...f, cardIds: f.cardIds.filter(cid => cid !== id) })));
    setListings(prev => prev.filter(l => l.cardId !== id));
    if (card) showToast(`Deleted ${card.player}`);
  };

  const toggleCardSelect = (id: number) => {
    setSelectedCardIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDeleteCards = (ids: number[]) => {
    const idSet = new Set(ids);
    setCards(prev => prev.filter(c => !idSet.has(c.id)));
    setFolders(prev => prev.map(f => ({ ...f, cardIds: f.cardIds.filter(cid => !idSet.has(cid)) })));
    setListings(prev => prev.filter(l => !idSet.has(l.cardId)));
    showToast(`Deleted ${ids.length} card${ids.length !== 1 ? "s" : ""}`);
    setSelectMode(false);
    setSelectedCardIds([]);
  };

  const handleBulkAddToFolder = (folderId: number, ids: number[]) => {
    const folder = folders.find(f => f.id === folderId);
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, cardIds: Array.from(new Set([...f.cardIds, ...ids])) } : f));
    if (folder) showToast(`Added ${ids.length} card${ids.length !== 1 ? "s" : ""} to ${folder.name}`);
    setBulkPickingFolder(false);
    setSelectMode(false);
    setSelectedCardIds([]);
  };

  const handleUpdateFolder = (updated: FolderType) => {
    setFolders(prev => prev.map(f => f.id === updated.id ? updated : f));
    setOpenFolder(updated);
  };

  const handleCreateFolder = (name: string, color: string, thumbnail?: string, cardIds?: number[]) => {
    setFolders(prev => [...prev, { id: Date.now(), name, color, cardIds: cardIds ?? [], thumbnail }]);
  };

  const handleDeleteFolder = (folder: FolderType) => {
    setFolders(prev => prev.filter(f => f.id !== folder.id));
    setOpenFolder(null);
    showToast(`Deleted ${folder.name}`);
  };

  const handleBuy = (item: MarketItem) => {
    setCards(prev => [...prev, {
      id: Date.now(),
      img: item.img,
      player: item.player,
      year: item.year,
      brand: item.brand,
      team: "Unknown",
      grader: item.grader,
      grade: item.grade,
      gradeLabel: GRADE_LABELS[item.grade] || "",
      cert: `MKT-${item.id}-${Date.now()}`,
      value: item.price,
      change: 0,
      subGrades: null,
      autograph: false,
    }]);
    showToast(`Bought ${item.player}`);
  };

  const handleToggleWatchlist = (id: number) => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleFollow = (handle: string) => {
    setFollowing(prev => prev.includes(handle) ? prev.filter(h => h !== handle) : [...prev, handle]);
  };

  const handleCreateListing = (listing: Listing) => {
    setListings(prev => [...prev, listing]);
    showToast("Listed for sale");
  };

  const handleCreatePost = (topic: string, body: string) => {
    const newPost: CommunityPost = {
      id: Date.now(),
      authorHandle: profile.handle,
      topic,
      hot: false,
      body,
      createdAt: Date.now(),
      likes: 0,
      dislikes: 0,
      comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
    setShowNewPost(false);
    showToast("Posted to Community");
  };

  const handleTogglePostLike = (id: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const likedByMe = !p.likedByMe;
      return {
        ...p,
        likedByMe,
        likes: p.likes + (likedByMe ? 1 : -1),
        dislikedByMe: likedByMe ? false : p.dislikedByMe,
        dislikes: likedByMe && p.dislikedByMe ? p.dislikes - 1 : p.dislikes,
      };
    }));
  };

  const handleTogglePostDislike = (id: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const dislikedByMe = !p.dislikedByMe;
      return {
        ...p,
        dislikedByMe,
        dislikes: p.dislikes + (dislikedByMe ? 1 : -1),
        likedByMe: dislikedByMe ? false : p.likedByMe,
        likes: dislikedByMe && p.likedByMe ? p.likes - 1 : p.likes,
      };
    }));
  };

  const handleAddComment = (postId: number, text: string) => {
    const comment: CommunityComment = {
      id: Date.now(),
      authorHandle: profile.handle,
      body: text,
      createdAt: Date.now(),
      likes: 0,
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
  };

  const handleSendMessage = (peerHandle: string, text: string) => {
    const message: DirectMessage = { id: Date.now(), senderHandle: ME, body: text, createdAt: Date.now() };
    setThreads(prev => {
      const existing = prev.find(t => t.peerHandle === peerHandle);
      if (existing) return prev.map(t => t.peerHandle === peerHandle ? { ...t, messages: [...t.messages, message] } : t);
      return [...prev, { peerHandle, messages: [message] }];
    });
  };

  const openChat = (peerHandle: string) => setActiveChatHandle(peerHandle);

  const handleShopCard = (card: Card) => {
    setSelected(null);
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

  const handleRestore = (data: BackupData) => {
    setCards(data.cards);
    setFolders(data.folders);
    setProfile(data.profile);
    setWatchlist(data.watchlist);
    setFollowing(data.following);
    setListings(data.listings);
    showToast("Backup restored");
  };

  const handleReset = () => {
    setCards(ALL_CARDS);
    setFolders(DEFAULT_FOLDERS);
    setProfile(DEFAULT_PROFILE);
    setWatchlist([]);
    setFollowing([]);
    setListings([]);
    setPosts(MOCK_POSTS);
    setSeenAchievements([]);
    setOpenFolder(null);
    showToast("Data reset");
  };

  if (!auth?.loggedIn) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
          <LoginScreen onSignIn={handleSignIn} onSignUp={handleSignUp} onGuest={handleGuest} isDark={isDark} />
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
              onProfileChange={setProfile}
              cards={cards}
              folders={folders}
              watchlist={watchlist}
              following={following}
              listings={listings}
              onRestore={handleRestore}
              onReset={handleReset}
              seenAchievements={seenAchievements}
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
              onBuy={handleBuy}
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
              <EditProfileSheet profile={profile} onClose={() => setEditingProfile(false)} onSave={updated => { setProfile(updated); setEditingProfile(false); showToast("Profile updated"); }} />
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
            <MessagesView threads={threads} profile={profile} onBack={() => navigate("/")} onOpenChat={openChat} />
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

        <div className="flex flex-col items-center px-7 pt-14 pb-4">
          <div className="relative mb-8">
            <LevelRingAvatar avatar={profile.avatar} name={profile.name} xpFraction={levelInfo.xpFraction} />
            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -22 }}>
              <TierMedallions levelInfo={levelInfo} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-none">{profile.handle}</h1>
          <p className="text-base text-gray-400 mt-2 flex items-center gap-1.5 flex-wrap justify-center">
            <span>
              <CountUp to={cards.length} duration={1000} suffix=" cards" /> ·{" "}
              {hideValues ? <Money value={totalValue} hidden /> : <>$<CountUp to={totalValue} duration={1000} /></>}
            </span>
            <span className={`text-sm font-semibold inline-flex items-center gap-0.5 ${changePct >= 0 ? "text-emerald-500" : "text-red-400"}`}>
              {changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(changePct).toFixed(1)}%
            </span>
            <span>· {followersLabel} followers</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 px-7 mb-5">
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
                className={`flex items-center gap-2 text-base font-semibold transition-colors ${
                  active ? "pl-5 pr-4 py-3 rounded-full bg-gray-950 text-white" : "text-gray-400"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
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
                  <input value={cardQuery} onChange={e => setCardQuery(e.target.value)} placeholder="Search cards…"
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
                <button onClick={() => setShowNewFolder(true)} aria-label="New folder"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {cardsSubView === "cards" && (
              <div className="flex-1 px-7 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                {cards.length === 0 ? (
                  <div className="flex flex-col items-center text-center pt-16">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <Scan className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900">No cards yet</p>
                    <p className="text-sm text-gray-400 mt-1 mb-5 max-w-[240px]">Scan a slab or add a card to start building your collection.</p>
                    <button onClick={() => setShowScan(true)}
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
                        onClick={() => selectMode ? toggleCardSelect(card.id) : setSelected(card)}
                        selectMode={selectMode} selected={selectedCardIds.includes(card.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-50">
                    {visibleCards.map(card => (
                      <CardListRow key={card.id} card={card}
                        onClick={() => selectMode ? toggleCardSelect(card.id) : setSelected(card)}
                        selectMode={selectMode} selected={selectedCardIds.includes(card.id)} hideValues={hideValues} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {cardsSubView === "insights" && (
              <Suspense fallback={LOADING_FALLBACK}>
                <InsightsView cards={cards} />
              </Suspense>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {displayedFolders.map((folder, fi) => {
                    const folderValue = cards.filter(c => folder.cardIds.includes(c.id)).reduce((s, c) => s + c.value, 0);
                    const previewCards = cards.filter(c => folder.cardIds.includes(c.id)).slice(0, 3);
                    const offsets = [
                      { rotate: "-8deg", translate: "-26px, 6px", z: 0 },
                      { rotate: "-2deg", translate: "-4px, 0px", z: 1 },
                      { rotate: "7deg",  translate: "22px, 4px", z: 2 },
                    ];
                    return (
                      <AnimateIn key={folder.id} delay={fi * 80}>
                        <button onClick={() => setOpenFolder(folder)} className="relative w-full text-left focus:outline-none pt-2.5">
                          {/* Folder tab */}
                          <div className="absolute top-0 left-4 w-16 h-5 rounded-t-xl" style={{ background: hexToRgba(folder.color, 0.18) }} />
                          {/* Card body */}
                          <div className="relative rounded-3xl p-3" style={{ background: hexToRgba(folder.color, 0.1) }}>
                            <div className="relative rounded-2xl flex items-center justify-center overflow-hidden" style={{ height: 150, background: "rgba(255,255,255,0.6)" }}>
                              {folder.thumbnail
                                ? <img src={folder.thumbnail} alt="" className="w-full h-full" style={{ objectFit: "contain" }} draggable={false} />
                                : previewCards.length > 0
                                  ? previewCards.map((card, i) => (
                                      <img key={card.id} src={card.img} alt="" draggable={false} className="absolute"
                                        style={{ width: 92, objectFit: "contain", background: "#fff", borderRadius: 4, boxShadow: "0 4px 14px rgba(0,0,0,0.18)", transform: `rotate(${offsets[i].rotate}) translate(${offsets[i].translate})`, zIndex: offsets[i].z }} />
                                    ))
                                  : <Folder className="w-8 h-8" style={{ color: hexToRgba(folder.color, 0.5) }} />
                              }
                            </div>
                            <p className="text-sm font-bold text-gray-900 leading-tight truncate mt-3">{folder.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-400">{folder.cardIds.length} cards</p>
                              <p className="text-sm font-bold" style={{ color: folder.color }}><Money value={folderValue} hidden={hideValues} /></p>
                            </div>
                          </div>
                        </button>
                      </AnimateIn>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {openFolder && (
          <div className="absolute inset-0 bg-white flex flex-col">
            <FolderDetailView
              folder={openFolder}
              onBack={() => setOpenFolder(null)}
              allCards={cards}
              onUpdate={handleUpdateFolder}
              onEdit={() => setEditingFolder(openFolder)}
              onDelete={() => setConfirmingDeleteFolder(openFolder)}
              onEditCard={card => setEditingCard(card)}
              onDeleteCard={handleDeleteCard}
            />
          </div>
        )}

        {mainTab === "community" && (
          <Suspense fallback={LOADING_FALLBACK}>
            <CommunityView
              posts={posts}
              profile={profile}
              myTier={levelInfo.tier}
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
              following={following}
              onToggleFollow={handleToggleFollow}
              onOpenChat={openChat}
              showToast={showToast}
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
                  { label: "Scan",  icon: <Scan className="w-4 h-4" />,  active: showScan,    onClick: () => setShowScan(true)    },
                  { label: "Post",  icon: <Plus className="w-4 h-4" />,  active: showNewPost, onClick: () => setShowNewPost(true) },
                  { label: "Share", icon: <Share2 className="w-4 h-4" />, active: showShare,  onClick: () => setShowShare(true)   },
                ]
              : mainTab === "connections"
              ? [
                  { label: "Share",    icon: <Share2 className="w-4 h-4" />,        active: showShare, onClick: () => setShowShare(true)      },
                  { label: "Messages", icon: <MessageCircle className="w-4 h-4" />, active: false,      onClick: () => navigate("/messages")   },
                ]
              : [
                  { label: "Scan",  icon: <Scan className="w-4 h-4" />,   active: showScan,  onClick: () => setShowScan(true)  },
                  { label: "Share", icon: <Share2 className="w-4 h-4" />, active: showShare, onClick: () => setShowShare(true) },
                  { label: "Sell",  icon: <Tag className="w-4 h-4" />,    active: showSell,  onClick: () => setShowSell(true)  },
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
          onClose={() => setSelected(null)}
          cards={visibleCards}
          initialIndex={visibleCards.findIndex(c => c.id === selected.id)}
          onEdit={card => { setSelected(null); setEditingCard(card); }}
          onDelete={handleDeleteCard}
          onShop={handleShopCard}
        />
      )}
      {showNewFolder && (
        <NewFolderSheet
          onClose={() => setShowNewFolder(false)}
          allCards={cards}
          onCreate={handleCreateFolder}
        />
      )}
      {showScan && (
        <Suspense fallback={LOADING_FALLBACK}>
          <ScanCardSheet onClose={() => setShowScan(false)} onAdd={handleAddCard} />
        </Suspense>
      )}
      {showShare && <ShareFlow onClose={() => setShowShare(false)} allCards={cards} folders={folders} />}
      {showSell && <SellFlow onClose={() => setShowSell(false)} allCards={cards} onCreate={handleCreateListing} />}
      {showNewPost && (
        <Suspense fallback={LOADING_FALLBACK}>
          <NewPostSheet onClose={() => setShowNewPost(false)} onCreate={handleCreatePost} />
        </Suspense>
      )}
      {viewingPost && (
        <Suspense fallback={LOADING_FALLBACK}>
          <ThreadView
            post={viewingPost}
            profile={profile}
            myTier={levelInfo.tier}
            onClose={() => setViewingPostId(null)}
            onToggleLike={() => handleTogglePostLike(viewingPost.id)}
            onToggleDislike={() => handleTogglePostDislike(viewingPost.id)}
            onAddComment={text => handleAddComment(viewingPost.id, text)}
          />
        </Suspense>
      )}
      {activeThread && (
        <Suspense fallback={LOADING_FALLBACK}>
          <ChatView
            thread={activeThread}
            profile={profile}
            onBack={() => setActiveChatHandle(null)}
            onSend={text => handleSendMessage(activeThread.peerHandle, text)}
          />
        </Suspense>
      )}
      {editingCard && (
        <EditCardSheet
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleEditCard}
        />
      )}
      {editingFolder && (
        <EditFolderSheet
          folder={editingFolder}
          onClose={() => setEditingFolder(null)}
          onSave={updated => { handleUpdateFolder(updated); setEditingFolder(null); }}
        />
      )}
      {confirmingDeleteFolder && (
        <ConfirmDialog
          title="Delete this folder?"
          message={`This deletes "${confirmingDeleteFolder.name}". Cards inside it stay in your collection.`}
          confirmLabel="Delete"
          onConfirm={() => { handleDeleteFolder(confirmingDeleteFolder); setConfirmingDeleteFolder(null); }}
          onCancel={() => setConfirmingDeleteFolder(null)}
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
