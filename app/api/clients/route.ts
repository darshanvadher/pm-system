import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createClientSchema } from "@/lib/validations/client";

export async function GET() {
  const { response } = await requireApiPermission(PERMISSIONS.CLIENT_MANAGE);
  if (response) return response;

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const { response } = await requireApiPermission(PERMISSIONS.CLIENT_MANAGE);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, contactEmail, contactPhone, notes } = parsed.data;

  const client = await prisma.client.create({
    data: {
      name,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
