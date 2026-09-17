import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { updateUserSchema } from "@/lib/validations/user";

const userListSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { response } = await requireApiPermission(PERMISSIONS.USER_MANAGE);
  if (response) return response;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: userListSelect,
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { user: currentUser, response } = await requireApiPermission(
    PERMISSIONS.USER_MANAGE,
  );
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, roleName, isActive } = parsed.data;

  // Nobody edits their own role or active status through this screen —
  // that's how you accidentally lock yourself out of the admin panel with
  // no other admin around to undo it. Ask a second admin instead.
  const isSelf = id === currentUser.id;
  if (isSelf && (roleName !== undefined || isActive !== undefined)) {
    return NextResponse.json(
      {
        error:
          "You can't change your own role or active status. Ask another admin.",
      },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let roleId: string | undefined;
  if (roleName !== undefined) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return NextResponse.json({ error: "Unknown role" }, { status: 400 });
    }
    roleId = role.id;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { name, roleId, isActive },
    select: userListSelect,
  });

  return NextResponse.json({ user });
}

/**
 * DELETE deactivates rather than actually removing the row. User rows will
 * be referenced by projects, tasks, comments, etc. in later modules, so a
 * hard delete would either cascade-destroy that history or fail on FK
 * constraints — soft delete (isActive: false) keeps the audit trail intact
 * and simply revokes the ability to log in.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { user: currentUser, response } = await requireApiPermission(
    PERMISSIONS.USER_MANAGE,
  );
  if (response) return response;

  const { id } = await params;

  if (id === currentUser.id) {
    return NextResponse.json(
      { error: "You can't deactivate your own account" },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: userListSelect,
  });

  return NextResponse.json({ user });
}
