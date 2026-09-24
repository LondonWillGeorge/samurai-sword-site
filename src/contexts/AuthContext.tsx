import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  mustSetPassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// supabase-js persists the session under `sb-<project-ref>-auth-token`.
// Derived from the configured URL so it stays correct if the project changes.
const SUPABASE_PROJECT_REF =
  import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? '';

// How long a signed-in member can be inactive before being signed out.
// To test, set it to something short such as 10 * 1000 (10 seconds).
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

// How often an open page checks whether the timeout has passed. Kept short so
// a short test timeout above is honoured promptly.
const INACTIVITY_CHECK_INTERVAL_MS = 2 * 1000;

const LAST_ACTIVITY_KEY = 'last-activity-at';

const readLastActivity = (): number | null => {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
};

const markActivity = () => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // Storage unavailable; the open-page checks simply won't find a timestamp.
  }
};

const clearActivity = () => {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Nothing to clear.
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') clearActivity();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminRole(session.user.id);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Invited members are signed in by the invite link itself, so the flag on
  // their account — set by the send-invite function — is what forces them
  // through /set-password before they can use anything else. Existing members
  // have no such flag and are unaffected.
  const mustSetPassword = user?.user_metadata?.must_set_password === true;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user || !mustSetPassword) return;
    if (location.pathname === '/set-password') return;
    navigate('/set-password', { replace: true });
  }, [user, loading, mustSetPassword, location.pathname, navigate]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) markActivity();
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // A stale or server-revoked session makes the global sign-out fail. If that
    // rejection propagated, the stored token would never be cleared and the user
    // would be stuck permanently "logged in" with no way out. Always fall back
    // to a local sign-out, which just drops the token from storage.
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Global sign out failed, clearing local session:', err);
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Last resort: drop the persisted token by hand so a bad session can
        // never trap someone in a logged-in state.
        localStorage.removeItem(`sb-${SUPABASE_PROJECT_REF}-auth-token`);
      }
    } finally {
      clearActivity();
      setSession(null);
      setUser(null);
      setIsAdmin(false);
    }
  };

  // The last-activity time is kept in localStorage rather than in a timer, so
  // it survives closing the tab or browser, a sleeping laptop, and is shared
  // across tabs — activity in any tab keeps the member signed in everywhere.
  useEffect(() => {
    if (!user) return;

    // A session restored with no recorded activity predates this check, or
    // came from an invite link; start its clock now rather than evicting it.
    if (readLastActivity() === null) markActivity();

    let lastWrite = 0;
    const onActivity = () => {
      // mousemove and scroll fire constantly; a few seconds' precision is plenty.
      const now = Date.now();
      if (now - lastWrite < 5000) return;
      lastWrite = now;
      markActivity();
    };

    let signingOut = false;
    const checkInactivity = async () => {
      const last = readLastActivity();
      if (signingOut || last === null || Date.now() - last < INACTIVITY_TIMEOUT_MS) return;
      signingOut = true;
      await signOut();
      toast({ title: 'Logged out', description: 'You were logged out due to inactivity.' });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkInactivity();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = setInterval(checkInactivity, INACTIVITY_CHECK_INTERVAL_MS);
    // Check before recording anything, so returning to a stale session signs out.
    checkInactivity();

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, mustSetPassword, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
