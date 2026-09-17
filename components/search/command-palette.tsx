"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderKanban,
  CheckSquare,
  Bug,
  Zap,
  FileText,
  Command,
  X,
} from "lucide-react";

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

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const executeSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  function handleSelectResult(url: string) {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  }

  const hasResults =
    results &&
    (results.projects.length > 0 ||
      results.tasks.length > 0 ||
      results.bugs.length > 0 ||
      results.sprints.length > 0 ||
      results.files.length > 0 ||
      results.clientUpdates.length > 0);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-1.5 text-xs text-zinc-500 shadow-sm hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:border-zinc-700"
      >
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <span className="hidden sm:inline font-medium">Quick Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-300 bg-white px-1.5 font-mono text-[10px] font-bold text-zinc-600 shadow-2xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-20">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, tasks, bugs, files, client updates..."
                className="ml-3 flex-1 bg-transparent text-sm focus:outline-none dark:text-zinc-100"
                autoFocus
              />
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Results Container */}
            <div className="max-h-96 overflow-y-auto p-3">
              {!query.trim() && (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Type to search across all projects, tasks, bugs, and files...
                </div>
              )}

              {query.trim() && !loading && !hasResults && (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No matching items found for &quot;{query}&quot;.
                </div>
              )}

              {hasResults && (
                <div className="flex flex-col gap-4">
                  {/* Projects */}
                  {results.projects.length > 0 && (
                    <div>
                      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Projects
                      </span>
                      <div className="mt-1 flex flex-col gap-1">
                        {results.projects.map((p) => (
                          <div
                            key={p.id}
                            onClick={() =>
                              handleSelectResult(`/projects/${p.id}`)
                            }
                            className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          >
                            <div className="flex items-center gap-2">
                              <FolderKanban className="h-4 w-4 text-indigo-500" />
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {p.name}
                              </span>
                            </div>
                            <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {p.code}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {results.tasks.length > 0 && (
                    <div>
                      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Tasks
                      </span>
                      <div className="mt-1 flex flex-col gap-1">
                        {results.tasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() =>
                              handleSelectResult(
                                `/projects/${t.project.code}/kanban`,
                              )
                            }
                            className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          >
                            <div className="flex items-center gap-2">
                              <CheckSquare className="h-4 w-4 text-emerald-500" />
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {t.taskKey}
                              </span>
                              <span className="truncate font-medium text-zinc-800 dark:text-zinc-200 max-w-xs">
                                {t.title}
                              </span>
                            </div>
                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bugs */}
                  {results.bugs.length > 0 && (
                    <div>
                      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Bug Tickets
                      </span>
                      <div className="mt-1 flex flex-col gap-1">
                        {results.bugs.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => handleSelectResult("/bugs")}
                            className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <div className="flex items-center gap-2">
                              <Bug className="h-4 w-4 text-rose-500" />
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                {b.taskKey}
                              </span>
                              <span className="truncate font-medium text-zinc-800 dark:text-zinc-200 max-w-xs">
                                {b.title}
                              </span>
                            </div>
                            {b.severity && (
                              <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                {b.severity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sprints */}
                  {results.sprints.length > 0 && (
                    <div>
                      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Sprints
                      </span>
                      <div className="mt-1 flex flex-col gap-1">
                        {results.sprints.map((s) => (
                          <div
                            key={s.id}
                            onClick={() =>
                              handleSelectResult(
                                `/projects/${s.project.id}/sprints`,
                              )
                            }
                            className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          >
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-amber-500" />
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {s.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400">
                              in {s.project.code}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {results.files.length > 0 && (
                    <div>
                      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Files & Documents
                      </span>
                      <div className="mt-1 flex flex-col gap-1">
                        {results.files.map((f) => (
                          <div
                            key={f.id}
                            onClick={() =>
                              handleSelectResult(
                                `/projects/${f.project.id}/files`,
                              )
                            }
                            className="flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {f.name}
                              </span>
                            </div>
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {f.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with hint */}
            <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/50 flex justify-between items-center">
              <span>Press ESC or click outside to close</span>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={() => setIsOpen(false)}
                className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View Full Search Page →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
