"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";

interface ProjectData {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: string;
  client?: { name: string } | null;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    dueDate?: string | null;
  }>;
  _count: { tasks: number; milestones: number };
}

interface ClientUpdateItem {
  id: string;
  title: string;
  summary?: string | null;
  content: string;
  status: string;
  clientFeedback?: string | null;
  publishedAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  project: { id: string; name: string; code: string };
  author: { id: string; name: string; email: string };
}

interface PortalClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
  projects: ProjectData[];
  initialUpdates: ClientUpdateItem[];
}

export function PortalClient({
  currentUser,
  projects,
  initialUpdates,
}: PortalClientProps) {
  const [updates, setUpdates] = useState<ClientUpdateItem[]>(initialUpdates);
  const [activeProjectId, setActiveProjectId] = useState<string>("ALL");

  // Feedback Drawer State
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUpdates = updates.filter((u) =>
    activeProjectId === "ALL" ? true : u.project.id === activeProjectId,
  );

  async function handleFeedbackAction(action: "APPROVE" | "REJECT") {
    if (!selectedUpdateId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/client-updates/${selectedUpdateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          clientFeedback: feedbackText.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUpdates(
          updates.map((u) => (u.id === selectedUpdateId ? data.update : u)),
        );
        setSelectedUpdateId(null);
        setFeedbackText("");
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedUpdate = updates.find((u) => u.id === selectedUpdateId);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black dark:text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center gap-6">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 font-bold text-white shadow-md">
              CP
            </div>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Client Portal
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/portal"
              className="text-indigo-600 dark:text-indigo-400 font-bold"
            >
              Approved Updates
            </Link>
            {currentUser.role.name !== "CLIENT" && (
              <Link
                href="/dashboard"
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Internal Dashboard →
              </Link>
            )}
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
              Client Project Portal & Approved Release Updates
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Review published project milestones, track deliverables, and
              provide formal client approvals.
            </p>
          </div>

          {/* Client Projects Overview Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`cursor-pointer rounded-2xl border p-5 transition shadow-sm ${
                  activeProjectId === p.id
                    ? "border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {p.code}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {p.status}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {p.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                  {p.description || "No project description."}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
                  <span className="flex items-center gap-1 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                    {p.client?.name || "Client Project"}
                  </span>
                  <span>{p.milestones.length} Milestones</span>
                </div>
              </div>
            ))}
          </div>

          {/* Project Updates Stream Section */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Published Progress Reports & Deliverables
                </h2>
                <p className="text-xs text-zinc-500">
                  Select an update to review deliverables or provide approval
                  feedback.
                </p>
              </div>

              {/* Project Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Filter Project:</span>
                <select
                  value={activeProjectId}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                  className="rounded-xl border border-zinc-300 bg-zinc-50 p-2 text-xs font-semibold focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="ALL">All Client Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Updates Feed */}
            <div className="flex flex-col gap-4">
              {filteredUpdates.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  No published client updates found for this selection.
                </div>
              ) : (
                filteredUpdates.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {u.project.code}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {u.title}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          u.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : u.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>

                    {u.summary && (
                      <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {u.summary}
                      </p>
                    )}

                    <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 whitespace-pre-wrap">
                      {u.content}
                    </div>

                    {/* Client Feedback section */}
                    {u.clientFeedback && (
                      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs dark:border-indigo-900 dark:bg-indigo-950/40">
                        <span className="font-bold text-indigo-900 dark:text-indigo-300">
                          Client Feedback:
                        </span>
                        <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                          {u.clientFeedback}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-200/70 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
                      <span>
                        Published by {u.author.name} on{" "}
                        {new Date(
                          u.publishedAt || u.createdAt,
                        ).toLocaleDateString()}
                      </span>

                      {u.status === "PUBLISHED" && (
                        <button
                          onClick={() => {
                            setSelectedUpdateId(u.id);
                            setFeedbackText("");
                          }}
                          className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                        >
                          Review & Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Review & Approval Modal */}
      {selectedUpdateId && selectedUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Review Client Deliverable Update
            </h3>
            <p className="mt-1 text-xs text-zinc-500 font-semibold">
              [{selectedUpdate.project.code}] {selectedUpdate.title}
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Client Comments / Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide feedback or signoff notes..."
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedUpdateId(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFeedbackAction("REJECT")}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Request Changes
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFeedbackAction("APPROVE")}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
