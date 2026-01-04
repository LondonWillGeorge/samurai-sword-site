import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 text-[20rem] font-heading text-primary select-none">
          道
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 text-center max-w-lg">
        {/* 404 with Japanese styling */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-heading font-bold text-primary tracking-wider">
            404
          </h1>
          <div className="section-divider mt-4" />
        </div>
        
        {/* Message */}
        <div className="space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-heading text-foreground">
            Path Not Found
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            The way you seek does not exist here. Like a sword stroke through empty air, 
            this path leads nowhere.
          </p>
        </div>
        
        {/* Return home button */}
        <div className="japanese-border inline-block p-1 bg-card">
          <Link
            to="/"
            className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
          >
            <Home size={20} />
            <span className="text-sm tracking-widest uppercase font-medium">
              Return to Home
            </span>
          </Link>
        </div>
        
        {/* Secondary navigation hint */}
        <p className="mt-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
          <ArrowLeft size={14} />
          Or use the browser back button to return
        </p>
      </div>
      
      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-primary/30" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-primary/30" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-primary/30" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-primary/30" />
    </div>
  );
};

export default NotFound;
