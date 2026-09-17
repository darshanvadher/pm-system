import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { assignTaskSprintSchema } from "@/lib/validations/sprint";

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
  const parsed = assignTaskSprintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid sprint input" },
      { status: 400 },
    );
  }

  const { sprintId, storyPoints } = parsed.data;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...(sprintId !== undefined && { sprintId }),
      ...(storyPoints !== undefined && { storyPoints }),
      activities: {
        create: {
          userId: user.id,
          action: "UPDATED",
          field: "Sprint / Story Points",
          oldValue: existing.sprintId ?? "Backlog",
          newValue: sprintId ?? "Backlog",
        },
      },
    },
    include: {
      sprint: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ task: updatedTask });
}
