// src/app/api/file/[name]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

type RouteParams = {
  params: Promise<{
    name: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // params may be a Promise (Next.js App Router requirement)
    const awaited = await params;
    const rawName = awaited?.name;
    if (!rawName) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    // decode and sanitize filename (use basename to prevent directory traversal)
    const decoded = decodeURIComponent(rawName);
    const safeName = path.basename(decoded); // removes any path segments

    if (!safeName) {
      return NextResponse.json(
        { error: "Invalid or empty file name" },
        { status: 400 }
      );
    }

    const downloadsDir = path.join(os.homedir(), "Downloads");
    const filePath = path.join(downloadsDir, safeName);

    // Ensure the file path is inside downloadsDir (extra safety)
    const relative = path.relative(downloadsDir, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Check existence and read file metadata
    let stat: fs.Stats;
    try {
      stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) {
        return NextResponse.json({ error: "Not a file" }, { status: 404 });
      }
    } catch (e) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file buffer (for moderate-size images this is fine)
    const fileBuffer = await fs.promises.readFile(filePath);

    const ext = safeName.split(".").pop()?.toLowerCase() || "";

    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "no-cache",
        // inline display is default; you can add:
        // "Content-Disposition": `inline; filename="${safeName}"`
      },
    });
  } catch (err) {
    console.error("Error serving file:", err);
    return NextResponse.json(
      { error: "Internal server error while reading file" },
      { status: 500 }
    );
  }
}
