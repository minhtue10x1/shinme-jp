"use client";

/**
 * Renders a single page (0-based index) of a PDF ArrayBuffer to a crisp WebP/PNG File
 * directly in the browser using pdfjs-dist, without needing any server-side headless browser.
 */
export async function renderPdfPageToImageFile(
  pdfBuffer: ArrayBuffer,
  pageIndex0Based: number,
  options?: { scale?: number; fileName?: string }
): Promise<File> {
  const pdfjs = await import("pdfjs-dist");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }

  // Clone buffer so pdfjs worker transfer never detaches the caller's ArrayBuffer
  const dataCopy = new Uint8Array(pdfBuffer.slice(0));
  const loadingTask = pdfjs.getDocument({ data: dataCopy });
  const pdfDoc = await loadingTask.promise;

  try {
    const safePageNum = Math.min(Math.max(1, pageIndex0Based + 1), pdfDoc.numPages);
    const page = await pdfDoc.getPage(safePageNum);
    const scale = options?.scale ?? 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Không thể khởi tạo Canvas 2D để chụp trang poster PDF.");
    }

    // White background so transparent PDF pages never turn black
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            canvas.toBlob(
              (pngBlob) => {
                if (pngBlob) resolve(pngBlob);
                else reject(new Error("Không thể xuất ảnh từ trang PDF."));
              },
              "image/png"
            );
          }
        },
        "image/webp",
        0.88
      );
    });

    const ext = blob.type === "image/png" ? "png" : "webp";
    const fileName = options?.fileName || `jlpt-poster-p${safePageNum}.${ext}`;
    return new File([blob], fileName, { type: blob.type });
  } finally {
    await loadingTask.destroy();
  }
}
