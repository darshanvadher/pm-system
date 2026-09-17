import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createMilestoneSchema } from "@/lib/validations/project";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: projectId } = await params;
  const { response } = await requireApiPermission(PERMISSIONS.PROJECT_UPDATE);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { title, description, dueDate, status } = parsed.data;

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status,
    },
  });

  return NextResponse.json({ milestone }, { status: 201 });
}
