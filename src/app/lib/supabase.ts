import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/**
 * Whether the build actually received its Supabase configuration.
 *
 * This used to `throw` at module load, which on a host without the env vars set
 * means the bundle dies before React mounts and the user gets a blank white
 * page with nothing but a console error. A deploy that forgets the variables is
 * a likely mistake, so it now degrades to a client that cannot connect and lets
 * the app render an explanation instead.
 */
export const isSupabaseConfigured = !!url && !!key;

if (!isSupabaseConfigured) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. " +
      "Locally: copy .env.example to .env and fill both in. " +
      "On a host such as Netlify: set both as build environment variables and redeploy."
  );
}

// Placeholders keep createClient from throwing when configuration is absent;
// `isSupabaseConfigured` is what callers should branch on.
export const supabase = createClient(url || "https://unconfigured.supabase.co", key || "unconfigured", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Money is stored as integer minor units; the UI works in whole currency. */
export const fromMinor = (minor: number | null | undefined): number =>
  minor == null ? 0 : minor / 100;

export const toMinor = (amount: number): number => Math.round(amount * 100);
