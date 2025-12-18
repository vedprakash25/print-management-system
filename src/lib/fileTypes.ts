export function getFileType(name: string): "image" | "pdf" | "other" {
  const ext = name.split(".").pop()?.toLowerCase();

  if (!ext) return "other";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";

  return "other";
}
