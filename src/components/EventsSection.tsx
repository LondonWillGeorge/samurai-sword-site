import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
  title: string;
  date: React.ReactNode;
  description: React.ReactNode;
  location?: string;
  featured?: boolean;
  link?: string;
}

const events: Event[] = [
  {
    title: 'Yodokan Summer Combined Training Seminar',
    date: (
      <>Saturday 29th August 2026 - <strong>Arrive 9.30AM</strong>, Finish 4PM - pub optional</>
    ),
    description: (
      <>A day of varied Budo activities, try out new forms of martial arts in a friendly and supportive environment. Open to all current students.
      <br/>
      <span className="text-accent font-medium">Click here for the full schedule!</span>
      </>
    ),
    location: 'Yabane Yodokan, Emmanuel United Reform Church, West Wickham, BR4 9JS',
    featured: true,
    link: '/events/seminar2026',
  },
  {
    title: 'Kagami Biraki',
    date: '6th January 2026',
    description: 'Annual New Year celebration with traditional Four Cuts ceremony and full syllabus practice including Katana, Wakazashi, Jo, and Kobudo.',
  },
  {
    title: 'Misogi in Brighton',
    date: '14th February 2026',
    description: 'A traditional spiritual ritual on Brighton Beach, to welcome the Japanese new year, open to all. This comprises a good period of warm-up exercises followed by walking into the sea, up to waist height, in white gi jackets and trousers. The aim is to stand still and silent in the sea for up to 4 minutes! There is also a paid sauna option next to the beach to warm up afterwards.',
  },
  {
    title: 'Grading Examinations',
    date: 'Twice per year, in summer and winter',
    description: 'Regular grading opportunities for students to progress through the DNBK International Division ranking system.',
  },
];

export const EventsSection = () => {
  return (
    <section id="events" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">UPCOMING & PAST EVENTS</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Join Us
          </h2>
          <div className="section-divider" />
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {events.map((event, index) => {
            const cardClassName = `japanese-border p-6 bg-card flex flex-col md:flex-row gap-6 ${
              event.featured
                ? 'ring-2 ring-accent/50 bg-gradient-to-br from-primary/10 via-card to-card shadow-[0_0_25px_-8px_hsl(var(--accent)/0.5)]'
                : ''
            } ${event.link ? 'cursor-pointer hover:ring-2 hover:ring-accent/50 transition-shadow' : ''}`;

            const cardContent = (
              <>
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-16 h-16 border ${
                    event.featured ? 'bg-accent/10 border-accent/40' : 'bg-primary/10 border-primary/30'
                  }`}
                >
                  <Calendar className={event.featured ? 'text-accent' : 'text-primary'} size={24} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-4 mb-2">
                    <h3 className="font-heading text-xl text-foreground">{event.title}</h3>
                    <span className="text-primary text-sm tracking-wider">{event.date}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                  {event.location && (
                    <p className="text-muted-foreground leading-relaxed mt-2">
                      <span className="text-foreground/80 font-medium">Place:</span> {event.location}
                    </p>
                  )}
                </div>
              </>
            );

            return event.link ? (
              <Link key={index} to={event.link} className={cardClassName}>
                {cardContent}
              </Link>
            ) : (
              <div key={index} className={cardClassName}>
                {cardContent}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Interested to find out more about our events or starting your training?
          </p>
          <a
            href="/schools"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 tracking-widest text-sm uppercase"
          >
            Find a School
          </a>
        </div>
      </div>
    </section>
  );
};
