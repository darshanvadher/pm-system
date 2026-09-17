"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bug,
  Plus,
  Filter,
  Search,
  ChevronLeft,
  AlertTriangle,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { TaskModal } from "@/components/tasks/task-modal";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

interface BugItem {
  id: string;
  taskKey: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  severity?: string | null;
  projectId: string;
  project: ProjectOption;
  assignee?: UserOption | null;
  reporter?: UserOption | null;
  _count?: { comments: number; attachments: number };
}

interface BugsClientProps {
  initialBugs: BugItem[];
  projects: ProjectOption[];
  users: UserOption[];
  user: UserOption;
  scopedProject?: { id: string; name: string; code: string };
}

const SEVERITY_BADGES: Record<string, string> = {
  CRITICAL:
    "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function BugsClient({
  initialBugs,
  projects,
  users,
  user,
  scopedProject,
}: BugsClientProps) {
  const [bugs, setBugs] = useState<BugItem[]>(initialBugs);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    scopedProject?.id || "",
  );

  // Report Bug Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugSeverity, setBugSeverity] = useState("HIGH");
  const [bugPriority] = useState("HIGH");
  const [bugProjectId, setBugProjectId] = useState(
    scopedProject?.id || (projects[0]?.id ?? ""),
  );
  const [bugAssigneeId, setBugAssigneeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function refreshBugs() {
    try {
      const pId = scopedProject?.id || selectedProjectId;
      const url = pId ? `/api/bugs?projectId=${pId}` : "/api/bugs";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBugs(data.bugs);
      }
    } catch (err) {
      console.error("Failed to refresh bugs:", err);
    }
  }

  const filteredBugs = bugs.filter((b) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchKey = b.taskKey.toLowerCase().includes(q);
      if (!matchTitle && !matchKey) return false;
    }
    if (selectedSeverity && b.severity !== selectedSeverity) return false;
    if (selectedStatus && b.status !== selectedStatus) return false;
    if (selectedProjectId && b.projectId !== selectedProjectId) return false;
    return true;
  });

  async function handleReportBug(e: React.FormEvent) {
    e.preventDefault();
    if (!bugTitle.trim() || !bugProjectId) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bugTitle.trim(),
          description: bugDescription.trim(),
          severity: bugSeverity,
          priority: bugPriority,
          projectId: bugProjectId,
          assigneeId: bugAssigneeId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to report bug");
      }

      setBugTitle("");
      setBugDescription("");
      setIsReportModalOpen(false);
      refreshBugs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const criticalBugsCount = bugs.filter(
    (b) => b.severity === "CRITICAL",
  ).length;
  const openBugsCount = bugs.filter((b) => b.status !== "DONE").length;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={
                scopedProject ? `/projects/${scopedProject.id}` : "/dashboard"
              }
              className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
              {scopedProject ? scopedProject.name : "Dashboard"}
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Bug Tracker
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {user.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {/* Header Banner */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Bug className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {scopedProject
                  ? `${scopedProject.name} — Bug Tracker`
                  : "System Bug Tracker"}
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Track software defects, triage severity levels, and manage fix
              workflows.
            </p>
          </div>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            Report Bug
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Total Bugs
            </span>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-mono">
              {bugs.length}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Open Defects
            </span>
            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {openBugsCount}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Critical Severity
            </span>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {criticalBugsCount}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Resolved Bugs
            </span>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {bugs.length - openBugsCount}
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[300px]">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bugs..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2 text-xs focus:border-rose-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            {!scopedProject && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <Filter className="h-3.5 w-3.5" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              >
                <option value="">All Statuses</option>
                <option value="TODO">To Do / Open</option>
                <option value="IN_PROGRESS">In Triage / Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Resolved / Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bugs Table List */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3">Bug Key</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredBugs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No defects found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredBugs.map((b) => (
                  <tr
                    key={b.id}
                    className="cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    onClick={() => setSelectedTaskId(b.id)}
                  >
                    <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">
                      {b.taskKey}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
                          SEVERITY_BADGES[b.severity || "HIGH"]
                        }`}
                      >
                        {b.severity || "HIGH"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                      {b.title}
                    </td>
                    <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">
                      {b.project?.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {b.assignee?.name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-rose-600 hover:underline dark:text-rose-400">
                      Inspect Defect
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Task Drawer for Bug */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={refreshBugs}
          users={users}
        />
      )}

      {/* Report Bug Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Report Software Defect
                </h2>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleReportBug} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Bug Summary / Title *
                </label>
                <input
                  type="text"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  placeholder="e.g. Memory leak when rendering large Gantt charts"
                  required
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-rose-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Reproduction Steps & Description
                </label>
                <textarea
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  placeholder="1. Navigate to Gantt view&#10;2. Zoom timeline out&#10;3. Observe crash..."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:border-rose-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Severity Level
                  </label>
                  <select
                    value={bugSeverity}
                    onChange={(e) => setBugSeverity(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="CRITICAL">Critical (System Crash)</option>
                    <option value="HIGH">High (Major Feature Broken)</option>
                    <option value="MEDIUM">
                      Medium (Workaround Available)
                    </option>
                    <option value="LOW">Low (Cosmetic/Minor)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Project *
                  </label>
                  <select
                    value={bugProjectId}
                    onChange={(e) => setBugProjectId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Assignee
                </label>
                <select
                  value={bugAssigneeId}
                  onChange={(e) => setBugAssigneeId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Bug Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
