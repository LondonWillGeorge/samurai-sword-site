-- Emails of members who have signed in at least once, for admins only.
-- Profiles can't answer this: sending an invite creates the auth user (and so
-- its profile) before the invitee has accepted, so only auth.users knows who
-- has actually signed in. disabled_until is the ban end for currently banned
-- members (NULL otherwise); they are listed after everyone else.
-- A function's result columns can't be changed in place, so drop it first.
DROP FUNCTION IF EXISTS public.list_registered_emails();
CREATE FUNCTION public.list_registered_emails()
RETURNS TABLE (email TEXT, disabled_until TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list registered emails' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT
      u.email::TEXT,
      CASE WHEN u.banned_until > now() THEN u.banned_until END
    FROM auth.users u
    WHERE u.last_sign_in_at IS NOT NULL
    ORDER BY (u.banned_until > now()) IS TRUE, lower(u.email);
END;
$$;
REVOKE ALL ON FUNCTION public.list_registered_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_registered_emails() TO authenticated;
