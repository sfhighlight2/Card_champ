import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Grid3X3, List, Scan, X, Plus, Share2, Search, TrendingUp, Users, LayoutGrid, Tag, Settings as SettingsIcon,
} from "lucide-react";
import type { Card, FolderType, Listing, MainTab, MarketItem, Profile } from "./types";
import { ALL_CARDS, DEFAULT_FOLDERS, GRADE_LABELS } from "./data/mockCards";
import { profilePic } from "./data/cardImages";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { BackupData } from "./lib/backup";
import { CardTile } from "./components/cards/CardTile";
import { CardListRow } from "./components/cards/CardListRow";
import { DetailSheet } from "./components/cards/DetailSheet";
import { ScanCardSheet } from "./components/cards/ScanCardSheet";
import { EditCardSheet } from "./components/cards/EditCardSheet";
import { NewFolderSheet } from "./components/cards/NewFolderSheet";
import { EditFolderSheet } from "./components/cards/EditFolderSheet";
import { FolderDetailView } from "./components/cards/FolderDetailView";
import { MarketView } from "./components/market/MarketView";
import { SellFlow } from "./components/market/SellFlow";
import { PeersView } from "./components/peers/PeersView";
import { SettingsView } from "./components/settings/SettingsView";
import { ShareFlow } from "./components/shared/ShareFlow";
import { ConfirmDialog } from "./components/shared/ConfirmDialog";
import { AnimateIn } from "./components/shared/AnimateIn";
import { CountUp } from "./components/shared/CountUp";

