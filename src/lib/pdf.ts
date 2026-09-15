import * as pdfjsLib from 'pdfjs-dist';

// Vite resolves this to a hashed asset URL at build time, so the worker is
// bundled and served from our own origin rather than a CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export { pdfjsLib };

export const MAX_PDF_BYTES = 31_457_280; // 30 MB, matching the storage bucket limit

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Start loading a PDF from raw bytes.
 *
 * Returns the loading task rather than the document: in pdf.js v6 `destroy()`
 * lives on the task, and callers must call it to shut down the worker.
 */
export const loadPdfTask = (data: ArrayBuffer | Uint8Array) =>
  pdfjsLib.getDocument({ data });

export interface PdfThumbnail {
  blob: Blob;
  pageCount: number;
}

/**
 * Render page 1 to a PNG for use as the tile image.
 *
 * Done in the browser at upload time: the alternative is a server-side
 * renderer, which Edge Functions can't do without a headless browser.
 */
export const renderPdfThumbnail = async (
  file: File,
  targetWidth = 800,
): Promise<PdfThumbnail> => {
  const bytes = await file.arrayBuffer();
  const task = loadPdfTask(bytes);
  const pdf = await task.promise;

  try {
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get a 2D canvas context');

    // White base: PDF pages are transparent where unpainted, which would
    // otherwise show as black in a PNG.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('Could not encode the thumbnail image');

    return { blob, pageCount: pdf.numPages };
  } finally {
    await task.destroy();
  }
};
