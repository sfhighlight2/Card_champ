import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, X, Check, CheckSquare, EyeOff } from "lucide-react";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface SortOption { key: string; label: string }

export interface CollectionFilterMenuProps {
  sortOptions: SortOption[];
  sortBy: string;
  onSortChange: (key: string) => void;
  filterAuto: boolean;
  onToggleAuto: (v: boolean) => void;
  filterGems: boolean;
  onToggleGems: (v: boolean) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  selectMode: boolean;
  onToggleSelect: (v: boolean) => void;
  selectAvailable: boolean;
  hideValues: boolean;
  onToggleHideValues: (v: boolean) => void;
  onClearAll: () => void;
}

export function CollectionFilterMenu(props: CollectionFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const activeCount =
    (props.sortBy !== "recent" ? 1 : 0) + (props.filterAuto ? 1 : 0) + (props.filterGems ? 1 : 0) + (props.hideValues ? 1 : 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="View and filter options"
        aria-haspopup="dialog"
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0"
      >
        <Eye className="w-4 h-4 text-gray-500" />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-gray-950 text-white text-[10px] font-bold flex items-center justify-center border border-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && <FilterSheet {...props} onClose={() => setOpen(false)} />}
    </>
  );
}

function FilterSheet({
  sortOptions, sortBy, onSortChange, filterAuto, onToggleAuto, filterGems, onToggleGems,
  view, onViewChange, selectMode, onToggleSelect, selectAvailable, hideValues, onToggleHideValues, onClearAll, onClose,
}: CollectionFilterMenuProps & { onClose: () => void }) {
  useEscapeClose(onClose);
  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto w-full max-w-[430px] md:max-w-lg mx-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden" style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <h2 className="text-base font-semibold text-gray-900">View &amp; filters</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 132px)", scrollbarWidth: "none" }}>
          <Section label="Sort by">
            <div className="flex flex-col gap-0.5">
              {sortOptions.map(o => (
                <button key={o.key} role="radio" aria-checked={sortBy === o.key} onClick={() => onSortChange(o.key)}
                  className="w-full flex items-center justify-between py-2.5 text-sm font-medium text-gray-800 text-left">
                  {o.label}
                  {sortBy === o.key && <Check className="w-4 h-4 text-gray-900" />}
                </button>
              ))}
            </div>
          </Section>

          <Section label="Card type">
            <Segmented options={[{ v: "all", label: "All" }, { v: "autos", label: "Autos" }]}
              value={filterAuto ? "autos" : "all"} onChange={v => onToggleAuto(v === "autos")} />
          </Section>

          <Section label="Grade">
            <Segmented options={[{ v: "all", label: "All" }, { v: "gem", label: "Gem/Mint+" }]}
              value={filterGems ? "gem" : "all"} onChange={v => onToggleGems(v === "gem")} />
          </Section>

          <Section label="Display">
            <Segmented options={[{ v: "grid", label: "Grid" }, { v: "list", label: "List" }]}
              value={view} onChange={v => onViewChange(v as "grid" | "list")} />
            <div className="flex flex-col gap-0.5 mt-2">
              <ToggleRow icon={<CheckSquare className="w-4 h-4" />} label="Selection mode" disabled={!selectAvailable}
                checked={selectMode} onChange={onToggleSelect} />
              <ToggleRow icon={hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} label="Hide values"
                checked={hideValues} onChange={onToggleHideValues} />
            </div>
          </Section>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={() => { onClearAll(); }} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Clear all</button>
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Done</button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">{label}</p>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }: { options: { v: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-100">
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: value === o.v ? "#111" : "transparent", color: value === o.v ? "#fff" : "#6b7280" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ icon, label, checked, disabled = false, onChange }: { icon: ReactNode; label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className="w-full flex items-center gap-3 py-2.5 text-left disabled:opacity-40">
      <span className="text-gray-500 flex-shrink-0">{icon}</span>
      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
      <span className="w-10 h-6 rounded-full flex items-center transition-colors flex-shrink-0 px-0.5" style={{ background: checked ? "#111" : "#e5e7eb", justifyContent: checked ? "flex-end" : "flex-start" }}>
        <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}
