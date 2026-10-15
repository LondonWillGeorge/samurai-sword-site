import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { YouTubeVideo } from '@/components/YouTubeVideo';
import { VideoSeriesMenu } from '@/components/VideoSeriesMenu';
import { VideoPagination } from '@/components/VideoPagination';
import { fetchPublicVideos, pageCount, pageSlice, type PublicVideo, type VideoSeries } from '@/lib/publicVideos';

export const VideosSection = () => {
  const [series, setSeries] = useState<VideoSeries[]>([]);
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPublicVideos()
      .then(data => {
        setSeries(data.series);
        setVideos(data.videos);
        setStatus('ready');
      })
      .catch(err => {
        console.error('Failed to load videos:', err);
        setStatus('error');
      });
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const v of videos) result[v.series_id] = (result[v.series_id] ?? 0) + 1;
    return result;
  }, [videos]);

  // With no (or an unknown) series in the URL, show the first series.
  const requestedSeries = searchParams.get('series');
  const selected = series.find(s => s.id === requestedSeries) ?? series[0] ?? null;
  const seriesVideos = selected ? videos.filter(v => v.series_id === selected.id) : [];
  const totalPages = pageCount(seriesVideos.length);
  const page = Math.min(Math.max(1, Number(searchParams.get('page')) || 1), totalPages);

  const goTo = (seriesId: string, newPage: number) => {
    setSearchParams(newPage > 1 ? { series: seriesId, page: String(newPage) } : { series: seriesId });
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="videos" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">VIDEOS</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            {/* Non-breaking space holds the line while loading, so a linked series doesn't flash the default title */}
            {status === 'loading' ? '\u00A0' : selected?.title ?? 'Tenshin Ryu In Motion'}
          </h2>
          <p className="text-muted-foreground tracking-wide text-sm mb-4">
            Too fast to follow? Use slider below video to slow down or speed up!
            <br />
            After playing once, you can click bottom left video to play again, no
            need to click 'Watch again on YouTube'.
          </p>
          <div className="section-divider" />
        </div>

        {status === 'loading' && (
          <p className="text-center text-muted-foreground text-sm tracking-wider">Loading videos...</p>
        )}
        {status === 'error' && (
          <p className="text-center text-muted-foreground text-sm tracking-wider">
            Sorry, the videos couldn't be loaded. Please try again later.
          </p>
        )}

        {status === 'ready' && (
          <div ref={gridRef} className="scroll-mt-24 flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
            <VideoSeriesMenu
              series={series}
              counts={counts}
              selectedId={selected?.id ?? null}
              onSelect={id => goTo(id, 1)}
            />

            <div className="flex-1 min-w-0">
              {seriesVideos.length === 0 ? (
                <p className="text-muted-foreground text-sm tracking-wider">No videos in this series yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pageSlice(seriesVideos, page).map(video => (
                      <YouTubeVideo
                        key={video.id}
                        videoId={video.youtube_id}
                        caption={video.title}
                        lazyLoad
                      />
                    ))}
                  </div>
                  <VideoPagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={p => goTo(selected!.id, p)}
                  />
                </>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            More videos from our training sessions and events coming soon
          </p>
        </div>
      </div>
    </section>
  );
};
