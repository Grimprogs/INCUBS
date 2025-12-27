/*
 * mobile/supabaseClient.ts
 *
 * Create and export a Supabase client instance for the mobile app.
 * The file reads the URL and anon key from environment variables
 * or global variables so you don't embed secrets in the repo.
 */
import { createClient } from '@supabase/supabase-js';
// Try to read Expo config if present so keys can be injected via app.json/app.config.js
// This makes it easier to run in Expo where process.env may not be available.
// Read values from the environment only. Prefer `process.env` and
// fall back to `globalThis` for quick dev overrides. This avoids
// attempting multiple discovery strategies which caused noisy logs.
const SUPABASE_URL = (process.env as any).SUPABASE_URL || (globalThis as any).SUPABASE_URL;
const SUPABASE_ANON_KEY = (process.env as any).SUPABASE_ANON_KEY || (globalThis as any).SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Before throwing, log which sources are present (do not log secrets).
  try {
    // eslint-disable-next-line no-console
    console.log('supabase config sources', JSON.stringify({
      gotFromGlobalThis: !!((globalThis as any).SUPABASE_URL || (globalThis as any).SUPABASE_ANON_KEY),
      gotFromProcessEnv: !!((process.env as any).SUPABASE_URL || (process.env as any).SUPABASE_ANON_KEY)
    }));
  } catch (e) {
    // ignore logging errors
  }

  const msg =
    'Supabase URL or anon key not found. Set SUPABASE_URL and SUPABASE_ANON_KEY.\n' +
    'Options:\n' +
    '1) For quick dev: set in App.tsx before imports: globalThis.SUPABASE_URL = "https://<project>.supabase.co"; globalThis.SUPABASE_ANON_KEY = "<anon-key>"\n' +
    '2) For Expo: add them to app.json under expo.extra and rebuild (or use EAS secrets).\n' +
    '3) For native bundlers: set process.env or use a dotenv solution.\n';
  // Log an explicit error and throw so the redbox shows this helpful message.
  // This prevents the lower-level Supabase client validation error that is harder to read.
  // eslint-disable-next-line no-console
  console.error(msg);
  throw new Error(msg);
}

// Create the client. The anon key is safe to use in client apps
// only when you enforce Row Level Security (RLS) policies.
export const supabase = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);

// Debug helper: show which source provided the keys. Do not print secrets.
try {
  // Only print presence/absence, not values. (This is now printed earlier too.)
} catch (e) {
  // ignore logging errors
}
