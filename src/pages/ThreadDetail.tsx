import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ImageLightbox } from '@/components/ImageLightbox';
import { useToast } from '@/hooks/use-toast';
import { validateMessageImage, compressImageIfNeeded, uploadToCloudinary, getMessageImageUrl, getFullSizeUrl } from '@/lib/cloudinary';
import { ArrowLeft, Send, Trash2, ImagePlus, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  image_public_id?: string | null;
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const fetchThread = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('conversation_titles')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setThread(data);
  };

  const fetchMessages = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('thread_id', id)
      .order('created_at', { ascending: true });
    if (!error && data) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);
      const profileMap = (profilesData || []).reduce<Record<string, { display_name: string | null; email: string | null }>>((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {});
      setMessages(data.map(m => ({ ...m, profiles: profileMap[m.user_id] || null })));
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_messages', filter: `thread_id=eq.${id}` }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateMessageImage(file);
    if (error) {
      setImageError(error);
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setImageFile(file);
      setImageError('');
      // Note: oversized images are compressed automatically on send
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !user || !id) return;
    setIsSending(true);

    let imagePubId: string | undefined;
    if (imageFile) {
      try {
        const { file: fileToUpload, compressed, originalKB, compressedKB } = await compressImageIfNeeded(imageFile);
        if (compressed) {
          toast({
            title: 'Hai! I\'m afraid your image was too large, so it is being compressed',
            description: `Compressing from ${originalKB}kB to ${compressedKB}kB`,
          });
        }
        imagePubId = await uploadToCloudinary(fileToUpload);
      } catch (err) {
        toast({ title: 'Image upload failed', description: (err as Error).message, variant: 'destructive' });
        setIsSending(false);
        return;
      }
    }

    const { error } = await supabase
      .from('conversation_messages')
      .insert({
        thread_id: id,
        user_id: user.id,
        content: newMessage.trim(),
        ...(imagePubId ? { image_public_id: imagePubId } : {}),
      });
    setIsSending(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewMessage('');
      clearImage();
    }
  };

  const handleDeleteMessage = async () => {
    if (!pendingDeleteId) return;
    const { error } = await supabase.from('conversation_messages').delete().eq('id', pendingDeleteId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setMessages(prev => prev.filter(m => m.id !== pendingDeleteId));
    }
    setPendingDeleteId(null);
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
                        <button onClick={() => setPendingDeleteId(msg.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                  {msg.image_public_id && (
                    <div className="mt-2">
                      <img
                        src={getMessageImageUrl(msg.image_public_id)}
                        alt="attachment"
                        className="max-h-[100px] rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setLightboxImage(msg.image_public_id!)}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply form */}
          <form onSubmit={handleSend} className="space-y-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px]"
              maxLength={2000}
            />
            {/* Image attachment row */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ImagePlus size={14} /> Attach image
              </button>
              {imageFile && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {imageFile.name}
                  <button type="button" onClick={clearImage} className="hover:text-destructive transition-colors">
                    <X size={12} />
                  </button>
                </span>
              )}
              {imageError && <span className="text-xs text-destructive">{imageError}</span>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSending || (!newMessage.trim() && !imageFile)}>
                <Send size={16} />
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this message?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lightboxImage && (
        <ImageLightbox
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
          thumbnailSrc={getMessageImageUrl(lightboxImage)}
          fullSizeSrc={getFullSizeUrl(lightboxImage)}
          alt="Message attachment"
        />
      )}
    </div>
  );
};

export default ThreadDetail;
