import { useState, type FormEvent } from "react";
import { X, Lock, Eye, EyeOff, Check } from "lucide-react";
import { useEscapeClose } from "../../hooks/useEscapeClose";
import { humanizeError } from "../../lib/errors";
import { passwordPolicyError, PASSWORD_HINT } from "../../lib/password";

interface ChangePasswordSheetProps {
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}

/**
 * Changing a password in the app.
 *
 * Previously the only route was "Forgot password?" on the sign-in screen, which
 * means signing out and waiting on an email — and that email goes through a
 * rate-limited sender. Someone who simply wants to rotate a password they still
 * know should not have to leave the app.
 *
 * Supabase's updateUser works off the live session, so the current password is
 * not required. That is also why this only appears to a signed-in user.
 */
export function ChangePasswordSheet({ onClose, onSubmit }: ChangePasswordSheetProps) {
  useEscapeClose(onClose);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const policyError = password.length > 0 ? passwordPolicyError(password) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const weak = passwordPolicyError(password);
    if (weak) {
      setError(weak);
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onSubmit(password);
      setDone(true);
    } catch (err) {
      setError(humanizeError(err, "Could not change the password."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="app-sheet mt-auto md:m-auto rounded-t-3xl md:rounded-3xl bg-white overflow-hidden w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 md:hidden"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-900">Change password</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100" aria-label="Close">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {done ? (
          <div className="px-6 pb-10 pt-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Password changed</p>
            <p className="text-xs text-gray-400 mt-1 mb-6">You'll use the new one next time you sign in.</p>
            <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 pb-10 pt-2">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">New password</p>
            <div className="relative mb-3">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full rounded-2xl bg-gray-50 pl-11 pr-11 py-3.5 text-sm text-gray-900 outline-none"
              />
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <p className="text-[11px] -mt-1.5 mb-3 min-h-[15px]">
              {password.length === 0 ? (
                <span className="text-gray-400">{PASSWORD_HINT}</span>
              ) : policyError ? (
                <span className="text-red-500">{policyError}</span>
              ) : (
                <span className="text-emerald-600">Strong password ✓</span>
              )}
            </p>

            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5">Confirm new password</p>
            <div className="relative mb-3">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full rounded-2xl bg-gray-50 pl-11 pr-11 py-3.5 text-sm text-gray-900 outline-none"
              />
              {confirm.length > 0 && password === confirm && (
                <Check className="w-4 h-4 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button type="submit" disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-gray-950 text-white text-sm font-semibold disabled:opacity-40">
              {busy ? "Saving…" : "Change password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
