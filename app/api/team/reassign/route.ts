import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { z } from "zod";

const reassignSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  targetUserId: z.string().nullable(),
});

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.TASK_UPDATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = reassignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid reassignment input",
      },
      { status: 400 },
    );
  }

  const { taskId, targetUserId } = parsed.data;

  const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let targetUserName = "Unassigned";
  if (targetUserId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target assignee not found" },
        { status: 404 },
      );
    }
    targetUserName = targetUser.name;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId: targetUserId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  // Log activity
  await prisma.taskActivityLog.create({
    data: {
      taskId,
      userId: user.id,
      action: "ASSIGNEE_CHANGE",
      oldValue: existingTask.assigneeId ?? "Unassigned",
      newValue: targetUserName,
    },
  });

  return NextResponse.json({ task: updatedTask });
}
