import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import otaniTomio from '@/assets/otani-tomio.jpg';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const OtaniTomio = () => {
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
                Otani Tomio
              </h1>
              <p className="text-primary text-lg tracking-wider">Master Budoka</p>
              <div className="section-divider" />
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="japanese-border p-2 bg-card">
                <img
                  src={otaniTomio}
                  alt="Otani Tomio"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p className="text-lg">
                  First born son of Masutaro Otani, 7th Dan Judo Master, Otani Tomio was immersed in martial arts from his earliest years.
                </p>

                <p>
                  Trained since childhood and became a Master Budoka under Abbe Sensei's guidance, inheriting the complete system of martial knowledge passed down through the lineage.
                </p>

                <p>
                  In 1984, he opened the Yodokan in South London, establishing a center for the teaching and preservation of authentic Japanese martial arts in the United Kingdom.
                </p>

                <p>
                  The Yodokan continues to serve as the headquarters for Tenshin Ryu, maintaining the traditions and teachings of the masters who came before.
                </p>

                <p>
                  Otani Sensei's dedication to preserving the authentic teachings ensures that the lineage remains unbroken, passing the art to new generations of practitioners.
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

export default OtaniTomio;
