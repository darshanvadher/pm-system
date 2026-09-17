import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { updateSprintSchema } from "@/lib/validations/sprint";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_UPDATE);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = updateSprintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.sprint.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const { name, goal, startDate, endDate, status } = parsed.data;

  const sprint = await prisma.sprint.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(goal !== undefined && { goal: goal || null }),
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(endDate !== undefined && {
        endDate: endDate ? new Date(endDate) : null,
      }),
      ...(status !== undefined && { status }),
    },
    include: {
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json({ sprint });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_UPDATE);
  if (response) return response;

  const existing = await prisma.sprint.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  await prisma.sprint.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
