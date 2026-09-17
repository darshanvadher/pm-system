"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  FileCode,
  FileCheck,
  FolderArchive,
  Download,
  Trash2,
  Upload,
  Search,
  Filter,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

interface UploaderInfo {
  id: string;
  name: string;
  email: string;
}

interface ProjectFileItem {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  category: string;
  createdAt: string;
  project: ProjectOption;
  uploader: UploaderInfo;
}

interface GlobalFilesClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: { name: string };
  };
  initialFiles: ProjectFileItem[];
  projects: ProjectOption[];
}

const CATEGORY_COLORS: Record<string, string> = {
  SPEC: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  CONTRACT:
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  DESIGN: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  DOCUMENT:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  OTHER: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
};

export function GlobalFilesClient({
  currentUser,
  initialFiles,
  projects,
}: GlobalFilesClientProps) {
  const [files, setFiles] = useState<ProjectFileItem[]>(initialFiles);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState<string>("DOCUMENT");
  const [customName, setCustomName] = useState("");
  const [uploading, setUploading] = useState(false);

  const filteredFiles = files.filter((f) => {
    if (selectedProjectId !== "ALL" && f.project.id !== selectedProjectId)
      return false;
    if (selectedCategory !== "ALL" && f.category !== selectedCategory)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.project.name.toLowerCase().includes(q) ||
        f.uploader.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !uploadProjectId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Disk upload failed");
      const uploadData = await uploadRes.json();

      const fileRes = await fetch(`/api/projects/${uploadProjectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim() || uploadData.fileName,
          filePath: uploadData.url,
          fileSize: uploadData.fileSize,
          fileType: uploadData.fileType,
          category: fileCategory,
        }),
      });

      if (fileRes.ok) {
        const fileData = await fileRes.json();
        setFiles([fileData.file, ...files]);
        setIsUploadOpen(false);
        setSelectedFile(null);
        setCustomName("");
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFile(fileId: string) {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (res.ok) {
        setFiles(files.filter((f) => f.id !== fileId));
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black dark:text-zinc-100">
      {/* Top Navbar */}
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
              href="/time"
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Time Tracking
            </Link>
            <Link
              href="/team"
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Team Workload
            </Link>
            <Link
              href="/files"
              className="text-indigo-600 dark:text-indigo-400 font-bold"
            >
              Files
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                System File Explorer & Local Storage
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Centralized file vault across all organization projects.
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-700"
            >
              <Upload className="h-4 w-4" />
              Upload Local File
            </button>
          </div>

          {/* Filters Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                <Search className="h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search file, project, or uploader..."
                  className="bg-transparent focus:outline-none dark:text-zinc-100"
                />
              </div>

              {/* Project Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                <Folder className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none dark:text-zinc-100"
                >
                  <option value="ALL">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                <Filter className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none dark:text-zinc-100"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SPEC">Specifications</option>
                  <option value="CONTRACT">Contracts</option>
                  <option value="DESIGN">Design Mockups</option>
                  <option value="DOCUMENT">Documents</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-zinc-400">
              Showing {filteredFiles.length} file(s)
            </span>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFiles.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-zinc-400">
                No files match criteria.
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                        {file.category === "SPEC" && (
                          <FileCode className="h-5 w-5" />
                        )}
                        {file.category === "CONTRACT" && (
                          <FileCheck className="h-5 w-5" />
                        )}
                        {file.category === "DESIGN" && (
                          <FolderArchive className="h-5 w-5" />
                        )}
                        {file.category === "DOCUMENT" && (
                          <FileText className="h-5 w-5" />
                        )}
                        {file.category === "OTHER" && (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          CATEGORY_COLORS[file.category] ||
                          CATEGORY_COLORS.OTHER
                        }`}
                      >
                        {file.category}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {file.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-500 font-medium">
                      Project: {file.project.name} ({file.project.code})
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      Uploaded by {file.uploader.name} on{" "}
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <span className="font-mono text-xs text-zinc-500">
                      {formatBytes(file.fileSize)}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={file.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60"
                        title="Delete File"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Upload File to Local Storage
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Select project and file from your machine to store in
              public/uploads.
            </p>

            <form
              onSubmit={handleFileUpload}
              className="mt-4 flex flex-col gap-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Project *
                </label>
                <select
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                  required
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Select File *
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file && !customName) {
                      setCustomName(file.name);
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Display File Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Architecture Specification.pdf"
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Category *
                </label>
                <select
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="SPEC">Specification</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="DESIGN">Design Mockup</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile || !uploadProjectId}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
