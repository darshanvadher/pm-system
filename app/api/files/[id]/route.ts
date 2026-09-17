import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { user, response } = await requireApiPermission(
    PERMISSIONS.PROJECT_UPDATE,
  );
  if (response || !user) return response;

  const file = await prisma.projectFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Only uploader, PM, or Admin can delete
  if (
    file.uploaderId !== user.id &&
    user.role.name !== "ADMIN" &&
    user.role.name !== "PROJECT_MANAGER"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from database first
  await prisma.projectFile.delete({ where: { id } });

  // Attempt to delete from local disk if it's a relative /uploads path
  if (file.filePath.startsWith("/uploads/")) {
    try {
      const diskPath = path.join(
        process.cwd(),
        "public",
        file.filePath.replace("/uploads/", "uploads/"),
      );
      await unlink(diskPath);
    } catch {
      // Ignore disk delete errors if file was already removed
    }
  }

  return NextResponse.json({ success: true });
}
