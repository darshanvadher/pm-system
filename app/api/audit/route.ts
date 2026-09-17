import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function GET(request: NextRequest) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.PROJECT_VIEW,
  );
  if (response || !user) return response;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const whereClause: {
    task?: { projectId: string };
    userId?: string;
    action?: string;
  } = {};

  if (projectId) {
    whereClause.task = { projectId };
  }
  if (userId) {
    whereClause.userId = userId;
  }
  if (action && action !== "ALL") {
    whereClause.action = action;
  }

  const [activities, comments, clientUpdates] = await Promise.all([
    prisma.taskActivityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
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
      where: projectId ? { task: { projectId } } : {},
      orderBy: { createdAt: "desc" },
      take: 25,
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
      where: projectId ? { projectId } : {},
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        project: { select: { id: true, name: true, code: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    activities,
    comments,
    clientUpdates,
  });
}
