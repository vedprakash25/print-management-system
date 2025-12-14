// src/app/api/files/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET() {
  try {
    const downloads = path.join(os.homedir(), "Downloads");

    const items = await fs.promises.readdir(downloads, { withFileTypes: true });

    const files = await Promise.all(
      items
        .filter((it) => it.isFile())
        .map(async (it) => {
          const full = path.join(downloads, it.name);
          const stat = await fs.promises.stat(full);
          const ext = it.name.split(".").pop()?.toLowerCase();

          let type: "image" | "pdf" | "other" = "other";
          if (
            ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext!)
          )
            type = "image";
          if (ext === "pdf") type = "pdf";

          return {
            name: it.name,
            type,
            mtime: stat.mtimeMs,
            size: stat.size,
          };
        })
    );

    return NextResponse.json({ files });
  } catch (err: any) {
    console.error("Failed to load files:", err);
    return NextResponse.json(
      { error: "Failed to read Downloads folder" },
      { status: 500 }
    );
  }
}
