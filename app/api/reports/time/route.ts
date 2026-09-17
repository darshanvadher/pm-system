import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.PROJECT_VIEW,
  );
  if (response || !user) return response;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId");

  const whereClause: {
    task?: { projectId: string };
    userId?: string;
  } = {};

  if (projectId) {
    whereClause.task = { projectId };
  }
  if (userId) {
    whereClause.userId = userId;
  }

  const [timeLogs, tasksSummary] = await Promise.all([
    prisma.timeLog.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        task: {
          select: {
            id: true,
            taskKey: true,
            title: true,
            estimatedHours: true,
            project: { select: { id: true, name: true, code: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.task.findMany({
      where: projectId ? { projectId } : {},
      select: {
        id: true,
        taskKey: true,
        title: true,
        estimatedHours: true,
        status: true,
        project: { select: { id: true, name: true, code: true } },
        _count: { select: { timeLogs: true } },
        timeLogs: { select: { hours: true } },
      },
    }),
  ]);

  const totalLoggedHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
  const totalEstimatedHours = tasksSummary.reduce(
    (sum, t) => sum + (t.estimatedHours ?? 0),
    0,
  );

  return NextResponse.json({
    totalLoggedHours,
    totalEstimatedHours,
    timeLogs,
    tasksSummary: tasksSummary.map((t) => ({
      id: t.id,
      taskKey: t.taskKey,
      title: t.title,
      estimatedHours: t.estimatedHours ?? 0,
      loggedHours: t.timeLogs.reduce((acc, l) => acc + l.hours, 0),
      project: t.project,
      status: t.status,
    })),
  });
}
