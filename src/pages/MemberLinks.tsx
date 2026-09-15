import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, PlayCircle, Globe, ExternalLink, ImageOff } from 'lucide-react';

const DESCRIPTION_MAX = 150;

interface MemberLink {
  id: string;
  title: string;
  description: string;
  url: string;
  kind: string;
  thumbnail_url: string | null;
  uploader_id: string;
  created_at: string;
}

interface LinkPreview {
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  detected_kind: 'video' | 'website';
  url: string;
  error?: string;
}

const hostnameOf = (raw: string) => {
  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return raw;
  }
};

/** Tile image with a graceful fallback when the remote thumbnail won't load. */
const TileImage = ({ link }: { link: MemberLink }) => {
  const [failed, setFailed] = useState(false);
  const isVideo = link.kind === 'video';

  if (!link.thumbnail_url || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary text-muted-foreground">
        {isVideo ? <PlayCircle size={32} /> : <ImageOff size={28} />}
        <span className="px-4 text-center text-xs tracking-wider break-all">
          {hostnameOf(link.url)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={link.thumbnail_url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
};

const MemberLinks = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [links, setLinks] = useState<MemberLink[]>([]);
  const [fetching, setFetching] = useState(true);

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from('member_links')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load links', description: error.message, variant: 'destructive' });
    } else if (data) {
      setLinks(data as MemberLink[]);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (user) fetchLinks();
  }, [user]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setUrl('');
    setIsVideo(false);
  };

  /** Ask the Edge Function for a preview image; never blocks saving. */
  const resolvePreview = async (rawUrl: string): Promise<LinkPreview | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/link-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ url: rawUrl, kind: isVideo ? 'video' : 'website' }),
        },
      );
      const json: LinkPreview = await res.json();
      if (!res.ok) {
        toast({
          title: 'Could not read that page',
          description: json.error ?? 'Saving the link without a preview image.',
        });
        return null;
      }
      return json;
    } catch {
      toast({
        title: 'Could not generate a preview',
        description: 'Saving the link without a preview image.',
      });
      return null;
    }
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !url.trim()) return;
    setSaving(true);

    const preview = await resolvePreview(url.trim());

    const { error } = await supabase.from('member_links').insert({
      title: title.trim(),
      description: description.trim().slice(0, DESCRIPTION_MAX),
      url: preview?.url ?? url.trim(),
      kind: isVideo ? 'video' : 'website',
      thumbnail_url: preview?.thumbnail_url ?? null,
      uploader_id: user.id,
    });

    setSaving(false);

    if (error) {
      toast({ title: 'Failed to save link', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Link added', description: `"${title.trim()}" is now on the page.` });
    resetForm();
    setDialogOpen(false);
    fetchLinks();
  };

  const handleDelete = async (link: MemberLink) => {
    if (!window.confirm(`Remove "${link.title}" from this page?`)) return;
    const { error } = await supabase.from('member_links').delete().eq('id', link.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setLinks(prev => prev.filter(l => l.id !== link.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm tracking-wider">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  const canSave = title.trim().length > 0 && url.trim().length > 0 && !saving;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="font-heading text-3xl tracking-wider text-foreground">
            Videos &amp; Links
          </h1>
          <button
            onClick={() => setDialogOpen(true)}
            title="Add a video or website link"
            aria-label="Add a video or website link"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm tracking-wider border border-border bg-secondary text-secondary-foreground rounded-sm transition-colors duration-200 hover:border-primary/60 hover:bg-muted hover:text-foreground active:bg-primary/15 active:border-primary"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add link</span>
          </button>
        </div>

        <h3 className="text-sm tracking-wider text-muted-foreground mb-8 max-w-xl">
          Anything Tenshin-related from elsewhere on the web — videos, articles, other
          schools&apos; pages.<br />
          Add a link and it will appear here with a preview image.
        </h3>

        {fetching ? (
          <p className="text-muted-foreground text-sm tracking-wider">Loading links...</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground text-sm tracking-wider">
            No links yet — use the <span className="text-foreground">Add link</span> button to
            share the first one.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {links.map((link) => (
              <div key={link.id} className="group">
                {/* Title above the image, matching the Member Videos page */}
                <div className="flex items-center gap-2 mb-1 min-w-0">
                  {(isAdmin || link.uploader_id === user.id) && (
                    <button
                      onClick={() => handleDelete(link)}
                      title="Remove from page"
                      className="shrink-0 p-1 rounded-sm text-muted-foreground hover:text-destructive transition-colors duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {link.kind === 'video' ? (
                    <PlayCircle size={14} className="shrink-0 text-primary" />
                  ) : (
                    <Globe size={14} className="shrink-0 text-primary" />
                  )}
                  <span
                    title={link.title}
                    className="text-sm tracking-wider text-muted-foreground truncate"
                  >
                    {link.title}
                  </span>
                </div>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-sm border border-border bg-secondary transition-colors duration-200 hover:border-primary/60"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <TileImage link={link} />
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-sm bg-background/80 px-2 py-1 text-xs tracking-wider text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <ExternalLink size={12} />
                      Open
                    </span>
                  </div>
                </a>

                {link.description && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {link.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add-link modal */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (saving) return;
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading tracking-wider">Add a video or link</DialogTitle>
            <DialogDescription>
              The preview image is generated from the page when you save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is this?"
                maxLength={120}
                disabled={saving}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="link-description">Short description</Label>
                <span className="text-xs text-muted-foreground">
                  {description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
              <Textarea
                id="link-description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                placeholder="A line or two about it (optional)"
                rows={3}
                disabled={saving}
                className="mt-1 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="link-url">Link</Label>
              <Input
                id="link-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                disabled={saving}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between rounded-sm border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                {isVideo ? (
                  <PlayCircle size={16} className="text-primary" />
                ) : (
                  <Globe size={16} className="text-primary" />
                )}
                <Label htmlFor="link-kind" className="cursor-pointer">
                  {isVideo ? 'Video link' : 'Website link'}
                </Label>
              </div>
              <Switch
                id="link-kind"
                checked={isVideo}
                onCheckedChange={setIsVideo}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {saving ? 'Generating preview...' : 'Add link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MemberLinks;
