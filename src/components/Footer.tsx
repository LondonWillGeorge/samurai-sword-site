export const Footer = () => {
  return (
    <footer className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <div className="font-heading text-3xl mb-4">
            <span className="text-primary">天心</span>
            <span className="text-foreground">武士</span>
          </div>
          
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Yodokan UK - Teaching the traditional arts of Iaido, Iaijutsu, and Kobudo in the spirit of the Samurai
          </p>

          <div className="section-divider mb-6" />

          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Yodokan UK. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
