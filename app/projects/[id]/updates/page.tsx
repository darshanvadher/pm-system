import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { ProjectUpdatesClient } from "./updates-client";

export default async function ProjectUpdatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      clientUpdates: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!project) notFound();

  return <ProjectUpdatesClient project={project} currentUser={currentUser} />;
}
