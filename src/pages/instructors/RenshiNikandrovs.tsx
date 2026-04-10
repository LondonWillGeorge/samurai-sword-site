import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import renshiPhoto from '@/assets/renshi-nikandrovs.jpeg';

const RenshiNikandrovs = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-primary tracking-[0.3em] text-sm mb-4">INSTRUCTORS</p>
              <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
                Renshi Deniss Nikandrovs
              </h2>
              <div className="section-divider" />
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative">
                  <div className="japanese-border p-3 bg-card">
                    <img
                      src={renshiPhoto}
                      alt="Renshi Nikandrovs"
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-heading text-3xl text-foreground mb-2">
                      Renshi Deniss Nikandrovs
                    </h3>
                    <p className="text-primary tracking-wider text-sm">
                      4th Dan Iaido
                    </p>
                  </div>

                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      Deniss Nikandrovs learnt the art of Iaido under the direct tutelage of Shihan Mike Selvey, absorbing the traditional techniques and philosophy passed down through the lineage.
                    </p>
                    <p>
                      Alongside his Iaido training, he studied Kendo separately, broadening his understanding of the Japanese sword arts and developing a well-rounded martial foundation.
                    </p>
                    <p>
                      Now holding the rank of 4th Dan in Iaido and the title of Renshi, Deniss has many years of experience in the art and is dedicated to sharing his knowledge with students of all levels, fostering a deep appreciation for the discipline and spirit of Tenshin Ryu.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground">Training location:</span> Tonbo Yodokan, Carshalton, Surrey
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
};

export default RenshiNikandrovs;
