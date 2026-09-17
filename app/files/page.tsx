import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { GlobalFilesClient } from "./files-client";

export default async function GlobalFilesPage() {
  const currentUser = await requireAuth();

  const [files, projects] = await Promise.all([
    prisma.projectFile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true, code: true } },
        uploader: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.project.findMany({ select: { id: true, name: true, code: true } }),
  ]);

  return (
    <GlobalFilesClient
      currentUser={currentUser}
      initialFiles={files}
      projects={projects}
    />
  );
}
