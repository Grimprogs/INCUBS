export type ApiMode = 'MOCK' | 'REAL';

// For this project we run in REAL mode by default and remove mock
// branches. Keep the value fixed to avoid accidental MOCK behavior.
const mode: ApiMode = 'REAL';

export function getApiMode(): ApiMode {
  return mode;
}

// `mode` is fixed to 'REAL' in this build, so `IS_MOCK` is always false.
// Export a plain boolean to avoid a type-level comparison error.
export const IS_MOCK: boolean = false;

export { mode as API_MODE };
