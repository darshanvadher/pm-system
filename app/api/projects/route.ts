import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createProjectSchema } from "@/lib/validations/project";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_VIEW);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Prisma.ProjectWhereInput = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      milestones: {
        select: { id: true, title: true, status: true, dueDate: true },
      },
      tasks: { select: { id: true, status: true } },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.PROJECT_CREATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, code, description, status, startDate, endDate, clientId } =
    parsed.data;

  // Check unique project code
  const existing = await prisma.project.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json(
      { error: `Project code '${code}' is already in use` },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      name,
      code,
      description: description || null,
      status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      clientId: clientId || null,
      members: {
        create: {
          userId: user.id,
          role: "MANAGER",
        },
      },
    },
    include: {
      client: { select: { id: true, name: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
