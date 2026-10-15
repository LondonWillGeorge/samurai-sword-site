-- Public website videos page, managed by admins from the members area.
-- Anyone (including logged-out visitors) can read; only admins can change.

CREATE TABLE public.public_video_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.public_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.public_video_series(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX public_videos_series_order_idx ON public.public_videos (series_id, sort_order);

ALTER TABLE public.public_video_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public video series"
  ON public.public_video_series FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert public video series"
  ON public.public_video_series FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update public video series"
  ON public.public_video_series FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete public video series"
  ON public.public_video_series FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view public videos"
  ON public.public_videos FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert public videos"
  ON public.public_videos FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update public videos"
  ON public.public_videos FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete public videos"
  ON public.public_videos FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.public_video_series, public.public_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_video_series, public.public_videos TO authenticated;

-- Seed with the videos previously hard-coded in VideosSection.tsx, in page order.
WITH series AS (
  INSERT INTO public.public_video_series (title, sort_order)
  VALUES ('Tenshin Ryu In Motion', 0)
  RETURNING id
)
INSERT INTO public.public_videos (series_id, youtube_id, title, sort_order)
SELECT series.id, v.youtube_id, v.title, v.sort_order
FROM series, (VALUES
  ('4LcpgyGT9_Y', 'Jo (4-foot staff) Kata', 0),
  ('h17azJvqBpA', 'Tenshin Ryu Style - First 4 Standing Forms', 1),
  ('FFOFYasid8M', 'Tonfa Strikes Kata', 2),
  ('Mj-6IDGRpL8', 'Nagamaki Demonstration', 3),
  ('6LfYWCkKG0U', 'Sword Kata Moves followed by Tameshigiri Cutting', 4),
  ('Sq0PmR5-2_k', 'Sai Strikes Kata', 5),
  ('woLf7JKs19E', 'Sai Deflections/Blocks Kata', 6),
  ('Jsgz2TaFGeA', 'Jo (Staff) against Tonfa Demonstration - Robinson senseis', 7),
  ('28vAKJ18gss', 'Tonfa Deflections / Blocks Kata - Sensei Luke', 8),
  ('-aZCYn5ZWig', 'Jo (Staff) Strikes Kata - Sensei Luke', 9),
  ('qtt4ICD0Szw', 'Jutsu Tonfa Kata - Shihan Selvey', 10),
  ('TQL8X6yp_2Y', 'Double Cut Tameshigiri (higher dan grade cuts)', 11),
  ('0_6HvDojnxA', '2023 - Team Visit Japan - Wakayama Buddhist Temple', 12),
  ('RTZ33OvsmAo', '1980s? Otani Sensei Teaching Tenshin Ryu Style - 13th Seiza (seated) form - Seppuku', 13),
  ('_9rTOZ8zbOA', '2020 - Shihan Selvey - Japanese Sword advert', 14),
  ('cJy-R2rj0Mk', '1973 Hanshi Box and Shihan Selvey - Judo Demo', 15),
  ('t3jLTid4QDU', '1973 Hanshi Box and Shihan Selvey - Judo Demo - Part 2', 16),
  ('88sXOW3aw08', 'Shihan Selvey - 4 Cuts Tameshigiri', 17)
) AS v (youtube_id, title, sort_order);
