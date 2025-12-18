import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { downloadDir } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";
import { remove } from "@tauri-apps/plugin-fs";

import type { FileItem } from "../hooks/useTauriFiles";
import { useFiles } from "../context/fileContext";

type Tab = "images" | "docs";
const MAX_MULTI_SELECT = 5;
const IMAGE_PAGE_SIZE = 20;

export default function Home() {
  const navigate = useNavigate();
  const { files, loading, error, refresh } = useFiles();

  const [tab, setTab] = useState<Tab>("images");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "mtime">("mtime");
  const [downloadsRoot, setDownloadsRoot] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<FileItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    downloadDir().then((dir) => setDownloadsRoot(dir.replace(/\\/g, "/")));
  }, []);

  const query = search.trim().toLowerCase();

  const images = useMemo(() => {
    return files
      .filter(
        (f) =>
          f.type === "image" && (!query || f.name.toLowerCase().includes(query))
      )
      .sort((a, b) =>
        sortBy === "name"
          ? a.name.localeCompare(b.name)
          : (b.mtime || 0) - (a.mtime || 0)
      )
      .slice(0, IMAGE_PAGE_SIZE);
  }, [files, query, sortBy]);

  const documents = useMemo(() => {
    return files.filter(
      (f) =>
        f.type === "pdf" && (!query || f.name.toLowerCase().includes(query))
    );
  }, [files, query]);

  const toggleImageSelect = (file: FileItem) => {
    setSelectedImages((prev) => {
      const exists = prev.some((f) => f.path === file.path);
      if (exists) return prev.filter((f) => f.path !== file.path);

      if (prev.length >= MAX_MULTI_SELECT) {
        setToast(`You can add only ${MAX_MULTI_SELECT} images at once`);
        setTimeout(() => setToast(null), 2000);
        return prev;
      }
      return [...prev, file];
    });
  };

  const handleEdit = (file?: FileItem) => {
    const filesToEdit = file ? [file] : selectedImages;
    if (!filesToEdit.length) return;

    const param = filesToEdit.map((f) => encodeURIComponent(f.path)).join(",");

    navigate(`/editor?files=${param}`);
    console.log(param, filesToEdit);
  };

  const handleDelete = async (file: FileItem) => {
    if (!downloadsRoot) return;
    if (!confirm(`Delete "${file.name}"?`)) return;

    try {
      await remove(`${downloadsRoot}/${file.path}`.replace(/\/+/g, "/"));
      refresh();
    } catch {
      alert("Delete failed");
    }
  };

  const handlePrintPdf = async (file: FileItem) => {
    if (!downloadsRoot) return;
    await openPath(`${downloadsRoot}/${file.path}`.replace(/\/+/g, "/"));
  };

  return (
    <main className="min-h-screen bg-app text-textPrimary p-6">
      <div className="max-w-7xl mx-auto bg-panel rounded-xl p-6 shadow">
        {/* Header */}
        <div className="flex justify-between mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="bg-input border border-border px-3 py-1.5 rounded text-sm"
          />
          <button
            onClick={refresh}
            className="border border-border px-3 py-1.5 rounded text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-between gap-6 border-b border-border mb-4">
          <div className=" flex gap-4">
            {(["images", "docs"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setSelectedImages([]);
                }}
                className={`pb-2 ${
                  tab === t ? "text-primary border-b-2 border-primary" : ""
                }`}
              >
                {t === "images" ? "Images" : "Documents"}
              </button>
            ))}
          </div>

          {/* MULTI EDIT CTA */}
          {selectedImages.length > 1 && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => handleEdit()}
                className="bg-yellow-500 text-black text-sm px-5 py-1 rounded-sm font-medium"
              >
                Edit ({selectedImages.length})
              </button>
            </div>
          )}
        </div>

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* IMAGES */}
        {tab === "images" && (
          <div className="grid  lg:grid-cols-3 gap-2">
            {images.map((file) => {
              const selected = selectedImages.some((f) => f.path === file.path);

              return (
                <div
                  key={file.path}
                  onClick={() => toggleImageSelect(file)}
                  className={`flex justify-between items-center p-3 border rounded cursor-pointer ${
                    selected ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <div>
                    <p className="text-sm">{file.name}</p>
                    <p className="text-xs text-textSecondary">
                      {file.mtime
                        ? new Date(file.mtime).toLocaleDateString()
                        : ""}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={selectedImages.length > 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(file);
                      }}
                      className="px-3 py-1 text-white text-xs bg-blue-600 rounded disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                      className="px-3 py-1 text-white text-xs bg-red-600 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "docs" &&
          documents.map((file) => (
            <div
              key={file.path}
              className="flex justify-between p-3 mb-2 border border-border rounded"
            >
              <span className="truncate">{file.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintPdf(file)}
                  className="bg-green-600 px-3 py-1 text-xs rounded"
                >
                  Print
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  className="bg-red-600 px-3 py-1 text-xs rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-panel px-4 py-2 rounded border border-border">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
