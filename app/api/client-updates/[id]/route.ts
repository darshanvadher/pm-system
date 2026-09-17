import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { clientFeedbackSchema } from "@/lib/validations/client-update";
import { sendEmail } from "@/lib/email/mailer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.clientUpdate.findUnique({
    where: { id },
    include: { project: true, author: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Update not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  // Path A: Client feedback / approval action
  if (user.role.name === "CLIENT") {
    const parsedFeedback = clientFeedbackSchema.safeParse(body);
    if (!parsedFeedback.success) {
      return NextResponse.json(
        {
          error:
            parsedFeedback.error.issues[0]?.message ?? "Invalid feedback input",
        },
        { status: 400 },
      );
    }

    const { action, clientFeedback } = parsedFeedback.data;
    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await prisma.clientUpdate.update({
      where: { id },
      data: {
        status: newStatus,
        clientFeedback,
        approvedAt: action === "APPROVE" ? new Date() : null,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify author / project manager
    await prisma.notification.create({
      data: {
        userId: existing.authorId,
        title: `Client Feedback on Update: ${existing.project.name}`,
        message: `Client ${user.name} ${action.toLowerCase()}d "${existing.title}".`,
        type: "CLIENT_UPDATE",
        link: `/projects/${existing.projectId}/updates`,
      },
    });

    await sendEmail({
      to: existing.author.email,
      subject: `[${existing.project.code}] Client ${action}D Update: ${existing.title}`,
      text: `Client ${user.name} has ${action.toLowerCase()}d the progress update "${existing.title}".\n\nFeedback: ${clientFeedback || "No additional comments."}`,
    });

    return NextResponse.json({ update: updated });
  }

  // Path B: PM / Admin edit or status publish
  const { title, summary, content, status } = body;

  const isNowPublished = status === "PUBLISHED" && existing.status === "DRAFT";

  const updated = await prisma.clientUpdate.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(summary !== undefined && { summary }),
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
      ...(isNowPublished && { publishedAt: new Date() }),
    },
    include: {
      project: { select: { id: true, name: true, code: true } },
      author: { select: { id: true, name: true, email: true } },
    },
  });

  if (isNowPublished && existing.project.clientId) {
    const clientUsers = await prisma.user.findMany({
      where: { clientId: existing.project.clientId },
    });

    for (const clientUser of clientUsers) {
      await prisma.notification.create({
        data: {
          userId: clientUser.id,
          title: `Project Update: ${existing.project.name}`,
          message: updated.title,
          type: "CLIENT_UPDATE",
          link: "/portal",
        },
      });

      await sendEmail({
        to: clientUser.email,
        subject: `[${existing.project.code}] New Progress Update: ${updated.title}`,
        text: `A new update "${updated.title}" has been published for ${existing.project.name}.\n\nLog in to review: http://localhost:3000/portal`,
      });
    }
  }

  return NextResponse.json({ update: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.clientUpdate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Update not found" }, { status: 404 });
  }

  if (
    user.role.name !== "ADMIN" &&
    user.role.name !== "PROJECT_MANAGER" &&
    existing.authorId !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.clientUpdate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
