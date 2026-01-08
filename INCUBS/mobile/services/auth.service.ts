/*
 * services/auth.service.ts
 *
 * Purpose: implement signup, login, logout and admin checks using
 * Supabase. This file contains detailed comments explaining every
 * line and decision, as requested.
 */

import { supabase, supabaseDiagnostics } from '../supabaseClient';
import { uuidv4, publicIdForRole } from '../utils/id.util';
import { generateRecoveryKey, hashRecoveryKey } from '../utils/recovery.util';
import { Role, isRoleAllowed, SUPER_ADMIN_EMAILS, canAssignRole } from './roles';
import { logger } from '../utils/logger';

/*
 * signup
 * - Create a new user with email and password.
 * - Generate internal UUID, public_id, recovery key, and store the
 *   recovery key hash in the `users` table.
 * - Show the plain recovery key to the caller exactly once.
 */
export async function signup(email: string, password: string, requestedRole: string | null, creatorRole: Role | null = null) {
  // Log the attempt. We avoid logging passwords or recovery keys.
  const diag = supabaseDiagnostics();
  logger.info('signup called', { email, requestedRole, creatorRole, targetProject: diag });

  // Normalise email to lowercase to avoid duplicate accounts. 
  const normalizedEmail = email.trim().toLowerCase();

  // Decide the role: if the email is in SUPER_ADMIN_EMAILS, assign
  // super_admin automatically. This is the bootstrap mechanism.
  let role: Role;
  if (SUPER_ADMIN_EMAILS.includes(normalizedEmail)) {
    role = 'super_admin';
  } else if (requestedRole && isRoleAllowed(requestedRole)) {
    // If a role was requested, check whether the creator can assign it.
    // `creatorRole` tells us who is creating this user (null for public signup).
    if (!canAssignRole(creatorRole, requestedRole as Role)) {
      // If not allowed, default to 'startup' to avoid privilege escalation.
      role = 'startup';
    } else {
      role = requestedRole as Role;
    }
  } else {
    // Default role for public signup is 'startup'.
    role = 'startup';
  }

  // Generate an internal UUID for the user. This will be the primary
  // key stored in the database and never changes.
  const id = uuidv4();

  // Create a public ID depending on role for human-friendly lookup.
  // Only create public IDs for startup and investor roles per spec.
  const public_id = role === 'startup' || role === 'investor' ? publicIdForRole(role) : null;

  // Generate a recovery key and hash it for storage. We will show
  // the plain key once to the user and only store the hash.
  const recoveryKey = generateRecoveryKey();
  // TODO: For production security, move `hashRecoveryKey` to a
  // trusted server-side function. Hashing on the server prevents
  // exposing the hashing logic or secrets in client bundles.
  // Leaving it here is acceptable for Phase 0 mock + dev only.
  const recoveryKeyHash = hashRecoveryKey(recoveryKey);

  // Create the account in Supabase Auth first (this handles email
  // + password and email verification flows). We use the client
  // SDK's signUp method.
  const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });

  if (error) {
    // If signUp failed, log and return the error to the caller.
    logger.error('supabase.auth.signUp failed', { error, targetProject: supabaseDiagnostics() });
    return { success: false, error: error.message };
  }

  // At this point Supabase has created an auth user. We now insert
  // a corresponding row into our `users` table with extra metadata.
  // We store: id (uuid), public_id, role, recovery_key_hash.
  const { error: dbError } = await supabase.from('users').insert([
    {
      id, // internal uuid primary key
      public_id, // human-friendly id
      role, // user role
      recovery_key_hash: recoveryKeyHash // hashed recovery key only
    }
  ]);

  if (dbError) {
    // If the DB insert failed we should rollback the auth user.
    // Supabase does not provide a direct rollback here; in a real
    // system you would remove the auth user or mark the record.
    logger.error('Failed to insert user metadata', { dbError, targetProject: supabaseDiagnostics() });
    return { success: false, error: dbError.message };
  }

  // Success: return the recovery key to the caller so they can save it.
  // IMPORTANT: this is the only time the plain recovery key is available.
  return {
    success: true,
    id,
    public_id,
    role,
    // Return the plain recovery key exactly once. Caller must persist it.
    recoveryKey
  };
}

