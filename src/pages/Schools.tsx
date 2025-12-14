import { Navigation } from '@/components/Navigation';
import { SchoolsSection } from '@/components/SchoolsSection';
import { Footer } from '@/components/Footer';

const Schools = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SchoolsSection />
      </div>
      <Footer />
    </main>
  );
};

export default Schools;
