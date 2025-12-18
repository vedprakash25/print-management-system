import { FileItem } from "../types/file";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];
const PDF_EXTS = ["pdf"];

export function getFileType(name: string): FileItem["type"] {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "other";
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (PDF_EXTS.includes(ext)) return "pdf";
  return "other";
}
