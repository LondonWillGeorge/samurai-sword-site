import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Forced password setup for newly invited members.
 *
 * Invited users arrive already signed in (the invite token is a login), so
 * without this step they would land straight in the members' area having never
 * chosen a password. AuthContext redirects anyone carrying the
 * `must_set_password` flag here and keeps them here until they submit.
 */
const SetPassword = () => {
  const { user, loading, mustSetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  // Leave only once the refreshed session actually shows the flag cleared,
  // otherwise the AuthContext guard would bounce us straight back here.
  useEffect(() => {
    if (submitted && !mustSetPassword) {
      navigate('/messages', { replace: true });
    }
  }, [submitted, mustSetPassword, navigate]);

  // Prefill the display name if the invite already carried one.
  useEffect(() => {
    const existing = user?.user_metadata?.display_name;
    if (typeof existing === 'string') setDisplayName(existing);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm tracking-wider">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Clearing must_set_password is what releases the AuthContext redirect.
    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        display_name: displayName.trim() || undefined,
        must_set_password: false,
      },
    });

    if (error) {
      setIsLoading(false);
      toast({ title: 'Could not set password', description: error.message, variant: 'destructive' });
      return;
    }

    // The profiles row is created by a trigger at sign-up, before any display
    // name exists, so keep it in step here — it's what other members see.
    if (displayName.trim()) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('user_id', user.id);
      if (profileError) {
        // Non-fatal: the password is set, which is the point of this page.
        console.error('Failed to update profile display name:', profileError);
      }
    }

    setIsLoading(false);
    setSubmitted(true);
    toast({ title: 'Welcome! Your password is set.' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          <div className="japanese-border p-8 bg-card">
            <h1 className="font-heading text-2xl text-center mb-2 tracking-wider">
              Set Your Password
            </h1>
            <p className="text-center text-muted-foreground text-sm mb-6">
              Choose a password to finish setting up your account.
            </p>
            {user.email && (
              <p className="text-center text-muted-foreground text-sm mb-6">{user.email}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  How other members will see you in messages.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Retype Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting password...' : 'Set Password & Continue'}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SetPassword;
