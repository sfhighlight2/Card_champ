import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True once the initial session restore has settled. */
  ready: boolean;
  /** Anonymous (guest) identities are browse-only; every write policy rejects them. */
  isGuest: boolean;
  isSignedIn: boolean;
  signUp: (
    email: string,
    password: string,
    profile?: { displayName: string; handle: string }
  ) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
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
  const queryClient = useQueryClient();
  // The last account this tab held a cache for. `undefined` = nothing cached
  // yet, `null` = signed out.
  const cachedUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user?.is_anonymous) {
        void supabase.auth.signOut();
        setSession(null);
        setReady(true);
        return;
      }
      if (cachedUserId.current === undefined) {
        cachedUserId.current = data.session?.user?.id ?? null;
      }
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Guest access is retired: the app requires a real login. A device that
      // still holds an anonymous session from before is signed out so it lands
      // on the sign-in screen rather than a read-only guest view.
      if (next?.user?.is_anonymous) {
        void supabase.auth.signOut();
        return;
      }

      // Several query keys (conversations, feed, peers) are not user-scoped, so
      // account changes in the same tab — sign out, then someone else signs in —
      // would otherwise serve the previous user's cached private data. Dropping
      // the whole cache whenever the account behind this tab changes makes that
      // impossible. A guest→permanent upgrade keeps its id and its cache.
      const nextId = next?.user?.id ?? null;
      if (cachedUserId.current !== undefined && cachedUserId.current !== nextId) {
        queryClient.clear();
      }
      cachedUserId.current = nextId;

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
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;

    return {
      session,
      user,
      ready,
      isRecovering,
      isGuest: user?.is_anonymous === true,
      isSignedIn: !!user,

      async signUp(email, password, profile) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Explicit redirect so the confirmation email lands back on THIS
            // deployment, rather than falling back to the dashboard's Site URL
            // (which once pointed at localhost and stranded every signup).
            emailRedirectTo: window.location.origin,
            // Lands in auth.users.raw_user_meta_data, which the handle_new_user
            // trigger reads to name the profile. A taken or malformed handle
            // falls back to collector_N server-side rather than failing signup.
            ...(profile
              ? { data: { display_name: profile.displayName, handle: profile.handle } }
              : {}),
          },
        });
        if (error) throw error;
        // With email confirmation on, Supabase returns a user but no session.
        return { needsConfirmation: !data.session };
      },

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
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
