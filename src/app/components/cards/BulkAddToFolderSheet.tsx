import { X, Folder } from "lucide-react";
import type { FolderType } from "../../types";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface BulkAddToFolderSheetProps {
  folders: FolderType[];
  count: number;
  onClose: () => void;
  onPick: (folderId: number) => void;
}

export function BulkAddToFolderSheet({ folders, count, onClose, onPick }: BulkAddToFolderSheetProps) {
  useEscapeClose(onClose);
  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "70vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add to folder</h2>
            <p className="text-xs text-gray-400 mt-0.5">{count} card{count !== 1 ? "s" : ""} selected</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 pb-8 overflow-y-auto" style={{ scrollbarWidth: "none", maxHeight: "calc(70vh - 80px)" }}>
          {folders.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No folders yet. Create one from the Folders tab first.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {folders.map(folder => (
                <button key={folder.id} onClick={() => onPick(folder.id)}
                  className="w-full flex items-center gap-3 py-3 px-3.5 rounded-2xl bg-gray-50 text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: folder.color }}>
                    <Folder className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{folder.name}</p>
                    <p className="text-xs text-gray-400">{folder.cardIds.length} cards</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
