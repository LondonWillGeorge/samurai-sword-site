import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [newFirstMessage, setNewFirstMessage] = useState('');
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
      .from('conversation_titles')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);
      const profileMap = (profilesData || []).reduce<Record<string, { display_name: string | null; email: string | null }>>((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {});
      setThreads(data.map(t => ({ ...t, profiles: profileMap[t.user_id] || null })));
    }
  };

  useEffect(() => {
    if (user) fetchThreads();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('threads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_titles' }, () => {
        fetchThreads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    setIsCreating(true);
    const { data, error } = await supabase
      .from('conversation_titles')
      .insert({ title: newTitle.trim(), user_id: user.id })
      .select('id')
      .single();
    if (error) {
      toast({ title: 'Error creating conversation', description: error.message, variant: 'destructive' });
      setIsCreating(false);
      return;
    }
    if (newFirstMessage.trim() && data?.id) {
      await supabase
        .from('conversation_messages')
        .insert({ thread_id: data.id, user_id: user.id, content: newFirstMessage.trim() });
    }
    setIsCreating(false);
    setNewTitle('');
    setNewFirstMessage('');
    fetchThreads();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground text-sm tracking-widest">Loading...</div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl tracking-wider"><span className="text-primary">掲</span>示板</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
              <Link to="/change-password">
              {/* To set Button without outline: variant="ghost" */}
                <Button variant="outline" size="sm"><KeyRound size={16} className="mr-1" />Change Password</Button>
              </Link>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setShowInvite(true)}>
                  <Users size={16} className="mr-1" /> Invite
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut size={16} className="mr-1" /> Sign Out
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <span className="font-heading text-3xl text-foreground">Message Board <span className="text-accent">Please be Polite!</span></span>
          </div>

          {/* New conversation form */}
          <form onSubmit={handleCreateThread} className="space-y-3 mb-8 p-4 bg-card border border-border rounded-sm">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-title">Title <span className="text-muted-foreground font-normal">(required)</span></Label>
                <span className="text-xs text-muted-foreground">{newTitle.length}/100</span>
              </div>
              <Input
                id="new-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Conversation title..."
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-message">First message <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="new-message"
                value={newFirstMessage}
                onChange={(e) => setNewFirstMessage(e.target.value)}
                placeholder="Write an opening message..."
                className="min-h-[80px]"
                maxLength={2000}
              />
            </div>
            <Button type="submit" disabled={isCreating || !newTitle.trim()}>
              <MessageSquarePlus size={16} className="mr-1" /> Start Conversation
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
