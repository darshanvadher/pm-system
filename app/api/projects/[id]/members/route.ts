import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { addProjectMemberSchema } from "@/lib/validations/project";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_UPDATE);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = addProjectMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { userId, role } = parsed.data;

  const member = await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId, userId },
    },
    update: { role },
    create: { projectId, userId, role },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_UPDATE);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId parameter is required" },
      { status: 400 },
    );
  }

  await prisma.projectMember.deleteMany({
    where: { projectId, userId },
  });

  return NextResponse.json({ success: true });
}
