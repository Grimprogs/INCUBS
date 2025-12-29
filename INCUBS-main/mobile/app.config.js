const fs = require('fs');
const path = require('path');

// Load .env from likely locations so running `expo start` from `mobile/` or repo root works.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  // Try current working directory first (where expo was started).
  const candidates = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '..', '.env'), path.resolve(__dirname, '..', '.env')];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        dotenv.config({ path: p });
        // Stop after the first successful load.
        break;
      }
    } catch (err) {
      // ignore and continue
    }
  }
} catch (e) {
  // dotenv may not be installed in some environments; ignore if missing.
}

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL || '<YOUR_SUPABASE_URL>',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '<YOUR_SUPABASE_ANON_KEY>',
      // Keep existing extras if present
      ...(config.extra || {})
    }
  };
};
