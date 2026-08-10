import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True once the initial session restore has settled. */
  ready: boolean;
  /** Anonymous (guest) identities are browse-only; every write policy rejects them. */
  isGuest: boolean;
  isSignedIn: boolean;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Completes a recovery: valid only while the recovery session from the email
   *  link is active. */
  updatePassword: (password: string) => Promise<void>;
  /** True between clicking a recovery link and setting a new password. */
  isRecovering: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setReady(true);
      // Fired once `detectSessionInUrl` has exchanged the recovery link. Without
      // this the app cannot tell a recovery session from a normal sign-in, and
      // would drop the user straight into their collection.
      if (event === "PASSWORD_RECOVERY") setIsRecovering(true);
      if (event === "SIGNED_OUT") setIsRecovering(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;

    return {
      session,
      user,
      ready,
      isRecovering,
      isGuest: user?.is_anonymous === true,
      isSignedIn: !!user,

      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // With email confirmation on, Supabase returns a user but no session.
        return { needsConfirmation: !data.session };
      },

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },

      async continueAsGuest() {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      },

      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },

      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      },

      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setIsRecovering(false);
      },
    };
  }, [session, ready, isRecovering]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
