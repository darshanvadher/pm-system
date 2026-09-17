import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { hasPermission, hasRole } from "@/lib/auth/permission-checks";
import type { PermissionKey, RoleName } from "@/lib/auth/permissions";

export { hasPermission, hasRole };

/**
 * For Server Components / pages. Redirects to /login when there's no valid
 * session; otherwise returns the current user. Never returns null, so
 * callers can rely on getting a real user or not getting control back.
 *
 *   export default async function DashboardPage() {
 *     const user = await requireAuth();
 *     ...
 *   }
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Same as requireAuth(), but also enforces role membership. Sends
 * authenticated-but-unauthorized users to /403 — that page isn't created
 * by this module, add it alongside whichever feature module first needs
 * role-gated pages.
 */
export async function requireRole(...roles: RoleName[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!hasRole(user, ...roles)) {
    redirect("/403");
  }
  return user;
}

/**
 * Same as requireRole(), but checks a specific permission instead of a
 * fixed role list. Prefer this over requireRole() whenever the gate is
 * really "can do X" rather than "is role Y" — e.g. Clients pages should
 * check CLIENT_MANAGE (which both Admin and Project Manager hold) rather
 * than hardcoding a role list that has to be kept in sync by hand.
 */
export async function requirePermission(
  ...permissions: PermissionKey[]
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!permissions.some((permission) => hasPermission(user, permission))) {
    redirect("/403");
  }
  return user;
}

type ApiAuthResult =
  | { user: SessionUser; response: null }
  | { user: null; response: NextResponse };

/**
 * For Route Handlers, where a redirect doesn't make sense — a fetch() call
 * expecting JSON needs a 401 body, not a 307.
 *
 *   export async function POST(request: NextRequest) {
 *     const { user, response } = await requireApiAuth();
 *     if (response) return response;
 *     // `user` is SessionUser from here on
 *   }
 */
export async function requireApiAuth(): Promise<ApiAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, response: null };
}

/**
 * Same as requireApiAuth(), but also checks a specific permission and
 * returns 403 rather than 401 if the user is logged in but not allowed.
 */
export async function requireApiPermission(
  permission: PermissionKey,
): Promise<ApiAuthResult> {
  const result = await requireApiAuth();
  if (result.response) return result;

  if (!hasPermission(result.user, permission)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}
