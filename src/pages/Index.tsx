import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { AboutSection } from '@/components/AboutSection';
import { LineageSection } from '@/components/LineageSection';
import { InstructorsSection } from '@/components/InstructorsSection';
import { GallerySection } from '@/components/GallerySection';
import { SchoolsSection } from '@/components/SchoolsSection';
import { EventsSection } from '@/components/EventsSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <LineageSection />
      <InstructorsSection />
      <GallerySection />
      <SchoolsSection />
      <EventsSection />
      <Footer />
    </main>
  );
};

export default Index;
