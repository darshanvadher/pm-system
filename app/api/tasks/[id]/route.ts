import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { updateTaskSchema } from "@/lib/validations/task";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.TASK_VIEW);
  if (response) return response;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, code: true } },
      milestone: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}

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
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.task.findUnique({
    where: { id },
    include: { assignee: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const {
    title,
    description,
    status,
    priority,
    milestoneId,
    assigneeId,
    dueDate,
    tagNames,
  } = parsed.data;

  // Track activity logs for changed fields
  const activityLogsToCreate: Prisma.TaskActivityLogCreateWithoutTaskInput[] =
    [];

  if (status && status !== existing.status) {
    activityLogsToCreate.push({
      user: { connect: { id: user.id } },
      action: "STATUS_CHANGE",
      field: "status",
      oldValue: existing.status,
      newValue: status,
    });
  }

  if (priority && priority !== existing.priority) {
    activityLogsToCreate.push({
      user: { connect: { id: user.id } },
      action: "PRIORITY_CHANGE",
      field: "priority",
      oldValue: existing.priority,
      newValue: priority,
    });
  }

  if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
    activityLogsToCreate.push({
      user: { connect: { id: user.id } },
      action: "ASSIGNEE_CHANGE",
      field: "assigneeId",
      oldValue: existing.assignee?.name ?? "Unassigned",
      newValue: assigneeId ? "Assigned" : "Unassigned",
    });
  }

  if (title && title !== existing.title) {
    activityLogsToCreate.push({
      user: { connect: { id: user.id } },
      action: "UPDATED",
      field: "title",
      oldValue: existing.title,
      newValue: title,
    });
  }

  // Tags processing if provided
  if (tagNames) {
    await prisma.taskTag.deleteMany({ where: { taskId: id } });
    for (const name of tagNames) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const tag = await prisma.tag.upsert({
        where: { name: trimmed },
        update: {},
        create: { name: trimmed },
      });
      await prisma.taskTag.create({
        data: { taskId: id, tagId: tag.id },
      });
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description: description || null }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(milestoneId !== undefined && { milestoneId: milestoneId || null }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(dueDate !== undefined && {
        dueDate: dueDate ? new Date(dueDate) : null,
      }),
      activities: {
        create: activityLogsToCreate,
      },
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
      milestone: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ task: updatedTask });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.TASK_DELETE);
  if (response) return response;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
