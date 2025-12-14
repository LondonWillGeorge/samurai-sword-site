import { Navigation } from '@/components/Navigation';
import { InstructorsSection } from '@/components/InstructorsSection';
import { Footer } from '@/components/Footer';

const Instructors = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <InstructorsSection />
      </div>
      <Footer />
    </main>
  );
};

export default Instructors;
