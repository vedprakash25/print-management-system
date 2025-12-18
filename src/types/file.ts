export type FileType = "image" | "pdf" | "other";

export type FileItem = {
  name: string;
  path: string;
  type: FileType;
  mtime?: number;
};
