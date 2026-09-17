import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createDependencySchema } from "@/lib/validations/task";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.TASK_UPDATE);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createDependencySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid dependency input" },
      { status: 400 },
    );
  }

  const { dependsOnTaskId } = parsed.data;

  if (taskId === dependsOnTaskId) {
    return NextResponse.json(
      { error: "A task cannot depend on itself" },
      { status: 400 },
    );
  }

  const dependency = await prisma.taskDependency.upsert({
    where: {
      taskId_dependsOnTaskId: { taskId, dependsOnTaskId },
    },
    update: {},
    create: { taskId, dependsOnTaskId },
    include: {
      dependsOnTask: { select: { id: true, taskKey: true, title: true } },
    },
  });

  return NextResponse.json({ dependency }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.TASK_UPDATE);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const dependsOnTaskId = searchParams.get("dependsOnTaskId");
  if (!dependsOnTaskId) {
    return NextResponse.json(
      { error: "dependsOnTaskId parameter is required" },
      { status: 400 },
    );
  }

  await prisma.taskDependency.deleteMany({
    where: { taskId, dependsOnTaskId },
  });

  return NextResponse.json({ success: true });
}
