import { Calendar } from 'lucide-react';

const events = [
  {
    title: 'Kagami Biraki',
    date: 'January 2025',
    description: 'Annual New Year celebration with traditional Four Cuts ceremony and full syllabus practice including Katana, Wakazashi, Jo, and Kobudo.',
  },
  {
    title: 'Combined Training Seminar',
    date: 'Spring 2025',
    description: 'Students from all Yodokan schools gather for intensive training in Iaido, Iaijutsu, Aikido, and two-person Katana kata.',
  },
  {
    title: 'Grading Examinations',
    date: 'Throughout the year',
    description: 'Regular grading opportunities for students to progress through the DNBKID ranking system.',
  },
];

export const EventsSection = () => {
  return (
    <section id="events" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">UPCOMING EVENTS</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Join Us
          </h2>
          <div className="section-divider" />
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {events.map((event, index) => (
            <div
              key={index}
              className="japanese-border p-6 bg-card flex flex-col md:flex-row gap-6"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-primary/10 border border-primary/30">
                <Calendar className="text-primary" size={24} />
              </div>
              
              <div>
                <div className="flex flex-wrap items-center gap-4 mb-2">
                  <h3 className="font-heading text-xl text-foreground">{event.title}</h3>
                  <span className="text-primary text-sm tracking-wider">{event.date}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Interested in attending an event or starting your training?
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
