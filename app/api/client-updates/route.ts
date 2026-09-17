import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createClientUpdateSchema } from "@/lib/validations/client-update";
import { sendEmail } from "@/lib/email/mailer";

export async function GET(request: NextRequest) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.PROJECT_VIEW,
  );
  if (response || !user) return response;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  // If Client user, only show published/approved updates for their linked client projects
  const whereClause: {
    projectId?: string;
    status?: { in: string[] };
    project?: { clientId?: string };
  } = {};

  if (projectId) {
    whereClause.projectId = projectId;
  }

  if (user.role.name === "CLIENT") {
    whereClause.status = { in: ["PUBLISHED", "APPROVED", "REJECTED"] };
    if (user.clientId) {
      whereClause.project = { clientId: user.clientId };
    }
  }

  const updates = await prisma.clientUpdate.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true, code: true } },
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ updates });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.PROJECT_UPDATE,
  );
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = createClientUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update input" },
      { status: 400 },
    );
  }

  const { projectId, title, summary, content, status } = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isPublished = status === "PUBLISHED";

  const clientUpdate = await prisma.clientUpdate.create({
    data: {
      projectId,
      authorId: user.id,
      title,
      summary,
      content,
      status,
      publishedAt: isPublished ? new Date() : null,
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
      author: { select: { id: true, name: true, email: true } },
    },
  });

  // If published, notify client users & send email notification
  if (isPublished && project.clientId) {
    const clientUsers = await prisma.user.findMany({
      where: { clientId: project.clientId },
    });

    for (const clientUser of clientUsers) {
      await prisma.notification.create({
        data: {
          userId: clientUser.id,
          title: `Project Update: ${project.name}`,
          message: title,
          type: "CLIENT_UPDATE",
          link: "/portal",
        },
      });

      await sendEmail({
        to: clientUser.email,
        subject: `[${project.code}] New Project Progress Update: ${title}`,
        text: `A new update "${title}" has been published for ${project.name}.\n\nSummary: ${summary || "Please check portal for details."}\n\nLog in to review: http://localhost:3000/portal`,
      });
    }
  }

  return NextResponse.json({ update: clientUpdate }, { status: 201 });
}
