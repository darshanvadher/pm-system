"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  User as UserIcon,
  Folder,
  History,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";

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

interface ActivityItem {
  id: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  task: {
    id: string;
    taskKey: string;
    title: string;
    project: ProjectOption;
  };
  user: UserOption;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  task: {
    id: string;
    taskKey: string;
    title: string;
    project: ProjectOption;
  };
  author: UserOption;
}

interface ClientUpdateItem {
  id: string;
  title: string;
  summary?: string | null;
  status: string;
  createdAt: string;
  project: ProjectOption;
  author: UserOption;
}

interface AuditClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
  initialActivities: ActivityItem[];
  initialComments: CommentItem[];
  initialClientUpdates: ClientUpdateItem[];
  projects: ProjectOption[];
  users: UserOption[];
}

export function AuditClient({
  currentUser,
  initialActivities,
  initialComments,
  initialClientUpdates,
  projects,
  users,
}: AuditClientProps) {
  const [activities] = useState<ActivityItem[]>(initialActivities);
  const [comments] = useState<CommentItem[]>(initialComments);
  const [clientUpdates] = useState<ClientUpdateItem[]>(initialClientUpdates);

  const [activeTab, setActiveTab] = useState<
    "activity" | "comments" | "updates"
  >("activity");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredActivities = activities.filter((act) => {
    if (
      selectedProjectId !== "ALL" &&
      act.task.project.id !== selectedProjectId
    )
      return false;
    if (selectedUserId !== "ALL" && act.user.id !== selectedUserId)
      return false;
    if (selectedAction !== "ALL" && act.action !== selectedAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        act.task.taskKey.toLowerCase().includes(q) ||
        act.task.title.toLowerCase().includes(q) ||
        act.user.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredComments = comments.filter((c) => {
    if (selectedProjectId !== "ALL" && c.task.project.id !== selectedProjectId)
      return false;
    if (selectedUserId !== "ALL" && c.author.id !== selectedUserId)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.task.taskKey.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.author.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredClientUpdates = clientUpdates.filter((u) => {
    if (selectedProjectId !== "ALL" && u.project.id !== selectedProjectId)
      return false;
    if (selectedUserId !== "ALL" && u.author.id !== selectedUserId)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.title.toLowerCase().includes(q) ||
        u.author.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
              href="/files"
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Files
            </Link>
            <Link
              href="/audit"
              className="text-indigo-600 dark:text-indigo-400 font-bold"
            >
              Audit Trail
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
          <div className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Centralized Audit & System Activity Logs
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              System-wide audit trail across task state transitions,
              reassignments, comments, and client updates.
            </p>
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
                  <option value="ALL">All Users</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Filter */}
              {activeTab === "activity" && (
                <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                  <Filter className="h-3.5 w-3.5 text-zinc-400" />
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="bg-transparent font-medium focus:outline-none dark:text-zinc-100"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="STATUS_CHANGE">Status Changes</option>
                    <option value="ASSIGNEE_CHANGE">Reassignments</option>
                    <option value="PRIORITY_CHANGE">Priority Changes</option>
                    <option value="TIME_LOGGED">Time Logged</option>
                    <option value="CREATED">Created Tasks</option>
                  </select>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "activity"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Activity Trail ({filteredActivities.length})
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "comments"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Comments ({filteredComments.length})
              </button>
              <button
                onClick={() => setActiveTab("updates")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "updates"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Client Updates ({filteredClientUpdates.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* ACTIVITY TAB */}
            {activeTab === "activity" && (
              <div className="flex flex-col gap-3">
                {filteredActivities.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400">
                    No activity logs match search criteria.
                  </div>
                ) : (
                  filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <div className="mt-0.5 rounded-xl bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <History className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {act.user.name}
                            </span>{" "}
                            {act.action === "CREATED" && "created task "}
                            {act.action === "STATUS_CHANGE" && (
                              <>
                                updated status from{" "}
                                <span className="font-semibold text-amber-600">
                                  {act.oldValue}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-emerald-600">
                                  {act.newValue}
                                </span>{" "}
                                on{" "}
                              </>
                            )}
                            {act.action === "ASSIGNEE_CHANGE" && (
                              <>
                                reassigned task from{" "}
                                <span className="font-semibold">
                                  {act.oldValue}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold">
                                  {act.newValue}
                                </span>{" "}
                                on{" "}
                              </>
                            )}
                            {act.action === "TIME_LOGGED" && (
                              <>logged {act.newValue} on </>
                            )}
                            <span className="font-bold rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] dark:bg-zinc-800">
                              {act.task.taskKey}
                            </span>{" "}
                            ({act.task.title})
                          </p>

                          <span className="font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Project: {act.task.project.name} (
                          {act.task.project.code})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === "comments" && (
              <div className="flex flex-col gap-3">
                {filteredComments.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400">
                    No comments found matching criteria.
                  </div>
                ) : (
                  filteredComments.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {c.author.name}
                          </span>
                          <span className="text-zinc-400">commented on</span>
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {c.task.taskKey}
                          </span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {c.task.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* UPDATES TAB */}
            {activeTab === "updates" && (
              <div className="flex flex-col gap-3">
                {filteredClientUpdates.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400">
                    No client updates found.
                  </div>
                ) : (
                  filteredClientUpdates.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-indigo-100 px-2 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {u.project.code}
                          </span>
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                            {u.title}
                          </h4>
                        </div>
                        <p className="mt-1 text-zinc-500">
                          Published by {u.author.name} for {u.project.name}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 font-bold ${
                          u.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
