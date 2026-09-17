"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Clock, Bug, Folder, Zap, PieChart } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { CommandPalette } from "@/components/search/command-palette";

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

interface AnalyticsData {
  kpis: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    openBugs: number;
    resolvedBugs: number;
    totalLoggedHours: number;
    totalEstimatedHours: number;
    totalMilestones: number;
    completedMilestones: number;
    approvedClientUpdates: number;
  };
  sprintVelocity: Array<{
    id: string;
    name: string;
    status: string;
    projectCode: string;
    totalPoints: number;
    completedPoints: number;
    completionRate: number;
  }>;
  taskDistribution: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  bugAnalytics: {
    totalBugs: number;
    resolvedBugs: number;
    bySeverity: Record<string, number>;
    resolutionRate: number;
  };
}

interface ReportsClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
  projects: ProjectOption[];
}

export function ReportsClient({ currentUser, projects }: ReportsClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [activeReportTab, setActiveReportTab] = useState<
    "overview" | "velocity" | "time" | "bugs" | "tasks"
  >("overview");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const url =
          selectedProjectId === "ALL"
            ? "/api/reports/analytics"
            : `/api/reports/analytics?projectId=${selectedProjectId}`;
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

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
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Team Workload
            </Link>
            <Link
              href="/reports"
              className="text-indigo-600 dark:text-indigo-400 font-bold"
            >
              Reports & Analytics
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CommandPalette />
          <NotificationCenter />
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
                Reports & Executive Insights
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Multi-dimensional metrics across velocity, time tracking, defect
                severity, and deliverables.
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              <Folder className="h-4 w-4 text-indigo-500" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-semibold focus:outline-none dark:text-zinc-100"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Report Sub-navigation Tabs */}
          <div className="mb-6 flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800 overflow-x-auto">
            <button
              onClick={() => setActiveReportTab("overview")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeReportTab === "overview"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Executive Overview
            </button>
            <button
              onClick={() => setActiveReportTab("velocity")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeReportTab === "velocity"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <Zap className="h-4 w-4" />
              Sprint Velocity & Burndown
            </button>
            <button
              onClick={() => setActiveReportTab("time")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeReportTab === "time"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <Clock className="h-4 w-4" />
              Est vs Actual Hours
            </button>
            <button
              onClick={() => setActiveReportTab("bugs")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeReportTab === "bugs"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <Bug className="h-4 w-4" />
              Bug Severity & Resolution
            </button>
            <button
              onClick={() => setActiveReportTab("tasks")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeReportTab === "tasks"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <PieChart className="h-4 w-4" />
              Task Status Breakdown
            </button>
          </div>

          {loading || !data ? (
            <div className="py-24 text-center text-xs text-zinc-400">
              Calculating analytical metrics...
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* TAB 1: EXECUTIVE OVERVIEW */}
              {activeReportTab === "overview" && (
                <div className="flex flex-col gap-6">
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-xs font-semibold text-zinc-500">
                        Total Tasks Completion
                      </span>
                      <p className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {data.kpis.totalTasks > 0
                          ? `${Math.round((data.kpis.completedTasks / data.kpis.totalTasks) * 100)}%`
                          : "0%"}
                      </p>
                      <span className="mt-1 block text-[11px] text-zinc-400">
                        {data.kpis.completedTasks} of {data.kpis.totalTasks}{" "}
                        tasks finished
                      </span>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-xs font-semibold text-zinc-500">
                        Defect Resolution Rate
                      </span>
                      <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {data.bugAnalytics.resolutionRate}%
                      </p>
                      <span className="mt-1 block text-[11px] text-zinc-400">
                        {data.kpis.resolvedBugs} resolved, {data.kpis.openBugs}{" "}
                        open bugs
                      </span>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-xs font-semibold text-zinc-500">
                        Total Logged Hours
                      </span>
                      <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                        {data.kpis.totalLoggedHours.toFixed(1)}h
                      </p>
                      <span className="mt-1 block text-[11px] text-zinc-400">
                        Against {data.kpis.totalEstimatedHours}h estimated
                      </span>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-xs font-semibold text-zinc-500">
                        Client Signoff Rate
                      </span>
                      <p className="mt-2 text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                        {data.kpis.approvedClientUpdates} Updates
                      </p>
                      <span className="mt-1 block text-[11px] text-zinc-400">
                        Approved release progress reports
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SPRINT VELOCITY */}
              {activeReportTab === "velocity" && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    Sprint Velocity & Story Points Progress
                  </h3>
                  <div className="flex flex-col gap-4">
                    {data.sprintVelocity.length === 0 ? (
                      <p className="py-8 text-center text-xs text-zinc-400">
                        No sprint data available.
                      </p>
                    ) : (
                      data.sprintVelocity.map((s) => (
                        <div
                          key={s.id}
                          className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              [{s.projectCode}] {s.name} ({s.status})
                            </span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                              {s.completedPoints} / {s.totalPoints} pts (
                              {s.completionRate}%)
                            </span>
                          </div>
                          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-full bg-indigo-600 transition-all duration-300"
                              style={{ width: `${s.completionRate}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TIME TRACKING */}
              {activeReportTab === "time" && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    Estimated vs Actual Logged Hours
                  </h3>
                  <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <div>
                      <span className="text-xs text-zinc-500 font-medium">
                        Logged Hours vs Estimated
                      </span>
                      <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                        {data.kpis.totalLoggedHours.toFixed(1)}h /{" "}
                        {data.kpis.totalEstimatedHours}h
                      </p>
                    </div>
                    <div className="w-1/2">
                      <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              (data.kpis.totalLoggedHours /
                                (data.kpis.totalEstimatedHours || 1)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BUG ANALYTICS */}
              {activeReportTab === "bugs" && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    Bug Severity Distribution
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {Object.entries(data.bugAnalytics.bySeverity).map(
                      ([sev, count]) => (
                        <div
                          key={sev}
                          className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-950/60"
                        >
                          <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                            {sev}
                          </span>
                          <span className="mt-1 block text-2xl font-extrabold text-zinc-800 dark:text-zinc-200">
                            {count}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: TASK STATUS BREAKDOWN */}
              {activeReportTab === "tasks" && (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    Task Status & Column Distribution
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {Object.entries(data.taskDistribution.byStatus).map(
                      ([st, count]) => (
                        <div
                          key={st}
                          className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-950/60"
                        >
                          <span className="block text-[10px] font-bold text-zinc-400 uppercase">
                            {st}
                          </span>
                          <span className="mt-1 block text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                            {count}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
