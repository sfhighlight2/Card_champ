import { useState, type FormEvent } from "react";
import { Mail, MailCheck, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { AnimateIn } from "../shared/AnimateIn";
import { cardChampsLogo, cardChampsLogoDark } from "../../data/cardImages";

/** Supabase's own minimum. Validating below it only produced a server rejection
 *  the form then had to explain. */
const MIN_PASSWORD_LENGTH = 6;

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => void;
  onSignUp: (email: string, password: string) => void;
  onGuest: () => void;
  isDark: boolean;
  /** Message from the auth call itself, e.g. wrong password. */
  authError?: string;
  busy?: boolean;
  /** Sign-up succeeded but the account needs email confirmation first. */
  awaitingConfirmation?: boolean;
}

export function LoginScreen({
  onSignIn, onSignUp, onGuest, isDark, authError = "", busy = false, awaitingConfirmation = false,
}: LoginScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [localError, setLocalError] = useState("");

  const error = localError || authError;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError("Enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setLocalError("");
    if (mode === "signup") onSignUp(email, password);
    else onSignIn(email, password);
  };

  if (awaitingConfirmation) {
    return (
      <div className="flex-1 flex flex-col justify-center px-8 py-6">
        <AnimateIn>
          <div className="flex flex-col items-center text-center">
            <img src={isDark ? cardChampsLogoDark : cardChampsLogo} alt="Card Champs" className="w-36 h-auto mb-6" draggable={false} />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <MailCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Confirm your email</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-[280px]">
              We sent a confirmation link to <span className="font-semibold text-gray-600">{email}</span>. Open it to
              finish setting up your account, then sign in.
            </p>
          </div>
        </AnimateIn>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center px-8 py-6">
      <AnimateIn>
        <div className="flex flex-col items-center mb-5">
          <img src={isDark ? cardChampsLogoDark : cardChampsLogo} alt="Card Champs" className="w-36 h-auto mb-2" draggable={false} />
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
              onClick={() => { setMode(m); setLocalError(""); }}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ background: mode === m ? "#111" : "transparent", color: mode === m ? "#fff" : "#9ca3af" }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
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
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <label className="flex items-center gap-2 mt-1 mb-2 cursor-pointer">
            <Checkbox checked={remember} onCheckedChange={v => setRemember(v === true)} />
            <span className="text-xs text-gray-500">Remember me</span>
          </label>

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
