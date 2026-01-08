/*
 * services/payment/payment.service.ts
 *
 * Purpose: provide a small payment abstraction with a mock
 * implementation and a placeholder for a real payment provider
 * (for example Razorpay). The abstraction keeps payment code
 * decoupled from business logic and makes testing easy.
 */

import { getApiMode, IS_MOCK } from '../../apiMode';
import { logger } from '../../utils/logger';

// Result shape for initiating a payment.
export type PaymentResult = {
  success: boolean;
  source: 'MOCK' | 'REAL';
  paymentId?: string; // ID for the payment transaction when available
  message?: string;
};

/*
 * initiatePayment(amount)
 * - `amount` is a number representing the amount in the application's
 *   currency units (choose your convention; e.g. rupees or cents).
 *
 * We keep this simple: in mock mode we always succeed and provide a
 * fake `paymentId`. In real mode we include a TODO to integrate with
 * an actual payment provider.
 */
export async function initiatePayment(amount: number): Promise<PaymentResult> {
  // Log intent to start a payment. This is useful for auditing
  // when developing and debugging payment flows.
  logger.info('initiatePayment called', { mode: getApiMode(), amount });

  // Basic validation: amount must be a positive number.
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return { success: false, source: IS_MOCK ? 'MOCK' : 'REAL', message: 'Invalid amount' };
  }

  // MOCK behaviour: generate a deterministic-ish fake payment id.
  if (IS_MOCK) {
    // Create a pseudo-random id using current time. This is fine for
    // mock mode because ids are only used during development.
    const paymentId = `mock_${Date.now()}`;
    return { success: true, source: 'MOCK', paymentId, message: 'Mock payment successful' };
  }

  // REAL payment provider placeholder.
  try {
    // TODO: Integrate with Razorpay or another provider here.
    // Typical steps:
    // 1) Create an order with the provider API using server-side keys.
    // 2) Return order id to the client to complete payment.
    // 3) Verify webhook or provider callback for final confirmation.

    throw new Error('REAL payment integration not implemented (placeholder)');
  } catch (err) {
    logger.error('initiatePayment REAL mode failed', err);

    // Fallback: do not pretend the payment succeeded. Payments are
    // sensitive; failing closed is safer than failing open.
    return { success: false, source: 'MOCK', message: 'Fallback: payment failed' };
  }
}
