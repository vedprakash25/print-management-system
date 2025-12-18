import { useEffect, useState } from "react";
import { readDir, stat, BaseDirectory, DirEntry } from "@tauri-apps/plugin-fs";

export type FileItem = {
  name: string;
  path: string;
  type: "image" | "pdf" | "other";
  mtime?: number;
};

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif"];
const PDF_EXTS = ["pdf"];

function getFileType(name: string): FileItem["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (PDF_EXTS.includes(ext)) return "pdf";
  return "other";
}

export function useTauriFiles(baseDir: BaseDirectory, refreshKey: number) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function walk(dir: string, acc: FileItem[]) {
      const entries: DirEntry[] = await readDir(dir, { baseDir });

      for (const entry of entries) {
        if (!entry.name) continue;

        const relPath = dir ? `${dir}/${entry.name}` : entry.name;

        if (entry.isDirectory) {
          await walk(relPath, acc);
          continue;
        }

        if (!entry.isFile) continue;

        const info = await stat(relPath, { baseDir });

        acc.push({
          name: entry.name,
          path: relPath, // relative to Downloads
          type: getFileType(entry.name),
          mtime: info.mtime ? info.mtime.getTime() : undefined,
        });
      }
    }

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const collected: FileItem[] = [];

        // ✅ Read directly from Downloads root
        await walk("", collected);

        if (alive) setFiles(collected);
      } catch (e: any) {
        if (alive) {
          setError(e?.message ?? "Failed to read Downloads folder.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [baseDir, refreshKey]);

  return { files, loading, error };
}
