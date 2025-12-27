import * as pdfjs from "pdfjs-dist";

// IMPORTANT: v4-compatible worker setup
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default pdfjs;
