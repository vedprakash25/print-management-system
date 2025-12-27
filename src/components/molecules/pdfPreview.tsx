import { useEffect, useRef, useState } from "react";
import pdfjs from "@lib/pdfWorker";

type Props = {
  pdfBytes: Uint8Array;
};

export default function PdfPreview({ pdfBytes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const scale = 1.25;

  useEffect(() => {
    (async () => {
      const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
      setPdf(doc);
      setTotal(doc.numPages);
    })();
  }, [pdfBytes]);

  useEffect(() => {
    if (!pdf) return;

    (async () => {
      const pageObj = await pdf.getPage(page);
      const viewport = pageObj.getViewport({ scale });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await pageObj.render({ canvasContext: ctx, viewport }).promise;
    })();
  }, [pdf, page]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="shadow border"
      />

      <div className="flex gap-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>

        <span>
          {page} / {total}
        </span>

        <button
          disabled={page >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
