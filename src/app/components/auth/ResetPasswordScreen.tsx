import { useState, type FormEvent } from "react";
import { Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AnimateIn } from "../shared/AnimateIn";
import { cardChampsLogo, cardChampsLogoDark } from "../../data/cardImages";

/** Supabase's own minimum. */
const MIN_PASSWORD_LENGTH = 6;

interface ResetPasswordScreenProps {
  /** False when the recovery link is missing, already used, or expired. */
  hasRecoverySession: boolean;
  onSubmit: (password: string) => Promise<void>;
  onBackToSignIn: () => void;
  isDark: boolean;
}

/**
 * Reached from the link in a password-reset email, which lands on
 * `/reset-password` — the route `resetPassword`'s `redirectTo` has always
 * pointed at, and which previously did not exist.
 */
export function ResetPasswordScreen({
  hasRecoverySession, onSubmit, onBackToSignIn, isDark,
}: ResetPasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
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
      setError(err instanceof Error ? err.message : "Could not update the password.");
    } finally {
      setBusy(false);
    }
  };

  const logo = (
    <img src={isDark ? cardChampsLogoDark : cardChampsLogo} alt="Card Champs" className="w-36 h-auto mb-6" draggable={false} />
  );

  if (!hasRecoverySession) {
    return (
      <div className="flex-1 flex flex-col justify-center px-8 py-6">
        <AnimateIn>
          <div className="flex flex-col items-center text-center">
            {logo}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">This link has expired</h1>
            <p className="text-sm text-gray-400 mt-2 mb-6 max-w-[280px]">
              Password reset links can only be used once, and they don't last long. Request a fresh one from the
              sign-in screen.
            </p>
            <Button onClick={onBackToSignIn} className="w-full h-auto rounded-full py-3.5 text-sm font-semibold">
              Back to sign in
            </Button>
          </div>
        </AnimateIn>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex-1 flex flex-col justify-center px-8 py-6">
        <AnimateIn>
          <div className="flex flex-col items-center text-center">
            {logo}
            <h1 className="text-xl font-semibold text-gray-900">Password updated</h1>
            <p className="text-sm text-gray-400 mt-2 mb-6 max-w-[280px]">
              You're signed in with your new password.
            </p>
            <Button onClick={onBackToSignIn} className="w-full h-auto rounded-full py-3.5 text-sm font-semibold">
              Go to my collection
            </Button>
          </div>
        </AnimateIn>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center px-8 py-6">
      <AnimateIn>
        <div className="flex flex-col items-center mb-5">
          {logo}
          <h1 className="text-xl font-semibold text-gray-900">Choose a new password</h1>
          <p className="text-sm text-gray-400 mt-1">Then you're back in.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="new-password" className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 block">
              New password
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full h-auto rounded-2xl bg-gray-50 border-none pl-11 pr-11 py-3.5 text-sm text-gray-900 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 block">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full h-auto rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full h-auto rounded-full py-3.5 text-sm font-semibold mt-2">
            {busy ? "Saving…" : "Set new password"}
          </Button>
        </form>
      </AnimateIn>
    </div>
  );
}
