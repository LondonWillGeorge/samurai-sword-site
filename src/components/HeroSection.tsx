import { Volume2 } from 'lucide-react';
import heroBg from '@/assets/Tori_Gate_Royalty_Free_Cropped.jpeg';

export const HeroSection = () => {
  const playPronunciation = () => {
    const utterance = new SpeechSynthesisUtterance('天心武士');
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

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
        
        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-light tracking-wide mb-6 animate-slide-up relative">
          <span className="block text-foreground relative inline-block">
            Tenshin Warrior
            <button
              onClick={playPronunciation}
              className="absolute -top-1 -right-8 md:-right-10 p-1 text-primary/70 hover:text-primary transition-colors"
              aria-label="Listen to pronunciation"
            >
              <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </span>
          <span className="block text-primary mt-2">天心武士</span>
        </h1>
        
        <div className="section-divider mb-8" />
        
        <p className="text-foreground/90 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-in drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ animationDelay: '0.3s' }}>
          Train with us in South London, in Tenshin Ryu - 天心流 - the ancient art of the Japanese sword.<br/>
          Complete beginners and experienced Martial Artists welcome!<br/>
          Free trial lesson.<br/>
          If you don't try, you will never know.
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
