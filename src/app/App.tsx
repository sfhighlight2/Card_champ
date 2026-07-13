import { useState, useRef, useCallback } from "react";
import { Grid3X3, List, Scan, X, ChevronRight, Folder, ChevronLeft, Plus, Share2, Link, Mail, MessageCircle, Check, Search, TrendingUp, Users, LayoutGrid, Tag, Star, Trophy, Heart, Zap, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import profilePic from "@/imports/image-1.png";
import loganPaul from "@/imports/logan_paul.jpg";
import barbaraCorcoran from "@/imports/barbara_corcoran.jpeg";
import garyVee from "@/imports/gary_vee.png";
import kevinOLeary from "@/imports/kevin_o_leary.png";
import card1 from "@/imports/CARD_1-1.png";
import card2 from "@/imports/CARD_2-3.png";
import card3 from "@/imports/CARD_3-1.png";
import card4 from "@/imports/CARD_4-1.png";
import card5 from "@/imports/CARD_5-1.png";
import card6 from "@/imports/CARD_6-1.png";
import card7 from "@/imports/CARD_7.png";
import card8 from "@/imports/CARD_8.png";
import card9 from "@/imports/CARD_9.png";
import card10 from "@/imports/CARD_10.png";
import card11 from "@/imports/CARD_11.png";
import card12 from "@/imports/CARD_12.png";

const ALL_CARDS = [
  { id: 1,  img: card1,  player: "Bo Jackson",       year: "1986", brand: "Topps",        team: "Royals",   grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 320,  change: +4,  subGrades: null,                                                              autograph: false, popReport: 4821, sellPrice: 380  },
  { id: 2,  img: card2,  player: "Bo Jackson",       year: "1986", brand: "Topps Traded", team: "Royals",   grader: "PSA",  grade: "10",  gradeLabel: "Gem Mint", cert: "22365223",  value: 1745, change: +7,  subGrades: null,                                                              autograph: false, popReport: 1152, sellPrice: 2000 },
  { id: 3,  img: card3,  player: "Rickey Henderson", year: "1980", brand: "Topps",        team: "Athletics",grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 185,  change: -2,  subGrades: null,                                                              autograph: false, popReport: 3290, sellPrice: 210  },
  { id: 4,  img: card4,  player: "Gary Nolan",       year: "1978", brand: "Topps",        team: "Angels",   grader: "BGS",  grade: "9",   gradeLabel: "Mint",     cert: "004295496", value: 95,   change: +1,  subGrades: { centering: "9", corners: "9.5", edges: "9.5", surface: "10" }, autograph: true,  popReport: 88,   sellPrice: 115  },
  { id: 5,  img: card5,  player: "John Montague",    year: "1978", brand: "Topps",        team: "Mariners", grader: "FWrk", grade: "9",   gradeLabel: "Mint",     cert: "FW-2023-001",value: 42,  change: 0,   subGrades: { centering: "9.5", corners: "8.5", edges: "9", surface: "9" },  autograph: false, popReport: 142,  sellPrice: 50   },
  { id: 6,  img: card6,  player: "Bo Jackson",       year: "1986", brand: "Topps",        team: "Royals",   grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264765", value: 310,  change: +3,  subGrades: null,                                                              autograph: false, popReport: 4821, sellPrice: 365  },
  { id: 7,  img: card7,  player: "Shohei Ohtani",    year: "2022", brand: "Bowman",       team: "Dodgers",  grader: "FWrk", grade: "9.5", gradeLabel: "Mint+",    cert: "5625404",   value: 890,  change: +22, subGrades: null,                                                              autograph: false, popReport: 2104, sellPrice: 1050 },
  { id: 8,  img: card8,  player: "Mickey Mantle",    year: "1952", brand: "Topps",        team: "Yankees",  grader: "SGC",  grade: "9.5", gradeLabel: "Mint+",    cert: "364764",    value: 4200, change: +8,  subGrades: { centering: "9.5", corners: "9.5", edges: "9.5", surface: "9.5" },autograph: false, popReport: 23,   sellPrice: 4800 },
  { id: 9,  img: card9,  player: "Mickey Mantle",    year: "1954", brand: "Bowman",       team: "Yankees",  grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264764", value: 620,  change: +5,  subGrades: null,                                                              autograph: false, popReport: 312,  sellPrice: 720  },
  { id: 10, img: card10, player: "Mickey Hatcher",   year: "1986", brand: "Fleer",        team: "Rangers",  grader: "FWrk", grade: "9.5", gradeLabel: "Mint+",    cert: "5625405",   value: 38,   change: 0,   subGrades: null,                                                              autograph: false, popReport: 67,   sellPrice: 45   },
  { id: 11, img: card11, player: "Jim York",         year: "1975", brand: "Topps",        team: "Astros",   grader: "SGC",  grade: "9.5", gradeLabel: "Mint+",    cert: "364765",    value: 55,   change: +1,  subGrades: { centering: "9.5", corners: "9.5", edges: "9.5", surface: "9.5" },autograph: false, popReport: 44,   sellPrice: 65   },
  { id: 12, img: card12, player: "Don Baylor",       year: "1975", brand: "Topps",        team: "Orioles",  grader: "PSA",  grade: "1",   gradeLabel: "Good",     cert: "068264766", value: 42,   change: -1,  subGrades: null,                                                              autograph: false, popReport: 1876, sellPrice: 48   },
];

const GRADER_COLOR: Record<string, string> = {
  PSA:  "#E01F26",
  BGS:  "#1A1A1A",
  CGC:  "#1D4FA1",
  SGC:  "#111111",
  TAG:  "#6B7280",
  FWrk: "#111111",
};

type Card = typeof ALL_CARDS[0];
type MainTab = "cards" | "shop" | "peers";

interface FolderType {
  id: number;
  name: string;
  color: string;
  cardIds: number[];
  thumbnail?: string;
}

const FOLDER_COLORS = ["#111", "#1a6cc4", "#c9a84c", "#c42020", "#2a9d8f", "#e76f51", "#6a4c93"];

// ── Share sheet ──────────────────────────────────────────────────────────────

interface ShareTarget {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

function ShareSheet({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const targets: ShareTarget[] = [
    {
      label: "Copy Link",
      subtitle: "Anyone with the link can view",
      icon: copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link className="w-4 h-4 text-gray-700" />,
      action: copy,
    },
    {
      label: "Messages",
      subtitle: "Send via iMessage or SMS",
      icon: <MessageCircle className="w-4 h-4 text-green-500" />,
      action: onClose,
    },
    {
      label: "Email",
      subtitle: "Share as an email",
      icon: <Mail className="w-4 h-4 text-blue-500" />,
      action: onClose,
    },
    {
      label: "More options",
      subtitle: "Instagram, Twitter & more",
      icon: <Share2 className="w-4 h-4 text-gray-400" />,
      action: onClose,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="mt-auto rounded-t-3xl bg-white overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 mb-1">
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Preview header */}
        <div className="px-6 pt-3 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Share options */}
        <div className="px-6 py-3 pb-10">
          {targets.map((t, i) => (
            <button
              key={i}
              onClick={t.action}
              className="w-full flex items-center gap-4 py-3.5 text-left focus:outline-none"
              style={{ borderBottom: i < targets.length - 1 ? "1px solid #f4f4f5" : "none" }}
            >
              <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 3D tilt ──────────────────────────────────────────────────────────────────

function use3DTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const applyTilt = useCallback((clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    setStyle({
      transform: `perspective(600px) rotateX(${(y - 0.5) * -20}deg) rotateY(${(x - 0.5) * 20}deg) scale3d(1.04,1.04,1.04)`,
      transition: "transform 0.05s ease",
      "--glare-x": `${Math.round(x * 100)}%`,
      "--glare-y": `${Math.round(y * 100)}%`,
    } as React.CSSProperties);
  }, []);

  const resetTilt = useCallback(() => {
    setStyle({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)", transition: "transform 0.4s ease" });
  }, []);

  // Attach touch listeners directly so we can use { passive: false }
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      applyTilt(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => resetTilt();
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [applyTilt, resetTilt]);

  const onMouseMove  = useCallback((e: React.MouseEvent) => applyTilt(e.clientX, e.clientY), [applyTilt]);
  const onMouseLeave = useCallback(() => resetTilt(), [resetTilt]);

  return { ref, style, onMouseMove, onMouseLeave };
}

// ── Card tile ────────────────────────────────────────────────────────────────

function CardTile({ card, onClick, index = 0 }: { card: Card; onClick: () => void; index?: number }) {
  const tilt = use3DTilt();
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    if (spinning) return;
    setSpinning(true);
  };

  return (
    <>
      <style>{`
        @keyframes cardFlip { 0%{transform:perspective(600px) rotateY(0deg) scale(1)} 50%{transform:perspective(600px) rotateY(180deg) scale(1.06)} 100%{transform:perspective(600px) rotateY(360deg) scale(1)} }
        @keyframes cardEnter { 0%{opacity:0;transform:perspective(600px) translateY(48px) rotateX(24deg) scale(0.92)} 100%{opacity:1;transform:perspective(600px) translateY(0) rotateX(0deg) scale(1)} }
      `}</style>
      <button
        onClick={handleClick}
        className="focus:outline-none w-full"
        style={{ perspective: "600px", animation: `cardEnter 0.6s cubic-bezier(0.22,1,0.36,1) both`, animationDelay: `${index * 70}ms` }}
      >
        <div
          ref={spinning ? undefined : tilt.ref}
          style={spinning
            ? { animation: "cardFlip 0.45s cubic-bezier(0.4,0,0.2,1) forwards", willChange: "transform" }
            : { ...tilt.style, transformStyle: "preserve-3d", willChange: "transform" }
          }
          onMouseMove={spinning ? undefined : tilt.onMouseMove}
          onMouseLeave={spinning ? undefined : tilt.onMouseLeave}
          onAnimationEnd={() => { setSpinning(false); onClick(); }}
          className="relative w-full overflow-hidden"
        >
        {card.img
          ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
          : <div className="w-full flex flex-col items-center justify-center gap-1 px-1" style={{ background: GRADER_COLOR[card.grader] || "#888", aspectRatio: "2.5/3.5" }}>
              <span className="text-white font-semibold text-[10px] text-center leading-tight">{card.player}</span>
              <span className="text-white/70 text-[9px]">{card.year}</span>
              <span className="text-white font-black text-xl leading-none">{card.grade}</span>
              <span className="text-white/70 text-[9px]">{card.grader}</span>
            </div>
        }
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.18) 0%, transparent 65%)" }} />
        </div>
      </button>
    </>
  );
}

// ── Card list row ────────────────────────────────────────────────────────────

function CardListRow({ card, onClick }: { card: Card; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 py-2.5 focus:outline-none">
      <img src={card.img} alt={card.player} className="w-11 flex-shrink-0" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{card.player}</p>
        <p className="text-xs text-gray-400 mt-0.5">{card.year} · {card.brand} · {card.team}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: GRADER_COLOR[card.grader] || "#111" }}>
          {card.grader} {card.grade}
        </span>
        <span className="text-sm font-semibold text-gray-800">${card.value}</span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
    </button>
  );
}

// ── Detail sheet ─────────────────────────────────────────────────────────────

function DetailSheet({ card, onClose, isPeer = false, cards = [], initialIndex = 0 }: { card?: Card; onClose: () => void; isPeer?: boolean; cards?: Card[]; initialIndex?: number }) {
  const [idx, setIdx] = useState(initialIndex);
  const current = cards.length > 0 ? cards[idx] : card!;
  const gradeColor = GRADER_COLOR[current.grader] || "#111";
  const tilt = use3DTilt();
  const [sharing, setSharing] = useState(false);

  // Swipe detection
  const touchStartX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 50 || cards.length < 2) return;
    if (dx < 0 && idx < cards.length - 1) setIdx(i => i + 1);
    if (dx > 0 && idx > 0) setIdx(i => i - 1);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <div
          className="mt-auto rounded-t-3xl bg-white overflow-hidden"
          style={{ maxHeight: "92vh" }}
          onClick={e => e.stopPropagation()}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex justify-center pt-3">
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>
          {/* Header row */}
          <div className="flex items-center justify-between px-5 pt-2 pb-0">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            {/* Dot indicators */}
            {cards.length > 1 && (
              <div className="flex items-center gap-1">
                {cards.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: i === idx ? "#111" : "#e0e0e0", width: i === idx ? 16 : 6 }} />
                ))}
              </div>
            )}
            <div className="w-8" />
          </div>

          <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 64px)", scrollbarWidth: "none" }}>
            {/* Card image */}
            <AnimateIn delay={0}>
            <div className="flex justify-center mb-6 mt-4" style={{ perspective: "800px" }}>
              <div
                ref={tilt.ref}
                style={{ ...tilt.style, transformStyle: "preserve-3d", willChange: "transform", width: "58%" }}
                onMouseMove={tilt.onMouseMove}
                onMouseLeave={tilt.onMouseLeave}
                className="relative overflow-hidden"
              >
                {current.img
                  ? <img src={current.img} alt={current.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                  : <div className="w-full flex flex-col items-center justify-center gap-1 px-2" style={{ background: gradeColor, aspectRatio: "2.5/3.5" }}>
                      <span className="text-white font-semibold text-xs text-center">{current.player}</span>
                      <span className="text-white font-black text-2xl">{current.grade}</span>
                      <span className="text-white/70 text-[10px]">{current.grader}</span>
                    </div>
                }
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.2) 0%, transparent 65%)" }} />
              </div>
            </div>
            </AnimateIn>

            {/* Player + grade */}
            <AnimateIn delay={80}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 leading-tight">{current.player}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{current.year} {current.brand} · {current.team}</p>
                {current.autograph && (
                  <span className="inline-block mt-1.5 text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Autograph</span>
                )}
              </div>
              <div className="flex flex-col items-center px-3.5 py-2 rounded-2xl" style={{ background: gradeColor }}>
                <span className="text-2xl font-bold text-white leading-none">{current.grade}</span>
                <span className="text-[9px] font-semibold tracking-widest text-white/70 mt-0.5 uppercase">{current.grader}</span>
              </div>
            </div>
            </AnimateIn>

            {/* Stats grid */}
            <AnimateIn delay={160}>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {/* Est. Value */}
              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Est. Value</p>
                  <p className="text-[9px] text-gray-400">eBay</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">${current.value.toLocaleString()}</p>
                {current.change !== 0 ? (
                  <div className={`flex items-center gap-1 mt-1.5 px-2 py-1 rounded-lg w-fit ${current.change > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                      {current.change > 0
                        ? <path d="M5 8V2M2 5l3-3 3 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        : <path d="M5 2v6M2 5l3 3 3-3" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                    </svg>
                    <span className={`text-[10px] font-bold ${current.change > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {current.change > 0 ? "+" : ""}{current.change}% 30d
                    </span>
                  </div>
                ) : <p className="text-[10px] text-gray-300 mt-1">No change</p>}
              </div>

              {/* Condition */}
              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Condition</p>
                <p className="text-sm font-semibold text-gray-800">{current.gradeLabel}</p>
              </div>

              {/* Grader */}
              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Grader</p>
                <p className="text-sm font-semibold text-gray-800">{current.grader}</p>
              </div>

              {/* Cert # */}
              <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Cert #</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{current.cert}</p>
              </div>

              {/* Pop Report */}
              {current.popReport && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                  <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1">Pop Report</p>
                  <p className="text-sm font-semibold text-gray-800">{current.popReport.toLocaleString()}</p>
                </div>
              )}

              {/* Sell Price */}
              {current.sellPrice && (
                <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Sell Price</p>
                    <p className="text-[9px] text-gray-400">Fanatics</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">${current.sellPrice.toLocaleString()}</p>
                </div>
              )}
            </div>
            </AnimateIn>

            {/* Sub-grades */}
            {current.subGrades && (
            <AnimateIn delay={240}>
              <div className="rounded-2xl border border-gray-100 px-4 py-3.5 mb-4">
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Sub-grades</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {Object.entries(current.subGrades!).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-base font-semibold text-gray-900">{v}</p>
                      <p className="text-[9px] text-gray-400 capitalize mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
            )}

            {/* Actions */}
            <AnimateIn delay={current.subGrades ? 320 : 240}>
            <div className="flex gap-2">
              <button onClick={() => setSharing(true)} className="flex-1 py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold flex items-center justify-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />Share
              </button>
              <button className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Shop</button>
            </div>
            </AnimateIn>
          </div>
        </div>
      </div>

      {sharing && (
        <ShareSheet
          title={`${card.player} — ${card.year} ${card.brand}`}
          subtitle={`${card.grader} ${card.grade} · Est. $${card.value}`}
          onClose={() => setSharing(false)}
        />
      )}
    </>
  );
}

