interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold"
            style={{ background: destructive ? "#dc2626" : "#111" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
