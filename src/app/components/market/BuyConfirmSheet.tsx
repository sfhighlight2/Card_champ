import { X } from "lucide-react";
import type { MarketItem } from "../../types";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface BuyConfirmSheetProps {
  item: MarketItem;
  onClose: () => void;
  onConfirm: () => void;
}

export function BuyConfirmSheet({ item, onClose, onConfirm }: BuyConfirmSheetProps) {
  useEscapeClose(onClose);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Buy this card?</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 mb-5">
          <img src={item.img} alt={item.player} className="w-12 flex-shrink-0" style={{ objectFit: "contain", background: "#ebebeb" }} draggable={false} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.player}</p>
            <p className="text-xs text-gray-400">{item.year} · {item.grader} {item.grade}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          This adds the card to your collection for <span className="font-semibold text-gray-900">${item.price.toLocaleString()}</span>. No real payment is made — Card Champs doesn't process real purchases.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-gray-950 text-white text-sm font-semibold">Buy · ${item.price.toLocaleString()}</button>
        </div>
      </div>
    </div>
  );
}
