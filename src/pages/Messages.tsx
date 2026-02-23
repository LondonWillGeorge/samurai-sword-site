import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MessageSquarePlus, Users, LogOut, KeyRound } from 'lucide-react';
import { InviteDialog } from '@/components/InviteDialog';

interface Thread {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  profiles?: { display_name: string | null; email: string | null } | null;
}

const Messages = () => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const fetchThreads = async () => {
    const { data, error } = await supabase
      .from('message_threads')
      .select('*, profiles!message_threads_user_id_fkey(display_name, email)')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setThreads(data.map(t => ({ ...t, profiles: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles })));
    }
  };

  useEffect(() => {
    if (user) fetchThreads();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('threads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, () => {
        fetchThreads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    setIsCreating(true);
    const { error } = await supabase
      .from('message_threads')
      .insert({ title: newTitle.trim(), user_id: user.id });
    setIsCreating(false);
    if (error) {
      toast({ title: 'Error creating thread', description: error.message, variant: 'destructive' });
    } else {
      setNewTitle('');
      fetchThreads();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl tracking-wider">掲示板 <span className="text-lg text-muted-foreground ml-2">Message Board</span></h1>
            <div className="flex items-center gap-2">
              <Link to="/change-password">
                <Button variant="ghost" size="sm"><KeyRound size={16} className="mr-1" /> Password</Button>
              </Link>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setShowInvite(true)}>
                  <Users size={16} className="mr-1" /> Invite
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut size={16} className="mr-1" /> Sign Out
              </Button>
            </div>
          </div>

          {/* New thread form */}
          <form onSubmit={handleCreateThread} className="flex gap-3 mb-8">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Start a new discussion..."
              className="flex-1"
              maxLength={200}
            />
            <Button type="submit" disabled={isCreating || !newTitle.trim()}>
              <MessageSquarePlus size={16} className="mr-1" /> Post
            </Button>
          </form>

          {/* Thread list */}
          <div className="space-y-3">
            {threads.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No threads yet. Start the first discussion!</p>
            ) : (
              threads.map((thread) => (
                <Link
                  key={thread.id}
                  to={`/messages/${thread.id}`}
                  className="block p-4 bg-card border border-border hover:border-primary/50 transition-colors rounded-sm"
                >
                  <h3 className="font-heading text-lg tracking-wide">{thread.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {thread.profiles?.display_name || thread.profiles?.email?.split('@')[0] || 'Unknown'} · {new Date(thread.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
      <InviteDialog open={showInvite} onOpenChange={setShowInvite} />
    </div>
  );
};

export default Messages;
