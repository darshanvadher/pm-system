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
  const q = searchParams.get("q")?.trim() || "";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!q) {
    return NextResponse.json({
      projects: [],
      tasks: [],
      bugs: [],
      sprints: [],
      files: [],
      clientUpdates: [],
    });
  }

  const [projects, tasks, bugs, sprints, files, clientUpdates] =
    await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: { id: true, name: true, code: true, status: true },
      }),
      prisma.task.findMany({
        where: {
          type: { not: "BUG" },
          OR: [
            { taskKey: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: {
          id: true,
          taskKey: true,
          title: true,
          status: true,
          priority: true,
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          type: "BUG",
          OR: [
            { taskKey: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: {
          id: true,
          taskKey: true,
          title: true,
          severity: true,
          status: true,
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.sprint.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { goal: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.projectFile.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          filePath: true,
          category: true,
          project: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.clientUpdate.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          project: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

  return NextResponse.json({
    projects,
    tasks,
    bugs,
    sprints,
    files,
    clientUpdates,
  });
}
