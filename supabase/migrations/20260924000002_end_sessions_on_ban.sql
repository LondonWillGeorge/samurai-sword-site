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

DROP TRIGGER IF EXISTS on_auth_user_banned ON auth.users;
CREATE TRIGGER on_auth_user_banned
  AFTER UPDATE OF banned_until ON auth.users
  FOR EACH ROW
  WHEN (NEW.banned_until IS DISTINCT FROM OLD.banned_until)
  EXECUTE FUNCTION public.end_sessions_on_ban();
