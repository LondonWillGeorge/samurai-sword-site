import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { label: 'About', href: '/#about' },
  { label: 'Lineage', href: '/lineage' },
  { label: 'Instructors', href: '/instructors' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Schools', href: '/schools' },
  { label: 'Events', href: '/events' },
];

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    // Handle anchor links on the same page
    if (href.startsWith('/#')) {
      const hash = href.substring(1);
      if (window.location.pathname === '/') {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const renderNavLink = (item: { label: string; href: string }) => {
    const isHashLink = item.href.startsWith('/#');
    
    if (isHashLink) {
      return (
        <Link
          key={item.href}
          to={item.href}
          onClick={() => handleNavClick(item.href)}
          className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
        >
          {item.label}
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
      >
        {item.label}
      </Link>
    );
  };

  const renderMobileNavLink = (item: { label: string; href: string }) => {
    const isHashLink = item.href.startsWith('/#');
    
    if (isHashLink) {
      return (
        <Link
          key={item.href}
          to={item.href}
          onClick={() => handleNavClick(item.href)}
          className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
        >
          {item.label}
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => setIsOpen(false)}
        className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-heading text-xl tracking-wider text-foreground">
            <span className="text-primary">天</span>心流
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(renderNavLink)}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {navItems.map(renderMobileNavLink)}
          </div>
        )}
      </div>
    </nav>
  );
};
