import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";

/**
 * Read-only. Permissions are defined in code (lib/auth/permissions.ts) as
 * the single source of truth, not editable through this API — this just
 * reflects what's actually seeded into the database for the admin to see.
 */
export async function GET() {
  const { response } = await requireApiPermission(PERMISSIONS.ROLE_MANAGE);
  if (response) return response;

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
    orderBy: { name: "asc" },
  });

  const shaped = roles.map((role) => ({
    id: role.id,
    name: role.name,
    permissions: role.permissions.map((rp) => rp.permission.key).sort(),
  }));

  return NextResponse.json({ roles: shaped });
}
