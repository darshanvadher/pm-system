"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Zap,
  Target,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { TaskModal } from "@/components/tasks/task-modal";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface TaskItem {
  id: string;
  taskKey: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  storyPoints?: number | null;
  sprintId?: string | null;
  assignee?: UserOption | null;
}

interface SprintItem {
  id: string;
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  tasks: TaskItem[];
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  sprints: SprintItem[];
  tasks: TaskItem[]; // Backlog tasks
}

interface SprintsClientProps {
  project: ProjectData;
  users: UserOption[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
}

export function SprintsClient({
  project: initialProject,
  users,
}: SprintsClientProps) {
  const [project, setProject] = useState<ProjectData>(initialProject);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // New Sprint Modal State
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);

  async function refreshData() {
    try {
      const res = await fetch(`/api/projects/${project.id}/sprints`);
      if (res.ok) {
        const data = await res.json();
        setProject((prev) => ({
          ...prev,
          sprints: data.sprints,
          tasks: data.backlogTasks,
        }));
      }
    } catch (err) {
      console.error("Failed to refresh sprints data:", err);
    }
  }

  async function handleCreateSprint(e: React.FormEvent) {
    e.preventDefault();
    if (!sprintName.trim()) return;
    setCreatingSprint(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sprintName.trim(),
          goal: sprintGoal.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      if (res.ok) {
        setSprintName("");
        setSprintGoal("");
        setStartDate("");
        setEndDate("");
        setIsSprintModalOpen(false);
        refreshData();
      }
    } catch (err) {
      console.error("Failed to create sprint:", err);
    } finally {
      setCreatingSprint(false);
    }
  }

  async function updateSprintStatus(sprintId: string, status: string) {
    try {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error("Failed to update sprint status:", err);
    }
  }

  async function moveTaskToSprint(
    taskId: string,
    sprintId: string | null,
    points?: number | null,
  ) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/sprint`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintId,
          storyPoints: points !== undefined ? points : undefined,
        }),
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error("Failed to move task to sprint:", err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Navbar */}
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
              Sprints & Backlog
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${project.id}/gantt`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Gantt Timeline
            </Link>
            <Link
              href={`/projects/${project.id}/bugs`}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-zinc-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              Bugs & Issues
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Sprints & Backlog Planning
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Plan sprint iterations, assign story points, and manage product
              backlog priorities.
            </p>
          </div>

          <button
            onClick={() => setIsSprintModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            Create Sprint
          </button>
        </div>

        {/* Sprints Section */}
        <div className="mb-10 flex flex-col gap-6">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Sprint Iterations ({project.sprints.length})
          </h2>

          {project.sprints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
              No sprints created yet. Click &quot;Create Sprint&quot; to begin
              your first iteration.
            </div>
          ) : (
            project.sprints.map((sprint) => {
              const totalPoints = sprint.tasks.reduce(
                (sum, t) => sum + (t.storyPoints ?? 0),
                0,
              );
              const completedPoints = sprint.tasks
                .filter((t) => t.status === "DONE")
                .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
              const progressPct =
                totalPoints > 0
                  ? Math.round((completedPoints / totalPoints) * 100)
                  : 0;

              return (
                <div
                  key={sprint.id}
                  className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950"
                >
                  <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="mb-1.5 flex items-center gap-3">
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {sprint.name}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            sprint.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : sprint.status === "COMPLETED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {sprint.status}
                        </span>
                        {sprint.startDate && sprint.endDate && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(
                              sprint.startDate,
                            ).toLocaleDateString()} -{" "}
                            {new Date(sprint.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {sprint.goal && (
                        <p className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                          <Target className="h-3.5 w-3.5 text-indigo-500" />
                          Sprint Goal: {sprint.goal}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        {completedPoints} / {totalPoints} pts ({progressPct}%)
                      </div>

                      {sprint.status === "PLANNED" && (
                        <button
                          onClick={() =>
                            updateSprintStatus(sprint.id, "ACTIVE")
                          }
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Start Sprint
                        </button>
                      )}

                      {sprint.status === "ACTIVE" && (
                        <button
                          onClick={() =>
                            updateSprintStatus(sprint.id, "COMPLETED")
                          }
                          className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete Sprint
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tasks in Sprint List */}
                  <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    {sprint.tasks.length === 0 ? (
                      <p className="py-4 text-center text-xs text-zinc-400">
                        No tasks assigned to this sprint. Move items from the
                        Backlog below.
                      </p>
                    ) : (
                      sprint.tasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-xs hover:border-indigo-300 dark:border-zinc-900 dark:bg-zinc-900/50 dark:hover:border-indigo-800"
                        >
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setSelectedTaskId(t.id)}
                          >
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {t.taskKey}
                            </span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {t.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {t.storyPoints ?? 0} pts
                            </span>
                            <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {t.status}
                            </span>
                            <button
                              onClick={() => moveTaskToSprint(t.id, null)}
                              className="text-[10px] text-zinc-500 hover:text-zinc-800 hover:underline"
                            >
                              Move to Backlog
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Product Backlog Section */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Product Backlog ({project.tasks.length} items)
              </h2>
              <p className="text-xs text-zinc-500">
                Unassigned tasks ready for sprint planning
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {project.tasks.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-400">
                Backlog is currently empty.
              </p>
            ) : (
              project.tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-xs hover:border-indigo-300 dark:border-zinc-900 dark:bg-zinc-900/50 dark:hover:border-indigo-800"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setSelectedTaskId(t.id)}
                  >
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {t.taskKey}
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Story points selector */}
                    <select
                      value={t.storyPoints ?? 0}
                      onChange={(e) =>
                        moveTaskToSprint(
                          t.id,
                          t.sprintId ?? null,
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="rounded-lg border border-zinc-300 p-1 text-[11px] dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <option value="0">0 pts</option>
                      <option value="1">1 pt</option>
                      <option value="2">2 pts</option>
                      <option value="3">3 pts</option>
                      <option value="5">5 pts</option>
                      <option value="8">8 pts</option>
                      <option value="13">13 pts</option>
                    </select>

                    {/* Move to Sprint Selector */}
                    {project.sprints.length > 0 && (
                      <select
                        onChange={(e) =>
                          moveTaskToSprint(t.id, e.target.value || null)
                        }
                        defaultValue=""
                        className="rounded-lg border border-zinc-300 p-1 text-[11px] font-semibold text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-indigo-400"
                      >
                        <option value="" disabled>
                          Move to Sprint...
                        </option>
                        {project.sprints.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Task Drawer */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={refreshData}
          users={users}
        />
      )}

      {/* Create Sprint Modal */}
      {isSprintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Create Sprint
              </h2>
              <button
                onClick={() => setIsSprintModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Sprint Name *
                </label>
                <input
                  type="text"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  placeholder="e.g. Sprint 1 — Core Infrastructure"
                  required
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Sprint Goal
                </label>
                <input
                  type="text"
                  value={sprintGoal}
                  onChange={(e) => setSprintGoal(e.target.value)}
                  placeholder="e.g. Finish user authentication and dashboard MVP"
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSprintModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSprint}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingSprint ? "Creating..." : "Save Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
