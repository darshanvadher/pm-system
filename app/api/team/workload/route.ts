import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
  const { user, response } = await requireApiPermission(PERMISSIONS.USER_READ);
  if (response || !user) return response;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } },
      assignedTasks: {
        where: projectId ? { projectId } : {},
        select: {
          id: true,
          taskKey: true,
          title: true,
          status: true,
          priority: true,
          estimatedHours: true,
          dueDate: true,
          project: { select: { id: true, name: true, code: true } },
          timeLogs: { select: { hours: true } },
        },
      },
    },
  });

  const memberWorkloads = users.map((u) => {
    const totalAssignedTasks = u.assignedTasks.length;
    const activeTasks = u.assignedTasks.filter((t) => t.status !== "DONE");
    const totalEstimatedHours = u.assignedTasks.reduce(
      (acc, t) => acc + (t.estimatedHours ?? 0),
      0,
    );
    const totalLoggedHours = u.assignedTasks.reduce(
      (acc, t) => acc + t.timeLogs.reduce((sum, l) => sum + l.hours, 0),
      0,
    );

    // Calculate capacity status: > 40 est hours or > 8 active tasks => OVERLOADED
    let capacityStatus: "OPTIMAL" | "OVERLOADED" | "AVAILABLE" = "OPTIMAL";
    if (activeTasks.length > 7 || totalEstimatedHours > 40) {
      capacityStatus = "OVERLOADED";
    } else if (activeTasks.length < 3) {
      capacityStatus = "AVAILABLE";
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      roleName: u.role.name,
      totalAssignedTasks,
      activeTaskCount: activeTasks.length,
      totalEstimatedHours,
      totalLoggedHours,
      capacityStatus,
      tasks: u.assignedTasks,
    };
  });

  return NextResponse.json({ workloads: memberWorkloads });
}
