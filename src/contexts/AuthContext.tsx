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
      (_event, session) => {
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

  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // Test locally at 10 seconds: 10 * 1000;
  // Inactivity timeout of 30 minutes, event listeners set in this script run client-side in browser.

  useEffect(() => {
    if (!user) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
        toast({ title: 'Logged out', description: 'You were logged out due to inactivity.' });
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
      setSession(null);
      setUser(null);
      setIsAdmin(false);
    }
  };

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
