/*
 * services/roles.ts
 *
 * Purpose: define the allowed user roles and provide helpers for
 * role checks. Roles are fixed so we avoid privilege escalation and
 * keep authorization simple and auditable.
 */

// Define the allowed role strings as a TypeScript union so callers
// get autocomplete and compile-time checking.
export type Role = 'startup' | 'investor' | 'admin' | 'super_admin';

// Export a constant array of allowed roles. This is useful if you
// need to iterate the roles (for validation or UI choices).
export const ALLOWED_ROLES: Role[] = ['startup', 'investor', 'admin', 'super_admin'];

// Super admin emails: list of emails that should be granted
// `super_admin` automatically. This is a simple bootstrap mechanism
// so that one operator initially has the highest privileges.
// Replace these with your actual super admin addresses in config.
export const SUPER_ADMIN_EMAILS = [
  // TODO: replace with the real bootstrap super-admin email
  'founder@example.com'
];

/*
 * isRoleAllowed
 * - Check that a requested role is among the allowed roles.
 */
export function isRoleAllowed(role: string): role is Role {
  // `ALLOWED_ROLES.includes(role as Role)` returns true only if the
  // role string exactly matches one of the allowed values.
  return ALLOWED_ROLES.includes(role as Role);
}

/*
 * canAssignRole
 * - Determine whether `requesterRole` is allowed to assign `targetRole`.
 * - We prevent regular users from creating elevated roles.
 */
export function canAssignRole(requesterRole: Role | null, targetRole: Role): boolean {
  // If there's no requester (public sign-up), they may only request
  // non-admin roles like 'startup' or 'investor'. They cannot create
  // 'admin' or 'super_admin'.
  if (requesterRole === null) {
    return targetRole === 'startup' || targetRole === 'investor';
  }

  // A `super_admin` may assign any role.
  if (requesterRole === 'super_admin') {
    return true;
  }

  // Admins may create startup/investor but not super_admin or admin.
  if (requesterRole === 'admin') {
    return targetRole === 'startup' || targetRole === 'investor';
  }

  // Regular roles cannot assign roles.
  return false;
}
