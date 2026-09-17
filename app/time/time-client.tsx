"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  User as UserIcon,
  Folder,
  Plus,
  BarChart3,
  Search,
  Filter,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

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

interface TimeLogItem {
  id: string;
  hours: number;
  date: string;
  description?: string | null;
  task: {
    id: string;
    taskKey: string;
    title: string;
    estimatedHours?: number | null;
    project: ProjectOption;
  };
  user: UserOption;
}

interface TaskOption {
  id: string;
  taskKey: string;
  title: string;
  estimatedHours?: number | null;
  projectId: string;
  timeLogs: Array<{ hours: number }>;
}

interface TimeClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
  projects: ProjectOption[];
  users: UserOption[];
  initialTimeLogs: TimeLogItem[];
  initialTasks: TaskOption[];
}

export function TimeClient({
  currentUser,
  projects,
  users,
  initialTimeLogs,
  initialTasks,
}: TimeClientProps) {
  const [timeLogs, setTimeLogs] = useState<TimeLogItem[]>(initialTimeLogs);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Log Time Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTaskId, setModalTaskId] = useState("");
  const [modalHours, setModalHours] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredLogs = timeLogs.filter((log) => {
    if (
      selectedProjectId !== "ALL" &&
      log.task.project.id !== selectedProjectId
    )
      return false;
    if (selectedUserId !== "ALL" && log.user.id !== selectedUserId)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = log.task.taskKey.toLowerCase().includes(q);
      const matchTitle = log.task.title.toLowerCase().includes(q);
      const matchDesc = log.description?.toLowerCase().includes(q);
      const matchUser = log.user.name.toLowerCase().includes(q);
      return matchKey || matchTitle || matchDesc || matchUser;
    }
    return true;
  });

  const totalLoggedHours = filteredLogs.reduce(
    (acc, log) => acc + log.hours,
    0,
  );

  const totalEstimatedHours = initialTasks
    .filter((t) =>
      selectedProjectId === "ALL" ? true : t.projectId === selectedProjectId,
    )
    .reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

  async function handleCreateTimeLog(e: React.FormEvent) {
    e.preventDefault();
    const hoursNum = parseFloat(modalHours);
    if (!modalTaskId || isNaN(hoursNum) || hoursNum <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${modalTaskId}/time-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: hoursNum,
          description: modalDescription.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTimeLogs([data.timeLog, ...timeLogs]);
        setIsModalOpen(false);
        setModalHours("");
        setModalDescription("");
      }
    } catch (err) {
      console.error("Failed to log time:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black dark:text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
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
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
              className="text-indigo-600 dark:text-indigo-400 font-bold"
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
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {currentUser.name} ({currentUser.role.name})
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Time Tracking & Log Summaries
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Track logged hours, monitor estimated vs actual time, and audit
                team productivity.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Log Hours Worked
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">
                  Total Logged Hours
                </span>
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {totalLoggedHours.toFixed(1)}h
              </p>
              <span className="mt-1 block text-[11px] text-zinc-400">
                Across {filteredLogs.length} work entries
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">
                  Total Estimated Hours
                </span>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {totalEstimatedHours.toFixed(1)}h
              </p>
              <span className="mt-1 block text-[11px] text-zinc-400">
                Sum of task estimates in filter
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">
                  Efficiency Ratio
                </span>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {totalEstimatedHours > 0
                  ? `${Math.round((totalLoggedHours / totalEstimatedHours) * 100)}%`
                  : "N/A"}
              </p>
              <span className="mt-1 block text-[11px] text-zinc-400">
                Actual vs Estimated Ratio
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                <Search className="h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search task or user..."
                  className="bg-transparent focus:outline-none dark:text-zinc-100"
                />
              </div>

              {/* Project Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                <Folder className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none dark:text-zinc-100"
                >
                  <option value="ALL">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* User Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none dark:text-zinc-100"
                >
                  <option value="ALL">All Team Members</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Showing {filteredLogs.length} entries</span>
            </div>
          </div>

          {/* Time Logs Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Task Key & Title</th>
                  <th className="px-6 py-3.5">Project</th>
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Hours Logged</th>
                  <th className="px-6 py-3.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-xs text-zinc-400"
                    >
                      No time logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-zinc-500">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <span className="mr-2 rounded bg-indigo-100 px-2 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {log.task.taskKey}
                        </span>
                        {log.task.title}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {log.task.project.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-200">
                        {log.user.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-mono font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {log.hours}h
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                        {log.description || "Logged work"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Log Time Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Log Hours Worked
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Select a task and record your completed work hours.
            </p>

            <form
              onSubmit={handleCreateTimeLog}
              className="mt-4 flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Select Task *
                </label>
                <select
                  value={modalTaskId}
                  onChange={(e) => setModalTaskId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                >
                  <option value="">-- Choose Task --</option>
                  {initialTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.taskKey}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Hours Worked *
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.1"
                  max="24"
                  value={modalHours}
                  onChange={(e) => setModalHours(e.target.value)}
                  placeholder="e.g. 4.5"
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Work Notes / Description
                </label>
                <input
                  type="text"
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Implemented dark mode tokens..."
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !modalTaskId || !modalHours}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Logging..." : "Submit Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
