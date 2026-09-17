import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, response } = await requireApiPermission(
    PERMISSIONS.TASK_UPDATE,
  );
  if (response || !user) return response;

  const timeLog = await prisma.timeLog.findUnique({ where: { id } });
  if (!timeLog) {
    return NextResponse.json({ error: "Time log not found" }, { status: 404 });
  }

  // Only uploader or admin/PM can delete
  if (
    timeLog.userId !== user.id &&
    user.role.name !== "ADMIN" &&
    user.role.name !== "PROJECT_MANAGER"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.timeLog.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
