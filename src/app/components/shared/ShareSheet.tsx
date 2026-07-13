import { useState } from "react";
import type { ReactNode } from "react";
import { X, Link, Mail, MessageCircle, Check, Share2, ChevronRight } from "lucide-react";

interface ShareTarget {
  label: string;
  subtitle: string;
  icon: ReactNode;
  action: () => void;
}

interface ShareSheetProps {
  title: string;
  subtitle: string;
  onClose: () => void;
}

export function ShareSheet({ title, subtitle, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(`${title} — ${subtitle}`).catch(() => {});
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
      <div className="mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 mb-1 md:hidden">
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>

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
