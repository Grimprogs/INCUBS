/*
 * utils/recovery.util.ts
 *
 * Purpose: generate a recovery key and hash it before storage.
 * The recovery key is shown to the user once after signup.
 */

// We import `createHash` from Node's crypto module for hashing.
// Note: in React Native this module is not available by default.
// For production, perform hashing on a trusted server or use a
// secure client-side library that supports crypto.
import { createHash } from 'crypto';

/*
 * generateRecoveryKey
 * - Create a recovery key formatted as groups of 4 digits separated
 *   by dashes. Example: 8391-2044-7712-0093-5581-9920
 * - We follow your example format (6 groups of 4 digits).
 */
export function generateRecoveryKey(): string {
  // Create 6 groups.
  const parts: string[] = [];
  for (let i = 0; i < 6; i++) {
    // Each group is a random 4-digit number zero-padded.
    const group = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    parts.push(group);
  }
  // Join with dashes and return.
  return parts.join('-');
}

/*
 * hashRecoveryKey
 * - Hash the recovery key with SHA-256 and return a hex string.
 * - We store only the hash in the database so if the database is
 *   leaked, the plain recovery keys are not revealed.
 */
export function hashRecoveryKey(key: string): string {
  // TODO: Consider moving hashing to a secure server-side function.
  // Hashing on the server reduces client exposure and centralizes
  // cryptographic operations behind trusted keys and environments.
  // For Phase 0 and local development, we perform hashing here.
  // createHash('sha256') constructs a SHA-256 hasher instance.
  const h = createHash('sha256');
  // Update the hash with the key bytes (utf-8 by default).
  h.update(key, 'utf8');
  // Return the hex digest string of the hash.
  return h.digest('hex');
}
