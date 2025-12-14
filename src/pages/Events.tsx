import { Navigation } from '@/components/Navigation';
import { EventsSection } from '@/components/EventsSection';
import { Footer } from '@/components/Footer';

const Events = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <EventsSection />
      </div>
      <Footer />
    </main>
  );
};

export default Events;
