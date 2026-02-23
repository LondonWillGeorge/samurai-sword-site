import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: { display_name: string | null; email: string | null } | null;
}

interface Thread {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
}

const ThreadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const fetchThread = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('message_threads')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setThread(data);
  };

  const fetchMessages = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('thread_messages')
      .select('*, profiles!thread_messages_user_id_fkey(display_name, email)')
      .eq('thread_id', id)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data.map(m => ({ ...m, profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles })));
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchThread();
      fetchMessages();
    }
  }, [user, id]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`thread-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'thread_messages', filter: `thread_id=eq.${id}` }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;
    setIsSending(true);
    const { error } = await supabase
      .from('thread_messages')
      .insert({ thread_id: id, user_id: user.id, content: newMessage.trim() });
    setIsSending(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewMessage('');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase.from('thread_messages').delete().eq('id', messageId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/messages" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} className="mr-1" /> Back to threads
          </Link>

          {thread && (
            <h1 className="font-heading text-2xl tracking-wider mb-8">{thread.title}</h1>
          )}

          {/* Messages */}
          <div className="space-y-4 mb-8">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No replies yet. Be the first to respond!</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`p-4 border rounded-sm ${msg.user_id === user.id ? 'bg-secondary border-primary/20' : 'bg-card border-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-accent">
                      {msg.profiles?.display_name || msg.profiles?.email?.split('@')[0] || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                      {(msg.user_id === user.id || isAdmin) && (
                        <button onClick={() => handleDeleteMessage(msg.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply form */}
          <form onSubmit={handleSend} className="flex gap-3">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 min-h-[60px]"
              maxLength={2000}
            />
            <Button type="submit" disabled={isSending || !newMessage.trim()} className="self-end">
              <Send size={16} />
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThreadDetail;
