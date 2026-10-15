import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type VideoSeries = Tables<'public_video_series'>;
export type PublicVideo = Tables<'public_videos'>;

export const VIDEOS_PER_PAGE = 6;

// Only row metadata is fetched up front; the players themselves load lazily,
// so fetching every series in one go stays cheap.
export const fetchPublicVideos = async () => {
  const [seriesRes, videosRes] = await Promise.all([
    supabase.from('public_video_series').select('*').order('sort_order').order('created_at'),
    supabase.from('public_videos').select('*').order('sort_order').order('created_at'),
  ]);
  const error = seriesRes.error ?? videosRes.error;
  if (error) throw error;
  return { series: seriesRes.data, videos: videosRes.data };
};

export const pageCount = (itemCount: number) => Math.max(1, Math.ceil(itemCount / VIDEOS_PER_PAGE));

export const pageSlice = <T>(items: T[], page: number) =>
  items.slice((page - 1) * VIDEOS_PER_PAGE, page * VIDEOS_PER_PAGE);
