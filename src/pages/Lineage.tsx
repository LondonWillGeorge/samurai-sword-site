import { Navigation } from '@/components/Navigation';
import { LineageSection } from '@/components/LineageSection';
import { Footer } from '@/components/Footer';

const Lineage = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <LineageSection />
      </div>
      <Footer />
    </main>
  );
};

export default Lineage;
