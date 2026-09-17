"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  users?: Array<{ id: string; name: string }>;
  milestones?: Array<{ id: string; title: string }>;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  users = [],
  milestones = [],
}: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError("");

    const tagNames = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          projectId,
          assigneeId: assigneeId || undefined,
          milestoneId: milestoneId || undefined,
          dueDate: dueDate || undefined,
          tagNames,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setAssigneeId("");
      setMilestoneId("");
      setDueDate("");
      setTagsInput("");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth Login Endpoint"
              required
              className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details and requirements..."
              rows={3}
              className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Milestone
              </label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">None</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Frontend, API"
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
