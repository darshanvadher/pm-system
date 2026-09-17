"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  ChevronLeft,
  Trash2,
  UserPlus,
} from "lucide-react";
import { TaskModal } from "@/components/tasks/task-modal";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { LogoutButton } from "@/components/auth/logout-button";

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface MemberItem {
  userId: string;
  role: string;
  user: UserOption;
}

interface MilestoneItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: string;
}

interface TaskItem {
  id: string;
  taskKey: string;
  title: string;
  status: string;
  priority: string;
  assignee?: UserOption | null;
  reporter?: { id: string; name: string } | null;
}

interface ProjectDetail {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  client?: { id: string; name: string } | null;
  members?: MemberItem[];
  milestones?: MilestoneItem[];
  tasks?: TaskItem[];
}

interface ProjectOverviewClientProps {
  project: ProjectDetail;
  users: UserOption[];
}

export function ProjectOverviewClient({
  project: initialProject,
  users,
}: ProjectOverviewClientProps) {
  const [project, setProject] = useState<ProjectDetail>(initialProject);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  // New Milestone State
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);

  // New Member State
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [addingMember, setAddingMember] = useState(false);

  async function refreshProject() {
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    } catch (err) {
      console.error("Failed to refresh project details:", err);
    }
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    setAddingMilestone(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: milestoneTitle.trim(),
          dueDate: milestoneDueDate || undefined,
        }),
      });
      if (res.ok) {
        setMilestoneTitle("");
        setMilestoneDueDate("");
        setShowMilestoneForm(false);
        refreshProject();
      }
    } catch (err) {
      console.error("Failed to add milestone:", err);
    } finally {
      setAddingMilestone(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          role: memberRole,
        }),
      });
      if (res.ok) {
        setSelectedUserId("");
        setShowMemberForm(false);
        refreshProject();
      }
    } catch (err) {
      console.error("Failed to add member:", err);
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (
      !confirm("Are you sure you want to remove this member from the project?")
    )
      return;
    try {
      const res = await fetch(
        `/api/projects/${project.id}/members?userId=${userId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        refreshProject();
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  }

  const totalTasks = project.tasks?.length ?? 0;
  const doneTasks =
    project.tasks?.filter((t) => t.status === "DONE").length ?? 0;
  const inProgressTasks =
    project.tasks?.filter((t) => t.status === "IN_PROGRESS").length ?? 0;
  const progressPct =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Projects
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {project.code}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${project.id}/kanban`}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-700"
            >
              <FolderKanban className="h-4 w-4" />
              Kanban
            </Link>
            <Link
              href={`/projects/${project.id}/sprints`}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sprints
            </Link>
            <Link
              href={`/projects/${project.id}/gantt`}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Gantt
            </Link>
            <Link
              href={`/projects/${project.id}/bugs`}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-zinc-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              Bugs
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {/* Project Header Banner */}
        <div className="mb-8 rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-lg bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {project.code}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {project.status}
                </span>
                {project.client && (
                  <span className="text-xs font-semibold text-zinc-500">
                    Client:{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {project.client.name}
                    </strong>
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {project.name}
              </h1>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {project.description || "No project description available."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTaskFormOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-600 dark:text-zinc-400">
                Task Completion Progress
              </span>
              <span className="text-indigo-600 dark:text-indigo-400">
                {progressPct}% ({doneTasks} / {totalTasks} completed)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-indigo-600 transition-all duration-500 dark:bg-indigo-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Total Tasks
            </span>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalTasks}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              In Progress
            </span>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {inProgressTasks}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Completed
            </span>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {doneTasks}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Milestones
            </span>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {project.milestones?.length ?? 0}
            </p>
          </div>
        </div>

        {/* 2-Column Section: Milestones & Team Members */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Milestones Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Milestones
              </h3>
              <button
                onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Milestone
              </button>
            </div>

            {showMilestoneForm && (
              <form
                onSubmit={handleAddMilestone}
                className="mb-4 flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30"
              >
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="Milestone Title"
                  className="rounded-lg border border-zinc-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  className="rounded-lg border border-zinc-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMilestoneForm(false)}
                    className="rounded-lg px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingMilestone}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {addingMilestone ? "Saving..." : "Save Milestone"}
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-3">
              {project.milestones?.length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-400">
                  No milestones defined yet.
                </p>
              ) : (
                project.milestones?.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200">
                        {m.title}
                      </h4>
                      {m.dueDate && (
                        <span className="text-[10px] text-zinc-500">
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {m.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Team Members Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Project Members
              </h3>
              <button
                onClick={() => setShowMemberForm(!showMemberForm)}
                className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Member
              </button>
            </div>

            {showMemberForm && (
              <form
                onSubmit={handleAddMember}
                className="mb-4 flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30"
              >
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="rounded-lg border border-zinc-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                >
                  <option value="">Select User to Add...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="rounded-lg border border-zinc-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="MANAGER">MANAGER</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMemberForm(false)}
                    className="rounded-lg px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {addingMember ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-3">
              {project.members?.map((mem) => (
                <div
                  key={mem.userId}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200">
                      {mem.user?.name}
                    </h4>
                    <span className="text-[10px] text-zinc-500">
                      {mem.user?.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {mem.role}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(mem.userId)}
                      className="text-zinc-400 hover:text-red-500"
                      title="Remove Member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Table Preview */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Tasks List
            </h3>
            <button
              onClick={() => setIsTaskFormOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {project.tasks?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-zinc-400">
                      No tasks found for this project.
                    </td>
                  </tr>
                ) : (
                  project.tasks?.map((t) => (
                    <tr
                      key={t.id}
                      className="cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      onClick={() => setSelectedTaskId(t.id)}
                    >
                      <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                        {t.taskKey}
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                        {t.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                        {t.priority}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {t.assignee?.name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                        View Details
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Task Details Drawer */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={refreshProject}
          users={users}
          milestones={project.milestones}
        />
      )}

      {/* Create Task Modal */}
      {project.id && (
        <TaskFormModal
          isOpen={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          onSuccess={refreshProject}
          projectId={project.id}
          users={users}
          milestones={project.milestones}
        />
      )}
    </div>
  );
}
