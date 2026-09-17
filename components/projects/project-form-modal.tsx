"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients?: Array<{ id: string; name: string }>;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSuccess,
  clients = [],
}: ProjectFormModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [clientId, setClientId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          clientId: clientId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      setName("");
      setCode("");
      setDescription("");
      setStatus("PLANNING");
      setStartDate("");
      setEndDate("");
      setClientId("");
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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Create New Project
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
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code) {
                  setCode(
                    e.target.value
                      .replace(/[^a-zA-Z0-9]/g, "")
                      .slice(0, 6)
                      .toUpperCase(),
                  );
                }
              }}
              placeholder="e.g. Nexus Dashboard"
              required
              className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Short Code (Key) *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. NEXUS"
              maxLength={10}
              required
              className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm uppercase focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project goals and overview..."
              rows={2}
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
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Client (Optional)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">No Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
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
                className="w-full rounded-xl border border-zinc-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
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
              {submitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
