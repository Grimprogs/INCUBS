/*
 * utils/recovery.util.ts
 *
 * Purpose: Generate a recovery key and hash it before storage.
 * The recovery key is shown to the user once after signup.
 * 
 * Note: This uses a simple hash function for React Native compatibility.
 * For production, consider moving hashing to your backend server.
 */

/**
 * generateRecoveryKey
 * - Creates a 24-digit recovery key (6 groups of 4 digits)
 * - Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
 * - Example: 8391-2044-7712-0093-5581-9920
 * - Total: 24 digits, NUMBERS ONLY
 */
export function generateRecoveryKey(): string {
  const parts: string[] = [];
  
  // Generate 6 groups of 4 digits each = 24 digits total
  for (let i = 0; i < 6; i++) {
    // Random number between 0-9999, padded to 4 digits
    const group = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    parts.push(group);
  }
  
  // Join with dashes: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  return parts.join('-');
}

/**
 * hashRecoveryKey
 * - Hash the recovery key before storing in database
 * - Uses a simple hash function compatible with React Native
 * - For production: Move this to your backend for better security
 * 
 * @param key - The recovery key to hash (e.g., "1234-5678-9012-3456-7890-1234")
 * @returns Hex string hash (e.g., "a1b2c3d4")
 */
export function hashRecoveryKey(key: string): string {
  let hash = 0;
  
  // Simple but effective hash function (Java's String.hashCode() algorithm)
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Return as hex string, always 8 characters
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * verifyRecoveryKey
 * - Check if provided recovery key matches stored hash
 * 
 * @param providedKey - Key entered by user
 * @param storedHash - Hash stored in database
 * @returns true if match, false otherwise
 */
export function verifyRecoveryKey(
  providedKey: string,
  storedHash: string
): boolean {
  const providedHash = hashRecoveryKey(providedKey);
  return providedHash === storedHash;
}

/**
 * formatRecoveryKeyInput
 * - Auto-format as user types: automatically add dashes
 * - Only allows digits (0-9)
 * - Converts "123456789012" to "1234-5678-9012"
 * - Maximum 24 digits (6 groups of 4)
 * 
 * @param input - Raw input string from user
 * @returns Formatted string with dashes
 */
export function formatRecoveryKeyInput(input: string): string {
  // Remove all non-digits (only keep 0-9)
  const digits = input.replace(/\D/g, '');
  
  // Limit to exactly 24 digits maximum
  const limited = digits.slice(0, 24);
  
  // Add dashes every 4 digits
  const formatted = limited.match(/.{1,4}/g)?.join('-') || limited;
  
  return formatted;
}

/**
 * validateRecoveryKey
 * - Check if recovery key is in correct format
 * - Must be exactly 24 digits in 6 groups of 4
 * 
 * @param key - Recovery key to validate
 * @returns true if valid format, false otherwise
 */
export function validateRecoveryKey(key: string): boolean {
  // Remove dashes and check if exactly 24 digits
  const digitsOnly = key.replace(/-/g, '');
  
  // Must be exactly 24 characters and all digits
  if (digitsOnly.length !== 24) {
    return false;
  }
  
  // Check if all characters are digits
  return /^\d{24}$/.test(digitsOnly);
}

/**
 * stripDashes
 * - Remove all dashes from recovery key
 * - Useful for database queries or API calls
 * 
 * @param key - Recovery key with dashes
 * @returns Key without dashes (24 digits)
 */
export function stripDashes(key: string): string {
  return key.replace(/-/g, '');
}

/**
 * Example usage:
 * 
 * // Generate key
 * const key = generateRecoveryKey();
 * console.log(key); // "8391-2044-7712-0093-5581-9920"
 * 
 * // Hash key for storage
 * const hash = hashRecoveryKey(key);
 * console.log(hash); // "a1b2c3d4"
 * 
 * // Later, verify user's input
 * const userInput = "8391-2044-7712-0093-5581-9920";
 * const isValid = verifyRecoveryKey(userInput, hash);
 * console.log(isValid); // true
 * 
 * // Format as user types
 * const formatted = formatRecoveryKeyInput("839120447712");
 * console.log(formatted); // "8391-2044-7712"
 * 
 * // Validate format
 * const valid = validateRecoveryKey("8391-2044-7712-0093-5581-9920");
 * console.log(valid); // true
 */