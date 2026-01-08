// Simple in-memory audit log for Phase 3 mock.
// We keep a list of strings describing actions taken by admins.
const log: string[] = [];

// Add a message to the log.
export function addLog(entry: string) {
  // Prepend a timestamp to the entry and store it.
  const ts = new Date().toISOString();
  log.unshift(`${ts} - ${entry}`);
}

// Read the current log entries.
export function readLog() {
  // Return a shallow copy so callers cannot mutate internal array.
  return [...log];
}

// Clear the log (useful for testing).
export function clearLog() {
  log.length = 0;
}
