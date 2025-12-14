import { useState } from 'react';
import { Menu, X, ChevronDown, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { label: 'About', href: '/#about' },
  { 
    label: 'Lineage', 
    href: '/lineage',
    subItems: [
      { label: 'Otani Tomio', href: '/lineage/otani-tomio' },
      { label: 'Abbe Kenshiro', href: '/lineage/abbe-kenshiro' },
      { label: 'Ogawa Kinnosuke', href: '/lineage/ogawa-kinnosuke' },
    ]
  },
  { label: 'Instructors', href: '/instructors' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Schools', href: '/schools' },
  { label: 'Events', href: '/events' },
];

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    setOpenSubmenu(null);
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

  const renderNavLink = (item: { label: string; href: string; subItems?: { label: string; href: string }[] }) => {
    const isHashLink = item.href.startsWith('/#');
    const hasSubItems = item.subItems && item.subItems.length > 0;
    
    if (hasSubItems) {
      return (
        <div 
          key={item.href} 
          className="relative group"
          onMouseEnter={() => setOpenSubmenu(item.label)}
          onMouseLeave={() => setOpenSubmenu(null)}
        >
          <Link
            to={item.href}
            className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1"
          >
            {item.label}
            <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
          </Link>
          
          {openSubmenu === item.label && (
            <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-sm shadow-lg min-w-48 py-2 z-50">
              {item.subItems!.map((subItem) => (
                <Link
                  key={subItem.href}
                  to={subItem.href}
                  className="block px-4 py-2 text-sm tracking-wider text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }
    
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

  const renderMobileNavLink = (item: { label: string; href: string; subItems?: { label: string; href: string }[] }) => {
    const isHashLink = item.href.startsWith('/#');
    const hasSubItems = item.subItems && item.subItems.length > 0;
    
    if (hasSubItems) {
      return (
        <div key={item.href}>
          <Link
            to={item.href}
            onClick={() => handleNavClick(item.href)}
            className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
          >
            {item.label}
          </Link>
          <div className="pl-4 border-l border-border ml-2">
            {item.subItems!.map((subItem) => (
              <Link
                key={subItem.href}
                to={subItem.href}
                onClick={() => handleNavClick(subItem.href)}
                className="block py-2 text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }
    
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
      {/* Top bar with contact info */}
      <div className="hidden md:block border-b border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-end items-center h-8 gap-6 text-xs text-muted-foreground">
            <a href="mailto:info@tenshinryu.co.uk" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail size={12} />
              info@tenshinryu.co.uk
            </a>
            <a href="tel:+441onal234567890" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone size={12} />
              +44 (0) 20 1234 5678
            </a>
          </div>
        </div>
      </div>

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
            {/* Mobile contact info */}
            <div className="flex flex-col gap-2 pb-4 mb-4 border-b border-border text-xs text-muted-foreground">
              <a href="mailto:info@tenshinryu.co.uk" className="flex items-center gap-1.5">
                <Mail size={12} />
                info@tenshinryu.co.uk
              </a>
              <a href="tel:+4402012345678" className="flex items-center gap-1.5">
                <Phone size={12} />
                +44 (0) 20 1234 5678
              </a>
            </div>
            {navItems.map(renderMobileNavLink)}
          </div>
        )}
      </div>
    </nav>
  );
};