// ── Scan card sheet ───────────────────────────────────────────────────────────

const GRADERS = ["PSA", "BGS", "SGC", "CGC", "TAG", "FWrk"];
const GRADES  = ["1","1.5","2","2.5","3","3.5","4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10"];
const GRADE_LABELS: Record<string, string> = {
  "1":"Poor","1.5":"Fair","2":"Good","2.5":"Good+","3":"VG","3.5":"VG+",
  "4":"VG-EX","4.5":"VG-EX+","5":"EX","5.5":"EX+","6":"EX-MT","6.5":"EX-MT+",
  "7":"NM","7.5":"NM+","8":"NM-MT","8.5":"NM-MT+","9":"Mint","9.5":"Mint+","10":"Gem Mint",
};
const ALL_YEARS = Array.from({ length: 76 }, (_, i) => String(2025 - i)); // 2025 → 1950

const BRANDS_BY_YEAR = (y: number): string[] => {
  if (y <= 1954) return ["Topps","Bowman"];
  if (y <= 1959) return ["Topps"];
  if (y <= 1980) return ["Topps","Fleer","Kellogg's"];
  if (y <= 1988) return ["Topps","Fleer","Donruss","Score"];
  if (y <= 1993) return ["Topps","Fleer","Donruss","Upper Deck","Score","Bowman","Leaf"];
  if (y <= 2000) return ["Topps","Fleer","Donruss","Upper Deck","Score","Bowman","Pacific","Leaf","Skybox"];
  if (y <= 2009) return ["Topps","Bowman","Upper Deck","Fleer","Donruss","Leaf"];
  return ["Topps","Bowman","Panini","Leaf"];
};

const ALL_TEAMS = ["Angels","Astros","Athletics","Blue Jays","Braves","Brewers","Cardinals","Cubs","Dodgers","Giants","Indians","Mariners","Marlins","Mets","Nationals","Orioles","Padres","Phillies","Pirates","Rangers","Red Sox","Reds","Rockies","Royals","Tigers","Twins","White Sox","Yankees"];

// ── Scroll picker ─────────────────────────────────────────────────────────────
import { useEffect } from "react";

