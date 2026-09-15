import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { pdfjsLib, loadPdfTask } from '@/lib/pdf';
import { Search, ChevronUp, ChevronDown, X, ZoomIn, ZoomOut, ArrowLeft, Download } from 'lucide-react';

const BUCKET = 'member-documents';
const SIGNED_URL_TTL = 60 * 60;

interface DocumentRow {
  id: string;
  title: string;
  storage_path: string;
  page_count: number | null;
}

/** One searchable run of text, with where to draw its highlight. */
interface TextPiece {
  text: string;
  lower: string;
  left: number;   // unscaled viewport units (scale 1)
  top: number;
  width: number;
  height: number;
}

interface Match {
  page: number; // 1-based
  piece: number;
}

const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  const [doc, setDoc] = useState<DocumentRow | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([]);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Loading document...');

  const [pageTexts, setPageTexts] = useState<TextPiece[][]>([]);
  const [textReady, setTextReady] = useState(false);
  const [query, setQuery] = useState('');
  const [activeMatch, setActiveMatch] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const renderedPages = useRef<Set<number>>(new Set());

  // --- load the document -----------------------------------------------------
  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    // Held so the worker can be shut down on unmount — destroy() is on the task.
    let task: ReturnType<typeof loadPdfTask> | null = null;

    (async () => {
      const { data: row, error: rowError } = await supabase
        .from('member_documents')
        .select('id, title, storage_path, page_count')
        .eq('id', id)
        .single();
      if (cancelled) return;
      if (rowError || !row) {
        setError('That document could not be found.');
        return;
      }
      setDoc(row as DocumentRow);
      document.title = `${row.title} — Tenshin Warrior`;

      // Private bucket: fetch through a short-lived signed URL.
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL);
      if (cancelled) return;
      if (signError || !signed?.signedUrl) {
        setError('Could not get access to the file.');
        return;
      }
      setFileUrl(signed.signedUrl);

      setStatus('Downloading...');
      const response = await fetch(signed.signedUrl);
      if (!response.ok) {
        if (!cancelled) setError('Could not download the file.');
        return;
      }
      const bytes = await response.arrayBuffer();
      if (cancelled) return;

      setStatus('Rendering...');
      task = loadPdfTask(bytes);
      const loaded = await task.promise;
      if (cancelled) {
        await task.destroy();
        return;
      }

      const sizes: { width: number; height: number }[] = [];
      for (let i = 1; i <= loaded.numPages; i++) {
        const page = await loaded.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        sizes.push({ width: vp.width, height: vp.height });
      }
      if (cancelled) return;
      setPageSizes(sizes);
      setPdf(loaded);
      setStatus('');
    })().catch((err) => {
      if (!cancelled) setError((err as Error).message);
    });

    return () => {
      cancelled = true;
      task?.destroy();
    };
  }, [user, id]);

  // --- extract text for search, after the document is up ---------------------
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;

    (async () => {
      const all: TextPiece[][] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) return;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        const pieces: TextPiece[] = [];
        for (const item of content.items) {
          if (!('str' in item) || !item.str.trim()) continue;
          // Map the text-space transform into viewport space so the highlight
          // sits over the right part of the rendered canvas.
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const height = Math.hypot(tx[2], tx[3]);
          pieces.push({
            text: item.str,
            lower: item.str.toLowerCase(),
            left: tx[4],
            top: tx[5] - height,
            width: item.width,
            height,
          });
        }
        all.push(pieces);
      }
      if (!cancelled) {
        setPageTexts(all);
        setTextReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [pdf]);

  // --- fit to width ----------------------------------------------------------
  useEffect(() => {
    if (pageSizes.length === 0) return;
    const fit = () => {
      const available = (containerRef.current?.clientWidth ?? 900) - 24;
      setScale(Math.min(3, Math.max(0.4, available / pageSizes[0].width)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [pageSizes]);

  // --- render pages only as they come into view ------------------------------
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdf) return;
    const host = pageRefs.current[pageNumber - 1];
    if (!host) return;
    const canvas = host.querySelector('canvas');
    if (!canvas) return;

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(viewport.width * ratio);
    canvas.height = Math.ceil(viewport.height * ratio);
    canvas.style.width = `${Math.ceil(viewport.width)}px`;
    canvas.style.height = `${Math.ceil(viewport.height)}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, viewport.width, viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    renderedPages.current.add(pageNumber);
  }, [pdf, scale]);

  // Re-render everything visible when the zoom changes.
  useEffect(() => {
    renderedPages.current.clear();
  }, [scale]);

  useEffect(() => {
    if (!pdf || pageSizes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const pageNumber = Number((entry.target as HTMLElement).dataset.page);
          if (pageNumber && !renderedPages.current.has(pageNumber)) {
            renderedPages.current.add(pageNumber);
            renderPage(pageNumber).catch(() => renderedPages.current.delete(pageNumber));
          }
        }
      },
      { rootMargin: '400px 0px' },
    );
    pageRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pdf, pageSizes, renderPage, scale]);

  // --- search ----------------------------------------------------------------
  const matches = useMemo<Match[]>(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2 || pageTexts.length === 0) return [];
    const found: Match[] = [];
    pageTexts.forEach((pieces, pageIndex) => {
      pieces.forEach((piece, pieceIndex) => {
        if (piece.lower.includes(needle)) found.push({ page: pageIndex + 1, piece: pieceIndex });
      });
    });
    return found;
  }, [query, pageTexts]);

  useEffect(() => { setActiveMatch(0); }, [query]);

  const goToMatch = useCallback((index: number) => {
    if (matches.length === 0) return;
    const wrapped = (index + matches.length) % matches.length;
    setActiveMatch(wrapped);
    const target = pageRefs.current[matches[wrapped].page - 1];
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [matches]);

  const hasAnyText = pageTexts.some(p => p.length > 0);

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-muted-foreground text-sm tracking-wider text-center">
          Please <Link to="/login" className="text-primary underline">log in</Link> to view this document.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm tracking-wider mb-4">{error}</p>
          <Link to="/documents" className="text-primary text-sm underline">Back to documents</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Toolbar: search is the dominant control, per the brief */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-3 py-2 flex items-center gap-3 flex-wrap">
          <Link
            to="/documents"
            className="shrink-0 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Documents</span>
          </Link>

          <h1 className="font-heading text-sm sm:text-base tracking-wider truncate max-w-[10rem] sm:max-w-xs">
            {doc?.title ?? ''}
          </h1>

          <div className="relative flex-1 min-w-[14rem]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goToMatch(e.shiftKey ? activeMatch - 1 : activeMatch + 1);
                }
                if (e.key === 'Escape') setQuery('');
              }}
              placeholder={textReady ? 'Search this document...' : 'Preparing search...'}
              disabled={!textReady}
              className="h-11 pl-10 pr-24 text-base border-2 border-primary/40 focus-visible:border-primary bg-background"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query.trim().length >= 2 && (
                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {matches.length ? `${activeMatch + 1}/${matches.length}` : '0'}
                </span>
              )}
              {query && (
                <>
                  <button
                    onClick={() => goToMatch(activeMatch - 1)}
                    disabled={!matches.length}
                    title="Previous match"
                    className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => goToMatch(activeMatch + 1)}
                    disabled={!matches.length}
                    title="Next match"
                    className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => setQuery('')}
                    title="Clear search"
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1">
            <button
              onClick={() => setScale(s => Math.max(0.4, s - 0.2))}
              title="Zoom out"
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.2))}
              title="Zoom in"
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ZoomIn size={16} />
            </button>
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open the original PDF"
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Download size={16} />
              </a>
            )}
          </div>
        </div>

        {textReady && !hasAnyText && (
          <p className="px-3 pb-2 text-xs text-muted-foreground">
            This PDF has no selectable text — it looks like a scan, so searching won&apos;t find
            anything in it.
          </p>
        )}
      </header>

      <main ref={containerRef} className="flex-1 w-full max-w-5xl mx-auto px-3 py-4">
        {status && (
          <p className="text-center text-muted-foreground text-sm tracking-wider py-12">{status}</p>
        )}

        <div className="space-y-4">
          {pageSizes.map((size, index) => {
            const pageNumber = index + 1;
            const pageMatches = matches.filter(m => m.page === pageNumber);
            const current = matches[activeMatch];
            return (
              <div
                key={pageNumber}
                data-page={pageNumber}
                ref={(el) => { pageRefs.current[index] = el; }}
                className="relative mx-auto bg-white shadow-sm"
                style={{ width: size.width * scale, height: size.height * scale }}
              >
                <canvas className="block" />

                {/* Highlight overlay — positioned from the text transforms */}
                {pageMatches.map((m) => {
                  const piece = pageTexts[pageNumber - 1]?.[m.piece];
                  if (!piece) return null;
                  const isCurrent =
                    current && current.page === m.page && current.piece === m.piece;
                  return (
                    <span
                      key={`${m.page}-${m.piece}`}
                      className={`pointer-events-none absolute rounded-[2px] ${
                        isCurrent ? 'bg-primary/50 ring-1 ring-primary' : 'bg-yellow-300/40'
                      }`}
                      style={{
                        left: piece.left * scale,
                        top: piece.top * scale,
                        width: Math.max(piece.width * scale, 4),
                        height: Math.max(piece.height * scale, 8),
                      }}
                    />
                  );
                })}

                <span className="absolute -bottom-px right-1 text-[10px] text-muted-foreground/70 bg-white/80 px-1 rounded-sm">
                  {pageNumber} / {pageSizes.length}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default DocumentViewer;