const DEFAULT_PROFILE: Profile = { name: "Andrew Cordle", handle: "@andrewcordle", avatar: profilePic, followers: 219 };

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [cards, setCards] = useLocalStorage<Card[]>("cardchamps:cards", ALL_CARDS);
  const [folders, setFolders] = useLocalStorage<FolderType[]>("cardchamps:folders", DEFAULT_FOLDERS);
  const [profile, setProfile] = useLocalStorage<Profile>("cardchamps:profile", DEFAULT_PROFILE);
  const [watchlist, setWatchlist] = useLocalStorage<number[]>("cardchamps:watchlist", []);
  const [following, setFollowing] = useLocalStorage<string[]>("cardchamps:following", []);
  const [listings, setListings] = useLocalStorage<Listing[]>("cardchamps:listings", []);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Card | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [openFolder, setOpenFolder] = useState<FolderType | null>(null);
  const [cardQuery, setCardQuery] = useState("");
  const [cardsSubView, setCardsSubView] = useState<"cards" | "folders">("cards");
  const [toast, setToast] = useState("");
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [confirmingDeleteFolder, setConfirmingDeleteFolder] = useState<FolderType | null>(null);

  useEffect(() => {
    setOpenFolder(null);
    setSelected(null);
    setEditingCard(null);
    setEditingFolder(null);
    setConfirmingDeleteFolder(null);
    setShowScan(false);
    setShowShare(false);
    setShowSell(false);
    setShowNewFolder(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const mainTab: MainTab = location.pathname === "/shop" ? "shop" : location.pathname === "/peers" ? "peers" : "cards";
  const settingsOpen = location.pathname === "/settings";
  const totalValue = cards.reduce((s, c) => s + c.value, 0);
  const displayedCards = cardQuery
    ? cards.filter(c => c.player.toLowerCase().includes(cardQuery.toLowerCase()) || c.year.includes(cardQuery) || c.team.toLowerCase().includes(cardQuery.toLowerCase()))
    : cards;

  const goTab = (tab: MainTab) => navigate(tab === "cards" ? "/" : `/${tab}`);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
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
    if (card) showToast(`Deleted ${card.player}`);
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
    setOpenFolder(null);
    showToast("Data reset");
  };

  if (settingsOpen) {
    return (
      <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
        <div className="relative w-full max-w-[430px] md:max-w-2xl flex flex-col min-h-screen bg-white overflow-hidden">
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
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
      <div className="relative w-full max-w-[430px] md:max-w-2xl lg:max-w-5xl flex flex-col min-h-screen bg-white overflow-hidden">

        <button onClick={() => navigate("/settings")} className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 z-10">
          <SettingsIcon className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex flex-col items-center px-7 pt-16 pb-5 md:flex-row md:items-center md:justify-center md:gap-6 md:pt-12">
          <div className="relative mb-3 md:mb-0">
            <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-full object-cover" />
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full border-2 border-white flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9a84c 0%, #e8c96e 50%, #b8903c 100%)" }}>
              <span className="text-[9px] font-black text-white tracking-widest">PRO</span>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-xl font-semibold text-gray-900 leading-none">{profile.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm text-gray-400">{profile.handle}</span>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-sm text-gray-500 font-medium">{profile.followers} <span className="text-gray-400 font-normal">followers</span></span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-base text-gray-400">
                <CountUp to={cards.length} duration={1000} suffix=" cards" /> · Value $<CountUp to={totalValue} duration={1000} />
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 px-7 mb-5">
          {([
            { id: "cards", label: "Cards", icon: LayoutGrid },
            { id: "shop", label: "Shop", icon: TrendingUp },
            { id: "peers", label: "Peers", icon: Users },
          ] as { id: MainTab; label: string; icon: typeof LayoutGrid }[]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => goTab(id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ background: mainTab === id ? "#111" : "transparent", color: mainTab === id ? "#fff" : "#bbb" }}>
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {mainTab === "cards" && (
          <>
            <div className="flex items-center justify-between px-7 mb-2">
              <div className="flex-1 flex items-center gap-2 mr-2 rounded-xl bg-gray-100 px-3 py-2">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  value={cardQuery}
                  onChange={e => setCardQuery(e.target.value)}
                  placeholder="Search cards…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }}
                />
                {cardQuery && <button onClick={() => setCardQuery("")}><X className="w-3 h-3 text-gray-400" /></button>}
              </div>
              <div className="flex gap-1">
                {(["grid", "list"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors" style={{ background: view === v ? "#111" : "transparent" }}>
                    {v === "grid" ? <Grid3X3 className="w-3.5 h-3.5" style={{ color: view === v ? "#fff" : "#ccc" }} /> : <List className="w-3.5 h-3.5" style={{ color: view === v ? "#fff" : "#ccc" }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 px-7 mb-4">
              {(["cards", "folders"] as const).map(s => (
                <button key={s} onClick={() => setCardsSubView(s)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors"
                  style={{ background: cardsSubView === s ? "#111" : "transparent", color: cardsSubView === s ? "#fff" : "#bbb" }}>
                  {s === "cards" ? "Cards" : "Folders"}
                </button>
              ))}
            </div>

            {cardsSubView === "cards" && (
              <div className="flex-1 px-7 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                {view === "grid" ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {displayedCards.map((card, i) => <CardTile key={card.id} card={card} index={i} onClick={() => setSelected(card)} />)}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-50">
                    {displayedCards.map(card => <CardListRow key={card.id} card={card} onClick={() => setSelected(card)} />)}
                  </div>
                )}
              </div>
            )}

            {cardsSubView === "folders" && (
              <div className="flex-1 px-7 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400">{folders.length} folder{folders.length !== 1 ? "s" : ""}</p>
                  <button onClick={() => setShowNewFolder(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none">
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {folders.map((folder, fi) => {
                    const folderValue = cards.filter(c => folder.cardIds.includes(c.id)).reduce((s, c) => s + c.value, 0);
                    const previewCards = cards.filter(c => folder.cardIds.includes(c.id)).slice(0, 3);
                    const offsets = [
                      { rotate: "-10deg", translate: "-18px, 4px", z: 0 },
                      { rotate: "-3deg",  translate: "-4px, 2px",  z: 1 },
                      { rotate: "6deg",   translate: "12px, 0px",  z: 2 },
                    ];
                    return (
                      <AnimateIn key={folder.id} delay={fi * 80}>
                        <button onClick={() => setOpenFolder(folder)} className="rounded-2xl overflow-hidden focus:outline-none w-full" style={{ background: folder.color }}>
                          <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ height: "90px", background: `linear-gradient(160deg, ${folder.color} 0%, ${folder.color}cc 40%, #ffffff 100%)` }}>
                            {folder.thumbnail
                              ? <img src={folder.thumbnail} alt="" className="w-full h-full" style={{ objectFit: "contain" }} draggable={false} />
                              : previewCards.length > 0
                                ? previewCards.map((card, i) => (
                                    <img key={card.id} src={card.img} alt="" draggable={false} className="absolute"
                                      style={{ width: 62, objectFit: "contain", background: "#f4f4f5", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", transform: `rotate(${offsets[i].rotate}) translate(${offsets[i].translate})`, zIndex: offsets[i].z }} />
                                  ))
                                : null
                            }
                          </div>
                          <div className="px-3 py-2.5" style={{ background: "rgba(0,0,0,0.18)" }}>
                            <p className="text-xs font-semibold text-white leading-tight truncate">{folder.name}</p>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] text-white/60">{folder.cardIds.length} cards · eBay</p>
                              <p className="text-xs font-semibold text-white">${folderValue.toLocaleString()}</p>
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
          <div className="absolute inset-0 bg-white flex flex-col z-20">
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

        {mainTab === "shop" && (
          <MarketView
            allCards={cards}
            listings={listings}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onBuy={handleBuy}
          />
        )}
        {mainTab === "peers" && (
          <PeersView
            allCards={cards}
            folders={folders}
            following={following}
            onToggleFollow={handleToggleFollow}
            showToast={showToast}
          />
        )}

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2.5 rounded-full bg-white z-40" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
          {[
            { label: "Scan",  icon: <Scan className="w-4 h-4" />,   active: showScan,  onClick: () => setShowScan(true)  },
            { label: "Share", icon: <Share2 className="w-4 h-4" />, active: showShare, onClick: () => setShowShare(true) },
            { label: "Sell",  icon: <Tag className="w-4 h-4" />,    active: showSell,  onClick: () => setShowSell(true)  },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold active:opacity-70 transition-all"
              style={{ background: btn.active ? "#111" : "transparent", color: btn.active ? "#fff" : "#374151", border: btn.active ? "none" : "1px solid #e5e7eb" }}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>

        {toast && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-gray-950 text-white text-xs font-semibold shadow-lg whitespace-nowrap z-50">
            {toast}
          </div>
        )}
      </div>

      {selected && (
        <DetailSheet
          onClose={() => setSelected(null)}
          cards={displayedCards}
          initialIndex={displayedCards.findIndex(c => c.id === selected.id)}
          onEdit={card => { setSelected(null); setEditingCard(card); }}
          onDelete={handleDeleteCard}
        />
      )}
      {showNewFolder && (
        <NewFolderSheet
          onClose={() => setShowNewFolder(false)}
          allCards={cards}
          onCreate={handleCreateFolder}
        />
      )}
      {showScan && <ScanCardSheet onClose={() => setShowScan(false)} onAdd={handleAddCard} />}
      {showShare && <ShareFlow onClose={() => setShowShare(false)} allCards={cards} folders={folders} />}
      {showSell && <SellFlow onClose={() => setShowSell(false)} allCards={cards} onCreate={handleCreateListing} />}
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
    </div>
  );
}
