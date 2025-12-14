import { Link } from 'react-router-dom';
import ogawaKinnosuke from '@/assets/ogawa-kinnosuke.png';
import abbeKenshiro from '@/assets/abbe-kenshiro.jpg';
import otaniTomio from '@/assets/otani-tomio.jpg';

const lineageMembers = [
  {
    name: 'Otani Tomio',
    title: 'Master Budoka',
    image: otaniTomio,
    slug: 'otani-tomio',
    description: 'First born son of Masutaro Otani, 7th Dan Judo Master. Trained since childhood and became a Master Budoka under Abbe Sensei\'s guidance. In 1984, opened the Yodokan in South London.',
  },
  {
    name: 'Abbe Kenshiro',
    title: '8th Dan - Founder of Kyushin Budo',
    image: abbeKenshiro,
    slug: 'abbe-kenshiro',
    description: 'Instructed in Kendo since age three, became Japan\'s youngest ever 5th Dan at 18. In 1955, he brought these arts to the United Kingdom and began teaching Otani Tomio.',
  },
  {
    name: 'Ogawa Kinnosuke',
    title: '10th Dan Swordmaster',
    image: ogawaKinnosuke,
    slug: 'ogawa-kinnosuke',
    description: 'One of only three masters granted the "Shijohosho" by the Emperor of Japan. In 1933 at the Butokukwai in Kyoto, he began to teach the art of swordsmanship to Abbe Kenshiro.',
  },
];

export const LineageSection = () => {
  return (
    <section id="lineage" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">LINEAGE</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Our Heritage
          </h2>
          <div className="section-divider" />
          <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
            An unbroken lineage of masters passing down the ancient arts through generations
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-border to-primary hidden md:block" />

          {lineageMembers.map((member, index) => (
            <div
              key={member.name}
              className={`relative flex flex-col md:flex-row items-center gap-8 mb-16 ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Image */}
              <div className="w-full md:w-1/2 flex justify-center">
                <Link to={`/lineage/${member.slug}`} className="japanese-border p-2 bg-card max-w-xs cursor-pointer hover:border-primary transition-colors duration-300">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </Link>
              </div>

              {/* Center Dot */}
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background" />

              {/* Content */}
              <div className={`w-full md:w-1/2 text-center ${index % 2 === 1 ? 'md:text-right' : 'md:text-left'}`}>
                <Link to={`/lineage/${member.slug}`} className="hover:text-primary transition-colors">
                  <h3 className="font-heading text-2xl text-foreground mb-1">{member.name}</h3>
                </Link>
                <p className="text-primary text-sm tracking-wider mb-4">{member.title}</p>
                <p className="text-muted-foreground leading-relaxed">{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
