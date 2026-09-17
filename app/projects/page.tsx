import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { ProjectsClientHub } from "./projects-client-hub";

export default async function ProjectsPage() {
  const user = await requireAuth();

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        milestones: { select: { id: true, title: true, status: true } },
        tasks: { select: { id: true, status: true } },
      },
    }),
    prisma.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <ProjectsClientHub
      initialProjects={projects}
      clients={clients}
      user={user}
    />
  );
}
