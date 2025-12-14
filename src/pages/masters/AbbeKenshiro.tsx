import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import abbeKenshiro from '@/assets/abbe-kenshiro.jpg';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AbbeKenshiro = () => {
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
                Abbe Kenshiro
              </h1>
              <p className="text-primary text-lg tracking-wider">8th Dan - Founder of Kyushin Budo</p>
              <div className="section-divider" />
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="japanese-border p-2 bg-card">
                <img
                  src={abbeKenshiro}
                  alt="Abbe Kenshiro"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  Instructed in Kendo since age three, Abbe Kenshiro became Japan's youngest ever 5th Dan at the age of 18, demonstrating exceptional talent and dedication to the martial arts.
                </p>

                <p>
                  In 1955, he brought these arts to the United Kingdom, becoming a pioneering figure in introducing authentic Japanese martial arts to the Western world.
                </p>

                <p>
                  He founded Kyushin Budo, a comprehensive system of martial arts that integrated the principles he had learned from his masters, including Ogawa Kinnosuke.
                </p>

                <p>
                  Under his guidance, he began teaching Otani Tomio, ensuring the continuation of the lineage and the preservation of these ancient arts for future generations.
                </p>

                <p>
                  His influence extended beyond technique to encompass the philosophical foundations of Budo, emphasizing the development of character through disciplined practice.
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

export default AbbeKenshiro;
