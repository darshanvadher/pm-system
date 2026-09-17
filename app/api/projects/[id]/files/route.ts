import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createProjectFileSchema } from "@/lib/validations/project-file";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { user, response } = await requireApiPermission(
    PERMISSIONS.PROJECT_VIEW,
  );
  if (response || !user) return response;

  const files = await prisma.projectFile.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ files });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { user, response } = await requireApiPermission(
    PERMISSIONS.PROJECT_UPDATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createProjectFileSchema.safeParse({ ...body, projectId });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid file input" },
      { status: 400 },
    );
  }

  const { name, filePath, fileSize, fileType, category } = parsed.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const projectFile = await prisma.projectFile.create({
    data: {
      projectId,
      uploaderId: user.id,
      name,
      filePath,
      fileSize,
      fileType,
      category,
    },
    include: {
      uploader: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ file: projectFile }, { status: 201 });
}
