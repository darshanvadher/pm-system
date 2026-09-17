import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { ProjectFilesClient } from "./files-client";

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      files: {
        orderBy: { createdAt: "desc" },
        include: {
          uploader: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!project) notFound();

  return <ProjectFilesClient project={project} currentUser={currentUser} />;
}
