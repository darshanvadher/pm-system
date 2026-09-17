import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createCommentSchema } from "@/lib/validations/task";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;
  const { user, response } = await requireApiPermission(
    PERMISSIONS.TASK_UPDATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid comment input" },
      { status: 400 },
    );
  }

  const { content } = parsed.data;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: user.id,
      content,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  // Log activity
  await prisma.taskActivityLog.create({
    data: {
      taskId,
      userId: user.id,
      action: "COMMENT_ADDED",
      newValue: content.length > 50 ? content.slice(0, 50) + "..." : content,
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
