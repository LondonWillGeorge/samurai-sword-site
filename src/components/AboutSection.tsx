import iaidoIllustration from '@/assets/iaido-illustration.png';

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary tracking-[0.3em] text-sm mb-4">ABOUT US</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            The Path of the Sword
          </h2>
          <div className="section-divider" />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="text-lg">
              <span className="text-accent font-heading text-2xl">I</span>aido is the art of reacting to a surprise attack by counter attacking with a sword. The term does not translate into "The art of drawing the sword", but rather <span className="text-foreground font-medium">"Instant Awareness"</span>.
            </p>
            
            <p>
              An in-depth reading of the Japanese characters: <span className="text-primary">I</span> = being, <span className="text-primary">AI</span> = harmony, <span className="text-primary">DO</span> = way. "The way of harmonising oneself in action".
            </p>

            <p>
              The Iaidoka wields a sword not to control the opponent, but to control themselves. Iaido is mostly performed solo as a series of Waza against single or multiple imaginary opponents. Each form begins and ends with the sword sheathed.
            </p>

            <p>
              Iaido is an authentic martial art that proved its martial values in a time of constant battle and warfare, preserved and passed on directly from teacher to student over generations in an unbroken lineage for 450 years.
            </p>

            <div className="pt-4">
              <h3 className="font-heading text-foreground text-xl mb-4">We Also Teach</h3>
              <div className="flex flex-wrap gap-4">
                {['Iaijutsu', 'Kenjutsu', 'Kobudo', 'Tonfa', 'Sai', 'Jo'].map((art) => (
                  <span key={art} className="px-4 py-2 border border-border text-sm tracking-wider text-muted-foreground">
                    {art}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="japanese-border p-4 bg-card">
              <img
                src={iaidoIllustration}
                alt="Iaido illustration"
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 text-6xl font-heading text-primary/20">
              道
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
