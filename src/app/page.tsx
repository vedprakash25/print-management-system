// src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FileItem = {
  name: string;
  type: "image" | "pdf" | "other";
  mtime?: number;
};

const PREVIEWABLE_EXTS = ["pdf", "png", "jpg", "jpeg", "gif", "webp"];

export default function Home() {
  const router = useRouter();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selected, setSelected] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [imagesOnly, setImagesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "mtime">("mtime");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/files");
        if (!res.ok) throw new Error("Failed to load files");
        const data = await res.json();
        if (mounted) setFiles(data.files ?? []);
      } catch (e: any) {
        if (mounted) setError(e.message ?? "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files
      .filter(
        (f) =>
          (!imagesOnly || f.type === "image") &&
          (!q || f.name.toLowerCase().includes(q))
      )
      .sort((a, b) =>
        sortBy === "name"
          ? a.name.localeCompare(b.name)
          : (b.mtime || 0) - (a.mtime || 0)
      );
  }, [files, imagesOnly, search, sortBy]);

  const canEdit = selected?.type === "image";

  const handleOpen = () => {
    if (!selected) return;

    const url = `/api/file/${encodeURIComponent(selected.name)}`;
    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";

    if (PREVIEWABLE_EXTS.includes(ext)) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = selected.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleEdit = () => {
    if (!canEdit || !selected) return;
    router.push(`/editor/${encodeURIComponent(selected.name)}`);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow p-6">
        {/* Header */}
        <header className="flex flex-wrap gap-4 justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">File Manager</h1>
            <p className="text-xs text-gray-500">
              Select a file to open or edit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files"
                className="pl-8 pr-3 py-1.5 border rounded text-sm"
              />
              <span className="absolute left-2 top-1.5 text-gray-400">🔍</span>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={imagesOnly}
                onChange={() => setImagesOnly((v) => !v)}
              />
              Images only
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="mtime">Newest</option>
              <option value="name">Name</option>
            </select>
          </div>
        </header>

        {/* Action Bar */}
        <div className="sticky top-0 z-10 bg-white border-b py-3 mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selected ? selected.name : "Select a file"}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={!canEdit}
              title={
                !selected
                  ? "Select an image to edit"
                  : selected.type !== "image"
                  ? "Only images can be edited"
                  : ""
              }
              className={`px-4 py-2 rounded text-sm font-medium ${
                canEdit
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Edit
            </button>

            <button
              onClick={handleOpen}
              disabled={!selected}
              className={`px-4 py-2 rounded text-sm font-medium ${
                selected
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Open
            </button>
          </div>
        </div>

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {visible.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-sm">No files found</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {visible.map((file) => {
            const isSel = selected?.name === file.name;

            return (
              <article
                key={file.name}
                onClick={() => setSelected(file)}
                className={`rounded-xl overflow-hidden cursor-pointer transition ${
                  isSel
                    ? "ring-2 ring-blue-600 bg-blue-50 shadow-md"
                    : "border hover:shadow-md hover:border-gray-300"
                }`}
              >
                <div className="relative h-36 bg-gray-100">
                  {file.type === "image" ? (
                    <img
                      src={`/api/file/${encodeURIComponent(file.name)}`}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xl">
                      {file.type === "pdf" ? "📄" : "📁"}
                    </div>
                  )}

                  {isSel && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      ✓
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {file.mtime
                      ? new Date(file.mtime).toLocaleDateString()
                      : ""}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
