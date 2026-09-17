"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { KanbanCard } from "./kanban-card";

interface TaskCardData {
  id: string;
  taskKey: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  assignee?: { id: string; name: string } | null;
  tags?: Array<{ tag: { id: string; name: string; color?: string } }>;
  _count?: { comments: number; attachments: number };
}

interface KanbanColumnProps {
  id: string;
  title: string;
  badgeColor: string;
  tasks: TaskCardData[];
  onTaskClick: (task: TaskCardData) => void;
  onAddTaskClick?: () => void;
}

export function KanbanColumn({
  id,
  title,
  badgeColor,
  tasks,
  onTaskClick,
  onAddTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-1 min-w-[280px] max-w-[340px] flex-col rounded-2xl bg-zinc-100/70 p-4 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-800/60">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${badgeColor}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            {title}
          </h3>
          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {tasks.length}
          </span>
        </div>
        {onAddTaskClick && (
          <button
            onClick={onAddTaskClick}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Add Task"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Task Drop Zone & Cards List */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-3 min-h-[350px]"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
            No tasks in {title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}
