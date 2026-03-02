import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AcceptInvite = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get('error');
    const errorDesc = hashParams.get('error_description');

    if (error) {
      setErrorMessage(errorDesc?.replace(/\+/g, ' ') || 'The invitation link is invalid or has expired.');
      return;
    }

    const type = hashParams.get('type');
    if (type === 'invite' || type === 'signup' || type === 'recovery') {
      setIsValid(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setEmail(session.user.email || '');
        setIsValid(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: { display_name: displayName || undefined },
    });
    setIsLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome! Your account is set up.' });
      navigate('/messages');
    }
  };

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-md text-center">
            <h1 className="font-heading text-2xl mb-4 tracking-wider">Invitation Issue</h1>
            <p className="text-muted-foreground mb-6">
              {errorMessage || 'Invalid or expired invitation link.'}
            </p>
            {errorMessage && (
              <p className="text-sm text-muted-foreground">Please ask an admin to send you a new invitation.</p>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          <div className="japanese-border p-8 bg-card">
            <h1 className="font-heading text-2xl text-center mb-8 tracking-wider">Set Up Your Account</h1>
            {email && <p className="text-center text-muted-foreground text-sm mb-6">{email}</p>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AcceptInvite;
