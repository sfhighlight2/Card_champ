import { WifiOff, RefreshCw } from "lucide-react";

/**
 * Shown when a surface's data failed to load. Every list used to fall back to
 * its empty state on error, so a network blip read as "your collection is
 * gone" — an error must look like an error, and offer a way out.
 */
export function ErrorState({ onRetry, label = "Couldn't load this" }: { onRetry: () => void; label?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <WifiOff className="w-7 h-7 text-gray-400" />
      </div>
      <p className="text-base font-semibold text-gray-900">{label}</p>
      <p className="text-sm text-gray-400 mt-1 mb-5 max-w-[240px]">
        Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-3 rounded-full bg-gray-950 text-white text-sm font-semibold"
      >
        <RefreshCw className="w-4 h-4" /> Try again
      </button>
    </div>
  );
}
