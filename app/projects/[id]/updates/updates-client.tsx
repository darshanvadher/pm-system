"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Sparkles, Send, Trash2 } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";

interface AuthorInfo {
  id: string;
  name: string;
  email: string;
}

interface ClientUpdateItem {
  id: string;
  title: string;
  summary?: string | null;
  content: string;
  status: string;
  clientFeedback?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  author: AuthorInfo;
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  clientUpdates: ClientUpdateItem[];
}

interface ProjectUpdatesClientProps {
  project: ProjectData;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
}

export function ProjectUpdatesClient({
  project,
  currentUser,
}: ProjectUpdatesClientProps) {
  const [updates, setUpdates] = useState<ClientUpdateItem[]>(
    project.clientUpdates,
  );

  // New Update Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/client-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title: title.trim(),
          summary: summary.trim(),
          content: content.trim(),
          status,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUpdates([data.update, ...updates]);
        setIsModalOpen(false);
        setTitle("");
        setSummary("");
        setContent("");
      }
    } catch (err) {
      console.error("Failed to create update:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublishUpdate(id: string) {
    try {
      const res = await fetch(`/api/client-updates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      if (res.ok) {
        const data = await res.json();
        setUpdates(updates.map((u) => (u.id === id ? data.update : u)));
      }
    } catch (err) {
      console.error("Failed to publish update:", err);
    }
  }

  async function handleDeleteUpdate(id: string) {
    try {
      const res = await fetch(`/api/client-updates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUpdates(updates.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete update:", err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black dark:text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Projects
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {project.name} ({project.code})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <NotificationCenter />
          <span className="text-xs text-zinc-500">
            {currentUser.name} ({currentUser.role.name})
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Project Header Navigation */}
      <div className="border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
        <nav className="flex gap-6 text-xs font-semibold">
          <Link
            href={`/projects/${project.id}`}
            className="py-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Overview
          </Link>
          <Link
            href={`/projects/${project.id}/kanban`}
            className="py-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Kanban Board
          </Link>
          <Link
            href={`/projects/${project.id}/sprints`}
            className="py-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Sprints
          </Link>
          <Link
            href={`/projects/${project.id}/gantt`}
            className="py-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Gantt Timeline
          </Link>
          <Link
            href={`/projects/${project.id}/bugs`}
            className="py-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Bugs
          </Link>
          <Link
            href={`/projects/${project.id}/files`}
            className="py-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Files & Documents
          </Link>
          <Link
            href={`/projects/${project.id}/updates`}
            className="border-b-2 border-indigo-600 py-3 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold"
          >
            Client Updates
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Client Release Updates Manager
              </h1>
              <p className="text-xs text-zinc-500">
                Create progress updates, publish client notifications, and track
                client signoff feedback.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Client Update
            </button>
          </div>

          {/* List of Updates */}
          <div className="flex flex-col gap-4">
            {updates.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                No client updates published yet. Click &quot;Create Client
                Update&quot; to post a report.
              </div>
            ) : (
              updates.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {u.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          u.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : u.status === "PUBLISHED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : u.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {u.status}
                      </span>
                      <button
                        onClick={() => handleDeleteUpdate(u.id)}
                        className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60"
                        title="Delete Update"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {u.summary && (
                    <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {u.summary}
                    </p>
                  )}

                  <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200 whitespace-pre-wrap">
                    {u.content}
                  </div>

                  {u.clientFeedback && (
                    <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs dark:border-indigo-900 dark:bg-indigo-950/40">
                      <span className="font-bold text-indigo-900 dark:text-indigo-300">
                        Client Signoff Feedback:
                      </span>
                      <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                        {u.clientFeedback}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
                    <span>
                      Created by {u.author.name} on{" "}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>

                    {u.status === "DRAFT" && (
                      <button
                        onClick={() => handlePublishUpdate(u.id)}
                        className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Publish to Client
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* New Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Create Client Progress Update
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Draft or publish a release update for the client portal.
            </p>

            <form
              onSubmit={handleCreateUpdate}
              className="mt-4 flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Update Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Milestone V1 Beta Release & Integration"
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Summary Headline
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief 1-line overview of deliverables"
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Update Content & Release Notes *
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detail completed milestones, features shipped, and next steps..."
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Publish Status *
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "DRAFT" | "PUBLISHED")
                  }
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="PUBLISHED">
                    Publish Immediately & Notify Client
                  </option>
                  <option value="DRAFT">Save as Internal Draft</option>
                </select>
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
                  disabled={isSubmitting || !title || !content}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
