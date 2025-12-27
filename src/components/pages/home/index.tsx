import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { downloadDir } from "@tauri-apps/api/path";
// import { openPath } from "@tauri-apps/plugin-opener";
import { ask } from "@tauri-apps/plugin-dialog";

import { remove } from "@tauri-apps/plugin-fs";

import type { FileItem } from "@hooks/useTauriFiles";
import { useFiles } from "@context/fileContext";
import PdfPreviewModal from "@components/molecules/pdfPreviewModal";

type Tab = "images" | "docs";

const MAX_MULTI_SELECT = 5;
const PAGE_SIZE = 10;

export default function Home() {
  const navigate = useNavigate();
  const { files, loading, error, refresh } = useFiles();
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("images");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [downloadsRoot, setDownloadsRoot] = useState<string | null>(null);

  const [selectedImages, setSelectedImages] = useState<FileItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // batching
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  /* ---------- INIT ---------- */
  useEffect(() => {
    SortByName();
    downloadDir().then((dir) => setDownloadsRoot(dir.replace(/\\/g, "/")));

    const printers = invoke<string[]>("list_printers");
    console.log(printers);
  }, []);

  /* ---------- RESET PAGINATION ON TAB / SEARCH ---------- */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSelectedImages([]);
  }, [tab, search, sortBy]);

  const query = search.trim().toLowerCase();

  /* ---------- FILTER + SORT (FULL LIST, NO RENDER YET) ---------- */
  const filteredImages = useMemo(() => {
    return files
      .filter(
        (f) =>
          f.type === "image" && (!query || f.name.toLowerCase().includes(query))
      )
      .sort((a, b) =>
        sortBy === "newest"
          ? a.name.localeCompare(b.name)
          : (b.mtime || 0) - (a.mtime || 0)
      );
  }, [files, query, sortBy]);

  const filteredDocs = useMemo(() => {
    return files.filter(
      (f) =>
        f.type === "pdf" && (!query || f.name.toLowerCase().includes(query))
    );
  }, [files, query]);

  /* ---------- ONLY RENDER WHAT IS VISIBLE ---------- */
  const images = filteredImages.slice(0, visibleCount);
  const documents = filteredDocs.slice(0, visibleCount);

  const SortByName = () => {
    return setSortBy("newest");
  };

  const hasMore =
    tab === "images"
      ? visibleCount < filteredImages.length
      : visibleCount < filteredDocs.length;

  /* ---------- ACTIONS ---------- */
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

    const confirmed = await ask(`Delete "${file.name}"?`, {
      title: "Confirm Delete",
      kind: "warning",
    });

    if (!confirmed) return;

    try {
      await remove(`${downloadsRoot}/${file.path}`.replace(/\/+/g, "/"));
      refresh();
    } catch {
      alert("Delete failed");
    }
  };

  const handlePreviewAndPrintPdf = async (file: FileItem) => {
    if (!downloadsRoot) return;

    const fullPath = `${downloadsRoot}/${file.path}`.replace(/\/+/g, "/");

    const bytes = await invoke<number[]>("load_pdf", { path: fullPath });
    const uint8 = new Uint8Array(bytes);

    const blob = new Blob([uint8], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    setPdfUrl(url);
  };

  type SortBy = "name-asc" | "name-desc" | "newest";

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-app text-textPrimary p-6">
      <div className="max-w-7xl mx-auto bg-panel rounded-xl p-6 shadow">
        {/* Header */}
        <div className="flex justify-between mb-4 gap-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="bg-input border border-border px-3 py-1.5 rounded text-sm"
          />
          <div>
            <button
              onClick={refresh}
              className="border border-border px-3 py-1.5 rounded text-sm mr-3"
            >
              Refresh
            </button>
            <select
              className="border border-border py-1.5 rounded text-sm "
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-between border-b border-border mb-3">
          <div className="flex gap-4">
            {(["images", "docs"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
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
            <button
              onClick={() => handleEdit()}
              className="bg-blue-700 text-white text-sm px-4 pb-1 rounded mb-1"
            >
              Edit ({selectedImages.length})
            </button>
          )}
        </div>

        {loading && <p>Loading…</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* IMAGES */}
        {tab === "images" && (
          <div className="grid lg:grid-cols-3 gap-2">
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
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded"
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
                  onClick={() => handlePreviewAndPrintPdf(file)}
                  className="bg-green-600 px-3 py-1 text-white text-xs rounded"
                >
                  Print
                </button>

                <button
                  onClick={() => handleDelete(file)}
                  className="bg-red-600 px-3 py-1 text-white text-xs rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

        {/* LOAD MORE */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
              className="px-5 py-2 text-sm border border-border rounded hover:bg-input"
            >
              Load more
            </button>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-panel px-4 py-2 rounded border border-border">
            {toast}
          </div>
        )}
      </div>
      {pdfUrl && (
        <PdfPreviewModal
          pdfUrl={pdfUrl}
          onClose={() => setPdfUrl(null)}
        />
      )}
    </main>
  );
}
