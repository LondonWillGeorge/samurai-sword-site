import { Navigation } from '@/components/Navigation';
import { GallerySection } from '@/components/GallerySection';
import { Footer } from '@/components/Footer';

const Gallery = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <GallerySection />
      </div>
      <Footer />
    </main>
  );
};

export default Gallery;
