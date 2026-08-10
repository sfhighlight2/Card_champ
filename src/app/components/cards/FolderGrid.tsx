import { Folder } from "lucide-react";
import type { Card, FolderType } from "../../types";
import { AnimateIn } from "../shared/AnimateIn";
import { Money } from "../shared/Money";
import { CardThumb } from "./CardThumb";

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Fanned preview of the first three member cards, shown when no thumbnail copy
// has been chosen.
const PREVIEW_OFFSETS = [
  { rotate: "-8deg", translate: "-26px, 6px", z: 0 },
  { rotate: "-2deg", translate: "-4px, 0px", z: 1 },
  { rotate: "7deg",  translate: "22px, 4px", z: 2 },
];

interface FolderGridProps {
  folders: FolderType[];
  cards: Card[];
  hideValues: boolean;
  onOpen: (folder: FolderType) => void;
}

/**
 * `cardCount` and `value` come from the `folder_summaries` view, which excludes
 * archived copies — the previous inline version re-added them client-side from
 * `cardIds.length` and a local sum, so a deleted card lingered in the count.
 */
export function FolderGrid({ folders, cards, hideValues, onOpen }: FolderGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {folders.map((folder, fi) => {
        const previewCards = cards.filter(c => folder.cardIds.includes(c.id)).slice(0, 3);
        return (
          <AnimateIn key={folder.id} delay={fi * 80}>
            <button onClick={() => onOpen(folder)} className="relative w-full text-left focus:outline-none pt-2.5">
              {/* Folder tab */}
              <div className="absolute top-0 left-4 w-16 h-5 rounded-t-xl" style={{ background: hexToRgba(folder.color, 0.18) }} />
              {/* Card body */}
              <div className="relative rounded-3xl p-3" style={{ background: hexToRgba(folder.color, 0.1) }}>
                <div className="relative rounded-2xl flex items-center justify-center overflow-hidden" style={{ height: 150, background: "rgba(255,255,255,0.6)" }}>
                  {folder.thumbnail
                    ? <img src={folder.thumbnail} alt="" className="w-full h-full" style={{ objectFit: "contain" }} draggable={false} />
                    : previewCards.length > 0
                      ? previewCards.map((card, i) => (
                          <div key={card.id} className="absolute"
                            style={{ width: 92, borderRadius: 4, overflow: "hidden", boxShadow: "0 4px 14px rgba(0,0,0,0.18)", transform: `rotate(${PREVIEW_OFFSETS[i].rotate}) translate(${PREVIEW_OFFSETS[i].translate})`, zIndex: PREVIEW_OFFSETS[i].z }}>
                            <CardThumb card={card} />
                          </div>
                        ))
                      : <Folder className="w-8 h-8" style={{ color: hexToRgba(folder.color, 0.5) }} />
                  }
                </div>
                <p className="text-sm font-bold text-gray-900 leading-tight truncate mt-3">{folder.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{folder.cardCount} card{folder.cardCount !== 1 ? "s" : ""}</p>
                  <p className="text-sm font-bold" style={{ color: folder.color }}><Money value={folder.value} hidden={hideValues} /></p>
                </div>
              </div>
            </button>
          </AnimateIn>
        );
      })}
    </div>
  );
}
