import { useEffect, useState, type FormEvent } from "react";
import { Mail, MailCheck, Lock, Eye, EyeOff, User, AtSign, IdCard, Check, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { AnimateIn } from "../shared/AnimateIn";
import { cardChampsLogoDark } from "../../data/cardImages";
import { isHandleAvailable } from "../../data/repositories";
import { passwordPolicyError, PASSWORD_HINT } from "../../lib/password";

/** Matches profiles_handle_format, so the form rejects what the column would. */
const HANDLE_PATTERN = /^[a-z0-9_]{3,30}$/;

/** Turns ordinary typing into a valid handle: lowercased, @ dropped, spaces and
 *  dashes folded to underscores. Mirrors what the signup trigger does server-side. */
function normalizeHandle(input: string): string {
  return input.trim().toLowerCase().replace(/^@/, "").replace(/[\s-]+/g, "_");
}

/** A reasonable first suggestion so most people never touch the field. */
function suggestHandle(displayName: string, email: string): string {
  const base = displayName.trim() || email.split("@")[0] || "";
  const cleaned = normalizeHandle(base).replace(/[^a-z0-9_]/g, "");
  return cleaned.slice(0, 30);
}

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => void;
  onSignUp: (email: string, password: string, profile: { displayName: string; handle: string }) => void;
  onGuest: () => void;
  /** Sends a reset email; the link lands on /reset-password. */
  onForgotPassword: (email: string) => void;
  /** Message from the auth call itself, e.g. wrong password. */
  authError?: string;
  busy?: boolean;
  /** Sign-up succeeded but the account needs email confirmation first. */
  awaitingConfirmation?: boolean;
  /** A reset email has just been sent. */
  resetEmailSent?: boolean;
  /** Which tab to open on. A guest tapping "Create an account" should land on
   *  Sign Up, not have to find the tab themselves. */
  initialMode?: "signin" | "signup";
  /** Leaves the "check your email" screens and returns to the sign-in form —
   *  without it those screens are dead ends this component can't escape. */
  onBackToSignIn?: () => void;
}

