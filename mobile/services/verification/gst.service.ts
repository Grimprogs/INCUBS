/*
 * services/verification/gst.service.ts
 *
 * Purpose: provide `verifyGST` which validates a GST number format
 * and returns a mock success in development. Real API integration is
 * intentionally left as a placeholder.
 */

import { getApiMode, IS_MOCK } from '../../apiMode';
import { logger } from '../../utils/logger';

// Result type for GST verification.
export type GstResult = {
  success: boolean;
  source: 'MOCK' | 'REAL';
  message?: string;
};

/*
 * verifyGST(gstNumber)
 * - Simple GST format validation rules:
 *   - GSTIN is 15 characters long.
 *   - The first two characters are digits (state code).
 *   - The rest are alphanumeric.
 * Note: Real GST validation can be stricter; this is a basic check.
 */
export async function verifyGST(gstNumber: string): Promise<GstResult> {
  // Log that verification was requested and the running mode.
  logger.info('verifyGST called', { mode: getApiMode() });

  // Trim whitespace that users sometimes paste accidentally.
  const candidate = gstNumber.trim();

  // Basic length check: GST numbers must be 15 characters.
  if (candidate.length !== 15) {
    // If length is wrong, we can fail fast before any network call.
    return { success: false, source: IS_MOCK ? 'MOCK' : 'REAL', message: 'GST must be 15 characters' };
  }

  // Simple regex: first two characters digits, then 13 alphanumeric.
  // We use case-insensitive (`i`) so lower/upper case both work.
  const gstRegex = /^[0-9]{2}[A-Z0-9]{13}$/i;

  if (!gstRegex.test(candidate)) {
    // If regex fails, the format is invalid.
    return { success: false, source: IS_MOCK ? 'MOCK' : 'REAL', message: 'GST format invalid' };
  }

  // In MOCK mode we quickly return success for valid-looking inputs.
  if (IS_MOCK) {
    return { success: true, source: 'MOCK', message: 'Mock GST verification successful' };
  }

  // REAL mode placeholder: do not call a live GST validation API here.
  try {
    // TODO: Add network call to a GST verification service.
    // Example: fetch(`https://gst-api.example/verify?gst=${candidate}`)
    throw new Error('REAL GST verification not implemented (placeholder)');
  } catch (err) {
    // On error, we log and fall back to a conservative failure.
    logger.error('verifyGST REAL mode failed', err);

    // Fallback: we choose to return failure rather than pretending success,
    // because financial or compliance checks should not silently pass.
    return { success: false, source: 'MOCK', message: 'Fallback: verification failed' };
  }
}
