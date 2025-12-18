import { createContext, useContext, useState } from "react";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { useTauriFiles } from "../hooks/useTauriFiles";
import type { FileItem } from "../hooks/useTauriFiles";

type FileContextType = {
  files: FileItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const FileContext = createContext<FileContextType | null>(null);

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { files, loading, error } = useTauriFiles(
    BaseDirectory.Download,
    refreshKey
  );

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <FileContext.Provider value={{ files, loading, error, refresh }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error("useFiles must be used inside FileProvider");
  return ctx;
}
