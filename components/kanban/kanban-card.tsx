"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MessageSquare,
  Paperclip,
  Calendar,
  User as UserIcon,
} from "lucide-react";

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

interface KanbanCardProps {
  task: TaskCardData;
  onClick: (task: TaskCardData) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  URGENT: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="group relative flex cursor-grab flex-col gap-2.5 rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-indigo-400 hover:shadow-md active:cursor-grabbing dark:border-zinc-800/80 dark:bg-zinc-900 dark:hover:border-indigo-500"
    >
      {/* Top Header: Key and Priority */}
      <div className="flex items-center justify-between">
        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
          {task.taskKey}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM
          }`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="line-clamp-2 text-xs font-semibold text-zinc-800 transition group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((t) => (
            <span
              key={t.tag.id}
              className="rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
              style={{ backgroundColor: t.tag.color || "#6366f1" }}
            >
              {t.tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Assignee & Icons */}
      <div className="mt-1 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <UserIcon className="h-3 w-3 text-zinc-500" />
          </div>
          <span className="truncate max-w-[100px]">
            {task.assignee?.name || "Unassigned"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {(task._count?.comments ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{task._count?.comments}</span>
            </div>
          )}
          {(task._count?.attachments ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{task._count?.attachments}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
