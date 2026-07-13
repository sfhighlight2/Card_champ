import { useState } from "react";
import { X, Check } from "lucide-react";
import type { FolderType } from "../../types";
import { FOLDER_COLORS } from "../../data/mockCards";

interface EditFolderSheetProps {
  folder: FolderType;
  onClose: () => void;
  onSave: (updated: FolderType) => void;
}

export function EditFolderSheet({ folder, onClose, onSave }: EditFolderSheetProps) {
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ ...folder, name: name.trim(), color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-900">Edit folder</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 pb-10">
          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 mt-4">Name</p>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-4 text-base text-gray-900 outline-none mb-6" />

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">Color</p>
          <div className="grid grid-cols-4 gap-3 mb-8">
            {FOLDER_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="h-14 rounded-2xl flex items-center justify-center transition-all"
                style={{ background: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "3px" }}>
                {color === c && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>

          <button onClick={handleSave} disabled={!name.trim()}
            className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-30">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
