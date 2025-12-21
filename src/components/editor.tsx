import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas as FabricCanvas, FabricImage } from "fabric";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { IconButton } from "./atoms/IconButton";

import { useLocation } from "react-router-dom";

import {
  ArrowLeft,
  Crop,
  Download,
  ImagePlus,
  Printer,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const PREVIEW_WIDTH = 900;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

export default function Editor() {
  const navigate = useNavigate();
  // const { path } = useParams<{ path: string }>();
  // const decodedPath = decodeURIComponent(path ?? "");

  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  // const [loading, setLoading] = useState(true);
  const [pageZoom, setPageZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<FabricImage | null>(null);
  // const [isDragging, setIsDragging] = useState(false);

  const previewHeight = Math.round((A4_HEIGHT / A4_WIDTH) * PREVIEW_WIDTH);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const filesParam = params.get("files");

  const files = filesParam ? filesParam.split(",").map(decodeURIComponent) : [];

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

  function showToast(msg: string, timeout = 2000) {
    setToast(msg);
    setTimeout(() => setToast(null), timeout);
  }

  /* ---------- LOAD IMAGE ---------- */
  useEffect(() => {
    if (!files.length || !fabricRef.current) return;

    let alive = true;
    const canvas = fabricRef.current;

    (async () => {
      try {
        // setLoading(true);
        canvas.clear();

        for (let i = 0; i < files.length; i++) {
          const bytes = await readFile(files[i], {
            baseDir: BaseDirectory.Download,
          });
          if (!alive) return;

          const blob = new Blob([bytes], { type: "image/*" });
          const url = URL.createObjectURL(blob);
          const img = await FabricImage.fromURL(url);
          console.log(img, url);
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

          if (i === files.length - 1) {
            canvas.setActiveObject(img); // topmost selected
          }
        }

        canvas.renderAll();
      } finally {
        // alive && setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [previewHeight]);

  /* ---------- ACTIONS ---------- */
  const rotate = (deg: number) => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    obj.rotate((obj.angle || 0) + deg);
    fabricRef.current?.renderAll();
  };

  const remove = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.remove(obj);
    canvas.renderAll();
  };

  const addImage = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const selection = await openFileDialog({
      multiple: true,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (!selection) return;

    const paths = Array.isArray(selection) ? selection : [selection];

    for (const p of paths) {
      const bytes = await readFile(p);
      const blob = new Blob([bytes], { type: "image/*" });
      const url = URL.createObjectURL(blob);
      const img = await FabricImage.fromURL(url);

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
      canvas.setActiveObject(img);
    }
    canvas.renderAll();
  };

  /* ---------- EXPORT ---------- */
  const exportA4 = async () => {
    const canvas = fabricRef.current;
    if (!canvas || exporting) return;

    try {
      setExporting(true);
      showToast("Exporting…");

      canvas.requestRenderAll();
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const dataUrl = canvas.toDataURL({
        format: "png",
        multiplier: A4_WIDTH / PREVIEW_WIDTH,
        enableRetinaScaling: false,
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "export.png";
      a.click();

      showToast("Exported");
    } finally {
      setExporting(false);
    }
  };

  const startCrop = () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();

    if (!obj || obj.type !== "image") {
      alert("Select an image to crop");
      return;
    }

    const img = obj as FabricImage;

    setCroppingImage(img);
    setCropSrc(img.getSrc()); // IMPORTANT: must be blob / data URL
  };

  const applyCrop = async () => {
    if (!cropperRef.current || !croppingImage) return;

    const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas({
      imageSmoothingQuality: "high",
    });

    const dataUrl = croppedCanvas.toDataURL("image/png");

    const newImg = await FabricImage.fromURL(dataUrl);

    newImg.set({
      left: croppingImage.left,
      top: croppingImage.top,
      angle: croppingImage.angle,
      scaleX: croppingImage.scaleX,
      scaleY: croppingImage.scaleY,
      originX: "center",
      originY: "center",
      selectable: true,
    });

    const canvas = fabricRef.current!;
    canvas.remove(croppingImage);
    canvas.add(newImg);
    canvas.setActiveObject(newImg);
    canvas.renderAll();

    setCropSrc(null);
    setCroppingImage(null);
  };

  const printCanvas = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // ensure everything is rendered
    canvas.requestRenderAll();
    await new Promise((r) => requestAnimationFrame(r));

    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: A4_WIDTH / PREVIEW_WIDTH,
      enableRetinaScaling: false,
    });

    if (!dataUrl || dataUrl === "data:,") {
      alert("Nothing to print");
      return;
    }

    const originalHtml = document.body.innerHTML;

    document.body.innerHTML = `
    <style>
      @page { margin: 0; }
      body { margin: 0; }
      img { width: 100%; height: auto; }
    </style>
    <img src="${dataUrl}" />
  `;

    setTimeout(() => {
      window.print();

      // restore app UI
      setTimeout(() => {
        document.body.innerHTML = originalHtml;
        window.location.reload();
      }, 500);
    }, 100);
  };

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-app text-textPrimary">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 bg-toolbar border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2">
          <IconButton
            title="Back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </IconButton>

          <IconButton
            title="Rotate Left"
            onClick={() => rotate(-90)}
          >
            <RotateCcw size={18} />
          </IconButton>

          <IconButton
            title="Rotate Right"
            onClick={() => rotate(90)}
          >
            <RotateCw size={18} />
          </IconButton>

          <IconButton
            title="Crop"
            onClick={startCrop}
          >
            <Crop size={18} />
          </IconButton>

          <IconButton
            title="Add Image"
            onClick={addImage}
          >
            <ImagePlus size={18} />
          </IconButton>

          <IconButton
            title="Delete"
            onClick={remove}
          >
            <Trash2
              size={18}
              className="text-danger"
            />
          </IconButton>

          <IconButton
            title="Export"
            onClick={exportA4}
            disabled={exporting}
          >
            <Download size={18} />
          </IconButton>

          <IconButton
            title="Print"
            onClick={printCanvas}
          >
            <Printer size={18} />
          </IconButton>

          <div className="ml-auto flex items-center gap-1">
            <IconButton
              onClick={() => setPageZoom((z) => Math.max(0.4, z - 0.1))}
            >
              <ZoomOut size={18} />
            </IconButton>

            <span className="px-2 text-sm">{Math.round(pageZoom * 100)}%</span>

            <IconButton
              onClick={() => setPageZoom((z) => Math.min(2, z + 0.1))}
            >
              <ZoomIn size={18} />
            </IconButton>

            <IconButton onClick={() => setPageZoom(1)}>
              <RefreshCw size={18} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Canvas Area (FIXED ZOOM) */}
      <div className="flex justify-center bg-neutral-500 p-5 overflow-auto">
        <div
          style={{
            width: PREVIEW_WIDTH * pageZoom,
            height: previewHeight * pageZoom,
          }}
        >
          <div
            style={{
              transform: `scale(${pageZoom})`,
              transformOrigin: "top center",
            }}
          >
            <div
              className="bg-white shadow"
              style={{ width: PREVIEW_WIDTH, height: previewHeight }}
            >
              <canvas ref={canvasEl} />
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-panel border border-border px-4 py-2 rounded">
          {toast}
        </div>
      )}

      {cropSrc && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-white w-[80vw] h-[80vh] p-4 rounded flex flex-col">
            <Cropper
              ref={cropperRef}
              src={cropSrc}
              viewMode={1}
              dragMode="move"
              autoCropArea={1}
              background={false}
              responsive
              style={{ width: "100%", height: "100%" }}
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setCropSrc(null)}
                className="px-4 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={applyCrop}
                className="px-4 py-1 bg-green-600 text-white rounded"
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
