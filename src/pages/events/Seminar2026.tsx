import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { ArrowLeft, ImageOff } from 'lucide-react';

// Served from public/ (not a bundler import) so a missing/renamed file
// 404s at runtime instead of failing the whole site build.
const seminarSchedule = `${import.meta.env.BASE_URL}Summer_seminar_timetable_2026_final.png`;

const Seminar2026 = () => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            <span className="text-sm tracking-wider uppercase">Back to Events</span>
          </Link>

          <div className="text-center mb-12">
            <p className="text-primary tracking-[0.3em] text-sm mb-4">YODOKAN SUMMER COMBINED TRAINING SEMINAR</p>
            <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2">
              2026 Seminar Schedule
            </h1>
            <div className="section-divider" />
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="japanese-border p-3 bg-card">
              {imageFailed ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                  <ImageOff className="text-muted-foreground" size={40} />
                  <p className="text-muted-foreground">
                    Sorry, the schedule image couldn't be loaded. Please contact us for the full schedule.
                  </p>
                </div>
              ) : (
                <img
                  src={seminarSchedule}
                  alt="2026 Seminar Schedule"
                  className="w-full h-auto"
                  onError={() => setImageFailed(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Seminar2026;
