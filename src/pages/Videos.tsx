import { Navigation } from '@/components/Navigation';
import { VideosSection } from '@/components/VideosSection';
import { Footer } from '@/components/Footer';

const Videos = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <VideosSection />
      </div>
      <Footer />
    </main>
  );
};

export default Videos;
