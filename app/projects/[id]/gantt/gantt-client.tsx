"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Link as LinkIcon,
  X,
  AlertCircle,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

interface DependencyItem {
  dependsOnTaskId: string;
  dependsOnTask: { id: string; taskKey: string; title: string };
}

interface TaskItem {
  id: string;
  taskKey: string;
  title: string;
  status: string;
  priority: string;
  startDate?: string | null;
  dueDate?: string | null;
  assignee?: { id: string; name: string } | null;
  dependencies: DependencyItem[];
}

interface MilestoneItem {
  id: string;
  title: string;
  dueDate?: string | null;
  status: string;
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  milestones: MilestoneItem[];
  tasks: TaskItem[];
}

interface GanttClientProps {
  project: ProjectData;
  allTasks: Array<{ id: string; taskKey: string; title: string }>;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  IN_REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
};

export function GanttClient({
  project: initialProject,
  allTasks,
}: GanttClientProps) {
  const [project, setProject] = useState<ProjectData>(initialProject);

  // Dependency Modal State
  const [selectedTaskForDep, setSelectedTaskForDep] = useState<TaskItem | null>(
    null,
  );
  const [dependsOnTaskId, setDependsOnTaskId] = useState("");
  const [addingDep, setAddingDep] = useState(false);
  const [depError, setDepError] = useState("");

  async function refreshGantt() {
    try {
      const res = await fetch(`/api/projects/${project.id}/gantt`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    } catch (err) {
      console.error("Failed to refresh Gantt data:", err);
    }
  }

  async function handleAddDependency(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTaskForDep || !dependsOnTaskId) return;
    setAddingDep(true);
    setDepError("");

    try {
      const res = await fetch(
        `/api/tasks/${selectedTaskForDep.id}/dependencies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dependsOnTaskId }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add dependency");
      }

      setDependsOnTaskId("");
      setSelectedTaskForDep(null);
      refreshGantt();
    } catch (err: unknown) {
      setDepError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAddingDep(false);
    }
  }

  async function handleRemoveDependency(
    taskId: string,
    dependsOnTaskId: string,
  ) {
    try {
      const res = await fetch(
        `/api/tasks/${taskId}/dependencies?dependsOnTaskId=${dependsOnTaskId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        refreshGantt();
      }
    } catch (err) {
      console.error("Failed to remove dependency:", err);
    }
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
              Gantt Timeline
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${project.id}/sprints`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sprints
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Interactive Gantt & Timeline
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Visualize task schedules, milestone deadlines, and task dependency
              blocks.
            </p>
          </div>
        </div>

        {/* Timeline Table Container */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header Row */}
            <div className="grid grid-cols-12 gap-4 border-b border-zinc-200 pb-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
              <div className="col-span-4">Task / Key</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-2">Dates</div>
              <div className="col-span-3">Dependencies & Timeline Bar</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Milestones Markers */}
            {project.milestones.length > 0 && (
              <div className="my-3 border-b border-dashed border-zinc-200 pb-3 dark:border-zinc-800">
                <span className="mb-2 block text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  Project Milestones
                </span>
                <div className="flex flex-wrap gap-3">
                  {project.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="font-bold">{m.title}</span>
                      {m.dueDate && (
                        <span className="text-[10px] opacity-80">
                          ({new Date(m.dueDate).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks Timeline List */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {project.tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No tasks found in project.
                </div>
              ) : (
                project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid grid-cols-12 gap-4 py-3.5 items-center text-xs"
                  >
                    {/* Task Title & Key */}
                    <div className="col-span-4 flex items-center gap-2.5">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        {task.taskKey}
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {task.title}
                      </span>
                    </div>

                    {/* Assignee */}
                    <div className="col-span-2 text-zinc-600 dark:text-zinc-400 truncate">
                      {task.assignee?.name || "Unassigned"}
                    </div>

                    {/* Start / Due Dates */}
                    <div className="col-span-2 text-zinc-500">
                      {task.startDate
                        ? new Date(task.startDate).toLocaleDateString()
                        : "No Start"}{" "}
                      -{" "}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "No Due"}
                    </div>

                    {/* Timeline Bar & Dependencies */}
                    <div className="col-span-3 flex flex-col gap-1">
                      <div className="relative h-4 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[task.status] || "bg-indigo-600"}`}
                          style={{
                            width: task.status === "DONE" ? "100%" : "60%",
                          }}
                        />
                      </div>

                      {/* Dependencies List */}
                      {task.dependencies && task.dependencies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {task.dependencies.map((dep) => (
                            <span
                              key={dep.dependsOnTaskId}
                              className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/80 dark:text-amber-300"
                            >
                              <AlertCircle className="h-2.5 w-2.5" />
                              Blocked by {dep.dependsOnTask.taskKey}
                              <button
                                onClick={() =>
                                  handleRemoveDependency(
                                    task.id,
                                    dep.dependsOnTaskId,
                                  )
                                }
                                className="ml-1 hover:text-red-600"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => setSelectedTaskForDep(task)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
                        title="Add Dependency Link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Dependency Modal */}
      {selectedTaskForDep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Add Dependency for {selectedTaskForDep.taskKey}
              </h2>
              <button
                onClick={() => setSelectedTaskForDep(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {depError && (
              <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
                {depError}
              </div>
            )}

            <form
              onSubmit={handleAddDependency}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Prerequisite Task (Must finish first)
                </label>
                <select
                  value={dependsOnTaskId}
                  onChange={(e) => setDependsOnTaskId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                  required
                >
                  <option value="">Select Prerequisite Task...</option>
                  {allTasks
                    .filter((t) => t.id !== selectedTaskForDep.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.taskKey}: {t.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForDep(null)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDep}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addingDep ? "Saving..." : "Add Dependency"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
