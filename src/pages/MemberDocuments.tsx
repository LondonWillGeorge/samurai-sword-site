import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { MAX_PDF_BYTES, formatBytes, renderPdfThumbnail } from '@/lib/pdf';
import { Plus, Trash2, FileText, Upload } from 'lucide-react';

const BUCKET = 'member-documents';
const DESCRIPTION_MAX = 300;
const SIGNED_URL_TTL = 60 * 60; // 1 hour

interface MemberDocument {
  id: string;
  title: string;
  description: string;
  storage_path: string;
  thumbnail_path: string | null;
  file_size: number;
  page_count: number | null;
  uploader_id: string;
  created_at: string;
}

const MemberDocuments = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<MemberDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = stage !== null;

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('member_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Failed to load documents', description: error.message, variant: 'destructive' });
      setFetching(false);
      return;
    }

    const docs = (data ?? []) as MemberDocument[];
    setDocuments(docs);
    setFetching(false);

    // The bucket is private, so every thumbnail needs its own signed URL.
    const paths = docs.map(d => d.thumbnail_path).filter((p): p is string => !!p);
    if (paths.length === 0) return;
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    if (signed) {
      const map: Record<string, string> = {};
      for (const entry of signed) {
        if (entry.signedUrl && entry.path) map[entry.path] = entry.signedUrl;
      }
      setThumbUrls(map);
    }
  };

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      toast({ title: 'Not a PDF', description: 'Please choose a PDF file.', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    if (selected.size > MAX_PDF_BYTES) {
      toast({
        title: 'File too large',
        description: `That file is ${formatBytes(selected.size)}. The limit is 30 MB.`,
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setFile(selected);
    if (!title.trim()) setTitle(selected.name.replace(/\.pdf$/i, ''));
  };

  const handleUpload = async () => {
    if (!user || !file || !title.trim()) return;

    const stamp = Date.now();
    const safeName = file.name.replace(/[^\w.-]+/g, '_').replace(/\.pdf$/i, '');
    // Storage policy requires the first folder to be the uploader's id.
    const pdfPath = `${user.id}/${stamp}-${safeName}.pdf`;
    const thumbPath = `${user.id}/${stamp}-${safeName}-thumb.png`;

    try {
      setStage('Reading PDF...');
      setProgress(10);
      const { blob: thumbBlob, pageCount } = await renderPdfThumbnail(file);

      setStage('Uploading document...');
      setProgress(35);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(pdfPath, file, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      setStage('Uploading preview...');
      setProgress(75);
      const { error: thumbError } = await supabase.storage
        .from(BUCKET)
        .upload(thumbPath, thumbBlob, { contentType: 'image/png', upsert: false });
      // A missing preview is survivable — the tile falls back to an icon.
      if (thumbError) console.error('Thumbnail upload failed:', thumbError);

      setStage('Saving...');
      setProgress(90);
      const { error: insertError } = await supabase.from('member_documents').insert({
        title: title.trim(),
        description: description.trim().slice(0, DESCRIPTION_MAX),
        storage_path: pdfPath,
        thumbnail_path: thumbError ? null : thumbPath,
        file_size: file.size,
        page_count: pageCount,
        uploader_id: user.id,
      });
      if (insertError) {
        // Don't leave orphaned objects behind paying for storage.
        await supabase.storage.from(BUCKET).remove([pdfPath, thumbPath]);
        throw new Error(insertError.message);
      }

      setProgress(100);
      toast({ title: 'Document uploaded', description: `"${title.trim()}" is now available.` });
      resetForm();
      setDialogOpen(false);
      fetchDocuments();
    } catch (err) {
      toast({ title: 'Upload failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setStage(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const doc = pendingDelete;
    setPendingDelete(null);

    const { error } = await supabase.from('member_documents').delete().eq('id', doc.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    const paths = [doc.storage_path, doc.thumbnail_path].filter((p): p is string => !!p);
    await supabase.storage.from(BUCKET).remove(paths);
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm tracking-wider">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="font-heading text-3xl tracking-wider text-foreground">PDF Documents</h1>
          <button
            onClick={() => setDialogOpen(true)}
            title="Upload a PDF"
            aria-label="Upload a PDF"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm tracking-wider border border-border bg-secondary text-secondary-foreground rounded-sm transition-colors duration-200 hover:border-primary/60 hover:bg-muted hover:text-foreground active:bg-primary/15 active:border-primary"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Upload PDF</span>
          </button>
        </div>

        <h3 className="text-sm tracking-wider text-muted-foreground mb-8 max-w-xl">
          Club/tenshin related documents only please. If you have something useful in non-PDF format, try converting to PDF with free online tools, minimising file size if you can.<br />
          Visible to logged-in members only. Maximum 30&nbsp;MB per file.
        </h3>

        {fetching ? (
          <p className="text-muted-foreground text-sm tracking-wider">Loading documents...</p>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground text-sm tracking-wider">
            No documents yet — use the <span className="text-foreground">Upload PDF</span> button to
            add the first one.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => {
              const thumb = doc.thumbnail_path ? thumbUrls[doc.thumbnail_path] : undefined;
              return (
                <div key={doc.id} className="group">
                  <div className="flex items-center gap-2 mb-1 min-w-0">
                    {(isAdmin || doc.uploader_id === user.id) && (
                      <button
                        onClick={() => setPendingDelete(doc)}
                        title="Remove document"
                        className="shrink-0 p-1 rounded-sm text-muted-foreground hover:text-destructive transition-colors duration-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <FileText size={14} className="shrink-0 text-primary" />
                    <span
                      title={doc.title}
                      className="text-sm tracking-wider text-muted-foreground truncate"
                    >
                      {doc.title}
                    </span>
                  </div>

                  {/* Opens the reader in a new tab, as requested */}
                  <a
                    href={`/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-sm border border-border bg-secondary transition-colors duration-200 hover:border-primary/60"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-white">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-contain object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                          <FileText size={40} />
                        </div>
                      )}
                    </div>
                  </a>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {doc.page_count ? `${doc.page_count} page${doc.page_count === 1 ? '' : 's'} · ` : ''}
                    {formatBytes(doc.file_size)}
                  </p>
                  {doc.description && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {doc.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (isUploading) return;
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading tracking-wider">Upload a PDF</DialogTitle>
            <DialogDescription>
              Maximum 30 MB. A preview image is generated from the first page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-file">PDF file</Label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  id="doc-file"
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm tracking-wider border border-border bg-secondary text-secondary-foreground rounded-sm transition-colors duration-200 hover:border-primary/60 hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={15} />
                  Choose file
                </button>
                <span className="flex-1 text-sm text-muted-foreground truncate">
                  {file ? `${file.name} (${formatBytes(file.size)})` : 'No file chosen'}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is this document?"
                maxLength={200}
                disabled={isUploading}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="doc-description">Description</Label>
                <span className="text-xs text-muted-foreground">
                  {description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
              <Textarea
                id="doc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                placeholder="A line or two about it (optional)"
                rows={3}
                disabled={isUploading}
                className="mt-1 resize-none"
              />
            </div>

            {isUploading && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{stage}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetForm(); }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !file || !title.trim()}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? &ldquo;{pendingDelete?.title}&rdquo; and its stored file will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Yes, delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default MemberDocuments;
