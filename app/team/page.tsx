import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
  const currentUser = await requireAuth();

  const [users, projects, unassignedTasks] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
        assignedTasks: {
          select: {
            id: true,
            taskKey: true,
            title: true,
            status: true,
            priority: true,
            estimatedHours: true,
            project: { select: { id: true, name: true, code: true } },
            timeLogs: { select: { hours: true } },
          },
        },
      },
    }),
    prisma.project.findMany({ select: { id: true, name: true, code: true } }),
    prisma.task.findMany({
      where: { assigneeId: null },
      select: {
        id: true,
        taskKey: true,
        title: true,
        status: true,
        priority: true,
        estimatedHours: true,
        project: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  const memberWorkloads = users.map((u) => {
    const activeTasks = u.assignedTasks.filter((t) => t.status !== "DONE");
    const totalEstimatedHours = u.assignedTasks.reduce(
      (acc, t) => acc + (t.estimatedHours ?? 0),
      0,
    );
    const totalLoggedHours = u.assignedTasks.reduce(
      (acc, t) => acc + t.timeLogs.reduce((sum, l) => sum + l.hours, 0),
      0,
    );

    let capacityStatus: "OPTIMAL" | "OVERLOADED" | "AVAILABLE" = "OPTIMAL";
    if (activeTasks.length >= 6 || totalEstimatedHours >= 30) {
      capacityStatus = "OVERLOADED";
    } else if (activeTasks.length <= 2) {
      capacityStatus = "AVAILABLE";
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      roleName: u.role.name,
      totalAssignedTasks: u.assignedTasks.length,
      activeTaskCount: activeTasks.length,
      totalEstimatedHours,
      totalLoggedHours,
      capacityStatus,
      tasks: u.assignedTasks,
    };
  });

  return (
    <TeamClient
      currentUser={currentUser}
      projects={projects}
      users={users}
      initialWorkloads={memberWorkloads}
      unassignedTasks={unassignedTasks}
    />
  );
}
