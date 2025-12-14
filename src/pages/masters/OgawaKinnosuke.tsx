import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import ogawaKinnosuke from '@/assets/ogawa-kinnosuke.png';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const OgawaKinnosuke = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link 
            to="/lineage" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            <span className="text-sm tracking-wider uppercase">Back to Lineage</span>
          </Link>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-primary tracking-[0.3em] text-sm mb-4">LINEAGE</p>
              <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2">
                Ogawa Kinnosuke
              </h1>
              <p className="text-primary text-lg tracking-wider">10th Dan Swordmaster</p>
              <div className="section-divider" />
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="japanese-border p-2 bg-card">
                <img
                  src={ogawaKinnosuke}
                  alt="Ogawa Kinnosuke"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  One of only three masters granted the "Shijohosho" by the Emperor of Japan, Ogawa Kinnosuke was a legendary 10th Dan swordmaster whose influence shaped the future of Japanese martial arts.
                </p>

                <p>
                  In 1933 at the Butokukwai in Kyoto, he began to teach the art of swordsmanship to Abbe Kenshiro, passing down centuries of accumulated knowledge and technique.
                </p>

                <p>
                  His teachings emphasized not only technical perfection but also the spiritual and philosophical dimensions of the sword arts, creating a complete system of martial development.
                </p>

                <p>
                  The Shijohosho, an imperial recognition of the highest order, was bestowed upon only three masters in Japanese history, marking Ogawa Sensei as one of the most accomplished swordsmen of his era.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default OgawaKinnosuke;
