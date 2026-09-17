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

  const whereProject = projectId ? { id: projectId } : {};
  const whereTask = projectId ? { projectId } : {};

  const [projects, sprints, tasks, timeLogs, bugs, milestones, clientUpdates] =
    await Promise.all([
      prisma.project.findMany({
        where: whereProject,
        include: {
          _count: { select: { tasks: true, milestones: true, members: true } },
        },
      }),
      prisma.sprint.findMany({
        where: projectId ? { projectId } : {},
        include: {
          tasks: {
            select: { id: true, storyPoints: true, status: true },
          },
          project: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.task.findMany({
        where: whereTask,
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, code: true } },
          timeLogs: { select: { hours: true } },
        },
      }),
      prisma.timeLog.findMany({
        where: projectId ? { task: { projectId } } : {},
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
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.task.findMany({
        where: { ...whereTask, type: "BUG" },
        include: {
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.milestone.findMany({
        where: projectId ? { projectId } : {},
      }),
      prisma.clientUpdate.findMany({
        where: projectId ? { projectId } : {},
      }),
    ]);

  // 1. Sprint Velocity Metrics
  const sprintVelocity = sprints.map((s) => {
    const totalPoints = s.tasks.reduce(
      (sum, t) => sum + (t.storyPoints || 0),
      0,
    );
    const completedPoints = s.tasks
      .filter((t) => t.status === "DONE")
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    return {
      id: s.id,
      name: s.name,
      status: s.status,
      projectCode: s.project.code,
      totalPoints,
      completedPoints,
      completionRate:
        totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
    };
  });

  // 2. Task Status & Priority Distribution
  const statusCounts: Record<string, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
  };
  const priorityCounts: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

  tasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
  });

  // 3. Time Tracking Summary
  const totalLoggedHours = timeLogs.reduce((sum, l) => sum + l.hours, 0);
  const totalEstimatedHours = tasks.reduce(
    (sum, t) => sum + (t.estimatedHours || 0),
    0,
  );

  // 4. Bug Severity Breakdown
  const bugSeverityCounts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  let resolvedBugs = 0;

  bugs.forEach((b) => {
    if (b.severity && bugSeverityCounts[b.severity] !== undefined) {
      bugSeverityCounts[b.severity]++;
    }
    if (b.status === "DONE") resolvedBugs++;
  });

  // 5. Milestone & Client Progress
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(
    (m) => m.status === "COMPLETED",
  ).length;
  const approvedClientUpdates = clientUpdates.filter(
    (u) => u.status === "APPROVED",
  ).length;

  return NextResponse.json({
    kpis: {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks: statusCounts.DONE,
      openBugs: bugs.length - resolvedBugs,
      resolvedBugs,
      totalLoggedHours,
      totalEstimatedHours,
      totalMilestones,
      completedMilestones,
      approvedClientUpdates,
    },
    sprintVelocity,
    taskDistribution: {
      byStatus: statusCounts,
      byPriority: priorityCounts,
    },
    bugAnalytics: {
      totalBugs: bugs.length,
      resolvedBugs,
      bySeverity: bugSeverityCounts,
      resolutionRate:
        bugs.length > 0 ? Math.round((resolvedBugs / bugs.length) * 100) : 0,
    },
  });
}
