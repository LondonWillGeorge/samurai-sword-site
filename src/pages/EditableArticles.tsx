import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { FileEdit } from 'lucide-react';

/** Placeholder — the editing experience itself is still to be designed. */
const EditableArticles = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm tracking-wider">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
        <h1 className="font-heading text-3xl tracking-wider text-foreground mb-3">
          Editable Articles
        </h1>

        <div className="mt-10 max-w-xl rounded-sm border border-dashed border-border bg-card p-10 text-center">
          <FileEdit size={32} className="mx-auto mb-4 text-primary" />
          <h2 className="font-heading text-lg tracking-wider text-foreground mb-2">
            Coming soon
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is where members will be able to write and edit shared articles together —
            club history, technique notes, and training guidance.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditableArticles;
