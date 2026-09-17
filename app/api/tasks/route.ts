import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createTaskSchema } from "@/lib/validations/task";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { response } = await requireApiPermission(PERMISSIONS.TASK_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");

  const where: Prisma.TaskWhereInput = {};
  if (projectId) where.projectId = projectId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { taskKey: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    include: {
      project: { select: { id: true, name: true, code: true } },
      milestone: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true, attachments: true } },
    },
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.TASK_CREATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const {
    title,
    description,
    status,
    priority,
    projectId,
    milestoneId,
    assigneeId,
    dueDate,
    tagNames,
  } = parsed.data;

  // Verify project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Generate unique taskKey (e.g., PROJ-1)
  const taskCount = await prisma.task.count({ where: { projectId } });
  const taskKey = `${project.code}-${taskCount + 1}`;

  // Get max position in column for ordering
  const maxPos = await prisma.task.aggregate({
    where: { projectId, status },
    _max: { position: true },
  });
  const newPosition = (maxPos._max.position ?? 0) + 1.0;

  // Tags processing
  const tagConnects: { tagId: string }[] = [];
  if (tagNames && tagNames.length > 0) {
    for (const name of tagNames) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const tag = await prisma.tag.upsert({
        where: { name: trimmed },
        update: {},
        create: { name: trimmed },
      });
      tagConnects.push({ tagId: tag.id });
    }
  }

  const task = await prisma.task.create({
    data: {
      taskKey,
      title,
      description: description || null,
      status,
      priority,
      position: newPosition,
      projectId,
      milestoneId: milestoneId || null,
      assigneeId: assigneeId || null,
      reporterId: user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: {
        create: tagConnects,
      },
      activities: {
        create: {
          userId: user.id,
          action: "CREATED",
          newValue: title,
        },
      },
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
      milestone: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      comments: true,
      attachments: true,
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
