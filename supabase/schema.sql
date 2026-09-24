-- =============================================================================
-- Tenshin Warrior — full public schema (source of truth)
-- =============================================================================
-- This file is IDEMPOTENT: it can be re-run against the database any number of
-- times and will converge to the schema described here. Whenever the schema
-- changes, edit this file (and add a matching dated migration in ./migrations
-- if you use `supabase db push`), then re-run it:
--
--   psql "$DB_URL" -f supabase/schema.sql
--   -- or paste it into the SQL editor at
--   -- https://supabase.com/dashboard/project/vnuxihmrzwiypoatoziz/sql
--
-- $DB_URL is the connection string from
-- Dashboard -> Project Settings -> Database -> Connection string (URI).
--
-- Rules for editing:
--   * tables      -> CREATE TABLE IF NOT EXISTS, then ADD COLUMN IF NOT EXISTS
--   * policies    -> DROP POLICY IF EXISTS, then CREATE POLICY
--   * triggers    -> DROP TRIGGER IF EXISTS, then CREATE TRIGGER
--   * functions   -> CREATE OR REPLACE FUNCTION
--   * types/other -> guard with a DO block that checks the catalog first
-- Nothing here drops a table or a column, so running it is non-destructive.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------

-- CREATE TYPE has no IF NOT EXISTS form, so check the catalog first.
-- Note this guards existence only: adding a value to the enum later needs its
-- own `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS '...';` below.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END
$$;


-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- Profiles — one row per auth user, created by the on_auth_user_created trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles — admin membership is checked through public.has_role().
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Conversation titles (originally created as message_threads, renamed 2026-03-07).
CREATE TABLE IF NOT EXISTS public.conversation_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversation_titles
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Conversation messages (originally created as thread_messages, renamed 2026-03-07).
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.conversation_titles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS image_public_id TEXT;

-- Invitations — admin-issued sign-up tokens.
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Member videos — files uploaded through the upload-to-youtube Edge Function.
CREATE TABLE IF NOT EXISTS public.member_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.member_videos
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Member links — external videos and websites shared by members.
CREATE TABLE IF NOT EXISTS public.member_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'website',
  thumbnail_url TEXT,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_links_kind_check'
  ) THEN
    ALTER TABLE public.member_links
      ADD CONSTRAINT member_links_kind_check CHECK (kind IN ('video', 'website'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_links_description_length'
  ) THEN
    ALTER TABLE public.member_links
      ADD CONSTRAINT member_links_description_length CHECK (char_length(description) <= 150);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_links_title_length'
  ) THEN
    ALTER TABLE public.member_links
      ADD CONSTRAINT member_links_title_length CHECK (char_length(title) BETWEEN 1 AND 120);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS member_links_created_at_idx
  ON public.member_links (created_at DESC);

-- Member documents — PDFs held in the private `member-documents` storage
-- bucket. storage_path/thumbnail_path are object paths within that bucket, not
-- URLs: the bucket is private, so the app reads them through short-lived signed
-- URLs and nothing is ever publicly addressable.
CREATE TABLE IF NOT EXISTS public.member_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL UNIQUE,
  thumbnail_path TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  page_count INTEGER,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_documents_title_length'
  ) THEN
    ALTER TABLE public.member_documents
      ADD CONSTRAINT member_documents_title_length CHECK (char_length(title) BETWEEN 1 AND 200);
  END IF;

  -- Mirrors the 30 MB bucket limit so an oversized row cannot be recorded even
  -- if the storage upload were somehow bypassed.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'member_documents_file_size'
  ) THEN
    ALTER TABLE public.member_documents
      ADD CONSTRAINT member_documents_file_size CHECK (file_size >= 0 AND file_size <= 31457280);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS member_documents_created_at_idx
  ON public.member_documents (created_at DESC);

-- YouTube OAuth token cache — service-role only, no RLS policies.
CREATE TABLE IF NOT EXISTS public.youtube_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  access_token TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_titles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_links          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_tokens        ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- Functions
-- -----------------------------------------------------------------------------

-- Security-definer role check, so policies can test admin status without
-- recursing through user_roles' own RLS.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_admin_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('will_croxford@hotmail.com', 'tenshinryu@hotmail.co.uk') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Banning a user (setting auth.users.banned_until in the future) already stops
-- new sign-ins and token refreshes, but leaves existing sessions alive until
-- their access token expires. Ending the sessions here makes a ban immediate:
-- refresh tokens go with them (FK cascade), and the app's periodic session
-- check signs the browser out. Unbanning needs nothing — they just sign in.
CREATE OR REPLACE FUNCTION public.end_sessions_on_ban()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.banned_until IS NOT NULL AND NEW.banned_until > now() THEN
    DELETE FROM auth.sessions WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- -----------------------------------------------------------------------------
-- Policies
-- -----------------------------------------------------------------------------

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- conversation_titles
DROP POLICY IF EXISTS "Authenticated can view threads" ON public.conversation_titles;
CREATE POLICY "Authenticated can view threads"
  ON public.conversation_titles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can create threads" ON public.conversation_titles;
