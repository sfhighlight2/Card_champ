import { useEffect, useRef, useState } from "react";
import { LayoutGrid, ChevronDown, Check, Grid3X3, Folder, TrendingUp } from "lucide-react";

export type CollectionSection = "cards" | "folders" | "insights";

const ITEMS: { value: CollectionSection; label: string; icon: typeof Grid3X3 }[] = [
  { value: "cards", label: "Cards", icon: Grid3X3 },
  { value: "folders", label: "Folders", icon: Folder },
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

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
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
    <div className="relative" ref={ref}>
      <button
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 font-semibold transition-colors ${
          active ? "pl-5 pr-4 py-3 rounded-full bg-gray-950 text-white text-base" : "text-gray-400 text-base"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        Collection
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute top-full left-0 mt-2 w-48 rounded-2xl bg-white py-1.5 shadow-xl border border-gray-100 z-30">
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
        </div>
      )}
    </div>
  );
}
