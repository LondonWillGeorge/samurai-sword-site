CREATE TABLE public.member_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view member videos"
  ON public.member_videos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert own member videos"
  ON public.member_videos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uploader_id);
