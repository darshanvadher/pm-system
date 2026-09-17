import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  if (notification.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ notification: updated });
}
