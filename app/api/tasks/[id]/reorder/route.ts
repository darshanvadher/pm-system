import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { updateTaskPositionSchema } from "@/lib/validations/task";
import { Prisma } from "@/app/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, response } = await requireApiPermission(
    PERMISSIONS.TASK_UPDATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = updateTaskPositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid position input" },
      { status: 400 },
    );
  }

  const { status, position } = parsed.data;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const activities: Prisma.TaskActivityLogCreateWithoutTaskInput[] = [];
  if (status !== existing.status) {
    activities.push({
      user: { connect: { id: user.id } },
      action: "STATUS_CHANGE",
      field: "status",
      oldValue: existing.status,
      newValue: status,
    });
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      status,
      position,
      activities: {
        create: activities,
      },
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
      assignee: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json({ task: updatedTask });
}
