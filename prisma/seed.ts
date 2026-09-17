// Loaded explicitly (rather than relying on prisma7.config.ts's
// "dotenv/config" import) so this script also works when run directly via
// `npm run db:seed`, which bypasses the Prisma CLI wrapper entirely.
import "dotenv/config";
// The generated client has no index.ts/package.json redirecting the bare
// "prisma" folder — its own header comment says to import client.ts
// directly, so that's the exact path used here (see the matching fix in
// lib/db/prisma.ts too).
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth/password";
import { ROLE_PERMISSIONS, ROLE_NAMES } from "../lib/auth/permissions";

// Prisma 7 requires an explicit driver adapter — see lib/db/prisma.ts for
// the same pattern used by the app itself.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Password123!"; // dev/demo only — never ship this

async function main() {
  console.log("Seeding permissions...");
  const allPermissionKeys = Array.from(
    new Set(Object.values(ROLE_PERMISSIONS).flat()),
  );

  const permissionRecords = await Promise.all(
    allPermissionKeys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key },
      }),
    ),
  );
  const permissionIdByKey = new Map(
    permissionRecords.map((p) => [p.key, p.id]),
  );

  console.log("Seeding roles + role-permission links...");
  const roleIdByName = new Map<string, string>();

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleIdByName.set(roleName, role.id);

    for (const key of permissionKeys) {
      const permissionId = permissionIdByKey.get(key)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  console.log("Seeding demo users...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const demoUsers = [
    {
      email: "admin@pm-system.test",
      name: "Ava Admin",
      role: ROLE_NAMES.ADMIN,
    },
    {
      email: "pm@pm-system.test",
      name: "Priya Manager",
      role: ROLE_NAMES.PROJECT_MANAGER,
    },
    {
      email: "dev@pm-system.test",
      name: "Dev Developer",
      role: ROLE_NAMES.DEVELOPER,
    },
    {
      email: "client@pm-system.test",
      name: "Cara Client",
      role: ROLE_NAMES.CLIENT,
    },
  ];

  const createdUserMap = new Map<
    string,
    { id: string; email: string; name: string }
  >();

  for (const demoUser of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        email: demoUser.email,
        name: demoUser.name,
        passwordHash,
        roleId: roleIdByName.get(demoUser.role)!,
      },
    });
    createdUserMap.set(demoUser.role, user);
  }

  console.log("Seeding demo client & projects...");
  const client = await prisma.client.upsert({
    where: { id: "demo-client-acme" },
    update: {},
    create: {
      id: "demo-client-acme",
      name: "Acme Corporation",
      contactEmail: "contact@acme.inc",
      contactPhone: "+1 (555) 019-2831",
      notes: "Enterprise tier client - high priority SLAs",
    },
  });

  const project1 = await prisma.project.upsert({
    where: { code: "NEXUS" },
    update: {},
    create: {
      name: "Nexus Cloud Dashboard",
      code: "NEXUS",
      description:
        "Next-generation analytics dashboard and real-time monitoring workspace.",
      status: "ACTIVE",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-15"),
      clientId: client.id,
      members: {
        create: [
          { userId: createdUserMap.get(ROLE_NAMES.ADMIN)!.id, role: "MANAGER" },
          {
            userId: createdUserMap.get(ROLE_NAMES.PROJECT_MANAGER)!.id,
            role: "MANAGER",
          },
          {
            userId: createdUserMap.get(ROLE_NAMES.DEVELOPER)!.id,
            role: "MEMBER",
          },
        ],
      },
    },
  });

  console.log("Seeding milestones & sprints...");
  const milestone1 = await prisma.milestone.upsert({
    where: { id: "nexus-m1" },
    update: {},
    create: {
      id: "nexus-m1",
      projectId: project1.id,
      title: "V1 Core Release",
      description: "Auth, Core PM, and Kanban workspace release",
      dueDate: new Date("2026-10-31"),
      status: "OPEN",
    },
  });

  const milestone2 = await prisma.milestone.upsert({
    where: { id: "nexus-m2" },
    update: {},
    create: {
      id: "nexus-m2",
      projectId: project1.id,
      title: "V2 Analytics & Reports",
      description: "BI insights, automated PDF export, and custom charts",
      dueDate: new Date("2026-11-30"),
      status: "OPEN",
    },
  });

  const sprint1 = await prisma.sprint.upsert({
    where: { id: "nexus-sprint-1" },
    update: {},
    create: {
      id: "nexus-sprint-1",
      projectId: project1.id,
      name: "Sprint 1 — Core Platform",
      goal: "Complete authentication, project workspace, and Kanban MVP",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-09-30"),
      status: "ACTIVE",
    },
  });

  const sprint2 = await prisma.sprint.upsert({
    where: { id: "nexus-sprint-2" },
    update: {},
    create: {
      id: "nexus-sprint-2",
      projectId: project1.id,
      name: "Sprint 2 — Agile & Quality",
      goal: "Implement Sprint Backlog, Gantt Timeline, and Bug tracking workflow",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
      status: "PLANNED",
    },
  });

  console.log("Seeding tags & tasks...");
  const tagFrontend = await prisma.tag.upsert({
    where: { name: "Frontend" },
    update: {},
    create: { name: "Frontend", color: "#3b82f6" },
  });
  const tagBackend = await prisma.tag.upsert({
    where: { name: "Backend" },
    update: {},
    create: { name: "Backend", color: "#8b5cf6" },
  });
  const tagUI = await prisma.tag.upsert({
    where: { name: "UI/UX" },
    update: {},
    create: { name: "UI/UX", color: "#ec4899" },
  });

  const createdTasksMap = new Map<string, { id: string; taskKey: string }>();

  const tasksData = [
    {
      taskKey: "NEXUS-1",
      title: "Design System Tokens & Dark Mode Theme",
      description:
        "Define CSS custom properties for vibrant glassmorphism, dark/light themes, and Tailwind tokens.",
      status: "DONE",
      priority: "HIGH",
      type: "TASK",
      storyPoints: 5,
      position: 1.0,
      assigneeId: createdUserMap.get(ROLE_NAMES.DEVELOPER)!.id,
      milestoneId: milestone1.id,
      sprintId: sprint1.id,
      startDate: new Date("2026-09-01"),
      dueDate: new Date("2026-09-10"),
      tags: [tagUI.id, tagFrontend.id],
    },
    {
      taskKey: "NEXUS-2",
      title: "Build Drag & Drop Kanban Workspace",
      description:
        "Implement accessible dnd-kit Kanban board with persistent column sorting and real-time API sync.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      type: "FEATURE",
      storyPoints: 8,
      position: 1.0,
      assigneeId: createdUserMap.get(ROLE_NAMES.DEVELOPER)!.id,
      milestoneId: milestone1.id,
      sprintId: sprint1.id,
      startDate: new Date("2026-09-10"),
      dueDate: new Date("2026-09-25"),
      tags: [tagFrontend.id],
    },
    {
      taskKey: "NEXUS-3",
      title: "Task Detail Drawer & Activity Audit Timeline",
      description:
        "Create sliding drawer with comments thread, attachments metadata list, and activity log audit trail.",
      status: "IN_REVIEW",
      priority: "MEDIUM",
      type: "FEATURE",
      storyPoints: 5,
      position: 1.0,
      assigneeId: createdUserMap.get(ROLE_NAMES.PROJECT_MANAGER)!.id,
      milestoneId: milestone1.id,
      sprintId: sprint1.id,
      startDate: new Date("2026-09-15"),
      dueDate: new Date("2026-09-28"),
      tags: [tagFrontend.id, tagBackend.id],
    },
    {
      taskKey: "NEXUS-4",
      title: "Configure Postgres Indexing & Query Optimizations",
      description:
        "Optimize foreign key indexes and query performance for dashboard metrics aggregation.",
      status: "TODO",
      priority: "LOW",
      type: "TASK",
      storyPoints: 3,
      position: 1.0,
      assigneeId: createdUserMap.get(ROLE_NAMES.DEVELOPER)!.id,
      milestoneId: milestone2.id,
      sprintId: sprint2.id,
      startDate: new Date("2026-10-01"),
      dueDate: new Date("2026-10-15"),
      tags: [tagBackend.id],
    },
    {
      taskKey: "NEXUS-BUG-1",
      title: "Kanban drag shadow flickers on Firefox browser",
      description:
        "When dragging a task card across columns in Firefox, the drag preview shadow causes slight layout shift.",
      status: "TODO",
      priority: "HIGH",
      type: "BUG",
      severity: "CRITICAL",
      storyPoints: 2,
      position: 2.0,
      assigneeId: createdUserMap.get(ROLE_NAMES.DEVELOPER)!.id,
      milestoneId: milestone1.id,
      sprintId: sprint1.id,
      startDate: new Date("2026-09-20"),
      dueDate: new Date("2026-09-26"),
      tags: [tagFrontend.id],
    },
  ];

  for (const t of tasksData) {
    const task = await prisma.task.upsert({
      where: { taskKey: t.taskKey },
      update: {},
      create: {
        taskKey: t.taskKey,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        type: t.type,
        severity: t.severity || null,
        storyPoints: t.storyPoints,
        position: t.position,
        projectId: project1.id,
        milestoneId: t.milestoneId,
        sprintId: t.sprintId,
        assigneeId: t.assigneeId,
        reporterId: createdUserMap.get(ROLE_NAMES.PROJECT_MANAGER)!.id,
        startDate: t.startDate,
        dueDate: t.dueDate,
        tags: {
          create: t.tags.map((tagId) => ({ tagId })),
        },
        activities: {
          create: [
            {
              userId: createdUserMap.get(ROLE_NAMES.PROJECT_MANAGER)!.id,
              action: "CREATED",
              newValue: t.title,
            },
          ],
        },
      },
    });

    createdTasksMap.set(t.taskKey, task);

    if (t.taskKey === "NEXUS-2") {
      await prisma.comment.createMany({
        data: [
          {
            taskId: task.id,
            authorId: createdUserMap.get(ROLE_NAMES.PROJECT_MANAGER)!.id,
            content:
              "Make sure column reordering uses optimistic state updates for smooth dragging!",
          },
          {
            taskId: task.id,
            authorId: createdUserMap.get(ROLE_NAMES.DEVELOPER)!.id,
            content:
              "Integrated dnd-kit with custom drag overlay and keyboard accessibility sensors.",
          },
        ],
      });
    }
  }

  console.log("Seeding task dependencies...");
  const task1 = createdTasksMap.get("NEXUS-1");
  const task2 = createdTasksMap.get("NEXUS-2");
  if (task1 && task2) {
    await prisma.taskDependency.upsert({
      where: {
        taskId_dependsOnTaskId: {
          taskId: task2.id,
          dependsOnTaskId: task1.id,
        },
      },
      update: {},
      create: {
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      },
    });
  }

  console.log("Seeding time logs and estimated hours...");
  const devUser = createdUserMap.get(ROLE_NAMES.DEVELOPER)!;
  const pmUser = createdUserMap.get(ROLE_NAMES.PROJECT_MANAGER)!;

  const nexus1 = createdTasksMap.get("NEXUS-1");
  const nexus2 = createdTasksMap.get("NEXUS-2");
  const nexus3 = createdTasksMap.get("NEXUS-3");

  if (nexus1) {
    await prisma.task.update({
      where: { id: nexus1.id },
      data: { estimatedHours: 12 },
    });
    await prisma.timeLog.createMany({
      data: [
        {
          taskId: nexus1.id,
          userId: devUser.id,
          hours: 6.5,
          description: "Theme token setup & Tailwind config",
          date: new Date("2026-09-02"),
        },
        {
          taskId: nexus1.id,
          userId: devUser.id,
          hours: 5.5,
          description: "Glassmorphism styling & dark mode testing",
          date: new Date("2026-09-04"),
        },
      ],
    });
  }

  if (nexus2) {
    await prisma.task.update({
      where: { id: nexus2.id },
      data: { estimatedHours: 24 },
    });
    await prisma.timeLog.createMany({
      data: [
        {
          taskId: nexus2.id,
          userId: devUser.id,
          hours: 8.0,
          description: "dnd-kit sensor integration and droppable columns",
          date: new Date("2026-09-12"),
        },
        {
          taskId: nexus2.id,
          userId: devUser.id,
          hours: 6.0,
          description: "Optimistic position sorting & reorder endpoint",
          date: new Date("2026-09-14"),
        },
      ],
    });
  }

  if (nexus3) {
    await prisma.task.update({
      where: { id: nexus3.id },
      data: { estimatedHours: 16 },
    });
    await prisma.timeLog.createMany({
      data: [
        {
          taskId: nexus3.id,
          userId: pmUser.id,
          hours: 7.5,
          description: "Sliding drawer layout and activity timeline",
          date: new Date("2026-09-16"),
        },
      ],
    });
  }

  console.log("Seeding project files...");
  await prisma.projectFile.createMany({
    data: [
      {
        projectId: project1.id,
        uploaderId: pmUser.id,
        name: "Nexus Technical Specification V1.pdf",
        filePath: "/uploads/nexus_tech_spec_v1.pdf",
        fileSize: 2450000,
        fileType: "application/pdf",
        category: "SPEC",
      },
      {
        projectId: project1.id,
        uploaderId: devUser.id,
        name: "UI Design Tokens & Figma Export.zip",
        filePath: "/uploads/ui_tokens_figma.zip",
        fileSize: 8120000,
        fileType: "application/zip",
        category: "DESIGN",
      },
      {
        projectId: project1.id,
        uploaderId: pmUser.id,
        name: "Client Statement of Work & SOW.pdf",
        filePath: "/uploads/sow_nexus.pdf",
        fileSize: 1150000,
        fileType: "application/pdf",
        category: "CONTRACT",
      },
    ],
  });

  // Link client user to demo client organization
  const clientUserObj = createdUserMap.get(ROLE_NAMES.CLIENT);
  if (clientUserObj) {
    await prisma.user.update({
      where: { id: clientUserObj.id },
      data: { clientId: client.id },
    });
  }

  console.log("Seeding client updates...");
  await prisma.clientUpdate.createMany({
    data: [
      {
        projectId: project1.id,
        authorId: pmUser.id,
        title: "Sprint 1 Milestone Deliverable: Glassmorphism Design System",
        summary:
          "Delivered CSS custom property tokens, dark mode theme support, and reusable UI components.",
        content:
          "We are pleased to report that Sprint 1 deliverables have passed internal QA testing. The new glassmorphism design system tokens, accessible color palettes, and Tailwind theme tokens are fully integrated.",
        status: "APPROVED",
        clientFeedback: "Looks fantastic! Approved for staging deployment.",
        publishedAt: new Date("2026-09-10"),
        approvedAt: new Date("2026-09-12"),
      },
      {
        projectId: project1.id,
        authorId: pmUser.id,
        title: "Sprint 2 Progress: Agile Sprints & Gantt Timeline",
        summary:
          "Interactive dnd-kit Kanban board and dependency gantt timeline view complete.",
        content:
          "Sprint 2 implementation is underway. The visual Gantt timeline chart and Sprint planning backlog views are now live for client preview.",
        status: "PUBLISHED",
        publishedAt: new Date("2026-09-16"),
      },
    ],
  });

  console.log("Seeding notifications...");
  if (clientUserObj) {
    await prisma.notification.createMany({
      data: [
        {
          userId: clientUserObj.id,
          title: "New Project Progress Update",
          message:
            "Sprint 2 Progress: Agile Sprints & Gantt Timeline report has been published.",
          type: "CLIENT_UPDATE",
          link: "/portal",
          isRead: false,
        },
        {
          userId: clientUserObj.id,
          title: "Milestone Completed",
          message:
            "V1 Core Platform Architecture milestone marked as completed.",
          type: "STATUS_CHANGED",
          link: "/portal",
          isRead: true,
        },
      ],
    });
  }

  if (devUser) {
    await prisma.notification.createMany({
      data: [
        {
          userId: devUser.id,
          title: "New Task Assigned",
          message:
            "You have been assigned to NEXUS-2: Build Drag & Drop Kanban Workspace.",
          type: "TASK_ASSIGNED",
          link: "/projects/cmu57stnz0000zkrybr3ch5c0/kanban",
          isRead: false,
        },
      ],
    });
  }

  console.log('\nDemo accounts (password for all: "Password123!"):');
  demoUsers.forEach((u) => console.log(`  ${u.role.padEnd(16)} ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
