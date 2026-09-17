import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createUserSchema } from "@/lib/validations/user";

const userListSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} as const;

export async function GET() {
  const { response } = await requireApiPermission(PERMISSIONS.USER_MANAGE);
  if (response) return response;

  const users = await prisma.user.findMany({
    select: userListSelect,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const { response } = await requireApiPermission(PERMISSIONS.USER_MANAGE);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { email, name, password, roleName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with that email already exists" },
      { status: 409 },
    );
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    // Shouldn't happen — roleName is validated against the same ROLE_NAMES
    // the seed uses — but a mismatched/un-seeded DB shouldn't 500.
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, name, passwordHash, roleId: role.id },
    select: userListSelect,
  });

  return NextResponse.json({ user }, { status: 201 });
}
