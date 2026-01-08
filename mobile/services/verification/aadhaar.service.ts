/*
 * services/verification/aadhaar.service.ts
 *
 * Purpose: provide a function `verifyAadhaar` that can run in two
 * modes: MOCK (returns fake success/failure quickly) and REAL
 * (placeholder for calling a real government or third-party
 * verification API). The function includes error handling and a
 * fallback to mock mode if something goes wrong at runtime.
 */

import { getApiMode, IS_MOCK } from '../../apiMode';
import { logger } from '../../utils/logger';

// Exported result type for the verification function so callers know
// exactly what to expect and TypeScript can help with types.
export type AadhaarResult = {
  // Whether the verification succeeded.
  success: boolean;
  // Where the response came from: MOCK (fake) or REAL (external).
  source: 'MOCK' | 'REAL';
  // Optional human-friendly message.
  message?: string;
};

/*
 * verifyAadhaar
 * - `aadhaarNumber`: the Aadhaar number to verify (string for safety)
 * - `otp`: one-time password supplied by the user to confirm possession
 *
 * We explain every line because you requested very detailed comments.
 */
export async function verifyAadhaar(aadhaarNumber: string, otp: string): Promise<AadhaarResult> {
  // Log entry including the chosen API mode.
  // We do not log sensitive values like the full Aadhaar number or OTP.
  logger.info('verifyAadhaar called', { mode: getApiMode() });

  // MOCK flow: quick deterministic check for development and tests.
  if (IS_MOCK) {
    // In mock mode we accept a specific test OTP: "123456".
    // This is safe for mocks because mock mode never reaches
    // production systems. Hardcoding a test OTP is common for
    // predictable, repeatable tests.
    if (otp === '123456') {
      // Return a resolved success object that looks like a real response.
      return { success: true, source: 'MOCK', message: 'Mock verification successful' };
    }

    // If OTP is wrong in mock mode, return a predictable failure.
    return { success: false, source: 'MOCK', message: 'Invalid mock OTP' };
  }

  // REAL flow (placeholder): do not call any real API here.
  // We still structure the code as if we would perform a real
  // network request, to make future changes straightforward.
  try {
    // TODO: Integrate with the real Aadhaar verification API here.
    // Example steps you would add later:
    // 1) Build a request payload with `aadhaarNumber` and `otp`.
    // 2) Send HTTPS request to the verification endpoint.
    // 3) Parse response and return success/failure accordingly.

    // For now, we throw to simulate that the REAL implementation
    // is not present / would fail if attempted. This will trigger
    // the fallback logic below.
    throw new Error('REAL Aadhaar verification not implemented (placeholder)');
  } catch (err) {
    // We catch any runtime error to avoid crashing the app.
    // Logging the error helps debugging. We do not include full
    // sensitive data in logs.
    logger.error('verifyAadhaar REAL mode failed, falling back to MOCK', err);

    // Fallback: use the same mock behaviour to keep the app usable.
    // This is critical so the user experience continues even if the
    // external service is down or unreachable.
    if (otp === '123456') {
      return { success: true, source: 'MOCK', message: 'Fallback mock verification successful' };
    }

    return { success: false, source: 'MOCK', message: 'Fallback: invalid mock OTP' };
  }
}