function ScrollPicker({ items, value, onChange, width }: { items: string[]; value: string; onChange: (v: string) => void; width?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const ITEM_H = 44;

  useEffect(() => {
    const idx = items.indexOf(value);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H;
    }
  }, []);

  const onScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (items[clamped] && items[clamped] !== value) onChange(items[clamped]);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ height: ITEM_H * 5, width: width || "100%" }}>
      {/* Fade top */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: "linear-gradient(to bottom, #fff 20%, transparent)" }} />
      {/* Fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{ height: ITEM_H * 2, background: "linear-gradient(to top, #fff 20%, transparent)" }} />
      {/* Selection highlight */}
      <div className="absolute left-0 right-0 z-0 rounded-xl" style={{ top: ITEM_H * 2, height: ITEM_H, background: "#f4f4f5" }} />
      {/* Scrollable list */}
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map(item => (
          <div
            key={item}
            onClick={() => { onChange(item); if (ref.current) ref.current.scrollTop = items.indexOf(item) * ITEM_H; }}
            style={{ height: ITEM_H, scrollSnapAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: item === value ? 600 : 400, color: item === value ? "#111" : "#aaa", cursor: "pointer", userSelect: "none", transition: "color 0.15s, font-weight 0.15s", fontFamily: "'Google Sans', sans-serif" }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

function ScanCardSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (card: typeof ALL_CARDS[0]) => void }) {
  const [step, setStep]         = useState(1);
  const [scanDone, setScanDone] = useState(false);
  const [done, setDone]         = useState(false);
  const [player, setPlayer]     = useState("");
  const [year, setYear]         = useState("1986");
  const [brand, setBrand]       = useState("Topps");
  const [team, setTeam]         = useState("Yankees");
  const [cardNumber, setCardNumber] = useState("");
  const [grader, setGrader]     = useState("");
  const [grade, setGrade]       = useState("");
  const [cert, setCert]         = useState("");
  const [value, setValue]       = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [popReport, setPopReport] = useState("");

  const STEPS = ["Scan","Player","Card","Grading","Pricing","Review"];
  const gradeLabel  = GRADE_LABELS[grade] || "";
  const graderColor = GRADER_COLOR[grader] || "#111";


  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const canNext = [
    true,
    player.trim().length > 0,
    true,
    grader && grade && cert.trim().length > 0,
    value.trim().length > 0,
    true,
  ][step - 1];

  const startScan = () => {
    setScanDone(false);
    setTimeout(() => setScanDone(true), 2000);
  };

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #c9a84c 0%, #e8c96e 45%, #b8903c 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          {/* Card image */}
          <div className="relative mb-6" style={{ perspective: "600px" }}>
            <img
              src={card2}
              alt="Reference card"
              className="w-40 rounded-xl"
              style={{ objectFit: "contain", boxShadow: "0 16px 40px rgba(0,0,0,0.35)", transform: "rotate(-2deg)" }}
              draggable={false}
            />
          </div>
          <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-2">Success</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Added to your<br />collection!</h2>
          <p className="text-white/70 text-sm mb-2">{player} · {year} {brand}</p>
          <div className="flex items-center gap-2 mt-1 mb-8">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white/90" style={{ background: "rgba(0,0,0,0.2)" }}>
              {grader} {grade}
            </span>
            {value && <span className="text-white font-semibold text-sm">${parseFloat(value).toLocaleString()}</span>}
          </div>
          <button
            onClick={() => {}}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm mb-3"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
          >
            <Share2 className="inline w-4 h-4 mr-1.5 -mt-0.5" />
            Share
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.8)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto rounded-t-3xl bg-white overflow-hidden" style={{ maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        {/* Progress */}
        <div className="flex items-center justify-between px-6 pt-4 mb-6">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: step > i ? "#111" : "#f0f0f0" }} />
            ))}
          </div>
          <span className="text-xs text-gray-400 mr-3 flex-shrink-0">{step}/{STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 90px)", scrollbarWidth: "none" }}>

          {/* Step 1 — Scan */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Add a card</h2>
              <p className="text-sm text-gray-400 mb-6">Scan the barcode on the slab or enter manually.</p>

              {/* Viewfinder */}
              <button
                onClick={startScan}
                className="w-full rounded-2xl overflow-hidden mb-5 focus:outline-none"
                style={{ height: 200, background: "#0c0c0e" }}
              >
                {[["top-3 left-3","border-t-2 border-l-2"],["top-3 right-3","border-t-2 border-r-2"],["bottom-3 left-3","border-b-2 border-l-2"],["bottom-3 right-3","border-b-2 border-r-2"]].map(([pos, border], i) => (
                  <div key={i} className={`absolute w-7 h-7 ${pos} ${border} border-white/50 rounded-sm`} />
                ))}
                {scanDone ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-white text-sm font-semibold">Detected</p>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute left-6 right-6 h-px bg-white/50 rounded-full"
                      style={{ animation: "scanLine 1.8s ease-in-out infinite" }} />
                    <Scan className="w-8 h-8 text-white/20" />
                    <style>{`@keyframes scanLine{0%,100%{top:25%}50%{top:75%}}`}</style>
                  </div>
                )}
              </button>

              <button onClick={next}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold mb-3">
                {scanDone ? "Continue with scan" : "Enter manually"}
              </button>
            </>
          )}

          {/* Step 2 — Player */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Who's on the card?</h2>
              <p className="text-sm text-gray-400 mb-6">Enter the player's name.</p>
              <input
                autoFocus value={player} onChange={e => setPlayer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canNext && next()}
                placeholder="e.g. Bo Jackson"
                className="w-full rounded-2xl bg-gray-50 px-4 py-4 text-lg text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }}
              />
              <button onClick={next} disabled={!canNext}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {/* Step 3 — Card info */}
          {step === 3 && (() => {
            const availBrands = BRANDS_BY_YEAR(parseInt(year) || 2000);
            const currentBrand = availBrands.includes(brand) ? brand : availBrands[0];
            if (currentBrand !== brand) setBrand(currentBrand);
            return (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Card info</h2>
                <p className="text-sm text-gray-400 mb-4">Scroll to select — brands update based on the year.</p>

                {/* Labels */}
                <div className="flex gap-2 mb-1">
                  {["Year","Brand","Team"].map(l => (
                    <p key={l} className="flex-1 text-center text-[10px] font-medium text-gray-400 tracking-widest uppercase">{l}</p>
                  ))}
                </div>

                {/* Three pickers side by side */}
                <div className="flex gap-2 mb-5">
                  <div className="flex-1">
                    <ScrollPicker items={ALL_YEARS} value={year || ALL_YEARS[35]} onChange={v => { setYear(v); }} />
                  </div>
                  <div className="flex-1">
                    <ScrollPicker items={availBrands} value={currentBrand} onChange={setBrand} />
                  </div>
                  <div className="flex-1">
                    <ScrollPicker items={ALL_TEAMS} value={team || ALL_TEAMS[0]} onChange={setTeam} />
                  </div>
                </div>

                {/* Card # optional */}
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">
                  Card # <span className="normal-case font-normal tracking-normal text-gray-300">optional</span>
                </p>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="e.g. #50T"
                  className="w-full rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none mb-6"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />

                <button onClick={next} className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                  Continue
                </button>
              </>
            );
          })()}

          {/* Step 4 — Grading */}
          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Grading</h2>
              <p className="text-sm text-gray-400 mb-5">Select the grading company and score.</p>

              {/* Grader */}
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grader *</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {GRADERS.map(g => (
                  <button key={g} onClick={() => setGrader(g)}
                    className="py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ background: grader === g ? (GRADER_COLOR[g] || "#111") : "#f4f4f5", color: grader === g ? "#fff" : "#888" }}>
                    {g}
                  </button>
                ))}
              </div>

              {/* Grade */}
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Grade *</p>
              <div className="grid grid-cols-5 gap-2 mb-1">
                {GRADES.map(g => (
                  <button key={g} onClick={() => setGrade(g)}
                    className="py-3 rounded-2xl text-sm font-bold transition-all"
                    style={{ background: grade === g ? (graderColor) : "#f4f4f5", color: grade === g ? "#fff" : "#888" }}>
                    {g}
                  </button>
                ))}
              </div>
              {grade && <p className="text-xs text-gray-400 mb-4">{gradeLabel}</p>}
              {!grade && <div className="mb-4" />}

              {/* Cert */}
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Cert # *</p>
              <input value={cert} onChange={e => setCert(e.target.value)} placeholder="e.g. 22365223"
                inputMode="numeric"
                className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 outline-none font-mono mb-6" />

              <button onClick={next} disabled={!canNext}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {/* Step 5 — Pricing */}
          {step === 5 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">What's it worth?</h2>
              <p className="text-sm text-gray-400 mb-5">Add pricing so your collection stays up to date.</p>

              {[
                { label: "Est. Value", sub: "eBay", val: value, set: setValue, required: true, placeholder: "0" },
                { label: "Sell Price", sub: "Fanatics", val: sellPrice, set: setSellPrice, required: false, placeholder: "0" },
                { label: "Pop Report", sub: "PSA", val: popReport, set: setPopReport, required: false, placeholder: "0", noPrefix: true },
              ].map(f => (
                <div key={f.label} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">{f.label}{f.required ? " *" : ""}</p>
                    <p className="text-[10px] text-gray-300">{f.sub}</p>
                  </div>
                  <div className="relative">
                    {!f.noPrefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>}
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                      inputMode="decimal" type="number"
                      className={`w-full rounded-2xl bg-gray-50 ${!f.noPrefix ? "pl-8" : "pl-4"} pr-4 py-3.5 text-base text-gray-900 placeholder-gray-300 outline-none`}
                      style={{ fontFamily: "'Google Sans', sans-serif" }} />
                  </div>
                </div>
              ))}

              <div className="mt-6">
                <button onClick={next} disabled={!canNext}
                  className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 6 — Review */}
          {step === 6 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Looks good?</h2>
              <p className="text-sm text-gray-400 mb-5">Review before adding to your collection.</p>

              <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#f7f7f7" }}>
                <div className="h-1.5 w-full" style={{ background: graderColor }} />
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{player}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {year}{brand ? ` · ${brand}` : ""}{team ? ` · ${team}` : ""}{cardNumber ? ` · ${cardNumber}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl flex-shrink-0" style={{ background: graderColor }}>
                      <span className="text-xl font-black text-white leading-none">{grade}</span>
                      <span className="text-[9px] font-bold tracking-widest text-white/70 uppercase">{grader}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Cert #",     value: cert,       mono: true },
                      { label: "Condition",  value: gradeLabel              },
                      ...(value     ? [{ label: "Est. Value", value: `$${parseFloat(value).toLocaleString()}`,     sub: "eBay"     }] : []),
                      ...(sellPrice ? [{ label: "Sell Price", value: `$${parseFloat(sellPrice).toLocaleString()}`, sub: "Fanatics" }] : []),
                      ...(popReport ? [{ label: "Pop Report", value: popReport, sub: "PSA" }] : []),
                    ].map((s: any) => (
                      <div key={s.label} className="rounded-xl bg-white px-3 py-2.5">
                        <p className="text-[9px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">{s.label}</p>
                        <p className={`text-sm font-semibold text-gray-800 ${s.mono ? "font-mono text-xs" : ""}`}>{s.value || "—"}</p>
                        {s.sub && <p className="text-[9px] text-gray-400 mt-0.5">{s.sub}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onAdd({
                    id: Date.now(),
                    img: "",
                    player,
                    year,
                    brand,
                    team,
                    grader,
                    grade,
                    gradeLabel,
                    cert,
                    value: parseFloat(value) || 0,
                    change: 0,
                    subGrades: null,
                    autograph: false,
                    popReport: popReport ? parseInt(popReport) : undefined,
                    sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
                  } as typeof ALL_CARDS[0]);
                  setDone(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                Add to Collection
              </button>
            </>
          )}

          {step > 1 && (
            <button onClick={back} className="w-full mt-3 py-2.5 text-sm text-gray-400">← Back</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New folder sheet ──────────────────────────────────────────────────────────

const FOLDER_ICONS = [
  { id: "folder", el: <Folder className="w-6 h-6" /> },
  { id: "star", el: <Star className="w-6 h-6" /> },
  { id: "trophy", el: <Trophy className="w-6 h-6" /> },
  { id: "heart", el: <Heart className="w-6 h-6" /> },
  { id: "zap", el: <Zap className="w-6 h-6" /> },
];

function NewFolderSheet({ onClose, onCreate, allCards = ALL_CARDS }: { onClose: () => void; onCreate: (name: string, color: string, thumbnail?: string, cardIds?: number[]) => void; allCards?: typeof ALL_CARDS }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [cardSearch, setCardSearch] = useState("");

  const filteredCards = ALL_CARDS.filter(c =>
    c.player.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.year.includes(cardSearch) ||
    c.team.toLowerCase().includes(cardSearch.toLowerCase())
  );

  const STEPS = ["Name", "Color", "Cards"];

  // Folder preview tile
  const previewImgs = ALL_CARDS.filter(c => selectedCards.includes(c.id)).slice(0, 3).map(c => c.img);
  const offsets = [
    { rotate: "-12deg", translate: "-16px, 4px", z: 0 },
    { rotate: "-3deg",  translate: "-2px, 2px",  z: 1 },
    { rotate: "6deg",   translate: "14px, 0px",  z: 2 },
  ];
  const FolderPreview = () => (
    <div className="w-28 mx-auto rounded-2xl overflow-hidden mb-5" style={{ background: color }}>
      <div className="relative flex items-center justify-center" style={{ height: "80px", background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}>
        {previewImgs.length > 0 ? (
          previewImgs.map((img, i) => (
            <img key={i} src={img} alt="" draggable={false} className="absolute"
              style={{ width: 34, objectFit: "contain", background: "#f4f4f5", borderRadius: 3, boxShadow: "0 2px 6px rgba(0,0,0,0.3)", transform: `rotate(${offsets[i].rotate}) translate(${offsets[i].translate})`, zIndex: offsets[i].z }} />
          ))
        ) : (
          <Folder className="w-5 h-5 text-white/50" />
        )}
      </div>
      <div className="px-2.5 py-1.5" style={{ background: "rgba(0,0,0,0.18)" }}>
        <p className="text-[10px] font-semibold text-white truncate">{name || "Folder"}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto rounded-t-3xl bg-white overflow-hidden" style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ background: step > i ? "#111" : "#f0f0f0" }} />
            ))}
          </div>
          <span className="text-xs text-gray-400 mr-3 flex-shrink-0">{step} / {STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(85vh - 90px)", scrollbarWidth: "none" }}>

          {/* Step 1: Name */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Name your folder</h2>
              <p className="text-sm text-gray-400 mb-6">Give it a name that reflects what's inside.</p>
              <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && name.trim() && setStep(2)}
                placeholder="e.g. Rookies, Hall of Fame…"
                className="w-full rounded-2xl bg-gray-50 px-4 py-4 text-base text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }}
              />
              <button onClick={() => setStep(2)} disabled={!name.trim()}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30 transition-opacity">
                Continue
              </button>
            </>
          )}

          {/* Step 2: Color */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Pick a color</h2>
              <p className="text-sm text-gray-400 mb-6">This color will represent your folder.</p>
              <div className="grid grid-cols-4 gap-3 mb-8">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="h-14 rounded-2xl flex items-center justify-center transition-all"
                    style={{ background: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "3px" }}>
                    {color === c && <Check className="w-5 h-5 text-white" />}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(3)} className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Continue</button>

            </>
          )}

          {/* Step 3: Cards */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Add cards</h2>
              <p className="text-sm text-gray-400 mb-4">Select the cards you want in this folder.</p>
              <FolderPreview />
              {/* Search */}
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3.5 py-2.5 mb-4">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={cardSearch} onChange={e => setCardSearch(e.target.value)} placeholder="Search cards…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
                {cardSearch && <button onClick={() => setCardSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {filteredCards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCards(prev => prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id])}
                    className="relative focus:outline-none">
                    <div className="overflow-hidden" style={{ outline: selectedCards.includes(card.id) ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                      <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                    </div>
                    {selectedCards.includes(card.id) && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-950 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <p className="text-[9px] text-gray-500 text-center mt-1 truncate">{card.player.split(" ").pop()}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => { onCreate(name.trim(), color, thumbnail, selectedCards); onClose(); }}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
                Create Folder{selectedCards.length > 0 ? ` · ${selectedCards.length} cards` : ""}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Folder detail ─────────────────────────────────────────────────────────────

function FolderDetailView({ folder, onBack, onUpdate, allCards = ALL_CARDS }: { folder: FolderType; onBack: () => void; onUpdate: (updated: FolderType) => void; allCards?: typeof ALL_CARDS }) {
  const [selected, setSelected] = useState<Card | null>(null);
  const [sharing, setSharing] = useState(false);
  const [addingCards, setAddingCards] = useState(false);
  const [changingThumb, setChangingThumb] = useState(false);
  const cards = ALL_CARDS.filter(c => folder.cardIds.includes(c.id));
  const folderValue = cards.reduce((s, c) => s + c.value, 0);

  const toggleCard = (id: number) => {
    const next = folder.cardIds.includes(id)
      ? folder.cardIds.filter(x => x !== id)
      : [...folder.cardIds, id];
    onUpdate({ ...folder, cardIds: next });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Folder header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        {/* Thumbnail / color swatch — tap to change */}
        <button onClick={() => setChangingThumb(true)} className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 relative">
          {folder.thumbnail
            ? <img src={folder.thumbnail} alt="" className="w-full h-full object-contain" style={{ background: folder.color }} />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: folder.color }}><Folder className="w-4 h-4 text-white" /></div>
          }
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <Plus className="w-3 h-3 text-white" />
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 leading-tight">{folder.name}</h2>
          <p className="text-[11px] text-gray-400">{cards.length} cards · ${folderValue.toLocaleString()} <span className="text-gray-300">· eBay</span></p>
        </div>
        <button onClick={() => setSharing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold flex-shrink-0">
          <Share2 className="w-3 h-3" />Share
        </button>
      </div>

      {/* Cards grid */}
      <div className="flex-1 px-6 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Folder className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">No cards in this folder</p>
            <button onClick={() => setAddingCards(true)} className="px-4 py-2 rounded-full bg-gray-950 text-white text-xs font-semibold">Add Cards</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {cards.map(card => (
                <CardTile key={card.id} card={card} index={cards.indexOf(card)} onClick={() => setSelected(card)} />
              ))}
            </div>
            <button onClick={() => setAddingCards(true)} className="w-full py-3 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />Add Cards
            </button>
          </>
        )}
      </div>

      {/* Add cards sheet */}
      {addingCards && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={() => setAddingCards(false)}>
          <div className="mt-auto rounded-t-3xl bg-white overflow-hidden" style={{ maxHeight: "80vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <h2 className="text-base font-semibold text-gray-900">Add Cards</h2>
              <button onClick={() => setAddingCards(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", maxHeight: "calc(80vh - 80px)" }}>
              {ALL_CARDS.map(card => (
                <button key={card.id} onClick={() => toggleCard(card.id)} className="relative focus:outline-none">
                  <div className="overflow-hidden" style={{ outline: folder.cardIds.includes(card.id) ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                    <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                  </div>
                  {folder.cardIds.includes(card.id) && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-950 flex items-center justify-center">
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Change thumbnail sheet */}
      {changingThumb && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={() => setChangingThumb(false)}>
          <div className="mt-auto rounded-t-3xl bg-white overflow-hidden" style={{ maxHeight: "70vh" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <h2 className="text-base font-semibold text-gray-900">Choose Thumbnail</h2>
              <button onClick={() => setChangingThumb(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", maxHeight: "calc(70vh - 80px)" }}>
              {/* No thumbnail option */}
              <button onClick={() => { onUpdate({ ...folder, thumbnail: undefined }); setChangingThumb(false); }}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{ background: folder.color, outline: !folder.thumbnail ? "2px solid #111" : "none", outlineOffset: "2px" }}>
                <Folder className="w-5 h-5 text-white" />
              </button>
              {ALL_CARDS.map(card => (
                <button key={card.id} onClick={() => { onUpdate({ ...folder, thumbnail: card.img }); setChangingThumb(false); }}
                  className="overflow-hidden"
                  style={{ outline: folder.thumbnail === card.img ? "2px solid #111" : "2px solid transparent", outlineOffset: "2px" }}>
                  <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && <DetailSheet onClose={() => setSelected(null)} cards={cards} initialIndex={cards.findIndex(c => c.id === selected.id)} />}
      {sharing && (
        <ShareSheet
          title={folder.name}
          subtitle={`${cards.length} cards · Est. $${folderValue.toLocaleString()}`}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}

// ── Market view ───────────────────────────────────────────────────────────────

const MARKET_ITEMS = [
  { img: card8, player: "Mickey Mantle", year: "1952", brand: "Topps", grader: "SGC", grade: "9.5", price: 4200, change: +8, source: "eBay", priceHistory: [{d:"Jan",v:3800},{d:"Feb",v:3950},{d:"Mar",v:4100},{d:"Apr",v:3900},{d:"May",v:4200},{d:"Jun",v:4200}], recentSales: [{date:"Jun 12",price:4100,source:"eBay"},{date:"May 28",price:3950,source:"Fanatics"},{date:"Apr 15",price:4200,source:"eBay"}], dealNote: "Deal of the Day" },
  { img: card7, player: "Shohei Ohtani", year: "2022", brand: "Bowman", grader: "FWrk", grade: "9.5", price: 890, change: +22, source: "Fanatics", priceHistory: [{d:"Jan",v:600},{d:"Feb",v:680},{d:"Mar",v:720},{d:"Apr",v:780},{d:"May",v:840},{d:"Jun",v:890}], recentSales: [{date:"Jun 10",price:875,source:"Fanatics"},{date:"Jun 2",price:820,source:"eBay"}], dealNote: null },
  { img: card2, player: "Bo Jackson RC", year: "1986", brand: "Topps Traded", grader: "PSA", grade: "10", price: 1745, change: +7, source: "PSA Marketplace", priceHistory: [{d:"Jan",v:1400},{d:"Feb",v:1500},{d:"Mar",v:1580},{d:"Apr",v:1620},{d:"May",v:1700},{d:"Jun",v:1745}], recentSales: [{date:"Jun 8",price:1720,source:"eBay"},{date:"May 20",price:1650,source:"PSA Marketplace"}], dealNote: null },
  { img: card1, player: "Bo Jackson", year: "1986", brand: "Topps", grader: "PSA", grade: "8", price: 410, change: +2, source: "eBay", priceHistory: [{d:"Jan",v:380},{d:"Feb",v:390},{d:"Mar",v:400},{d:"Apr",v:395},{d:"May",v:405},{d:"Jun",v:410}], recentSales: [{date:"Jun 5",price:405,source:"eBay"}], dealNote: null },
  { img: card3, player: "Rickey Henderson", year: "1980", brand: "Topps", grader: "SGC", grade: "8.5", price: 320, change: -3, source: "Fanatics", priceHistory: [{d:"Jan",v:350},{d:"Feb",v:345},{d:"Mar",v:335},{d:"Apr",v:330},{d:"May",v:325},{d:"Jun",v:320}], recentSales: [{date:"Jun 1",price:318,source:"Fanatics"}], dealNote: null },
  { img: card9, player: "Mickey Mantle", year: "1954", brand: "Bowman", grader: "PSA", grade: "1", price: 620, change: +5, source: "eBay", priceHistory: [{d:"Jan",v:560},{d:"Feb",v:575},{d:"Mar",v:590},{d:"Apr",v:600},{d:"May",v:612},{d:"Jun",v:620}], recentSales: [{date:"May 30",price:610,source:"eBay"}], dealNote: null },
  { img: card4, player: "Gary Nolan", year: "1978", brand: "Topps", grader: "BGS", grade: "9.5", price: 155, change: +11, source: "Card Ladder", priceHistory: [{d:"Jan",v:120},{d:"Feb",v:130},{d:"Mar",v:140},{d:"Apr",v:145},{d:"May",v:150},{d:"Jun",v:155}], recentSales: [{date:"Jun 3",price:150,source:"Card Ladder"}], dealNote: null },
  { img: card11, player: "Jim York", year: "1975", brand: "Topps", grader: "SGC", grade: "9.5", price: 55, change: +1, source: "eBay", priceHistory: [{d:"Jan",v:50},{d:"Feb",v:51},{d:"Mar",v:52},{d:"Apr",v:53},{d:"May",v:54},{d:"Jun",v:55}], recentSales: [{date:"May 25",price:54,source:"eBay"}], dealNote: null },
  { img: card12, player: "Don Baylor", year: "1975", brand: "Topps", grader: "PSA", grade: "1", price: 42, change: -1, source: "Fanatics", priceHistory: [{d:"Jan",v:45},{d:"Feb",v:44},{d:"Mar",v:43},{d:"Apr",v:43},{d:"May",v:42},{d:"Jun",v:42}], recentSales: [{date:"May 18",price:43,source:"Fanatics"}], dealNote: null },
];

type MarketItem = typeof MARKET_ITEMS[0];

function MarketCardDetailSheet({ item, onClose }: { item: MarketItem; onClose: () => void }) {
  const gradeColor = GRADER_COLOR[item.grader] || "#111";
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto rounded-t-3xl bg-white overflow-hidden" style={{ maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="overflow-y-auto pb-10" style={{ maxHeight: "calc(90vh - 20px)", scrollbarWidth: "none" }}>
          {/* Card image */}
          <div className="flex justify-center px-6 pt-4 pb-4">
            <img src={item.img} alt={item.player} className="w-40" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
          </div>
          {/* Header */}
          <div className="flex items-start justify-between px-6 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{item.player}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{item.year} · {item.brand}</p>
            </div>
            <div className="flex flex-col items-center px-3 py-1.5 rounded-2xl flex-shrink-0" style={{ background: gradeColor }}>
              <span className="text-xl font-bold text-white leading-none">{item.grade}</span>
              <span className="text-[9px] font-bold tracking-widest text-white/70 uppercase">{item.grader}</span>
            </div>
          </div>
          {/* Price + source */}
          <div className="mx-6 rounded-2xl bg-gray-50 px-4 py-3.5 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Price</p>
                <p className="text-2xl font-bold text-gray-900">${item.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 mb-0.5">Source</p>
                <p className="text-xs font-semibold text-gray-700">{item.source}</p>
                <span className={`text-xs font-semibold ${item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-400" : "text-gray-400"}`}>
                  {item.change > 0 ? "+" : ""}{item.change}% 30d
                </span>
              </div>
            </div>
          </div>
          {/* Price history chart */}
          <div className="mx-6 rounded-2xl border border-gray-100 px-4 pt-3.5 pb-2 mb-4">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Price History · {item.source}</p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={item.priceHistory}>
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Price"]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #f0f0f0" }} />
                <Line type="monotone" dataKey="v" stroke="#111" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Recent sales */}
          <div className="mx-6 mb-5">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-3">Recent Sales</p>
            {item.recentSales.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < item.recentSales.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                <p className="text-xs text-gray-500">{s.date}</p>
                <p className="text-xs text-gray-400">{s.source}</p>
                <p className="text-sm font-semibold text-gray-900">${s.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
          {/* Actions */}
          <div className="flex gap-2 px-6">
            <button className="flex-1 py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Buy · {item.source}</button>
            <button className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketView() {
  const [query, setQuery] = useState("");
  const [marketTab, setMarketTab] = useState<"browse" | "listings">("browse");
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const isSearching = query.trim().length > 0;
  const spotlight = MARKET_ITEMS[0];

  const filtered = MARKET_ITEMS.filter(item =>
    item.player.toLowerCase().includes(query.toLowerCase()) ||
    item.year.includes(query) ||
    item.brand.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-6 mb-4">
        {([{ id: "browse", label: "Browse", icon: TrendingUp }, { id: "listings", label: "My Listings", icon: Tag }] as { id: "browse" | "listings"; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMarketTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{ background: marketTab === id ? "#111" : "transparent", color: marketTab === id ? "#fff" : "#bbb" }}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {marketTab === "listings" && (
        <div className="flex-1 px-6 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
          {[
            { card: ALL_CARDS[1], price: 1350, status: "active", views: 24, since: "2d ago", source: "eBay" },
            { card: ALL_CARDS[3], price: 110, status: "active", views: 8, since: "5d ago", source: "Fanatics" },
            { card: ALL_CARDS[0], price: 340, status: "sold", views: 41, since: "12d ago", source: "eBay" },
          ].map((listing, i) => {
            const gradeColor = GRADER_COLOR[listing.card.grader] || "#111";
            return (
              <AnimateIn key={i} delay={i * 80}>
              <div className="flex items-center gap-3.5 py-3.5" style={{ borderBottom: "1px solid #f4f4f5" }}>
                <img src={listing.card.img} alt={listing.card.player} className="w-12 flex-shrink-0"
                  style={{ objectFit: "contain", background: "#f4f4f5", opacity: listing.status === "sold" ? 0.45 : 1 }} draggable={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{listing.card.player}</p>
                    <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: listing.status === "active" ? "#f0fdf4" : "#f4f4f5", color: listing.status === "active" ? "#16a34a" : "#aaa" }}>
                      {listing.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{listing.card.year} · {listing.card.grader} {listing.card.grade} · {listing.since}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{listing.views} views</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-base font-semibold text-gray-900">${listing.price}</p>
                  <p className="text-[10px] text-gray-400">{listing.source}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: gradeColor }}>
                    {listing.card.grader} {listing.card.grade}
                  </span>
                </div>
              </div>
              </AnimateIn>
            );
          })}
        </div>
      )}

      {/* Browse tab */}
      {marketTab === "browse" && (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>

          {/* 1. Spotlight */}
          {!isSearching && (
            <AnimateIn delay={0} className="px-6 mb-5">
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase text-center mb-3">Deal of the Day</p>
              <button
                onClick={() => setSelectedItem(spotlight)}
                className="w-full rounded-2xl overflow-hidden focus:outline-none"
                style={{ background: "linear-gradient(135deg, #c9a84c 0%, #e8c96e 40%, #b8903c 100%)" }}
              >
                <div className="flex flex-col items-center px-5 pt-5 pb-4 text-center">
                  <img
                    src={spotlight.img}
                    alt={spotlight.player}
                    className="w-52 mb-4"
                    style={{ objectFit: "contain", background: "rgba(255,255,255,0.15)", borderRadius: 6 }}
                    draggable={false}
                  />
                  <p className="text-base font-bold text-white leading-tight">{spotlight.player}</p>
                  <p className="text-xs text-white/70 mt-0.5">{spotlight.year} · {spotlight.brand}</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="text-2xl font-black text-white">${spotlight.price.toLocaleString()}</span>
                    <span className="text-xs font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full">+{spotlight.change}%</span>
                  </div>
                  <p className="text-[10px] text-white/60 mt-1">Price source: {spotlight.source}</p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/90" style={{ background: "rgba(0,0,0,0.25)" }}>
                      {spotlight.grader} {spotlight.grade}
                    </span>
                  </div>
                </div>
              </button>
            </AnimateIn>
          )}

          {/* 2. Search */}
          <AnimateIn delay={80} className="px-6 mb-5">
            <div className="flex items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-3">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Player, year, brand…"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                style={{ fontFamily: "'Google Sans', sans-serif" }} />
              {query && <button onClick={() => setQuery("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
            </div>
          </AnimateIn>

          {!isSearching ? (
            <>
              {/* 3. Trending */}
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase px-6 mb-3">Trending</p>
                <div className="flex gap-3 px-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {MARKET_ITEMS.slice(1, 4).map((item, i) => (
                    <AnimateIn key={i} delay={160 + i * 80}>
                    <button onClick={() => setSelectedItem(item)} className="flex-shrink-0 w-32 rounded-2xl overflow-hidden focus:outline-none" style={{ background: "#f7f7f7" }}>
                      <img src={item.img} alt={item.player} className="w-full" style={{ objectFit: "contain", background: "#f0f0f0" }} draggable={false} />
                      <div className="px-2.5 py-2">
                        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{item.player}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.year}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-gray-900">${item.price.toLocaleString()}</span>
                          <span className={`text-[10px] font-semibold ${item.change > 0 ? "text-emerald-500" : "text-red-400"}`}>{item.change > 0 ? "+" : ""}{item.change}%</span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5">{item.source}</p>
                      </div>
                    </button>
                    </AnimateIn>
                  ))}
                </div>
              </div>

              {/* 4. Market grid */}
              <div className="px-6">
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-3">Shop</p>
                <div className="grid grid-cols-2 gap-3">
                  {MARKET_ITEMS.slice(4).map((item, i) => (
                    <AnimateIn key={i} delay={i * 70}>
                    <button onClick={() => setSelectedItem(item)} className="rounded-2xl overflow-hidden text-left focus:outline-none w-full" style={{ background: "#f7f7f7" }}>
                      <img src={item.img} alt={item.player} className="w-full" style={{ objectFit: "contain", background: "#f0f0f0" }} draggable={false} />
                      <div className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-900 truncate">{item.player}</p>
                        <p className="text-[10px] text-gray-400">{item.year} · {item.brand}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-sm font-bold text-gray-900">${item.price.toLocaleString()}</span>
                          <span className={`text-[10px] font-semibold ${item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-400" : "text-gray-400"}`}>
                            {item.change > 0 ? "+" : ""}{item.change !== 0 ? `${item.change}%` : "—"}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5">{item.source}</p>
                      </div>
                    </button>
                    </AnimateIn>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="px-6">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Search className="w-8 h-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No results for "{query}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((item, i) => (
                    <AnimateIn key={i} delay={i * 60}>
                    <button onClick={() => setSelectedItem(item)} className="rounded-2xl overflow-hidden text-left focus:outline-none w-full" style={{ background: "#f7f7f7" }}>
                      <img src={item.img} alt={item.player} className="w-full" style={{ objectFit: "contain", background: "#f0f0f0" }} draggable={false} />
                      <div className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-900 truncate">{item.player}</p>
                        <p className="text-[10px] text-gray-400">{item.year} · {item.brand}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-sm font-bold text-gray-900">${item.price.toLocaleString()}</span>
                          <span className={`text-[10px] font-semibold ${item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-400" : "text-gray-400"}`}>
                            {item.change > 0 ? "+" : ""}{item.change !== 0 ? `${item.change}%` : "—"}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5">{item.source}</p>
                      </div>
                    </button>
                    </AnimateIn>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedItem && <MarketCardDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}

// ── Peers view ────────────────────────────────────────────────────────────────

const PEERS = [
  {
    name: "Logan Paul", handle: "@loganpaul", cards: 142, value: 284000, avatar: loganPaul, badge: "Top Collector", verified: true,
    topCards: [card8, card7, card2], snapshot: [card8, card7, card2, card9, card1, card3],
    specialty: "Yankees · Modern",
  },
  {
    name: "Barbara Corcoran", handle: "@barbaracorcoran", cards: 67, value: 93000, avatar: barbaraCorcoran, badge: "Top Collector", verified: false,
    topCards: [card2, card8, card11], snapshot: [card2, card8, card11, card4, card6, card5],
    specialty: "HOF · Vintage",
  },
  {
    name: "Gary Vee", handle: "@garyvee", cards: 318, value: 520000, avatar: garyVee, badge: "Top Collector", verified: true,
    topCards: [card8, card2, card7], snapshot: [card8, card2, card7, card9, card3, card12],
    specialty: "Graded · Investment",
  },
  {
    name: "Kevin O'Leary", handle: "@kevinoleary", cards: 89, value: 176000, avatar: kevinOLeary, badge: "Trending", verified: false,
    topCards: [card7, card8, card2], snapshot: [card7, card8, card2, card11, card4, card10],
    specialty: "ROI · Rare Finds",
  },
];

type Peer = typeof PEERS[0];

function PeerProfileSheet({ peer, onClose }: { peer: Peer; onClose: () => void }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [followed, setFollowed] = useState(false);

  const cardByImg = (img: string) => ALL_CARDS.find(c => c.img === img) ?? null;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="mt-auto rounded-t-3xl bg-white overflow-hidden"
        style={{ maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        <div className="overflow-y-auto pb-10" style={{ maxHeight: "calc(88vh - 20px)", scrollbarWidth: "none" }}>
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-4 pb-5">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                  <img src={peer.avatar} alt={peer.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                </div>
                {peer.verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#b49e63] border-2 border-white flex items-center justify-center">
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">{peer.name}</h2>
                  {peer.verified && (
                    <div className="w-4.5 h-4.5 rounded-full bg-[#b49e63] flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18 }}>
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {peer.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: peer.badge === "Top Collector" ? "#fef9ec" : "#f0fdf4", color: peer.badge === "Top Collector" ? "#b45309" : "#16a34a" }}>
                      {peer.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{peer.handle} · {peer.specialty}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 px-6 pb-5 border-b border-gray-100">
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Cards</p>
              <p className="text-xl font-semibold text-gray-900">{peer.cards}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">Value</p>
              <p className="text-xl font-semibold text-gray-900">${peer.value.toLocaleString()}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setFollowed(f => !f)}
                className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                style={{ background: followed ? "#f4f4f5" : "#111", color: followed ? "#888" : "#fff" }}
              >
                {followed ? "Following ✓" : "Follow"}
              </button>
            </div>
          </div>

          {/* Top cards */}
          <div className="px-6 pt-5 pb-4">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Top Cards</p>
            <div className="flex gap-3">
              {peer.topCards.map((img, i) => (
                <button key={i} className="flex-1 overflow-hidden focus:outline-none active:opacity-80" style={{ background: "#f4f4f5" }}
                  onClick={() => { const c = cardByImg(img); if (c) setSelectedCard(c); }}>
                  <img src={img} alt="" className="w-full block" style={{ objectFit: "contain" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>

          {/* Collection snapshot */}
          <div className="px-6 pt-1">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Collection</p>
            <div className="grid grid-cols-3 gap-2">
              {peer.snapshot.map((img, i) => (
                <button key={i} className="overflow-hidden focus:outline-none active:opacity-80" style={{ background: "#f4f4f5" }}
                  onClick={() => { const c = cardByImg(img); if (c) setSelectedCard(c); }}>
                  <img src={img} alt="" className="w-full block" style={{ objectFit: "contain" }} draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {selectedCard && <DetailSheet onClose={() => setSelectedCard(null)} isPeer cards={[selectedCard]} initialIndex={0} />}
    </>
  );
}

const SUGGESTED = [
  { name: "DJ Khaled", handle: "@djkhaled", cards: 203, avatar: card8, following: false },
  { name: "Meek Mill", handle: "@meekmill", cards: 87, avatar: card7, following: false },
  { name: "Lil Baby", handle: "@lilbaby", cards: 54, avatar: card2, following: false },
  { name: "Pat McAfee", handle: "@patmcafee", cards: 121, avatar: card3, following: false },
  { name: "Rich Paul", handle: "@richpaul", cards: 178, avatar: card9, following: false },
];

function PeersView({ showToast, allCards, folders }: { showToast: (msg: string) => void; allCards: typeof ALL_CARDS; folders: { id: number; name: string; color: string; cardIds: number[] }[] }) {
  const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
  const [query, setQuery] = useState("");
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [showShareFlow, setShowShareFlow] = useState(false);

  const filteredSuggested = SUGGESTED.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.handle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>

        {/* My Peers — horizontal scroll */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase px-6 mb-3">My Peers</p>
          <div className="flex gap-6 px-6 justify-center flex-wrap">
            {PEERS.map((peer, i) => (
              <AnimateIn key={i} delay={i * 80}>
              <button
                onClick={() => setSelectedPeer(peer)}
                className="flex flex-col items-center gap-2 focus:outline-none flex-shrink-0"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-sm">
                    <img src={peer.avatar} alt={peer.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                  </div>
                  {peer.verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#b49e63] border-2 border-white flex items-center justify-center">
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-gray-900 leading-tight text-center max-w-[64px] truncate">{peer.name.split(" ")[0]}</p>
                <div className="flex flex-col items-center" style={{ gap: 1 }}>
                  <p className="text-[9px] text-gray-400 leading-none">{peer.handle}</p>
                  <p className="text-[9px] text-gray-400 leading-none">{peer.cards} cards</p>
                </div>
              </button>
              </AnimateIn>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 mx-6 mb-5" />

        {/* Actions */}
        <div className="flex gap-2 px-6 mb-5">
          <button onClick={() => setShowShareFlow(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gray-950 text-white text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5" />Share Collection
          </button>
        </div>

        {/* Search */}
        <div className="px-6 mb-5">
          <div className="flex items-center gap-2.5 rounded-2xl bg-gray-100 px-4 py-3">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search collectors…"
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              style={{ fontFamily: "'Google Sans', sans-serif" }}
            />
            {query && <button onClick={() => setQuery("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
        </div>

        {/* Suggested */}
        <div className="px-6">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-3">Suggested</p>
          <div className="flex flex-col">
            {filteredSuggested.map((s, i) => (
              <AnimateIn key={i} delay={i * 70}>
              <div className="flex items-center gap-3 py-3" style={{ borderBottom: i < filteredSuggested.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={s.avatar} alt={s.name} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top center" }} draggable={false} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  <p className="text-[11px] text-gray-400">{s.handle} · {s.cards} cards</p>
                </div>
                <button
                  onClick={() => setFollowing(f => ({ ...f, [s.handle]: !f[s.handle] }))}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: following[s.handle] ? "#f4f4f5" : "#111",
                    color: following[s.handle] ? "#888" : "#fff",
                  }}
                >
                  {following[s.handle] ? "Following" : "Follow"}
                </button>
              </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>

      {selectedPeer && <PeerProfileSheet peer={selectedPeer} onClose={() => setSelectedPeer(null)} />}
      {showShareFlow && <ShareFlow onClose={() => setShowShareFlow(false)} allCards={allCards} folders={folders} />}
    </>
  );
}

// ── AnimateIn ─────────────────────────────────────────────────────────────────

function AnimateIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(28px)",
        transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Share sheet ───────────────────────────────────────────────────────────────

const SHARE_PLATFORMS = [
  { id: "link",  label: "Copy Link",   sub: "Anyone with the link can view", icon: <Link className="w-4 h-4 text-gray-600" /> },
  { id: "msg",   label: "Messages",    sub: "iMessage or SMS",               icon: <MessageCircle className="w-4 h-4 text-green-500" /> },
  { id: "mail",  label: "Email",       sub: "Share as an email",             icon: <Mail className="w-4 h-4 text-blue-500" /> },
  { id: "more",  label: "More",        sub: "Instagram, Twitter & more",     icon: <Share2 className="w-4 h-4 text-gray-400" /> },
];

function ShareFlow({ onClose, allCards, folders }: { onClose: () => void; allCards: typeof ALL_CARDS; folders: { id: number; name: string; color: string; cardIds: number[] }[] }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<"collection" | "folder" | "card" | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<typeof folders[0] | null>(null);
  const [selectedCard, setSelectedCard] = useState<typeof allCards[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const shareTitle = type === "collection" ? "Andrew's Collection"
    : type === "folder" ? selectedFolder?.name ?? ""
    : selectedCard ? `${selectedCard.player} ${selectedCard.year}` : "";

  const shareSubtitle = type === "collection" ? `${allCards.length} cards · Est. $${allCards.reduce((s,c)=>s+c.value,0).toLocaleString()}`
    : type === "folder" ? `${selectedFolder?.cardIds.length} cards`
    : selectedCard ? `${selectedCard.grader} ${selectedCard.grade} · $${selectedCard.value.toLocaleString()}` : "";

  const canContinue = type === "collection" || (type === "folder" && selectedFolder) || (type === "card" && selectedCard);

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #c9a84c 0%, #e8c96e 45%, #b8903c 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          {/* Preview */}
          {type === "card" && selectedCard?.img && (
            <img src={selectedCard.img} alt={selectedCard.player} className="w-36 mb-5 rounded-xl"
              style={{ objectFit: "contain", boxShadow: "0 12px 32px rgba(0,0,0,0.3)", transform: "rotate(-2deg)" }} draggable={false} />
          )}
          {type === "folder" && selectedFolder && (
            <div className="w-28 h-28 rounded-2xl mb-5 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.25)", boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
              <Folder className="w-12 h-12 text-white" />
            </div>
          )}
          {type === "collection" && (
            <div className="flex gap-1 mb-5">
              {allCards.filter(c => c.img).slice(0, 3).map((c, i) => (
                <img key={c.id} src={c.img} alt={c.player} className="w-20 rounded-lg"
                  style={{ objectFit: "contain", background: "rgba(255,255,255,0.2)", boxShadow: "0 8px 20px rgba(0,0,0,0.25)", transform: `rotate(${[-6,0,6][i]}deg)` }} draggable={false} />
              ))}
            </div>
          )}

          <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-2">Shared</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
            {type === "card" ? `Look at this card!` : type === "folder" ? `Check out ${selectedFolder?.name}!` : "Look at my collection!"}
          </h2>
          <p className="text-white/70 text-sm mb-8">{shareSubtitle}</p>

          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm mb-3"
            style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>
            Share Again
          </button>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl font-semibold text-sm"
            style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.8)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto rounded-t-3xl bg-white overflow-hidden" style={{ maxHeight: "88vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        {/* Progress */}
        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {[1,2].map(i => <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ background: step >= i ? "#111" : "#f0f0f0" }} />)}
          </div>
          <span className="text-xs text-gray-400 mr-3">{step}/2</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(88vh - 88px)", scrollbarWidth: "none" }}>

          {/* Step 1 — What to share */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">What do you want to share?</h2>
              <p className="text-sm text-gray-400 mb-5">Choose what you'd like to send.</p>

              {/* Options */}
              {[
                { id: "collection" as const, label: "Entire Collection", sub: `${allCards.length} cards · $${allCards.reduce((s,c)=>s+c.value,0).toLocaleString()}` },
                { id: "folder" as const, label: "A Folder", sub: "Select one of your folders" },
                { id: "card" as const, label: "A Single Card", sub: "Pick one card to share" },
              ].map(opt => (
                <button key={opt.id} onClick={() => { setType(opt.id); setSelectedFolder(null); setSelectedCard(null); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl mb-2 text-left transition-all"
                  style={{ background: type === opt.id ? "#111" : "#f7f7f7" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: type === opt.id ? "#fff" : "#111" }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: type === opt.id ? "rgba(255,255,255,0.6)" : "#aaa" }}>{opt.sub}</p>
                  </div>
                  {type === opt.id && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                </button>
              ))}

              {/* Folder picker */}
              {type === "folder" && (
                <div className="flex flex-col gap-2 mt-3 mb-4">
                  {folders.map(f => (
                    <button key={f.id} onClick={() => setSelectedFolder(f)}
                      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                      style={{ background: selectedFolder?.id === f.id ? f.color : "#f4f4f5" }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selectedFolder?.id === f.id ? "rgba(255,255,255,0.7)" : f.color }} />
                      <span className="text-sm font-semibold" style={{ color: selectedFolder?.id === f.id ? "#fff" : "#111" }}>{f.name}</span>
                      <span className="text-xs ml-auto" style={{ color: selectedFolder?.id === f.id ? "rgba(255,255,255,0.6)" : "#aaa" }}>{f.cardIds.length} cards</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Card picker */}
              {type === "card" && (
                <div className="grid grid-cols-3 gap-2 mt-3 mb-4">
                  {allCards.map(card => (
                    <button key={card.id} onClick={() => setSelectedCard(card)} className="relative focus:outline-none">
                      <div className="overflow-hidden" style={{ outline: selectedCard?.id === card.id ? "2px solid #111" : "2px solid transparent", outlineOffset: 2 }}>
                        {card.img
                          ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                          : <div className="w-full flex items-center justify-center py-4" style={{ background: GRADER_COLOR[card.grader]||"#888", aspectRatio:"2.5/3.5" }}><span className="text-white text-[9px] text-center px-1">{card.player}</span></div>
                        }
                      </div>
                      {selectedCard?.id === card.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(2)} disabled={!canContinue}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30 transition-opacity mt-2">
                Continue
              </button>
            </>
          )}

          {/* Step 2 — How to share */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Share via</h2>
              <div className="rounded-2xl bg-gray-50 px-4 py-3 mb-5">
                <p className="text-sm font-semibold text-gray-900">{shareTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{shareSubtitle}</p>
              </div>
              {SHARE_PLATFORMS.map((p, i) => (
                <button key={p.id} onClick={() => { if (p.id === "link") { setCopied(true); setTimeout(() => { setCopied(false); setDone(true); }, 800); } else setDone(true); }}
                  className="w-full flex items-center gap-4 py-3.5 text-left"
                  style={{ borderBottom: i < SHARE_PLATFORMS.length - 1 ? "1px solid #f4f4f5" : "none" }}>
                  <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {p.id === "link" && copied ? <Check className="w-4 h-4 text-emerald-500" /> : p.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{p.id === "link" && copied ? "Copied!" : p.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </>
          )}

          {step === 2 && <button onClick={() => setStep(1)} className="w-full mt-4 py-2.5 text-sm text-gray-400">← Back</button>}
        </div>
      </div>
    </div>
  );
}

// ── Sell sheet ────────────────────────────────────────────────────────────────

const SELL_PLATFORMS = ["eBay", "Fanatics", "COMC", "MySlabs", "StockX"];

function SellFlow({ onClose, allCards }: { onClose: () => void; allCards: typeof ALL_CARDS }) {
  const [step, setStep] = useState(1);
  const [selectedCard, setSelectedCard] = useState<typeof allCards[0] | null>(null);
  const [platform, setPlatform] = useState("eBay");
  const [askingPrice, setAskingPrice] = useState("");
  const [condition, setCondition] = useState("As graded");
  const [shipsFrom, setShipsFrom] = useState("United States");
  const [done, setDone] = useState(false);
  const [cardSearch, setCardSearch] = useState("");

  const filteredCards = allCards.filter(c =>
    c.player.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.year.includes(cardSearch)
  );

  const STEPS = ["Card", "Listing", "Review"];

  if (done) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full rounded-3xl overflow-hidden" style={{ background: "linear-gradient(145deg, #111 0%, #333 100%)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mb-5">
            <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-2">Listed</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Your card is live!</h2>
          {selectedCard && <p className="text-white/60 text-sm mb-1">{selectedCard.player} · {selectedCard.year}</p>}
          <p className="text-white font-semibold text-lg mb-6">${parseFloat(askingPrice || "0").toLocaleString()} · {platform}</p>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-white text-gray-900 text-sm font-semibold">Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto rounded-t-3xl bg-white overflow-hidden" style={{ maxHeight: "92vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>

        {/* Progress */}
        <div className="flex items-center justify-between px-6 pt-4 mb-5">
          <div className="flex-1 flex items-center gap-1 mr-4">
            {STEPS.map((_, i) => <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ background: step > i ? "#111" : "#f0f0f0" }} />)}
          </div>
          <span className="text-xs text-gray-400 mr-3">{step}/{STEPS.length}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "calc(92vh - 88px)", scrollbarWidth: "none" }}>

          {/* Step 1 — Pick card */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Which card are you selling?</h2>
              <p className="text-sm text-gray-400 mb-4">Pick from your collection.</p>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-3.5 py-2.5 mb-4">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={cardSearch} onChange={e => setCardSearch(e.target.value)} placeholder="Search cards…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
                {cardSearch && <button onClick={() => setCardSearch("")}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {filteredCards.map(card => (
                  <button key={card.id} onClick={() => setSelectedCard(card)} className="relative focus:outline-none group">
                    <div className="overflow-hidden transition-all" style={{ outline: selectedCard?.id === card.id ? "2px solid #111" : "2px solid transparent", outlineOffset: 2 }}>
                      {card.img
                        ? <img src={card.img} alt={card.player} className="w-full block" style={{ objectFit: "contain", background: "#f4f4f5" }} draggable={false} />
                        : <div className="w-full flex items-center justify-center py-4" style={{ background: GRADER_COLOR[card.grader]||"#888", aspectRatio:"2.5/3.5" }}><span className="text-white text-[9px] text-center px-1">{card.player}</span></div>
                      }
                    </div>
                    {selectedCard?.id === card.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <p className="text-[9px] text-gray-500 text-center mt-1 truncate">{card.player.split(" ").pop()}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} disabled={!selectedCard}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {/* Step 2 — Listing details */}
          {step === 2 && selectedCard && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Set your listing</h2>
              <p className="text-sm text-gray-400 mb-4">Price it and choose where to list.</p>

              {/* Card preview */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 mb-5">
                {selectedCard.img
                  ? <img src={selectedCard.img} alt={selectedCard.player} className="w-12 flex-shrink-0" style={{ objectFit: "contain", background: "#ebebeb" }} draggable={false} />
                  : <div className="w-12 h-16 flex-shrink-0 flex items-center justify-center rounded" style={{ background: GRADER_COLOR[selectedCard.grader]||"#888" }}><span className="text-white text-[8px] text-center px-0.5">{selectedCard.player}</span></div>
                }
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedCard.player}</p>
                  <p className="text-xs text-gray-400">{selectedCard.year} · {selectedCard.grader} {selectedCard.grade}</p>
                  <p className="text-xs text-gray-400">Est. value: <span className="font-semibold text-gray-700">${selectedCard.value.toLocaleString()}</span></p>
                </div>
              </div>

              {/* Platform */}
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Platform</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {SELL_PLATFORMS.map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                    style={{ background: platform === p ? "#111" : "#f4f4f5", color: platform === p ? "#fff" : "#888" }}>
                    {p}
                  </button>
                ))}
              </div>

              {/* Asking price */}
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Asking Price *</p>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input value={askingPrice} onChange={e => setAskingPrice(e.target.value)} placeholder={selectedCard.value.toLocaleString()}
                  inputMode="decimal" type="number"
                  className="w-full rounded-2xl bg-gray-50 pl-8 pr-4 py-3.5 text-base text-gray-900 placeholder-gray-300 outline-none"
                  style={{ fontFamily: "'Google Sans', sans-serif" }} />
              </div>

              {/* Ships from */}
              <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Ships From</p>
              <input value={shipsFrom} onChange={e => setShipsFrom(e.target.value)} placeholder="Country / Region"
                className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 outline-none mb-6"
                style={{ fontFamily: "'Google Sans', sans-serif" }} />

              <button onClick={() => setStep(3)} disabled={!askingPrice.trim()}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
                Continue
              </button>
            </>
          )}

          {/* Step 3 — Review */}
          {step === 3 && selectedCard && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Review your listing</h2>
              <p className="text-sm text-gray-400 mb-5">Everything looks good?</p>

              {/* Summary card */}
              <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#f7f7f7" }}>
                <div className="h-1 w-full" style={{ background: GRADER_COLOR[selectedCard.grader] || "#111" }} />
                <div className="flex items-center gap-4 p-4">
                  {selectedCard.img
                    ? <img src={selectedCard.img} alt={selectedCard.player} className="w-16 flex-shrink-0" style={{ objectFit: "contain", background: "#ebebeb" }} draggable={false} />
                    : <div className="w-16 h-20 flex-shrink-0 flex items-center justify-center rounded" style={{ background: GRADER_COLOR[selectedCard.grader]||"#888" }}><span className="text-white text-[8px] text-center px-1">{selectedCard.player}</span></div>
                  }
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{selectedCard.player}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedCard.year} · {selectedCard.brand}</p>
                    <p className="text-xs text-gray-400">{selectedCard.grader} {selectedCard.grade} · {selectedCard.gradeLabel}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-px bg-gray-200">
                  {[
                    { label: "Price", value: `$${parseFloat(askingPrice).toLocaleString()}` },
                    { label: "Platform", value: platform },
                    { label: "Ships From", value: shipsFrom },
                  ].map(s => (
                    <div key={s.label} className="bg-white px-3 py-3 text-center">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setDone(true)}
                className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold mb-2">
                List for Sale
              </button>
            </>
          )}

          {step > 1 && !done && (
            <button onClick={() => setStep(s => s - 1)} className="w-full mt-2 py-2.5 text-sm text-gray-400">← Back</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CountUp ───────────────────────────────────────────────────────────────────

function CountUp({ to, duration = 1000, prefix = "", suffix = "" }: { to: number; duration?: number; prefix?: string; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return <>{prefix}{value.toLocaleString()}{suffix}</>;
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>("cards");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Card | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([
    { id: 1, name: "Rookies", color: "#1a6cc4", cardIds: [1, 6] },
    { id: 2, name: "Hall of Fame", color: "#c9a84c", cardIds: [2, 3] },
  ]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [openFolder, setOpenFolder] = useState<FolderType | null>(null);
  const [cardSearchOpen, setCardSearchOpen] = useState(false);
  const [cardQuery, setCardQuery] = useState("");
  const [cardsSubView, setCardsSubView] = useState<"cards" | "folders">("cards");
  const [toast, setToast] = useState("");
  const [userCards, setUserCards] = useState<typeof ALL_CARDS>([]);

  const allCards = [...ALL_CARDS, ...userCards];

  const totalValue = allCards.reduce((s, c) => s + c.value, 0);
  const displayedCards = cardQuery
    ? allCards.filter(c => c.player.toLowerCase().includes(cardQuery.toLowerCase()) || c.year.includes(cardQuery) || c.team.toLowerCase().includes(cardQuery.toLowerCase()))
    : allCards;

  const handleAddCard = (newCard: typeof ALL_CARDS[0]) => {
    setUserCards(prev => [...prev, newCard]);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-white" style={{ fontFamily: "'Google Sans', sans-serif" }}>
      <div className="relative w-full max-w-[430px] flex flex-col min-h-screen bg-white overflow-hidden">

        {/* Top bar */}
        <div className="flex flex-col items-center px-7 pt-16 pb-5">
          {/* Avatar + PRO badge */}
          <div className="relative mb-3">
            <img src={profilePic} alt="Andrew" className="w-24 h-24 rounded-full object-cover" />
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full border-2 border-white flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9a84c 0%, #e8c96e 50%, #b8903c 100%)" }}>
              <span className="text-[9px] font-black text-white tracking-widest">PRO</span>
            </div>
          </div>

          {/* Name + handle + followers */}
          <h1 className="text-xl font-semibold text-gray-900 leading-none">Andrew Cordle</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm text-gray-400">@andrewcordle</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-sm text-gray-500 font-medium">219 <span className="text-gray-400 font-normal">followers</span></span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-base text-gray-400">
              <CountUp to={allCards.length} duration={1000} suffix=" cards" /> · Value $<CountUp to={totalValue} duration={1000} />
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1 px-7 mb-5">
          {([
            { id: "cards", label: "Cards", icon: LayoutGrid },
            { id: "shop", label: "Shop", icon: TrendingUp },
            { id: "peers", label: "Peers", icon: Users },
          ] as { id: MainTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setMainTab(id); setOpenFolder(null); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ background: mainTab === id ? "#111" : "transparent", color: mainTab === id ? "#fff" : "#bbb" }}>
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* CARDS */}
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

            {/* Cards / Folders switcher */}
            <div className="flex items-center gap-1 px-7 mb-4">
              {(["cards", "folders"] as const).map(s => (
                <button key={s} onClick={() => setCardsSubView(s)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors"
                  style={{ background: cardsSubView === s ? "#111" : "transparent", color: cardsSubView === s ? "#fff" : "#bbb" }}>
                  {s === "cards" ? "Cards" : "Folders"}
                </button>
              ))}
            </div>

            {/* Cards view */}
            {cardsSubView === "cards" && (
              <div className="flex-1 px-7 pb-10 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                {view === "grid" ? (
                  <div className="grid grid-cols-3 gap-3">
                    {(cardQuery ? displayedCards : allCards).map((card, i) => <CardTile key={card.id} card={card} index={i} onClick={() => setSelected(card)} />)}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-50">
                    {(cardQuery ? displayedCards : allCards).map(card => <CardListRow key={card.id} card={card} onClick={() => setSelected(card)} />)}
                  </div>
                )}
              </div>
            )}

            {/* Folders grid */}
            {cardsSubView === "folders" && (
              <div className="flex-1 px-7 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: "110px" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400">{folders.length} folder{folders.length !== 1 ? "s" : ""}</p>
                  <button onClick={() => setShowNewFolder(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none">
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {folders.map((folder, fi) => {
                    const folderValue = allCards.filter(c => folder.cardIds.includes(c.id)).reduce((s, c) => s + c.value, 0);
                    const previewCards = allCards.filter(c => folder.cardIds.includes(c.id)).slice(0, 3);
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

        {/* Folder detail — triggered from pills in Cards tab */}
        {openFolder && (
          <div className="absolute inset-0 bg-white z-30 flex flex-col">
            <FolderDetailView
              folder={openFolder}
              onBack={() => setOpenFolder(null)}
              allCards={allCards}
              onUpdate={updated => {
                setFolders(fs => fs.map(f => f.id === updated.id ? updated : f));
                setOpenFolder(updated);
              }}
            />
          </div>
        )}

        {/* MARKET */}
        {mainTab === "shop" && <MarketView />}
        {mainTab === "peers" && <PeersView showToast={showToast} allCards={allCards} folders={folders} />}


        {/* Footer */}
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
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-gray-950 text-white text-xs font-semibold shadow-lg whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>

      {selected && (
        <DetailSheet
          onClose={() => setSelected(null)}
          cards={cardQuery ? displayedCards : allCards}
          initialIndex={(cardQuery ? displayedCards : allCards).findIndex(c => c.id === selected.id)}
        />
      )}
      {showNewFolder && <NewFolderSheet onClose={() => setShowNewFolder(false)} allCards={allCards} onCreate={(name, color, thumbnail, cardIds) => setFolders(p => [...p, { id: Date.now(), name, color, cardIds: cardIds ?? [], thumbnail }])} />}
      {showScan && <ScanCardSheet onClose={() => setShowScan(false)} onAdd={handleAddCard} />}
      {showShare && <ShareFlow onClose={() => setShowShare(false)} allCards={allCards} folders={folders} />}
      {showSell && <SellFlow onClose={() => setShowSell(false)} allCards={allCards} />}
    </div>
  );
}
