import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { TimeClient } from "./time-client";

export default async function TimePage() {
  const currentUser = await requireAuth();

  const [projects, users, timeLogs, tasks] = await Promise.all([
    prisma.project.findMany({ select: { id: true, name: true, code: true } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    prisma.timeLog.findMany({
      orderBy: { date: "desc" },
      take: 100,
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
      select: {
        id: true,
        taskKey: true,
        title: true,
        estimatedHours: true,
        projectId: true,
        timeLogs: { select: { hours: true } },
      },
    }),
  ]);

  return (
    <TimeClient
      currentUser={currentUser}
      projects={projects}
      users={users}
      initialTimeLogs={timeLogs}
      initialTasks={tasks}
    />
  );
}
