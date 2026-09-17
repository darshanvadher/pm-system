import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { PortalClient } from "./portal-client";

export default async function PortalPage() {
  const currentUser = await requireAuth();

  // If user is connected to a client organization, scope to client projects
  const whereProject: { clientId?: string } = {};
  if (currentUser.role.name === "CLIENT" && currentUser.clientId) {
    whereProject.clientId = currentUser.clientId;
  }

  const [projects, updates] = await Promise.all([
    prisma.project.findMany({
      where: whereProject,
      include: {
        client: true,
        milestones: { orderBy: { dueDate: "asc" } },
        _count: { select: { tasks: true, milestones: true } },
      },
    }),
    prisma.clientUpdate.findMany({
      where:
        currentUser.role.name === "CLIENT"
          ? {
              status: { in: ["PUBLISHED", "APPROVED", "REJECTED"] },
              ...(currentUser.clientId
                ? { project: { clientId: currentUser.clientId } }
                : {}),
            }
          : {},
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true, code: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return (
    <PortalClient
      currentUser={currentUser}
      projects={projects}
      initialUpdates={updates}
    />
  );
}
