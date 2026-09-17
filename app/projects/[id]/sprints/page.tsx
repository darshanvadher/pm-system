import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { SprintsClient } from "./sprints-client";

export default async function ProjectSprintsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        sprints: {
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
        },
        tasks: {
          where: { sprintId: null },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            tags: { include: { tag: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return <SprintsClient project={project} users={users} currentUser={user} />;
}
