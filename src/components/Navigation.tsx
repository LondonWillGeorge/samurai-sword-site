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
            className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1 py-2"
          >
            {item.label}
            <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
          </Link>
          
          {/* Invisible bridge to prevent gap between trigger and dropdown */}
          <div className="absolute top-full left-0 h-2 w-full" />
          
          {openSubmenu === item.label && (
            <div className="absolute top-[calc(100%+0.5rem)] left-0 bg-background border border-border rounded-sm shadow-lg min-w-48 py-2 z-50">
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
      const isSubmenuOpen = openSubmenu === item.label;
      return (
        <div 
          key={item.href}
          onMouseEnter={() => setOpenSubmenu(item.label)}
        >
          <div className="flex items-center justify-between">
            <Link
              to={item.href}
              onClick={() => handleNavClick(item.href)}
              className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors flex-1"
            >
              {item.label}
            </Link>
            <button
              onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.label)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
          <div 
            className={`overflow-hidden transition-all duration-200 ${
              isSubmenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
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
        </div>
      );
    }
    
    if (isHashLink) {
      return (
        <Link
          key={item.href}
          to={item.href}
          onClick={() => handleNavClick(item.href)}
          onMouseEnter={() => setOpenSubmenu(null)}
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
        onMouseEnter={() => setOpenSubmenu(null)}
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
            <a href="mailto:tenshinryu@hotmail.co.uk" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail size={12} />
              info@tenshinryu.co.uk
            </a>
            <a href="tel:07715255150" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone size={12} />
              0771 5255150
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-heading text-xl tracking-wider text-foreground">
            <span className="text-primary">天心</span>武士
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
              <a href="mailto:tenshinryu@hotmail.co.uk" className="flex items-center gap-1.5">
                <Mail size={12} />
                tenshinryu@hotmail.co.uk
              </a>
              <a href="tel:07715255150" className="flex items-center gap-1.5">
                <Phone size={12} />
                0771 5255150
              </a>
            </div>
            {navItems.map(renderMobileNavLink)}
          </div>
        )}
      </div>
    </nav>
  );
};
