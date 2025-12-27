import {
  ClosedCaptionIcon,
  CloverIcon,
  Cross,
  CrosshairIcon,
  CrossIcon,
  Printer,
  X,
} from "lucide-react";

type PdfPreviewModalProps = {
  pdfUrl: string;
  onClose: () => void;
};

export default function PdfPreviewModal({
  pdfUrl,
  onClose,
}: PdfPreviewModalProps) {
  const handleClose = () => {
    URL.revokeObjectURL(pdfUrl);
    onClose();
  };

  const handlePrint = () => {
    const iframe = document.getElementById(
      "pdf-preview-iframe"
    ) as HTMLIFrameElement | null;

    iframe?.contentWindow?.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-panel w-[85vw] h-[90vh] rounded flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-3 py-2">
          <span className="font-medium"></span>
          <button onClick={handleClose}>✕</button>
        </div>

        {/* PDF Viewer */}
        <iframe
          id="pdf-preview-iframe"
          src={pdfUrl}
          className="flex-1 w-full"
          style={{ border: "none" }}
        />

        {/* Footer */}
        <div className="flex justify-center gap-4  px-3 py-2">
          <button
            className="bg-danger text-white px-4 py-1 rounded flex items-center gap-1"
            onClick={handleClose}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-4 py-1 rounded flex items-center gap-2"
            onClick={handlePrint}
          >
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
