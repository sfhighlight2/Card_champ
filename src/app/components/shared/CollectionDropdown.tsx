import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutGrid, ChevronDown, Check, Grid3X3, Folder, TrendingUp, Zap } from "lucide-react";

export type CollectionSection = "cards" | "folders" | "insights" | "chase";

const ITEMS: { value: CollectionSection; label: string; icon: typeof Grid3X3 }[] = [
  { value: "cards", label: "Cards", icon: Grid3X3 },
  { value: "folders", label: "Folders", icon: Folder },
  { value: "chase", label: "Chase", icon: Zap },
  { value: "insights", label: "Insights", icon: TrendingUp },
];

interface CollectionDropdownProps {
  active: boolean;
  value: CollectionSection;
  onChange: (v: CollectionSection) => void;
  onActivate: () => void;
}

export function CollectionDropdown({ active, value, onChange, onActivate }: CollectionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) setMenuPosition({ top: rect.bottom + 8, left: rect.left });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const handleClick = () => {
    if (!active) { onActivate(); setOpen(true); return; }
    setOpen(o => !o);
  };

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1 md:gap-2 font-bold transition-all ${
          active
            ? "pl-3 pr-2.5 py-2 rounded-full bg-[#0d0d11] text-white text-[11px] md:pl-4 md:pr-3.5 md:py-2.5 md:text-[15px] shadow-sm"
            : "text-slate-400 font-semibold text-[11px] md:text-[15px] hover:text-slate-600"
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
        <span>Collection</span>
        <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 text-white/80 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed w-48 rounded-2xl bg-white py-1.5 shadow-xl border border-gray-100 z-50"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          {ITEMS.map(({ value: v, label, icon: Icon }) => (
            <button
              key={v}
              role="menuitemradio"
              aria-checked={value === v}
              onClick={() => { onChange(v); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 text-left transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {value === v && <Check className="w-4 h-4 text-gray-900" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
