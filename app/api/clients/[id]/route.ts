import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { updateClientSchema } from "@/lib/validations/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { response } = await requireApiPermission(PERMISSIONS.CLIENT_MANAGE);
  if (response) return response;

  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  return NextResponse.json({ client });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { response } = await requireApiPermission(PERMISSIONS.CLIENT_MANAGE);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { name, contactEmail, contactPhone, notes, isActive } = parsed.data;

  const client = await prisma.client.update({
    where: { id },
    data: {
      name,
      contactEmail: contactEmail === "" ? null : contactEmail,
      contactPhone: contactPhone === "" ? null : contactPhone,
      notes: notes === "" ? null : notes,
      isActive,
    },
  });

  return NextResponse.json({ client });
}

/**
 * Soft delete, same reasoning as users: Projects (Stage B) will reference
 * Client by FK, so a hard delete here would either orphan or cascade-wipe
 * project history. Deactivating just hides it from "active clients" lists.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { response } = await requireApiPermission(PERMISSIONS.CLIENT_MANAGE);
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const client = await prisma.client.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ client });
}
