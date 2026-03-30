import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { YouTubeVideo } from '@/components/YouTubeVideo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileVideo } from 'lucide-react';

interface MemberVideo {
  id: string;
  youtube_id: string;
  title: string;
  uploader_id: string;
  created_at: string;
}

const MemberVideos = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [videos, setVideos] = useState<MemberVideo[]>([]);
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('member_videos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load videos', description: error.message, variant: 'destructive' });
      return;
    }
    if (data) setVideos(data as MemberVideo[]);
  };

  useEffect(() => {
    if (user) fetchVideos();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm tracking-wider">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

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
    if (!videoFile || !title.trim()) return;

    setUploadProgress(0);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
      setUploadProgress(null);
      return;
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-youtube`);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('X-Video-Title', title.trim());
      xhr.setRequestHeader('X-Video-Mime-Type', videoFile.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = async () => {
        let json: { youtube_id?: string; error?: string };
        try {
          json = JSON.parse(xhr.responseText);
        } catch {
          toast({ title: 'Upload failed', description: 'Unexpected server response.', variant: 'destructive' });
          setUploadProgress(null);
          return;
        }

        if (xhr.status !== 200) {
          toast({ title: 'Upload failed', description: json.error ?? xhr.statusText, variant: 'destructive' });
          setUploadProgress(null);
          return;
        }

        if (!json.youtube_id) {
          toast({ title: 'Upload failed', description: 'No video ID returned.', variant: 'destructive' });
          setUploadProgress(null);
          return;
        }

        const { error: insertError } = await supabase.from('member_videos').insert({
          youtube_id: json.youtube_id,
          title: title.trim(),
          uploader_id: user.id,
        });
        if (insertError) {
          toast({ title: 'Video uploaded to YouTube but failed to save', description: insertError.message, variant: 'destructive' });
          setUploadProgress(null);
          return;
        }
        toast({ title: 'Video uploaded!', description: `"${title.trim()}" is now live.` });
        setTitle('');
        setVideoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchVideos();
        setUploadProgress(null);
      };

      xhr.onerror = () => {
        toast({ title: 'Network error during upload', variant: 'destructive' });
        setUploadProgress(null);
      };

      xhr.send(videoFile);
    } catch (err) {
      toast({ title: 'Network error', description: (err as Error).message, variant: 'destructive' });
      setUploadProgress(null);
    }
  };

  const isUploading = uploadProgress !== null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
        <h1 className="font-heading text-3xl tracking-wider text-foreground mb-3">Tenshin Warrior Member Videos</h1>
        <h3 className="text-sm tracking-wider text-muted-foreground mb-6 max-w-xl">Please feel free to load any Tenshin-related video here!<br/>
        Only logged-in members can view these videos.<br/>
        Please don't share outside the club, some people may not want their content shared publicly.</h3>

        {/* Upload section */}
        <section className="mb-12 max-w-xl">
          <h2 className="text-lg tracking-wider text-foreground mb-2">Upload a Video</h2>

          <Input
            id="video-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your video"
            disabled={isUploading}
            className="mb-3"
          />

          {isUploading && (
            <div className="mb-4 rounded border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-semibold mb-1">⚠ Upload in progress — please do not close or navigate away from this tab.</p>
              <p className="text-xs">You can open a new tab to continue browsing.</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="video-file">Video file (max 100 MB)</Label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  id="video-file"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm tracking-wider border border-border bg-secondary text-secondary-foreground rounded-sm transition-colors duration-200 hover:border-primary/60 hover:bg-muted hover:text-foreground active:bg-primary/15 active:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileVideo size={15} />
                  Choose file
                </button>
                <span className="flex-1 text-sm text-muted-foreground truncate">
                  {videoFile ? videoFile.name : 'No file chosen'}
                </span>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !videoFile || !title.trim()}
                  className="shrink-0"
                >
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
        </section>

        {/* Videos grid */}
        {videos.length === 0 ? (
          <p className="text-muted-foreground text-sm tracking-wider">No member videos yet. Be the first to upload!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <YouTubeVideo
                key={video.id}
                videoId={video.youtube_id}
                caption={video.title}
                aspectRatio="landscape"
                lazyLoad
                showSpeedSlider={true}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MemberVideos;
