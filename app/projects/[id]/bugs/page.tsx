import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { BugsClient } from "@/app/bugs/bugs-client";

export default async function ProjectBugsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const [project, bugs, projects, users] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.task.findMany({
      where: { projectId: id, type: "BUG" },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        project: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, name: true, email: true } },
        reporter: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <BugsClient
      initialBugs={bugs}
      projects={projects}
      users={users}
      user={user}
      scopedProject={project}
    />
  );
}
