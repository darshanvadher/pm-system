import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { BugsClient } from "./bugs-client";

export default async function GlobalBugsPage() {
  const user = await requireAuth();

  const [bugs, projects, users] = await Promise.all([
    prisma.task.findMany({
      where: { type: "BUG" },
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

  return (
    <BugsClient
      initialBugs={bugs}
      projects={projects}
      users={users}
      user={user}
    />
  );
}
