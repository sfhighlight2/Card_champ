import { useState } from "react";
import { X } from "lucide-react";
import type { Profile } from "../../types";
import { useEscapeClose } from "../../hooks/useEscapeClose";

interface EditProfileSheetProps {
  profile: Profile;
  onClose: () => void;
  onSave: (updated: Profile) => void;
}

export function EditProfileSheet({ profile, onClose, onSave }: EditProfileSheetProps) {
  useEscapeClose(onClose);
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [chasing, setChasing] = useState(profile.chasing ?? "");
  const [tagsText, setTagsText] = useState((profile.tags ?? []).join(", "));

  const save = () => {
    const tags = tagsText.split(",").map(t => t.trim()).filter(Boolean);
    onSave({
      ...profile,
      name: name.trim() || profile.name,
      handle: handle.trim() || profile.handle,
      bio: bio.trim() || undefined,
      chasing: chasing.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" style={{ maxHeight: "88vh" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-4">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">Edit Profile</h2>
          <button onClick={save} className="px-4 py-2 rounded-full text-xs font-bold text-white" style={{ background: "#111" }}>Save</button>
        </div>

        <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: "calc(88vh - 76px)", scrollbarWidth: "none" }}>
          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Name</p>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-3" />

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Handle</p>
          <input value={handle} onChange={e => setHandle(e.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none mb-3" />

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Bio</p>
          <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 200))} rows={3}
            placeholder="Tell other collectors about yourself…"
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none mb-3" />

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Chasing</p>
          <input value={chasing} onChange={e => setChasing(e.target.value)}
            placeholder="What card are you hunting for?"
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none mb-3" />

          <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Interests</p>
          <input value={tagsText} onChange={e => setTagsText(e.target.value)}
            placeholder="Baseball, Vintage, Rookies…"
            className="w-full rounded-2xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none" />
          <p className="text-[11px] text-gray-300 mt-1.5">Comma-separated</p>
        </div>
      </div>
    </div>
  );
}
