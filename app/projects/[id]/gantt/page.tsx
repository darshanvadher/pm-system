import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { GanttClient } from "./gantt-client";

export default async function ProjectGanttPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const [project, allProjectTasks] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { dueDate: "asc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } },
            dependencies: {
              include: {
                dependsOnTask: {
                  select: { id: true, taskKey: true, title: true },
                },
              },
            },
          },
          orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
    prisma.task.findMany({
      where: { projectId: id },
      select: { id: true, taskKey: true, title: true },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <GanttClient
      project={project}
      allTasks={allProjectTasks}
      currentUser={user}
    />
  );
}