export function LoginScreen({
  onSignIn, onSignUp, onGuest, onForgotPassword,
  authError = "", busy = false, awaitingConfirmation = false, resetEmailSent = false,
  initialMode = "signin", onBackToSignIn,
}: LoginScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  // Signup-only fields. A new account used to be provisioned as "Collector" with
  // a collector_NNNN handle, so the community feed filled up with identical names.
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [handleState, setHandleState] = useState<"idle" | "checking" | "free" | "taken" | "invalid">("idle");

  const error = localError || authError;

  // Suggest a handle from the name until the user takes control of the field.
  useEffect(() => {
    if (mode !== "signup" || handleEdited) return;
    setHandle(suggestHandle(displayName, email));
  }, [displayName, email, mode, handleEdited]);

  // Debounced availability check. Answered by a security-definer RPC, because a
  // pre-signup caller cannot see non-discoverable profiles and would otherwise be
  // told a taken handle was free.
  useEffect(() => {
    if (mode !== "signup") return;
    const candidate = normalizeHandle(handle);
    if (!candidate) { setHandleState("idle"); return; }
    if (!HANDLE_PATTERN.test(candidate)) { setHandleState("invalid"); return; }

    setHandleState("checking");
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const free = await isHandleAvailable(candidate);
        if (active) setHandleState(free ? "free" : "taken");
      } catch {
        // Never block signup on this check — the trigger falls back safely.
        if (active) setHandleState("idle");
      }
    }, 400);

    return () => { active = false; clearTimeout(timer); };
  }, [handle, mode]);

  // Live policy feedback for signup, mirroring the server so a rejection can't
  // arrive as a surprise after submit.
  const policyError = mode === "signup" && password.length > 0 ? passwordPolicyError(password) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (password.length === 0) {
      setLocalError("Enter your password.");
      return;
    }
    if (mode === "signup") {
      const weak = passwordPolicyError(password);
      if (weak) {
        setLocalError(weak);
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Those passwords don't match.");
        return;
      }
      if (displayName.trim().length < 1) {
        setLocalError("Add your name so other collectors know who you are.");
        return;
      }
      const candidate = normalizeHandle(handle);
      if (!HANDLE_PATTERN.test(candidate)) {
        setLocalError("Handles are 3–30 characters, using letters, numbers, and underscores.");
        return;
      }
      if (handleState === "taken") {
        setLocalError("That handle is already taken.");
        return;
      }
      setLocalError("");
      onSignUp(email, password, { displayName: displayName.trim(), handle: candidate });
      return;
    }
    setLocalError("");
    onSignIn(email, password);
  };

  const requestReset = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError("Enter your email address first, then tap Forgot password.");
      return;
    }
    setLocalError("");
    onForgotPassword(email);
  };

  if (resetEmailSent) {
    return (
      <div className="flex-1 flex flex-col justify-center px-8 py-6">
        <AnimateIn>
          <div className="flex flex-col items-center text-center">
            <img src={cardChampsLogoDark} alt="Card Champs" className="w-36 h-auto mb-6" draggable={false} />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <MailCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-[280px]">
              We sent a password reset link to <span className="font-semibold text-gray-600">{email}</span>. It can
              only be used once, so open it soon.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onBackToSignIn}
              className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold border-gray-200"
            >
              Back to sign in
            </Button>
          </div>
        </AnimateIn>
      </div>
    );
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex-1 flex flex-col justify-center px-8 py-6">
        <AnimateIn>
          <div className="flex flex-col items-center text-center">
            <img src={cardChampsLogoDark} alt="Card Champs" className="w-36 h-auto mb-6" draggable={false} />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <MailCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Confirm your email</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-[280px]">
              We sent a confirmation link to <span className="font-semibold text-gray-600">{email}</span>. Open it to
              finish setting up your account, then sign in.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onBackToSignIn}
              className="mt-6 rounded-full px-6 py-2.5 text-sm font-semibold border-gray-200"
            >
              Back to sign in
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
          <img src={cardChampsLogoDark} alt="Card Champs" className="w-36 h-auto mb-2" draggable={false} />
          <h1 className="sr-only">Card Champs</h1>
          <p className="text-sm text-gray-400">
            {mode === "signin" ? "Welcome back, collector." : "Start building your collection."}
          </p>
        </div>
      </AnimateIn>

      <AnimateIn delay={80}>
        <div className="flex items-center gap-1 p-1 rounded-full bg-gray-100 mb-6">
          {(["signin", "signup"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setLocalError(""); setConfirmPassword(""); }}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ background: mode === m ? "#1d2e4e" : "transparent", color: mode === m ? "#fff" : "#9ca3af" }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="signup-name" className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 block">
                  Your name
                </Label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="signup-name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value.slice(0, 60))}
                    placeholder="Alex Rivera"
                    autoComplete="name"
                    className="w-full h-auto rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="signup-handle" className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 block">
                  Handle
                </Label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="signup-handle"
                    value={handle}
                    onChange={e => { setHandleEdited(true); setHandle(e.target.value.slice(0, 30)); }}
                    placeholder="alexrivera"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-full h-auto rounded-2xl bg-gray-50 border-none pl-11 pr-11 py-3.5 text-sm text-gray-900 placeholder-gray-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    {handleState === "checking" && <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />}
                    {handleState === "free" && <Check className="w-4 h-4 text-emerald-500" />}
                  </span>
                </div>
                <p className="text-[11px] mt-1.5 min-h-[15px]">
                  {handleState === "taken" ? (
                    <span className="text-red-500">That handle is taken — try another.</span>
                  ) : handleState === "invalid" ? (
                    <span className="text-gray-400">3–30 characters: letters, numbers, underscores.</span>
                  ) : handleState === "free" ? (
                    <span className="text-emerald-600">@{normalizeHandle(handle)} is available.</span>
                  ) : (
                    <span className="text-gray-400">This is how other collectors will find you.</span>
                  )}
                </p>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="login-email" className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 block">
              Email
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-auto rounded-2xl bg-gray-50 border-none pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="login-password" className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 block">
              Password
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
            {/* Live policy feedback, mirroring the handle-availability line: the
                requirement while empty, exactly what's missing while typing, a
                green check once it passes. The server enforces this policy, so
                telling the user up front beats a post-submit rejection. */}
            {mode === "signup" && (
              <p className="text-[11px] mt-1.5 min-h-[15px]">
                {password.length === 0 ? (
                  <span className="text-gray-400">{PASSWORD_HINT}</span>
                ) : policyError ? (
                  <span className="text-red-500">{policyError}</span>
                ) : (
                  <span className="text-emerald-600">Strong password ✓</span>
                )}
              </p>
            )}
          </div>

          {mode === "signup" && (
            <div>
              <Label htmlFor="signup-confirm" className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-1.5 block">
                Confirm password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="signup-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full h-auto rounded-2xl bg-gray-50 border-none pl-11 pr-11 py-3.5 text-sm text-gray-900 placeholder-gray-400"
                />
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <Check className="w-4 h-4 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* No "Remember me" checkbox: the session is always persisted, and a
              control that silently does nothing is worse than none at all. */}
          {mode === "signin" && (
            <div className="flex justify-end mt-1 mb-2">
              <button type="button" onClick={requestReset} disabled={busy}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50">
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" disabled={busy} className="w-full h-auto rounded-full py-3.5 text-sm font-semibold">
            {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <Separator className="flex-1" />
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">or</span>
          <Separator className="flex-1" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onGuest}
          disabled={busy}
          className="w-full h-auto rounded-full py-3.5 text-sm font-semibold border-gray-200"
        >
          <User className="w-4 h-4" />
          Continue as Guest
        </Button>
      </AnimateIn>
    </div>
  );
}
