import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { ProjectOverviewClient } from "./project-overview-client";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuth();

  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: { select: { name: true } },
              },
            },
          },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            reporter: { select: { id: true, name: true } },
            tags: { include: { tag: true } },
            _count: { select: { comments: true, attachments: true } },
          },
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return <ProjectOverviewClient project={project} users={users} />;
}