/*
 * login
 * - Authenticate a user using email + password via Supabase Auth.
 */
export async function login(email: string, password: string) {
  // Normalize email for consistent lookups.
  const normalizedEmail = email.trim().toLowerCase();

  // Delegate to Supabase's signIn method which handles sessions.
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

  if (error) {
    logger.warn('login failed', { error, targetProject: supabaseDiagnostics() });
    return { success: false, error: error.message };
  }

  // On success, Supabase returns session data. We simply return
  // the session object so callers can use it for authenticated calls.
  return { success: true, session: data.session };
}

/*
 * logout
 * - End the user's session using Supabase Auth.
 */
export async function logout() {
  // Supabase signs out the current session on the client.
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.error('logout failed', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/*
 * recoverWithKey
 * - Allow a user to recover their account using the recovery key.
 * - The key is hashed and compared against the stored hash.
 * - If it matches, we allow the caller to set a new password.
 */
export async function recoverWithKey(email: string, recoveryKey: string, newPassword: string) {
  // Normalize email.
  const normalizedEmail = email.trim().toLowerCase();

  // Hash the provided recovery key to compare with DB.
  // TODO: This operation should be executed on a secure server.
  // Comparing hashed recovery keys and changing passwords requires
  // privileged access. Performing this in client code is insecure.
  const candidateHash = hashRecoveryKey(recoveryKey);

  // Look up the user row by email via Supabase Auth, then fetch
  // corresponding `users` table entry to compare the hash.
  // Typings for the supabase admin client may not expose getUserByEmail
  // in some versions of the `@supabase/supabase-js` type definitions.
  // Use `any` for the admin object to avoid TS errors while still
  // calling the admin API at runtime. This is safe here because the
  // call is server-like and we only read its result.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userByEmail, error: userError } = await (supabase.auth.admin as any).getUserByEmail(normalizedEmail as string);

  if (userError) {
    logger.error('Failed to lookup user for recovery', userError);
    return { success: false, error: userError.message };
  }

  // userByEmail.data contains the auth user object with `id`.
  const authUserId = userByEmail?.data?.id;
  if (!authUserId) {
    return { success: false, error: 'User not found' };
  }

  // Fetch the user's stored recovery_key_hash from our `users` table.
  const { data: rows, error: dbError } = await supabase.from('users').select('recovery_key_hash').eq('id', authUserId).limit(1).single();

  if (dbError) {
    logger.error('Failed to fetch recovery hash', dbError);
    return { success: false, error: dbError.message };
  }

  const storedHash = (rows as any).recovery_key_hash;
  if (storedHash !== candidateHash) {
    // If hashes don't match we deny the recovery attempt.
    return { success: false, error: 'Recovery key does not match' };
  }

  // At this point the recovery key is valid. We update the user's
  // password via Supabase admin API (this requires server privileges).
  // Note: Performing this operation from client code is not secure.
  // In production, this should be executed from a server-side function
  // or an authenticated admin context.
  try {
    // TODO: Implement secure password reset via server-side function.
    return { success: true, message: 'Recovery validated — next step: reset password via server.' };
  } catch (err) {
    logger.error('Failed to reset password during recovery', err);
    return { success: false, error: 'Failed to reset password' };
  }
}

/*
 * promoteToAdmin
 * - Promote a user to the `admin` role. Only `super_admin` may do this.
 */
export async function promoteToAdmin(requesterEmail: string, targetUserId: string) {
  // Normalize the requester's email.
  const normalized = requesterEmail.trim().toLowerCase();

  // Check whether the requester is a super_admin by comparing email
  // against the bootstrap list. In production you would check the
  // requester's session/role from a secure server-side context.
  if (!SUPER_ADMIN_EMAILS.includes(normalized)) {
    return { success: false, error: 'Only super_admin may promote users' };
  }

  // Update the user's role in the database.
  // TODO: Promote role changes to a server-side protected endpoint.
  // Role changes must be executed with service-role keys and strict
  // RLS policies. Doing this from client code is insecure.
  const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', targetUserId);
  if (error) {
    logger.error('Failed to promote user', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
