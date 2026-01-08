/*
 * utils/logger.ts
 *
 * Purpose: provide a tiny logging utility with simple log levels.
 * We keep this small and synchronous because it's easy to read and
 * works in Node and React Native development environments.
 */

// A helper that returns an ISO timestamp string for log entries.
function nowIso(): string {
  // `new Date()` creates a Date object for the current moment.
  // `toISOString()` converts it to a human-readable, sortable format.
  return new Date().toISOString();
}

// We export a `logger` object with three common log levels:
// - info: general informational messages
// - warn: recoverable problems worth noticing
// - error: serious issues that usually need attention
// - debug: verbose details useful when actively debugging
export const logger = {
  // Info-level logs: used for normal runtime information.
  info: (...args: unknown[]) => {
    // Prefix with timestamp and the level for easy filtering.
    console.log(`[INFO] [${nowIso()}]`, ...args);
  },

  // Warning-level logs: indicate something unexpected but not fatal.
  warn: (...args: unknown[]) => {
    // We use console.warn because some systems treat this differently
    // (for example, showing warnings separately in developer tools).
    console.warn(`[WARN] [${nowIso()}]`, ...args);
  },

  // Error-level logs: indicate failures that should be fixed.
  error: (...args: unknown[]) => {
    // console.error often prints stack traces in addition to messages.
    console.error(`[ERROR] [${nowIso()}]`, ...args);
  },

  // Debug-level logs: very detailed; you may disable these in
  // production but they are helpful during development.
  debug: (...args: unknown[]) => {
    console.log(`[DEBUG] [${nowIso()}]`, ...args);
  }
};

// Example usage (commented out):
// logger.info('Server started');
// logger.warn('Using fallback behavior');
// logger.error('Unexpected failure', err);
