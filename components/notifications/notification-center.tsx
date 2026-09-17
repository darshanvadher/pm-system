"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Check,
  CheckCircle2,
  MessageSquare,
  UserCheck,
  Sparkles,
  Layers,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok && isMounted) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (res.ok) {
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 flex h-96 w-80 sm:w-96 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-3 p-3.5 text-xs transition ${
                    n.isRead
                      ? "bg-white opacity-75 dark:bg-zinc-900"
                      : "bg-indigo-50/40 dark:bg-indigo-950/20 font-medium"
                  }`}
                >
                  <div className="flex items-start gap-2.5 max-w-[85%]">
                    <div className="mt-0.5 rounded-lg bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      {n.type === "TASK_ASSIGNED" && (
                        <UserCheck className="h-4 w-4" />
                      )}
                      {n.type === "STATUS_CHANGED" && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {n.type === "COMMENT_ADDED" && (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      {n.type === "CLIENT_UPDATE" && (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {n.type === "SYSTEM" && <Layers className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                        {n.title}
                      </h4>
                      <p className="mt-0.5 text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {n.message}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[10px] text-zinc-400">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => setIsOpen(false)}
                            className="text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
