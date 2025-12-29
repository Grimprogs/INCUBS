/*
 * mobile/supabaseClient.ts
 *
 * Create and export a Supabase client instance for the mobile app.
 * The file reads the URL and anon key from environment variables
 * or global variables so you don't embed secrets in the repo.
 */
import { createClient } from '@supabase/supabase-js';
// Try multiple sources for configuration so the app works in Expo and
// during native builds. Preference order:
// 1. process.env (CI/EAS/Node)
// 2. Expo Constants extras (app.config.js / app.json EAS injection)
function stripQuotes(v: any) {
  if (typeof v !== 'string') return v;
  return v.trim().replace(/^['\"]|['\"]$/g, '').trim();
}

function extractFirstJwt(v: any) {
  if (typeof v !== 'string') return v;
  // Match typical JWTs used by Supabase (base64url segments with two dots)
  const m = v.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  return m ? m[0] : v;
}

function getJwtRef(token: string | null | undefined): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = Buffer.from(payload + '=='.slice((2 - (payload.length * 3) % 4) % 4), 'base64').toString('utf8');
    const obj = JSON.parse(decoded);
    return typeof obj?.ref === 'string' ? obj.ref : null;
  } catch {
    return null;
  }
}

function getExpoExtra(key: string) {
  try {
    // runtime require to avoid bundling issues on non-expo environments
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants');
    const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || null;
    return extra ? stripQuotes(extra[key]) : null;
  } catch (e) {
    return null;
  }
}

// Try sources in order: process.env -> expo extra -> local dev `supabase.env.js` (optional, not checked into VCS)
let localFallback: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  localFallback = require('./supabase.env');
} catch (_e) {
  // not present — that's fine; localFallback stays null
}

const SUPABASE_URL = stripQuotes((process.env as any).SUPABASE_URL || getExpoExtra('SUPABASE_URL') || (localFallback && localFallback.SUPABASE_URL));
let SUPABASE_ANON_KEY = stripQuotes((process.env as any).SUPABASE_ANON_KEY || getExpoExtra('SUPABASE_ANON_KEY') || (localFallback && localFallback.SUPABASE_ANON_KEY));
// If the anon key looks duplicated or contains extra text, try to extract the first valid JWT substring.
SUPABASE_ANON_KEY = extractFirstJwt(SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Before throwing, log which sources are present (do not log secrets).
  try {
    // eslint-disable-next-line no-console
    console.log('supabase config sources', JSON.stringify({
      gotFromProcessEnv: !!((process.env as any).SUPABASE_URL || (process.env as any).SUPABASE_ANON_KEY),
      gotFromExpoExtra: !!getExpoExtra('SUPABASE_URL') || !!getExpoExtra('SUPABASE_ANON_KEY')
    }));
    try {
      // Provide additional diagnostic information about Expo Constants
      // to help debug why extras may not be present at runtime.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Constants = require('expo-constants');
      // eslint-disable-next-line no-console
      console.log('expo constants present:', !!Constants);
      // eslint-disable-next-line no-console
      console.log('expoConfig present:', !!Constants?.expoConfig);
      // eslint-disable-next-line no-console
      console.log('manifest present:', !!Constants?.manifest);
      // eslint-disable-next-line no-console
      console.log('expoConfig.extra keys:', Object.keys(Constants?.expoConfig?.extra || {}));
      // eslint-disable-next-line no-console
      console.log('manifest.extra keys:', Object.keys(Constants?.manifest?.extra || {}));
    } catch (er) {
      // ignore errors when requiring expo-constants in non-expo contexts
    }
  } catch (e) {
    // ignore logging errors
  }

  const msg =
    'Supabase URL or anon key not found. Set SUPABASE_URL and SUPABASE_ANON_KEY.\n' +
    'Options:\n' +
    '1) For Expo/EAS: set SUPABASE_URL and SUPABASE_ANON_KEY in your build environment so `app.config.js` injects them into expo.extra.\n' +
    '2) For local dev: set process.env (or copy values into mobile/.env) before starting Metro.\n' +
    '3) Do NOT embed service_role keys in the app; keep them on server only.\n';
  // Log an explicit error and throw so the redbox shows this helpful message.
  // This prevents the lower-level Supabase client validation error that is harder to read.
  // eslint-disable-next-line no-console
  console.error(msg);
  throw new Error(msg);
}

// Create the client. The anon key is safe to use in client apps
// only when you enforce Row Level Security (RLS) policies.
// In React Native, provide AsyncStorage to supabase-js so auth sessions persist.
let authOptions: any = {};
try {
  // Require dynamically to avoid bundling errors on web.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  if (AsyncStorage) {
    authOptions = { auth: { storage: AsyncStorage } };
  }
} catch (e) {
  // AsyncStorage not available (e.g., web or node environment) — fall back to defaults.
}

export const supabase = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, authOptions);

// Debug helper: show which source provided the keys. Do not print secrets.
try {
  const refMatch = typeof SUPABASE_URL === 'string' ? SUPABASE_URL.match(/^https?:\/\/([^.]+)\./) : null;
  const ref = refMatch ? refMatch[1] : 'unknown';
  const keyStr = String(SUPABASE_ANON_KEY || '')
  const masked = keyStr ? `${keyStr.slice(0, 8)}...${keyStr.slice(-6)} (len=${keyStr.length})` : 'none';
  // eslint-disable-next-line no-console
  const jwtRef = getJwtRef(SUPABASE_ANON_KEY as string);
  console.log('supabase client configured', { projectRef: ref, anonKey: masked, jwtRef });
  if (jwtRef && ref && jwtRef !== ref) {
    console.warn('Supabase config warning: anon key project ref does not match URL ref', { urlRef: ref, jwtRef });
  }
} catch (e) {
  // ignore logging errors
}

export function supabaseDiagnostics() {
  const refMatch = typeof SUPABASE_URL === 'string' ? SUPABASE_URL.match(/^https?:\/\/([^.]+)\./) : null;
  const urlRef = refMatch ? refMatch[1] : null;
  const jwtRef = getJwtRef(SUPABASE_ANON_KEY as string);
  return { urlRef, jwtRef };
}
