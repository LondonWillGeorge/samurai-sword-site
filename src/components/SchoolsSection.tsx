import { MapPin, Clock, User } from 'lucide-react';

const schools = [
  {
    name: 'Tsunami Yodokan',
    instructor: 'Shihan Mike Selvey 7th Dan Kyoshi',
    address: '12, Beynon Road, Carshalton, Surrey SM5 3RL',
    schedule: 'Tuesdays 20:30 - 22:00',
  },
  {
    name: 'Kyushin Yodokan',
    instructor: 'Geoff Murray 6th Dan Kyoshi',
    address: 'Cowfold Village Hall RH13 8AA',
    schedule: 'Thursdays 18:00 - 20:00',
  },
  {
    name: 'Tengu Yodokan',
    instructor: 'Richard Jones 4th Dan Renshi',
    address: '5A The Southend, Ledbury HR8 2EY',
    schedule: 'Wednesdays 19:00',
  },
  {
    name: 'Tonbo Yodokan',
    instructor: 'Shidoin Denis Nikandrovs',
    address: '12, Beynon Road, Carshalton, Surrey SM5 3RL',
    schedule: 'Tuesdays 19:00 - 20:30',
  },
  {
    name: 'Fudoshin Yodokan',
    instructor: 'Sensei Demetri',
    address: 'Charles Major Centre, Duppas Hill Terrace, CR0 4BA',
    schedule: 'Thursdays 19:30 - 21:30',
  },
  {
    name: 'Yabane Yodokan',
    instructor: 'Sensei Crusoe',
    address: 'Emmanuel United Reform Church, West Wickham, BR4 9JS',
    schedule: 'Wednesdays 20:00 - 22:00',
  },
];

export const SchoolsSection = () => {
  return (
    <section id="schools" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">YODOKAN SCHOOLS</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Train With Us
          </h2>
          <div className="section-divider" />
          <p className="text-muted-foreground mt-6 max-w-2xl mx-auto italic">
            "The journey of 1000 steps begins with just one."
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {schools.map((school) => (
            <div
              key={school.name}
              className="japanese-border p-6 bg-card hover:border-primary/50 transition-colors duration-300"
            >
              <h3 className="font-heading text-xl text-foreground mb-4">
                {school.name}
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 text-muted-foreground">
                  <User size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>{school.instructor}</span>
                </div>
                
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>{school.address}</span>
                </div>
                
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Clock size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>{school.schedule}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
