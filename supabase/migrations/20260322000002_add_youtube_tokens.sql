CREATE TABLE public.youtube_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  access_token TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.youtube_tokens ENABLE ROW LEVEL SECURITY;
-- No RLS policies — only accessible via service role key in Edge Function
