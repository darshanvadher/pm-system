import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function ProjectKanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        milestones: { select: { id: true, title: true } },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${project.id}`}
              className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
              {project.name}
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Kanban Board
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.name} ({user.role.name})
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Kanban Board Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {project.name} Kanban Board
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Drag and drop tasks between workflow stages. Positions
              automatically persist.
            </p>
          </div>
        </div>

        <KanbanBoard
          projectId={project.id}
          users={users}
          milestones={project.milestones}
        />
      </main>
    </div>
  );
}
