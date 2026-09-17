import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createTimeLogSchema } from "@/lib/validations/time-log";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;
  const { user, response } = await requireApiPermission(PERMISSIONS.TASK_READ);
  if (response || !user) return response;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, estimatedHours: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const timeLogs = await prisma.timeLog.findMany({
    where: { taskId },
    orderBy: { date: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const totalLoggedHours = timeLogs.reduce((acc, log) => acc + log.hours, 0);

  return NextResponse.json({
    estimatedHours: task.estimatedHours ?? 0,
    totalLoggedHours,
    timeLogs,
  });
}

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
  const parsed = createTimeLogSchema.safeParse({ ...body, taskId });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid time log input" },
      { status: 400 },
    );
  }

  const { hours, date, description } = parsed.data;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const timeLog = await prisma.timeLog.create({
    data: {
      taskId,
      userId: user.id,
      hours,
      date: date ? new Date(date) : new Date(),
      description,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log activity
  await prisma.taskActivityLog.create({
    data: {
      taskId,
      userId: user.id,
      action: "TIME_LOGGED",
      newValue: `${hours}h - ${description || "Logged work"}`,
    },
  });

  return NextResponse.json({ timeLog }, { status: 201 });
}
