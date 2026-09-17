import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { updateProjectSchema } from "@/lib/validations/project";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_VIEW);
  if (response) return response;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: { select: { name: true } },
            },
          },
        },
      },
      milestones: {
        orderBy: { dueDate: "asc" },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
        },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_UPDATE);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { name, code, description, status, startDate, endDate, clientId } =
    parsed.data;

  if (code && code !== existing.code) {
    const codeTaken = await prisma.project.findUnique({ where: { code } });
    if (codeTaken) {
      return NextResponse.json(
        { error: `Project code '${code}' is already in use` },
        { status: 400 },
      );
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(description !== undefined && { description: description || null }),
      ...(status !== undefined && { status }),
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(endDate !== undefined && {
        endDate: endDate ? new Date(endDate) : null,
      }),
      ...(clientId !== undefined && { clientId: clientId || null }),
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

  return NextResponse.json({ project });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_DELETE);
  if (response) return response;

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
