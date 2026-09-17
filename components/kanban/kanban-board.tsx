"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { Search, Filter, Plus } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { TaskModal } from "../tasks/task-modal";
import { TaskFormModal } from "../tasks/task-form-modal";

const COLUMNS = [
  { id: "TODO", title: "To Do", badgeColor: "bg-slate-400" },
  { id: "IN_PROGRESS", title: "In Progress", badgeColor: "bg-blue-500" },
  { id: "IN_REVIEW", title: "In Review", badgeColor: "bg-amber-500" },
  { id: "DONE", title: "Done", badgeColor: "bg-emerald-500" },
];

interface UserItem {
  id: string;
  name: string;
  email: string;
}

interface MilestoneItem {
  id: string;
  title: string;
}

interface TaskItemData {
  id: string;
  taskKey: string;
  title: string;
  status: string;
  priority: string;
  position?: number;
  assigneeId?: string | null;
  dueDate?: string | null;
  assignee?: UserItem | null;
  tags?: Array<{ tag: { id: string; name: string; color?: string } }>;
  _count?: { comments: number; attachments: number };
}

interface KanbanBoardProps {
  projectId?: string;
  users?: UserItem[];
  milestones?: MilestoneItem[];
}

export function KanbanBoard({
  projectId,
  users = [],
  milestones = [],
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskItemData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  // Modals state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeDragTask, setActiveDragTask] = useState<TaskItemData | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const fetchTasks = useCallback(async () => {
    try {
      const url = projectId
        ? `/api/tasks?projectId=${projectId}`
        : "/api/tasks";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  }, [projectId]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const url = projectId
          ? `/api/tasks?projectId=${projectId}`
          : "/api/tasks";
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const data = await res.json();
          setTasks(data.tasks);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchKey = task.taskKey.toLowerCase().includes(q);
      if (!matchTitle && !matchKey) return false;
    }
    if (selectedAssignee && task.assigneeId !== selectedAssignee) return false;
    if (selectedPriority && task.priority !== selectedPriority) return false;
    return true;
  });

  // Group tasks by column status
  const tasksByColumn: Record<string, TaskItemData[]> = {
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
  };

  filteredTasks.forEach((t) => {
    if (tasksByColumn[t.status]) {
      tasksByColumn[t.status].push(t);
    } else {
      tasksByColumn.TODO.push(t);
    }
  });

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveDragTask(task);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const isOverColumn = COLUMNS.some((c) => c.id === overId);
    const targetStatus = isOverColumn
      ? (overId as string)
      : tasks.find((t) => t.id === overId)?.status;

    if (targetStatus && activeTask.status !== targetStatus) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: targetStatus } : t,
        ),
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    try {
      await fetch(`/api/tasks/${activeId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: activeTask.status,
          position: activeTask.position || 1.0,
        }),
      });
    } catch (err) {
      console.error("Failed to reorder task:", err);
      fetchTasks();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[300px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              <option value="">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Add Task Button */}
        {projectId && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        )}
      </div>

      {/* Kanban Drag and Drop Context */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span className="text-xs text-zinc-500">
              Loading Kanban board...
            </span>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                badgeColor={col.badgeColor}
                tasks={tasksByColumn[col.id] || []}
                onTaskClick={(t) => setSelectedTaskId(t.id)}
                onAddTaskClick={
                  projectId ? () => setIsCreateOpen(true) : undefined
                }
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragTask ? (
              <div className="rotate-2 scale-105 shadow-xl">
                <KanbanCard task={activeDragTask} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task Details Drawer Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={fetchTasks}
          users={users}
          milestones={milestones}
        />
      )}

      {/* Create Task Modal */}
      {projectId && (
        <TaskFormModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={fetchTasks}
          projectId={projectId}
          users={users}
          milestones={milestones}
        />
      )}
    </div>
  );
}
