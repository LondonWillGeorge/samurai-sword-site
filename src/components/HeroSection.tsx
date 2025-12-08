import heroBg from '@/assets/Tori_Gate_Royalty_Free_Cropped.jpeg';

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <p className="text-primary tracking-[0.3em] text-sm font-semibold mb-4 animate-fade-in">
          THE ART OF THE SAMURAI SWORD
        </p>
        
        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-light tracking-wide mb-6 animate-slide-up">
          <span className="block text-foreground">Tenshin Ryu</span>
          <span className="block text-primary mt-2">天心流</span>
        </h1>
        
        <div className="section-divider mb-8" />
        
        <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          The way of harmonising oneself in action through the ancient arts of Iaido, Iaijutsu, and Kobudo
        </p>
        
        <a
          href="#about"
          className="inline-block px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 tracking-widest text-sm uppercase"
        >
          Enter the Dojo
        </a>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-px h-16 bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  );
};
