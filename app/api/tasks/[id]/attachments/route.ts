import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createAttachmentSchema } from "@/lib/validations/task";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;
  const { user, response } = await requireApiPermission(
    PERMISSIONS.TASK_UPDATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createAttachmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid attachment input" },
      { status: 400 },
    );
  }

  const { fileName, fileSize, fileType, fileUrl } = parsed.data;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      uploaderId: user.id,
      fileName,
      fileSize,
      fileType,
      fileUrl,
    },
    include: {
      uploader: { select: { id: true, name: true } },
    },
  });

  // Log activity
  await prisma.taskActivityLog.create({
    data: {
      taskId,
      userId: user.id,
      action: "ATTACHMENT_ADDED",
      newValue: fileName,
    },
  });

  return NextResponse.json({ attachment }, { status: 201 });
}
