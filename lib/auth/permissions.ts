/**
 * Single source of truth for permission keys and which seeded role gets
 * which permissions. `prisma/seed.ts` reads ROLE_PERMISSIONS to populate
 * the Role/Permission/RolePermission tables. Changing this file alone
 * doesn't change anything in the database — re-run the seed (it's
 * upsert-based, so it's safe to run repeatedly).
 *
 * As later modules (Projects, Tasks, Time Tracking, ...) land, add their
 * permission keys here and extend ROLE_PERMISSIONS rather than scattering
 * new permission strings around the codebase.
 */

export const PERMISSIONS = {
  USER_MANAGE: "user:manage",
  ROLE_MANAGE: "role:manage",
  CLIENT_MANAGE: "client:manage",
  PROJECT_CREATE: "project:create",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  PROJECT_VIEW: "project:view",
  PROJECT_READ: "project:view",
  TASK_CREATE: "task:create",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  TASK_VIEW: "task:view",
  REPORT_VIEW: "report:view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_NAMES = {
  ADMIN: "ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  DEVELOPER: "DEVELOPER",
  CLIENT: "CLIENT",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  [ROLE_NAMES.ADMIN]: Object.values(PERMISSIONS),

  [ROLE_NAMES.PROJECT_MANAGER]: [
    PERMISSIONS.CLIENT_MANAGE,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],

  [ROLE_NAMES.DEVELOPER]: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_VIEW,
  ],

  [ROLE_NAMES.CLIENT]: [PERMISSIONS.PROJECT_VIEW, PERMISSIONS.REPORT_VIEW],
};
