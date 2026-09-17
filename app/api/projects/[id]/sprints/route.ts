import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createSprintSchema } from "@/lib/validations/sprint";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_VIEW);
  if (response) return response;

  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  const backlogTasks = await prisma.task.findMany({
    where: { projectId, sprintId: null },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sprints, backlogTasks });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_UPDATE);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createSprintSchema.safeParse({ ...body, projectId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, goal, startDate, endDate, status } = parsed.data;

  const sprint = await prisma.sprint.create({
    data: {
      projectId,
      name,
      goal: goal || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status,
    },
    include: {
      tasks: true,
    },
  });

  return NextResponse.json({ sprint }, { status: 201 });
}
