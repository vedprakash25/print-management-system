"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Canvas as FabricCanvas, FabricImage } from "fabric";
import Cropper, { ReactCropperElement } from "react-cropper";
import "react-cropper/node_modules/cropperjs/dist/cropper.css";

const PREVIEW_WIDTH = 900;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

export default function EditorPage() {
  const router = useRouter();
  const { file } = useParams<{ file: string }>();
  const fileName = decodeURIComponent(file);

  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const [loading, setLoading] = useState(true);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<FabricImage | null>(null);

  const previewHeight = Math.round((A4_HEIGHT / A4_WIDTH) * PREVIEW_WIDTH);

  /* ---------- INIT FABRIC ---------- */
  useEffect(() => {
    if (!canvasEl.current || fabricRef.current) return;

    const canvas = new FabricCanvas(canvasEl.current, {
      width: PREVIEW_WIDTH,
      height: previewHeight,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });

    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [previewHeight]);

  /* ---------- LOAD INITIAL IMAGE ---------- */
  useEffect(() => {
    if (!fabricRef.current || !fileName) return;

    const canvas = fabricRef.current;
    let alive = true;
    setLoading(true);

    FabricImage.fromURL(`/api/file/${encodeURIComponent(fileName)}`, {
      crossOrigin: "anonymous",
    }).then((img) => {
      if (!alive) return;

      canvas.clear();

      const scale = Math.min(
        (PREVIEW_WIDTH * 0.9) / (img.width || 1),
        (previewHeight * 0.9) / (img.height || 1),
        1
      );

      img.set({
        left: PREVIEW_WIDTH / 2,
        top: previewHeight / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: true,
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [fileName, previewHeight]);

  /* ---------- ACTIONS ---------- */
  const addImages = async (files: FileList) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });

      img.set({
        left: PREVIEW_WIDTH / 2,
        top: previewHeight / 2,
        originX: "center",
        originY: "center",
        scaleX: 0.5,
        scaleY: 0.5,
        selectable: true,
      });

      canvas.add(img);
    }

    canvas.renderAll();
  };

  const rotateActive = (deg: number) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.rotate((obj.angle || 0) + deg);
    canvas?.renderAll();
  };

  const deleteActive = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.remove(obj);
    canvas.renderAll();
  };

  /* ---------- CROP (CROPPER.JS) ---------- */
  const startCrop = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.type !== "image") return;

    const img = obj as FabricImage;
    setCroppingImage(img);
    setCropSrc(img.getSrc());
  };

  const applyCrop = async () => {
    if (!cropperRef.current || !croppingImage) return;

    const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas({
      imageSmoothingQuality: "high",
    });

    const dataUrl = croppedCanvas.toDataURL("image/png");

    const canvas = fabricRef.current!;
    const oldImg = croppingImage;

    const cropped = await FabricImage.fromURL(dataUrl, {
      crossOrigin: "anonymous",
    });

    cropped.set({
      left: oldImg.left,
      top: oldImg.top,
      angle: oldImg.angle,
      scaleX: oldImg.scaleX,
      scaleY: oldImg.scaleY,
      originX: "center",
      originY: "center",
      selectable: true,
    });

    canvas.remove(oldImg);
    canvas.add(cropped);
    canvas.setActiveObject(cropped);
    canvas.renderAll();

    setCropSrc(null);
    setCroppingImage(null);
  };

  const cancelCrop = () => {
    setCropSrc(null);
    setCroppingImage(null);
  };

  /* ---------- EXPORT / PRINT ---------- */
  const exportA4 = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: A4_WIDTH / PREVIEW_WIDTH,
    });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "export.png";
    a.click();
  };

  const printCanvas = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({
      multiplier: A4_WIDTH / PREVIEW_WIDTH,
    });

    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(`
      <img src="${dataUrl}" style="width:100%" />
      <script>setTimeout(() => window.print(), 500)</script>
    `);
    w.document.close();
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex gap-2 p-2 border-b bg-white">
        <button onClick={() => router.back()}>Back</button>
        <button onClick={() => fileInputRef.current?.click()}>Add</button>
        <button onClick={() => rotateActive(-90)}>Rotate L</button>
        <button onClick={() => rotateActive(90)}>Rotate R</button>
        <button onClick={startCrop}>Crop</button>
        <button onClick={deleteActive}>Delete</button>
        <button onClick={exportA4}>Export</button>
        <button onClick={printCanvas}>Print</button>
        <span className="ml-auto">{fileName}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && addImages(e.target.files)}
      />

      <div className="p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            Loading…
          </div>
        )}
        <div
          style={{ width: PREVIEW_WIDTH, height: previewHeight }}
          className="bg-white shadow"
        >
          <canvas ref={canvasEl} />
        </div>
      </div>

      {cropSrc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-[80vw] h-[80vh] flex flex-col">
            <Cropper
              ref={cropperRef}
              src={cropSrc}
              viewMode={1}
              dragMode="move"
              autoCropArea={1}
              guides
              background={false}
              responsive
              checkOrientation={false}
              style={{ width: "100%", height: "100%" }}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={cancelCrop}>Cancel</button>
              <button
                onClick={applyCrop}
                className="bg-green-600 text-white px-4 py-1 rounded"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
