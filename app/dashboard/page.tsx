import Link from "next/link";
import { requireAuth, hasPermission } from "@/lib/auth/rbac";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { CommandPalette } from "@/components/search/command-palette";
import { FolderKanban, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();
  const canSeeAdmin =
    hasPermission(user, PERMISSIONS.USER_MANAGE) ||
    hasPermission(user, PERMISSIONS.ROLE_MANAGE) ||
    hasPermission(user, PERMISSIONS.CLIENT_MANAGE);

  const [projectCount, taskCount, myAssignedTaskCount, activeProjects] =
    await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { assigneeId: user.id } }),
      prisma.project.findMany({
        take: 3,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { tasks: true, members: true } },
        },
      }),
    ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md">
                PM
              </div>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                PM System
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-xs font-semibold">
              <Link
                href="/dashboard"
                className="text-indigo-600 dark:text-indigo-400"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Projects
              </Link>
              <Link
                href="/bugs"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Bugs
              </Link>
              <Link
                href="/time"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Time Tracking
              </Link>
              <Link
                href="/team"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Team Workload
              </Link>
              <Link
                href="/files"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Files
              </Link>
              <Link
                href="/audit"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Audit Trail
              </Link>
              <Link
                href="/reports"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Reports
              </Link>
              {canSeeAdmin && (
                <Link
                  href="/admin"
                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <CommandPalette />
            <NotificationCenter />
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Role:{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {user.role.name}
              </span>{" "}
              · {user.email}
            </p>
          </div>
          <Link
            href="/projects"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-indigo-700"
          >
            <FolderKanban className="h-4 w-4" />
            Go to Projects Hub
          </Link>
        </div>

        {/* Dashboard Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Active Projects
            </span>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {projectCount}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Total System Tasks
            </span>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {taskCount}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Assigned to Me
            </span>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {myAssignedTaskCount}
            </p>
          </div>
        </div>

        {/* Recent Projects Preview */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {activeProjects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-900 dark:bg-zinc-900/50"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {p.code}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {p.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {p.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-200/60 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
                  <span>{p._count.tasks} Tasks</span>
                  <Link
                    href={`/projects/${p.id}/kanban`}
                    className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Open Kanban →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