CREATE POLICY "Authenticated can create threads"
  ON public.conversation_titles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner can update thread" ON public.conversation_titles;
CREATE POLICY "Owner can update thread"
  ON public.conversation_titles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- A thread owner may delete their thread only while it is still "theirs alone":
-- as soon as another member has replied, the conversation belongs to everyone
-- and only the individual authors can remove their own messages. Admins keep an
-- unconditional override for moderation. Deleting a thread cascades to its
-- messages via conversation_messages.thread_id.
DROP POLICY IF EXISTS "Owner or admin can delete thread" ON public.conversation_titles;
CREATE POLICY "Owner or admin can delete thread"
  ON public.conversation_titles FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      auth.uid() = user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.conversation_messages m
        WHERE m.thread_id = conversation_titles.id
          AND m.user_id <> auth.uid()
      )
    )
  );

-- conversation_messages
DROP POLICY IF EXISTS "Authenticated can view messages" ON public.conversation_messages;
CREATE POLICY "Authenticated can view messages"
  ON public.conversation_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can create messages" ON public.conversation_messages;
CREATE POLICY "Authenticated can create messages"
  ON public.conversation_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner can update message" ON public.conversation_messages;
CREATE POLICY "Owner can update message"
  ON public.conversation_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner or admin can delete message" ON public.conversation_messages;
CREATE POLICY "Owner or admin can delete message"
  ON public.conversation_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- invitations
DROP POLICY IF EXISTS "Admins can view invitations" ON public.invitations;
CREATE POLICY "Admins can view invitations"
  ON public.invitations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- member_videos
DROP POLICY IF EXISTS "Authenticated can view member videos" ON public.member_videos;
CREATE POLICY "Authenticated can view member videos"
  ON public.member_videos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert own member videos" ON public.member_videos;
CREATE POLICY "Authenticated can insert own member videos"
  ON public.member_videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Uploader or admin can delete member videos" ON public.member_videos;
CREATE POLICY "Uploader or admin can delete member videos"
  ON public.member_videos FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));

-- member_links
DROP POLICY IF EXISTS "Authenticated can view member links" ON public.member_links;
CREATE POLICY "Authenticated can view member links"
  ON public.member_links FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert own member links" ON public.member_links;
CREATE POLICY "Authenticated can insert own member links"
  ON public.member_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Uploader or admin can update member links" ON public.member_links;
CREATE POLICY "Uploader or admin can update member links"
  ON public.member_links FOR UPDATE TO authenticated
  USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Uploader or admin can delete member links" ON public.member_links;
CREATE POLICY "Uploader or admin can delete member links"
  ON public.member_links FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));

-- member_documents
DROP POLICY IF EXISTS "Authenticated can view member documents" ON public.member_documents;
CREATE POLICY "Authenticated can view member documents"
  ON public.member_documents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert own member documents" ON public.member_documents;
CREATE POLICY "Authenticated can insert own member documents"
  ON public.member_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Uploader or admin can update member documents" ON public.member_documents;
CREATE POLICY "Uploader or admin can update member documents"
  ON public.member_documents FOR UPDATE TO authenticated
  USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Uploader or admin can delete member documents" ON public.member_documents;
CREATE POLICY "Uploader or admin can delete member documents"
  ON public.member_documents FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));

-- youtube_tokens: intentionally has no policies — service role access only.


-- -----------------------------------------------------------------------------
-- Storage: private bucket for member PDFs
-- -----------------------------------------------------------------------------

-- public = false, so objects are never served anonymously; the app requests
-- short-lived signed URLs instead. The 30 MB limit is enforced by storage
-- itself, which is what makes it authoritative rather than a UI convention.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-documents',
  'member-documents',
  false,
  31457280,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Any signed-in member may read; uploads are confined to a folder named after
-- the uploader's own id, so nobody can write into someone else's space.
DROP POLICY IF EXISTS "Members can read member documents" ON storage.objects;
CREATE POLICY "Members can read member documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-documents');

DROP POLICY IF EXISTS "Members can upload member documents" ON storage.objects;
CREATE POLICY "Members can upload member documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owner or admin can delete member documents" ON storage.objects;
CREATE POLICY "Owner or admin can delete member documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'member-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );


-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_admin_check ON auth.users;
CREATE TRIGGER on_auth_user_admin_check
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_assignment();

DROP TRIGGER IF EXISTS on_auth_user_banned ON auth.users;
CREATE TRIGGER on_auth_user_banned
  AFTER UPDATE OF banned_until ON auth.users
  FOR EACH ROW
  WHEN (NEW.banned_until IS DISTINCT FROM OLD.banned_until)
  EXECUTE FUNCTION public.end_sessions_on_ban();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_threads_updated_at ON public.conversation_titles;
CREATE TRIGGER update_threads_updated_at
  BEFORE UPDATE ON public.conversation_titles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- -----------------------------------------------------------------------------
-- Realtime publication
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversation_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversation_titles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_titles;
  END IF;
END
$$;
