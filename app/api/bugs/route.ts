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
  const severity = searchParams.get("severity");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.TaskWhereInput = {
    type: "BUG",
  };

  if (projectId) where.projectId = projectId;
  if (severity) where.severity = severity;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { taskKey: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const bugs = await prisma.task.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      project: { select: { id: true, name: true, code: true } },
      assignee: { select: { id: true, name: true, email: true } },
      reporter: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true, attachments: true } },
    },
  });

  return NextResponse.json({ bugs });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.TASK_CREATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse({
    ...body,
    type: "BUG",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid bug report input" },
      { status: 400 },
    );
  }

  const {
    title,
    description,
    status,
    priority,
    severity,
    projectId,
    assigneeId,
    dueDate,
  } = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const taskCount = await prisma.task.count({ where: { projectId } });
  const taskKey = `${project.code}-BUG-${taskCount + 1}`;

  const bug = await prisma.task.create({
    data: {
      taskKey,
      title,
      description: description || null,
      status: status || "TODO",
      priority: priority || "HIGH",
      type: "BUG",
      severity: severity || "HIGH",
      projectId,
      assigneeId: assigneeId || null,
      reporterId: user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      activities: {
        create: {
          userId: user.id,
          action: "CREATED",
          newValue: `Reported Bug: ${title}`,
        },
      },
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
      assignee: { select: { id: true, name: true } },
      reporter: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ bug }, { status: 201 });
}
