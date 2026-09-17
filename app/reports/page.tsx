import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const currentUser = await requireAuth();

  const projects = await prisma.project.findMany({
    select: { id: true, name: true, code: true },
  });

  return <ReportsClient currentUser={currentUser} projects={projects} />;
}
