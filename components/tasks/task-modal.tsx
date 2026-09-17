"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Tag as TagIcon,
  MessageSquare,
  Paperclip,
  Activity,
  Plus,
  Clock,
  Trash2,
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email?: string;
}

interface MilestoneOption {
  id: string;
  title: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: UserInfo;
}

interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  createdAt: string;
  uploader: UserInfo;
}

interface ActivityItem {
  id: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user: UserInfo;
}

interface TimeLogItem {
  id: string;
  hours: number;
  date: string;
  description?: string | null;
  createdAt: string;
  user: UserInfo;
}

interface TaskDetail {
  id: string;
  taskKey: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  estimatedHours?: number | null;
  assigneeId?: string | null;
  milestoneId?: string | null;
  project?: { name: string };
  assignee?: UserInfo | null;
  reporter?: UserInfo | null;
  tags?: Array<{ tag: { id: string; name: string; color?: string } }>;
  comments?: CommentItem[];
  attachments?: AttachmentItem[];
  activities?: ActivityItem[];
  timeLogs?: TimeLogItem[];
}

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated?: () => void;
  users?: UserInfo[];
  milestones?: MilestoneOption[];
}

export function TaskModal({
  taskId,
  onClose,
  onTaskUpdated,
  users = [],
  milestones = [],
}: TaskModalProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "comments" | "attachments" | "activity" | "time"
  >("comments");

  // Form states
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType] = useState("document");
  const [fileSize] = useState("102400");
  const [attaching, setAttaching] = useState(false);

  // Time Log states
  const [logHours, setLogHours] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [loggingTime, setLoggingTime] = useState(false);

  const [updatingField, setUpdatingField] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      }
    } catch (err) {
      console.error("Failed to fetch task:", err);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setTask(data.task);
        }
      } catch (err) {
        console.error("Failed to fetch task:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [taskId]);

  async function updateTaskField(updates: Partial<TaskDetail>) {
    if (!taskId) return;
    setUpdatingField(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Failed to update task field:", err);
    } finally {
      setUpdatingField(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!taskId || !newComment.trim()) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment("");
        fetchTask();
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setCommenting(false);
    }
  }

  async function handleAddAttachment(e: React.FormEvent) {
    e.preventDefault();
    if (!taskId || !fileName.trim()) return;
    setAttaching(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileName.trim(),
          fileSize: parseInt(fileSize) || 102400,
          fileType: fileType || "document",
          fileUrl:
            fileUrl.trim() || `https://example.com/files/${fileName.trim()}`,
        }),
      });
      if (res.ok) {
        setFileName("");
        setFileUrl("");
        fetchTask();
      }
    } catch (err) {
      console.error("Failed to add attachment:", err);
    } finally {
      setAttaching(false);
    }
  }

  async function handleLogTime(e: React.FormEvent) {
    e.preventDefault();
    const hoursNum = parseFloat(logHours);
    if (!taskId || isNaN(hoursNum) || hoursNum <= 0) return;
    setLoggingTime(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/time-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: hoursNum,
          description: logDescription.trim(),
        }),
      });
      if (res.ok) {
        setLogHours("");
        setLogDescription("");
        fetchTask();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Failed to log time:", err);
    } finally {
      setLoggingTime(false);
    }
  }

  async function handleDeleteTimeLog(logId: string) {
    try {
      const res = await fetch(`/api/time-logs/${logId}`, { method: "DELETE" });
      if (res.ok) {
        fetchTask();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Failed to delete time log:", err);
    }
  }

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-zinc-900 dark:text-zinc-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          {loading ? (
            <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="rounded bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                {task?.taskKey}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                in {task?.project?.name}
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading || !task ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-zinc-500">Loading task details...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="p-6">
              {/* Task Title */}
              <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {task.title}
              </h2>

              {/* Status and Priority Controls */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Status
                  </label>
                  <select
                    value={task.status}
                    disabled={updatingField}
                    onChange={(e) =>
                      updateTaskField({ status: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Priority
                  </label>
                  <select
                    value={task.priority}
                    disabled={updatingField}
                    onChange={(e) =>
                      updateTaskField({ priority: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Assignee
                  </label>
                  <select
                    value={task.assigneeId ?? ""}
                    disabled={updatingField}
                    onChange={(e) =>
                      updateTaskField({ assigneeId: e.target.value || null })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
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
                  <label className="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Milestone
                  </label>
                  <select
                    value={task.milestoneId ?? ""}
                    disabled={updatingField}
                    onChange={(e) =>
                      updateTaskField({ milestoneId: e.target.value || null })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">No Milestone</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={task.estimatedHours ?? ""}
                    onChange={(e) => {
                      const val =
                        e.target.value === ""
                          ? null
                          : parseFloat(e.target.value);
                      updateTaskField({ estimatedHours: val });
                    }}
                    placeholder="e.g. 8"
                    disabled={updatingField}
                    className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-800/80"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Description
                </h3>
                <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {task.description || "No description provided."}
                </p>
              </div>

              {/* Tags list */}
              {task.tags && task.tags.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <TagIcon className="h-4 w-4 text-zinc-400" />
                  {task.tags.map((t) => (
                    <span
                      key={t.tag.id}
                      className="rounded-full px-3 py-0.5 text-xs font-medium text-white shadow-sm"
                      style={{ backgroundColor: t.tag.color || "#6366f1" }}
                    >
                      {t.tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Tabs Navigation */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition ${
                    activeTab === "comments"
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Comments ({task.comments?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab("time")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition ${
                    activeTab === "time"
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Time Logs ({task.timeLogs?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab("attachments")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition ${
                    activeTab === "attachments"
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Paperclip className="h-4 w-4" />
                  Attachments ({task.attachments?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold transition ${
                    activeTab === "activity"
                      ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Activity Log ({task.activities?.length ?? 0})
                </button>
              </div>

              {/* Tab Content */}
              <div className="py-4">
                {/* COMMENTS TAB */}
                {activeTab === "comments" && (
                  <div className="flex flex-col gap-4">
                    <form
                      onSubmit={handleAddComment}
                      className="flex flex-col gap-2"
                    >
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={2}
                        className="w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={commenting || !newComment.trim()}
                          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {commenting ? "Posting..." : "Post Comment"}
                        </button>
                      </div>
                    </form>

                    <div className="flex flex-col gap-3">
                      {task.comments?.length === 0 ? (
                        <p className="text-center text-xs text-zinc-400 py-4">
                          No comments yet.
                        </p>
                      ) : (
                        task.comments?.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/60"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {c.author?.name}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300">
                              {c.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TIME LOGS TAB */}
                {activeTab === "time" && (
                  <div className="flex flex-col gap-4">
                    {/* Log Progress Card */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Time Progress
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {(
                            task.timeLogs?.reduce(
                              (acc, l) => acc + l.hours,
                              0,
                            ) || 0
                          ).toFixed(1)}
                          h / {task.estimatedHours || 0}h est.
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              ((task.timeLogs?.reduce(
                                (acc, l) => acc + l.hours,
                                0,
                              ) || 0) /
                                (task.estimatedHours || 1)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Log Hours Form */}
                    <form
                      onSubmit={handleLogTime}
                      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Log Hours Worked
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          step="0.25"
                          min="0.1"
                          max="24"
                          value={logHours}
                          onChange={(e) => setLogHours(e.target.value)}
                          placeholder="Hours (e.g. 2.5)"
                          className="rounded-lg border border-zinc-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                          required
                        />
                        <input
                          type="text"
                          value={logDescription}
                          onChange={(e) => setLogDescription(e.target.value)}
                          placeholder="Work description / notes"
                          className="col-span-2 rounded-lg border border-zinc-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={loggingTime || !logHours}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {loggingTime ? "Logging..." : "Log Time"}
                        </button>
                      </div>
                    </form>

                    {/* Time Logs History List */}
                    <div className="flex flex-col gap-2">
                      {task.timeLogs?.length === 0 ? (
                        <p className="text-center text-xs text-zinc-400 py-4">
                          No time logged on this task yet.
                        </p>
                      ) : (
                        task.timeLogs?.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/60"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                                <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {log.hours}h
                                </span>
                                <span>{log.description || "Logged work"}</span>
                              </div>
                              <span className="text-[10px] text-zinc-400">
                                Logged by {log.user?.name} on{" "}
                                {new Date(log.date).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteTimeLog(log.id)}
                              className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60"
                              title="Delete log entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ATTACHMENTS TAB */}
                {activeTab === "attachments" && (
                  <div className="flex flex-col gap-4">
                    <form
                      onSubmit={handleAddAttachment}
                      className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="File Name (e.g., Specs.pdf)"
                          className="rounded-lg border border-zinc-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                          required
                        />
                        <input
                          type="text"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder="File URL / Link"
                          className="rounded-lg border border-zinc-300 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={attaching || !fileName.trim()}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {attaching ? "Adding..." : "Add Attachment Metadata"}
                        </button>
                      </div>
                    </form>

                    <div className="flex flex-col gap-2">
                      {task.attachments?.length === 0 ? (
                        <p className="text-center text-xs text-zinc-400 py-4">
                          No attachments uploaded.
                        </p>
                      ) : (
                        task.attachments?.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-800/60"
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-indigo-500" />
                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                {att.fileName}
                              </a>
                            </div>
                            <span className="text-[10px] text-zinc-400">
                              Uploaded by {att.uploader?.name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ACTIVITY LOG TAB */}
                {activeTab === "activity" && (
                  <div className="flex flex-col gap-3">
                    {task.activities?.length === 0 ? (
                      <p className="text-center text-xs text-zinc-400 py-4">
                        No activity recorded.
                      </p>
                    ) : (
                      task.activities?.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-start gap-3 text-xs"
                        >
                          <div className="mt-0.5 rounded-full bg-indigo-50 p-1 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                            <Activity className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-zinc-800 dark:text-zinc-200">
                              <span className="font-bold">
                                {act.user?.name}
                              </span>{" "}
                              {act.action === "CREATED" && "created this task"}
                              {act.action === "STATUS_CHANGE" && (
                                <>
                                  changed status from{" "}
                                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                                    {act.oldValue}
                                  </span>{" "}
                                  to{" "}
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {act.newValue}
                                  </span>
                                </>
                              )}
                              {act.action === "PRIORITY_CHANGE" && (
                                <>
                                  changed priority from{" "}
                                  <span className="font-semibold">
                                    {act.oldValue}
                                  </span>{" "}
                                  to{" "}
                                  <span className="font-semibold">
                                    {act.newValue}
                                  </span>
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
                                  </span>
                                </>
                              )}
                              {act.action === "COMMENT_ADDED" &&
                                "added a comment"}
                              {act.action === "ATTACHMENT_ADDED" &&
                                `attached file "${act.newValue}"`}
                              {act.action === "UPDATED" &&
                                `updated ${act.field}`}
                            </p>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
