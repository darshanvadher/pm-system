"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

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
  estimatedHours?: number | null;
  project: ProjectOption;
}

interface MemberWorkload {
  id: string;
  name: string;
  email: string;
  roleName: string;
  totalAssignedTasks: number;
  activeTaskCount: number;
  totalEstimatedHours: number;
  totalLoggedHours: number;
  capacityStatus: "OPTIMAL" | "OVERLOADED" | "AVAILABLE";
  tasks: TaskItem[];
}

interface TeamClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
  projects: ProjectOption[];
  users: UserOption[];
  initialWorkloads: MemberWorkload[];
  unassignedTasks: TaskItem[];
}

export function TeamClient({
  currentUser,
  users,
  initialWorkloads,
  unassignedTasks,
}: TeamClientProps) {
  const [workloads, setWorkloads] =
    useState<MemberWorkload[]>(initialWorkloads);

  // Reassignment Modal State
  const [reassignTaskId, setReassignTaskId] = useState<string | null>(null);
  const [reassignTaskTitle, setReassignTaskTitle] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [isReassigning, setIsReassigning] = useState(false);

  async function handleReassignTask(e: React.FormEvent) {
    e.preventDefault();
    if (!reassignTaskId) return;

    setIsReassigning(true);
    try {
      const res = await fetch("/api/team/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: reassignTaskId,
          targetUserId: targetUserId || null,
        }),
      });

      if (res.ok) {
        // Refresh workload state
        const wRes = await fetch("/api/team/workload");
        if (wRes.ok) {
          const wData = await wRes.json();
          setWorkloads(wData.workloads);
        }
        setReassignTaskId(null);
        setTargetUserId("");
      }
    } catch (err) {
      console.error("Failed to reassign task:", err);
    } finally {
      setIsReassigning(false);
    }
  }

  const totalMembers = workloads.length;
  const overloadedMembers = workloads.filter(
    (w) => w.capacityStatus === "OVERLOADED",
  ).length;
  const availableMembers = workloads.filter(
    (w) => w.capacityStatus === "AVAILABLE",
  ).length;

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
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Time Tracking
            </Link>
            <Link
              href="/team"
              className="text-indigo-600 dark:text-indigo-400 font-bold"
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
          <div className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Team Capacity & Workload Management
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Monitor developer capacity, balance active workload distribution,
              and reassign tasks seamlessly.
            </p>
          </div>

          {/* Capacity Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">
                  Active Team Size
                </span>
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {totalMembers} Members
              </p>
              <span className="mt-1 block text-[11px] text-zinc-400">
                Engineers & Managers
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">
                  Overloaded Members
                </span>
                <div className="rounded-xl bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {overloadedMembers}
              </p>
              <span className="mt-1 block text-[11px] text-zinc-400">
                Requires workload rebalancing
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">
                  Available Capacity
                </span>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {availableMembers}
              </p>
              <span className="mt-1 block text-[11px] text-zinc-400">
                Ready for new task assignments
              </span>
            </div>
          </div>

          {/* Member Workload Cards Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {workloads.map((m) => (
              <div
                key={m.id}
                className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {m.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {m.email} •{" "}
                      <span className="font-semibold">{m.roleName}</span>
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      m.capacityStatus === "OVERLOADED"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : m.capacityStatus === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {m.capacityStatus}
                  </span>
                </div>

                {/* Capacity Stats */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 text-center dark:border-zinc-800/80 dark:bg-zinc-950/50">
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-400 uppercase">
                      Active Tasks
                    </span>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      {m.activeTaskCount}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-400 uppercase">
                      Est. Hours
                    </span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {m.totalEstimatedHours}h
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-400 uppercase">
                      Logged
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {m.totalLoggedHours.toFixed(1)}h
                    </span>
                  </div>
                </div>

                {/* Task List for Member */}
                <div className="mt-4 flex-1">
                  <h4 className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Assigned Tasks ({m.tasks.length})
                  </h4>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {m.tasks.length === 0 ? (
                      <p className="py-3 text-center text-xs text-zinc-400">
                        No tasks assigned.
                      </p>
                    ) : (
                      m.tasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/40"
                        >
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {t.taskKey}
                            </span>
                            <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                              {t.title}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setReassignTaskId(t.id);
                              setReassignTaskTitle(`${t.taskKey}: ${t.title}`);
                              setTargetUserId("");
                            }}
                            className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            Reassign
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Unassigned Backlog Section */}
          {unassignedTasks.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Unassigned Tasks ({unassignedTasks.length})
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Assign available developers to these backlog tasks.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unassignedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-dashed border-zinc-300 p-3 text-xs dark:border-zinc-700"
                  >
                    <div>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {t.taskKey}
                      </span>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">
                        {t.title}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setReassignTaskId(t.id);
                        setReassignTaskTitle(`${t.taskKey}: ${t.title}`);
                        setTargetUserId("");
                      }}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Reassign Modal */}
      {reassignTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Reassign Task
            </h3>
            <p className="mt-1 text-xs text-zinc-500 truncate">
              {reassignTaskTitle}
            </p>

            <form
              onSubmit={handleReassignTask}
              className="mt-4 flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Select Target Assignee
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="">-- Unassign Task --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassignTaskId(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {isReassigning ? "Saving..." : "Confirm Reassignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
