"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  FolderKanban,
  CheckSquare,
  Bug,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { CommandPalette } from "@/components/search/command-palette";
import { useUrlState } from "@/lib/hooks/use-url-state";

interface SearchResults {
  projects: Array<{ id: string; name: string; code: string; status: string }>;
  tasks: Array<{
    id: string;
    taskKey: string;
    title: string;
    status: string;
    project: { code: string };
  }>;
  bugs: Array<{
    id: string;
    taskKey: string;
    title: string;
    severity?: string | null;
    project: { code: string };
  }>;
  sprints: Array<{
    id: string;
    name: string;
    status: string;
    project: { id: string; code: string };
  }>;
  files: Array<{
    id: string;
    name: string;
    category: string;
    project: { id: string; code: string };
  }>;
  clientUpdates: Array<{
    id: string;
    title: string;
    status: string;
    project: { id: string; code: string };
  }>;
}

interface SearchClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
}

export function SearchClient({ currentUser }: SearchClientProps) {
  const { getParam, setParam } = useUrlState({ q: "" });
  const urlQuery = getParam("q");

  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!urlQuery.trim()) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(urlQuery)}&limit=20`,
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [urlQuery]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam("q", query.trim());
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black dark:text-zinc-100">
      {/* Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-3.5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-md">
              PM
            </div>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              PM System
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/dashboard"
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Dashboard
            </Link>
            <Link
              href="/projects"
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Projects
            </Link>
            <Link
              href="/bugs"
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Bugs
            </Link>
            <Link
              href="/reports"
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Reports
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CommandPalette />
          <NotificationCenter />
          <span className="text-xs text-zinc-500">
            {currentUser.name} ({currentUser.role.name})
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          {/* Search Header Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mb-8 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <SearchIcon className="ml-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all projects, tasks, bugs, files, client updates..."
              className="flex-1 bg-transparent text-sm focus:outline-none dark:text-zinc-100 font-medium"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
            >
              Search
            </button>
          </form>

          {/* Search Results Display */}
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-400">
              Searching system workspace...
            </div>
          ) : !results ? (
            <div className="py-16 text-center text-xs text-zinc-400">
              Type a search keyword to view comprehensive workspace results with
              URL deep-link state.
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Projects ({results.projects.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {results.projects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex items-center gap-3">
                          <FolderKanban className="h-5 w-5 text-indigo-600" />
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {p.name}
                          </span>
                        </div>
                        <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {p.code}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Tasks ({results.tasks.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {results.tasks.map((t) => (
                      <Link
                        key={t.id}
                        href={`/projects/${t.project.code}/kanban`}
                        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 text-xs shadow-sm hover:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex items-center gap-3">
                          <CheckSquare className="h-4 w-4 text-emerald-500" />
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {t.taskKey}
                          </span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {t.title}
                          </span>
                        </div>
                        <span className="rounded bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {t.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Bugs */}
              {results.bugs.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Bug Tickets ({results.bugs.length})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {results.bugs.map((b) => (
                      <Link
                        key={b.id}
                        href="/bugs"
                        className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3.5 text-xs shadow-sm hover:border-rose-500 dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="flex items-center gap-3">
                          <Bug className="h-4 w-4 text-rose-500" />
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            {b.taskKey}
                          </span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {b.title}
                          </span>
                        </div>
                        {b.severity && (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            {b.severity}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
