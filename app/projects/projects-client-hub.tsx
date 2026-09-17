"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Users, ChevronRight } from "lucide-react";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { LogoutButton } from "@/components/auth/logout-button";

interface MemberItem {
  userId: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface ProjectItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  client?: { id: string; name: string } | null;
  members?: MemberItem[];
  tasks?: Array<{ id: string; status: string }>;
}

interface ClientItem {
  id: string;
  name: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: { name: string };
}

interface ProjectsClientHubProps {
  initialProjects: ProjectItem[];
  clients: ClientItem[];
  user: UserItem;
}

const STATUS_BADGES: Record<string, string> = {
  PLANNING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ACTIVE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ARCHIVED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function ProjectsClientHub({
  initialProjects,
  clients,
  user,
}: ProjectsClientHubProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function refreshProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error("Failed to refresh projects:", err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md">
                PM
              </div>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                PM System
              </span>
            </Link>
            <nav className="hidden items-center gap-4 text-xs font-semibold sm:flex">
              <Link
                href="/dashboard"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-indigo-600 dark:bg-zinc-800 dark:text-indigo-400"
              >
                Projects
              </Link>
              <Link
                href="/admin"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Admin
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.name} ({user.role.name})
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Projects Hub
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage your project portfolios, milestones, members, and task
              workflows.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
            <FolderKanban className="mb-3 h-10 w-10 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No projects yet
            </h3>
            <p className="mb-4 text-xs text-zinc-500">
              Create your first project to get started.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => {
              const totalTasks = proj.tasks?.length ?? 0;
              const doneTasks =
                proj.tasks?.filter((t) => t.status === "DONE").length ?? 0;
              const progressPct =
                totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={proj.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition hover:border-indigo-500/50 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950"
                >
                  <div>
                    {/* Header: Code badge, status badge */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
                        {proj.code}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_BADGES[proj.status] || STATUS_BADGES.PLANNING
                        }`}
                      >
                        {proj.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="mb-2 text-base font-bold text-zinc-900 transition group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
                      {proj.name}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {proj.description || "No description provided."}
                    </p>

                    {/* Client name if present */}
                    {proj.client && (
                      <p className="mb-4 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        Client:{" "}
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {proj.client.name}
                        </span>
                      </p>
                    )}
                  </div>

                  <div>
                    {/* Task Progress Bar */}
                    <div className="mb-4">
                      <div className="mb-1 flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        <span>Progress</span>
                        <span>
                          {progressPct}% ({doneTasks}/{totalTasks} tasks)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full bg-indigo-600 transition-all duration-500 dark:bg-indigo-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer stats & links */}
                    <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Users className="h-4 w-4 text-zinc-400" />
                        <span>{proj.members?.length ?? 0} members</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/projects/${proj.id}/kanban`}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Kanban
                        </Link>
                        <Link
                          href={`/projects/${proj.id}`}
                          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/60"
                        >
                          Overview
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshProjects}
        clients={clients}
      />
    </div>
  );
}
