import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { YouTubeVideo } from '@/components/YouTubeVideo';
import { VideoSeriesMenu } from '@/components/VideoSeriesMenu';
import { VideoPagination } from '@/components/VideoPagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { parseYouTubeId, uploadToYouTube } from '@/lib/youtube';
import { fetchPublicVideos, pageCount, pageSlice, VIDEOS_PER_PAGE, type PublicVideo, type VideoSeries } from '@/lib/publicVideos';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ExternalLink, FileVideo, Pencil, Plus, Trash2, X,
} from 'lucide-react';

type OrderedTable = 'public_video_series' | 'public_videos';

const iconButton =
  'p-1 rounded-sm text-muted-foreground hover:text-primary transition-colors duration-200 disabled:opacity-30 disabled:pointer-events-none';

const nextSortOrder = (rows: { sort_order: number }[]) =>
  rows.reduce((max, r) => Math.max(max, r.sort_order), -1) + 1;

const AdminPublicVideos = () => {
  const { user, isAdmin, adminLoading, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [series, setSeries] = useState<VideoSeries[]>([]);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [page, setPage] = useState(1);

  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const [addMode, setAddMode] = useState<'link' | 'upload'>('link');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const load = async () => {
    try {
      const data = await fetchPublicVideos();
      setSeries(data.series);
      setVideos(data.videos);
    } catch (err) {
      toast({ title: 'Failed to load videos', description: (err as Error).message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const v of videos) result[v.series_id] = (result[v.series_id] ?? 0) + 1;
    return result;
  }, [videos]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm tracking-wider">Loading...</p>
      </div>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
          <p className="text-muted-foreground text-sm tracking-wider">This page is for admins only.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const selected = series.find(s => s.id === searchParams.get('series')) ?? series[0] ?? null;
  const seriesVideos = selected ? videos.filter(v => v.series_id === selected.id) : [];
  const totalPages = pageCount(seriesVideos.length);
  const currentPage = Math.min(page, totalPages);
  const isUploading = uploadProgress !== null;
  const busy = saving || isUploading;

  const selectSeries = (id: string) => {
    setSearchParams({ series: id });
    setPage(1);
    setEditingVideoId(null);
  };

  const fail = (title: string, err: { message: string }) =>
    toast({ title, description: err.message, variant: 'destructive' });

  // Rewrites sort_order to match the given order, touching only rows that moved.
  const saveOrder = async (table: OrderedTable, ordered: { id: string; sort_order: number }[]) => {
    const changed = ordered.map((row, i) => ({ id: row.id, from: row.sort_order, to: i })).filter(r => r.from !== r.to);
    const results = await Promise.all(
      changed.map(r => supabase.from(table).update({ sort_order: r.to }).eq('id', r.id)),
    );
    const error = results.find(r => r.error)?.error;
    if (error) fail('Failed to save order', error);
    await load();
  };

  const swap = <T,>(items: T[], index: number, offset: number) => {
    const copy = [...items];
    [copy[index], copy[index + offset]] = [copy[index + offset], copy[index]];
    return copy;
  };

  // ---- Series ----

  const handleAddSeries = async () => {
    const title = newSeriesTitle.trim();
    if (!title) return;
    const { data, error } = await supabase
      .from('public_video_series')
      .insert({ title, sort_order: nextSortOrder(series) })
      .select()
      .single();
    if (error) return fail('Failed to create series', error);
    setNewSeriesTitle('');
    await load();
    selectSeries(data.id);
  };

  const handleRenameSeries = async (id: string) => {
    const title = editingTitle.trim();
    if (!title) return;
    const { error } = await supabase.from('public_video_series').update({ title }).eq('id', id);
    if (error) return fail('Failed to rename series', error);
    setEditingSeriesId(null);
    await load();
  };

  const handleDeleteSeries = async (s: VideoSeries) => {
    const count = counts[s.id] ?? 0;
    const message = count
      ? `Delete the series "${s.title}" and remove its ${count} video${count === 1 ? '' : 's'} from the public page? The YouTube videos will not be affected.`
      : `Delete the empty series "${s.title}"?`;
    if (!window.confirm(message)) return;
    const { error } = await supabase.from('public_video_series').delete().eq('id', s.id);
    if (error) return fail('Failed to delete series', error);
    if (selected?.id === s.id) setSearchParams({});
    await load();
  };

  const startEditing = (id: string, title: string, kind: 'series' | 'video') => {
    setEditingTitle(title);
    setEditingSeriesId(kind === 'series' ? id : null);
    setEditingVideoId(kind === 'video' ? id : null);
  };

  const renderSeriesEditor = (s: VideoSeries) =>
    editingSeriesId === s.id ? (
      <div className="flex items-center gap-1 px-2 py-1">
        <Input
          value={editingTitle}
          onChange={e => setEditingTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRenameSeries(s.id);
            if (e.key === 'Escape') setEditingSeriesId(null);
          }}
          autoFocus
          className="h-8 text-sm"
        />
        <button onClick={() => handleRenameSeries(s.id)} title="Save" className={iconButton}><Check size={14} /></button>
        <button onClick={() => setEditingSeriesId(null)} title="Cancel" className={iconButton}><X size={14} /></button>
      </div>
    ) : null;

  const renderSeriesActions = (s: VideoSeries, index: number) => (
    <div className="flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
      <button onClick={() => saveOrder('public_video_series', swap(series, index, -1))} disabled={index === 0} title="Move up" className={iconButton}>
        <ArrowUp size={13} />
      </button>
      <button onClick={() => saveOrder('public_video_series', swap(series, index, 1))} disabled={index === series.length - 1} title="Move down" className={iconButton}>
        <ArrowDown size={13} />
      </button>
      <button onClick={() => startEditing(s.id, s.title, 'series')} title="Rename" className={iconButton}>
        <Pencil size={13} />
      </button>
      <button onClick={() => handleDeleteSeries(s)} title="Delete series" className={cn(iconButton, 'hover:text-destructive')}>
        <Trash2 size={13} />
      </button>
    </div>
  );

  // ---- Videos ----

  const resetAddForm = () => {
    setVideoTitle('');
    setVideoLink('');
    setVideoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveVideo = async (youtubeId: string, thumbnailUrl: string | null, failTitle: string) => {
    if (!selected) return;
    const { error } = await supabase.from('public_videos').insert({
      series_id: selected.id,
      youtube_id: youtubeId,
      thumbnail_url: thumbnailUrl,
      title: videoTitle.trim(),
      sort_order: nextSortOrder(seriesVideos),
      uploader_id: user.id,
    });
    if (error) return fail(failTitle, error);
    toast({ title: 'Video added', description: `"${videoTitle.trim()}" is now on the public videos page.` });
    resetAddForm();
    await load();
    // New videos go at the end of the series, so show the last page.
    setPage(Math.ceil((seriesVideos.length + 1) / VIDEOS_PER_PAGE));
  };

  const handleAddLink = async () => {
    const youtubeId = parseYouTubeId(videoLink);
    if (!youtubeId) {
      toast({ title: 'Not a YouTube link', description: 'Paste a YouTube video URL, e.g. https://youtu.be/…', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await saveVideo(youtubeId, null, 'Failed to save video');
    setSaving(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast({ title: 'Invalid file type', description: 'Please select a video file.', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    if (file.size > 104_857_600) {
      toast({ title: 'File too large', description: 'Video must be 100 MB or smaller.', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setVideoFile(file);
  };

  const handleUpload = async () => {
    if (!videoFile || !videoTitle.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
      return;
    }
    setUploadProgress(0);
    try {
      const uploaded = await uploadToYouTube(videoFile, videoTitle.trim(), session.access_token, setUploadProgress);
      await saveVideo(uploaded.youtube_id, uploaded.thumbnail_url, 'Video uploaded to YouTube but failed to save');
    } catch (err) {
      fail('Upload failed', err as Error);
    } finally {
      setUploadProgress(null);
    }
  };

  // Saves the title on the website, then renames the video on YouTube too. The
  // YouTube rename can fail independently (e.g. a video linked from another
  // channel), so the website title is kept either way.
  const handleRenameVideo = async (video: PublicVideo) => {
    const title = editingTitle.trim();
    if (!title) return;
    const { error } = await supabase.from('public_videos').update({ title }).eq('id', video.id);
    if (error) return fail('Failed to rename video', error);
    setEditingVideoId(null);
    await load();

    const { error: ytError } = await supabase.functions.invoke('update-youtube-title', {
      body: { youtube_id: video.youtube_id, title },
    });
    if (!ytError) {
      toast({ title: 'Video renamed', description: 'Updated on the website and on YouTube.' });
      return;
    }
    let body: { error?: string; reason?: string } = {};
    try {
      body = await (ytError as { context?: Response }).context?.json();
    } catch {
      // No JSON body (e.g. network failure); fall back to the generic message.
    }
    const description =
      body?.reason === 'forbidden'
        ? "YouTube refused the rename. This happens when the video belongs to another channel, or the club's YouTube login only has upload permission."
        : body?.reason === 'not_found'
          ? 'The video could not be found on YouTube. It may be private or deleted.'
          : body?.error ?? ytError.message;
    toast({ title: 'Renamed on the website only — not on YouTube', description, variant: 'destructive' });
  };

  const handleMoveToSeries = async (video: PublicVideo, seriesId: string) => {
    const target = videos.filter(v => v.series_id === seriesId);
    const { error } = await supabase
      .from('public_videos')
      .update({ series_id: seriesId, sort_order: nextSortOrder(target) })
      .eq('id', video.id);
    if (error) return fail('Failed to move video', error);
    toast({ title: 'Video moved', description: `Moved to "${series.find(s => s.id === seriesId)?.title}".` });
    await load();
  };

  const handleDeleteVideo = async (video: PublicVideo) => {
    if (!window.confirm(`Remove "${video.title}" from the public videos page? The YouTube video will not be affected.`)) return;
    const { error } = await supabase.from('public_videos').delete().eq('id', video.id);
    if (error) return fail('Failed to remove video', error);
    await load();
  };

  const pageVideos = pageSlice(seriesVideos, currentPage);
  const pageOffset = (currentPage - 1) * VIDEOS_PER_PAGE;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl tracking-wider text-foreground mb-3">Public Videos</h1>
            <h3 className="text-sm tracking-wider text-muted-foreground max-w-xl">
              Admins only. Everything here appears on the public Tenshin Ryu In Motion page,
              visible to all website visitors. The first series is the one visitors see first.
            </h3>
          </div>
          <Link to={selected ? `/videos?series=${selected.id}` : '/videos'} target="_blank">
            <Button variant="outline" size="sm"><ExternalLink size={16} className="mr-1" />View public page</Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <VideoSeriesMenu
            series={series}
            counts={counts}
            selectedId={selected?.id ?? null}
            onSelect={selectSeries}
            renderActions={renderSeriesActions}
            renderOverride={renderSeriesEditor}
            footer={
              <div className="flex items-center gap-2">
                <Input
                  value={newSeriesTitle}
                  onChange={e => setNewSeriesTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSeries()}
                  placeholder="New series title"
                  className="h-8 text-sm"
                />
                <Button size="sm" onClick={handleAddSeries} disabled={!newSeriesTitle.trim()} title="Add series" className="h-8 px-2">
                  <Plus size={16} />
                </Button>
              </div>
            }
          />

          <div className="flex-1 min-w-0">
            {!selected ? (
              <p className="text-muted-foreground text-sm tracking-wider">Create a series on the left to start adding videos.</p>
            ) : (
              <>
                <h2 className="font-heading text-2xl tracking-wider text-foreground mb-6">{selected.title}</h2>

                {/* Add video */}
                <section className="mb-10 max-w-xl bg-card border border-border rounded-sm p-4">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <h3 className="text-lg tracking-wider text-foreground">Add a Video</h3>
                    <div className="flex border border-border rounded-sm overflow-hidden text-xs tracking-wider">
                      {(['link', 'upload'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setAddMode(mode)}
                          disabled={busy}
                          className={cn(
                            'px-3 py-1.5 transition-colors',
                            addMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary',
                          )}
                        >
                          {mode === 'link' ? 'YouTube link' : 'Upload file'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    value={videoTitle}
                    onChange={e => setVideoTitle(e.target.value)}
                    placeholder="Video title (shown to visitors)"
                    disabled={busy}
                    className="mb-3"
                  />

                  {addMode === 'link' ? (
                    <div className="flex items-center gap-3">
                      <Input
                        value={videoLink}
                        onChange={e => setVideoLink(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && videoTitle.trim() && videoLink.trim() && handleAddLink()}
                        placeholder="https://youtu.be/…"
                        disabled={busy}
                      />
                      <Button onClick={handleAddLink} disabled={busy || !videoTitle.trim() || !videoLink.trim()} className="shrink-0">
                        Add Video
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isUploading && (
                        <div className="rounded border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
                          <p className="font-semibold mb-1">⚠ Upload in progress — please do not close or navigate away from this tab.</p>
                          <p className="text-xs">You can open a new tab to continue browsing.</p>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="public-video-file">Video file (max 100 MB)</Label>
                        <div className="mt-1 flex items-center gap-3">
                          <input
                            id="public-video-file"
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            disabled={busy}
                            className="sr-only"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={busy}
                            className="inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm tracking-wider border border-border bg-secondary text-secondary-foreground rounded-sm transition-colors duration-200 hover:border-primary/60 hover:bg-muted hover:text-foreground active:bg-primary/15 active:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FileVideo size={15} />
                            Choose file
                          </button>
                          <span className="flex-1 text-sm text-muted-foreground truncate">
                            {videoFile ? videoFile.name : 'No file chosen'}
                          </span>
                          <Button onClick={handleUpload} disabled={busy || !videoFile || !videoTitle.trim()} className="shrink-0">
                            {isUploading ? 'Uploading...' : 'Upload Video'}
                          </Button>
                        </div>
                      </div>
                      {isUploading && (
                        <div className="space-y-1">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Videos in this series */}
                {seriesVideos.length === 0 ? (
                  <p className="text-muted-foreground text-sm tracking-wider">No videos in this series yet.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pageVideos.map((video, i) => {
                        const index = pageOffset + i;
                        return (
                          <div key={video.id} className="bg-card border border-border rounded-sm p-3 flex flex-col gap-3">
                            {editingVideoId === video.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editingTitle}
                                  onChange={e => setEditingTitle(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleRenameVideo(video);
                                    if (e.key === 'Escape') setEditingVideoId(null);
                                  }}
                                  autoFocus
                                  className="h-8 text-sm"
                                />
                                <button onClick={() => handleRenameVideo(video)} title="Save" className={iconButton}><Check size={14} /></button>
                                <button onClick={() => setEditingVideoId(null)} title="Cancel" className={iconButton}><X size={14} /></button>
                              </div>
                            ) : (
                              <p title={video.title} className="text-sm tracking-wider text-foreground truncate h-8 leading-8">
                                {video.title}
                              </p>
                            )}

                            <YouTubeVideo
                              videoId={video.youtube_id}
                              aspectRatio="landscape"
                              showSpeedSlider={false}
                              lazyLoad
                            />

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => saveOrder('public_videos', swap(seriesVideos, index, -1))}
                                disabled={index === 0}
                                title="Move earlier"
                                className={iconButton}
                              >
                                <ArrowLeft size={15} />
                              </button>
                              <button
                                onClick={() => saveOrder('public_videos', swap(seriesVideos, index, 1))}
                                disabled={index === seriesVideos.length - 1}
                                title="Move later"
                                className={iconButton}
                              >
                                <ArrowRight size={15} />
                              </button>
                              <button onClick={() => startEditing(video.id, video.title, 'video')} title="Rename" className={iconButton}>
                                <Pencil size={14} />
                              </button>
                              {series.length > 1 && (
                                <Select value="" onValueChange={id => handleMoveToSeries(video, id)}>
                                  <SelectTrigger className="h-7 flex-1 min-w-0 text-xs">
                                    <SelectValue placeholder="Move to series…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {series.filter(s => s.id !== selected.id).map(s => (
                                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <button
                                onClick={() => handleDeleteVideo(video)}
                                title="Remove from public page"
                                className={cn(iconButton, 'ml-auto hover:text-destructive')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <VideoPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPublicVideos;
