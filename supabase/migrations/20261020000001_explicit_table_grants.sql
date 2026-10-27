-- Since 2026-10-30 Supabase no longer auto-grants Data API access to new tables
-- in "public". Existing tables keep their grants, so on the live project this
-- is a no-op; it makes a rebuild into a fresh project reach the tables too.
-- RLS policies still decide which rows each role sees.

GRANT SELECT ON
  public.public_video_series,
  public.public_videos
TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles,
  public.user_roles,
  public.conversation_titles,
  public.conversation_messages,
  public.invitations,
  public.member_videos,
  public.member_links,
  public.member_documents,
  public.public_video_series,
  public.public_videos
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles,
  public.user_roles,
  public.conversation_titles,
  public.conversation_messages,
  public.invitations,
  public.member_videos,
  public.member_links,
  public.member_documents,
  public.youtube_tokens,
  public.public_video_series,
  public.public_videos
TO service_role;
