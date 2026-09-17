import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_VIEW);
  if (response) return response;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      milestones: {
        orderBy: { dueDate: "asc" },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
          dependencies: {
            include: {
              dependsOnTask: {
                select: { id: true, taskKey: true, title: true },
              },
            },
          },
        },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
