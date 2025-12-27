/*
 * utils/id.util.ts
 *
 * Purpose: generate internal UUIDs and short public IDs.
 * We comment every line to teach why each piece exists.
 */

// We create a simple UUID v4 generator here so the code has no
// external runtime dependency. For production you can use the
// `uuid` package which is well-tested.
export function uuidv4(): string {
  // This function returns a RFC4122 version 4 UUID string. The
  // implementation uses random numbers from Math.random which is
  // acceptable for many applications but not cryptographically
  // secure. For higher security use the `crypto` module.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; // random integer 0..15
    const v = c === 'x' ? r : (r & 0x3) | 0x8; // set bits for 'y'
    return v.toString(16);
  });
}

/*
 * publicIdForRole
 * - Create a short public ID for the user based on role.
 * - Format examples:
 *   - startup => STR-123456
 *   - investor => INV-123456
 */
export function publicIdForRole(role: 'startup' | 'investor', seed?: number): string {
  // Choose the prefix based on role. This keeps public IDs
  // human-friendly and indicates the account type.
  const prefix = role === 'startup' ? 'STR' : 'INV';

  // If a seed is provided we can make deterministic ids for tests.
  // Otherwise generate a random 6-digit number.
  const number = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);

  // Zero-pad the number to 6 digits to keep the format stable.
  const padded = number.toString().padStart(6, '0');

  // Return the concatenated public id.
  return `${prefix}-${padded}`;
}
