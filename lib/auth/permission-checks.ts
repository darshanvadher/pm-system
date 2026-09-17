import type { PermissionKey, RoleName } from "@/lib/auth/permissions";

/**
 * Deliberately a minimal structural type rather than importing SessionUser
 * from session.ts. That file pulls in next/headers and the Prisma client;
 * keeping this file free of those imports means hasPermission/hasRole can
 * be unit tested with a plain object and no DB or Next.js request context.
 */
export type AuthorizableUser = {
  role: { name: string };
  permissions: string[];
};

export function hasPermission(
  user: AuthorizableUser,
  permission: PermissionKey,
): boolean {
  return user.permissions.includes(permission);
}

export function hasRole(user: AuthorizableUser, ...roles: RoleName[]): boolean {
  return roles.includes(user.role.name as RoleName);
}
