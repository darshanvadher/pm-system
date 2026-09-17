import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { AuditClient } from "./audit-client";

export default async function AuditPage() {
  const currentUser = await requireAuth();

  const [activities, comments, clientUpdates, projects, users] =
    await Promise.all([
      prisma.taskActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          task: {
            select: {
              id: true,
              taskKey: true,
              title: true,
              project: { select: { id: true, name: true, code: true } },
            },
          },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          task: {
            select: {
              id: true,
              taskKey: true,
              title: true,
              project: { select: { id: true, name: true, code: true } },
            },
          },
          author: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.clientUpdate.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          project: { select: { id: true, name: true, code: true } },
          author: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.project.findMany({ select: { id: true, name: true, code: true } }),
      prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    ]);

  return (
    <AuditClient
      currentUser={currentUser}
      initialActivities={activities}
      initialComments={comments}
      initialClientUpdates={clientUpdates}
      projects={projects}
      users={users}
    />
  );
}
