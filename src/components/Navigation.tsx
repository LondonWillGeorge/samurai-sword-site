import { useState } from 'react';
import { Menu, X, ChevronDown, Phone, Mail, LogIn, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
  { 
    label: 'Instructors', 
    href: '#',
    noLink: true,
    subItems: [
      { label: 'Shihan Selvey', href: '/instructors/shihan-selvey' },
      { label: 'Renshi Nikandrovs', href: '/instructors/renshi-nikandrovs' },
    ]
  },
  { 
    label: 'Gallery', 
    href: '#',
    noLink: true,
    subItems: [
      { label: 'Club Photos New and Old', href: '/gallery' },
      { label: 'Tenshin Ryu In Motion', href: '/videos' },
    ]
  },
  { label: 'Schools', href: '/schools' },
  { label: 'Events', href: '/events' },
  { label: 'Contact / Free Trial', href: '/free-trial', highlight: true, twoLineLabel: true },
];

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsOpen(false);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

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

  const renderNavLink = (item: { label: string; href: string; highlight?: boolean; noLink?: boolean; twoLineLabel?: boolean; subItems?: { label: string; href: string }[] }) => {
    const isHashLink = item.href.startsWith('/#');
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (hasSubItems) {
      return (
        <div
          key={item.label}
          className="relative group"
          onMouseEnter={() => setOpenSubmenu(item.label)}
          onMouseLeave={() => setOpenSubmenu(null)}
        >
          {item.noLink ? (
            <span
              className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1 py-2 cursor-default"
            >
              {item.label}
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
            </span>
          ) : (
            <Link
              to={item.href}
              className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1 py-2"
            >
              {item.label}
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
            </Link>
          )}
          
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
          key={item.label}
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
        key={item.label}
        to={item.href}
        className={`text-sm tracking-widest uppercase transition-colors duration-300 ${
          item.highlight
            ? 'text-primary font-semibold hover:text-primary/80'
            : 'text-muted-foreground hover:text-primary'
        }`}
      >
        {item.twoLineLabel ? (
          <span className="flex flex-col items-center leading-tight text-center">
            <span>Contact /</span>
            <span>Free Trial</span>
          </span>
        ) : item.label}
      </Link>
    );
  };

  const renderMobileNavLink = (item: { label: string; href: string; highlight?: boolean; noLink?: boolean; twoLineLabel?: boolean; subItems?: { label: string; href: string }[] }) => {
    const isHashLink = item.href.startsWith('/#');
    const hasSubItems = item.subItems && item.subItems.length > 0;
    
    if (hasSubItems) {
      const isSubmenuOpen = openSubmenu === item.label;
      return (
        <div
          key={item.label}
        >
          <div className="flex items-center justify-between">
            {item.noLink ? (
              <button
                onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.label)}
                className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors flex-1 cursor-pointer text-left"
              >
                {item.label}
              </button>
            ) : (
              <Link
                to={item.href}
                onClick={() => handleNavClick(item.href)}
                className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors flex-1"
              >
                {item.label}
              </Link>
            )}
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
          key={item.label}
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
        key={item.label}
        to={item.href}
        onClick={() => setIsOpen(false)}
        onMouseEnter={() => setOpenSubmenu(null)}
        className={`block py-3 text-sm tracking-widest uppercase transition-colors ${
          item.highlight 
            ? 'text-primary font-semibold hover:text-primary/80' 
            : 'text-muted-foreground hover:text-primary'
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Left: Logo — natural width only */}
          <div className="flex-none">
            <Link to="/" className="font-heading text-xl tracking-wider text-foreground">
              <span className="text-primary">天心</span>武士
            </Link>
          </div>

          {/* Centre: Contact info — fills gap between logo and nav, centred (desktop only) */}
          <div className="hidden md:flex flex-1 flex-col items-center gap-0.5 pointer-events-none">
            <a href="mailto:tenshinryu@hotmail.co.uk" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors pointer-events-auto">
              <Mail size={14} />
              tenshinryu@hotmail.co.uk
            </a>
            <a href="tel:07715255150" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors pointer-events-auto">
              <Phone size={14} />
              0771 5255150
            </a>
          </div>

          {/* Right: Desktop nav + Mobile button */}
          <div className="flex-none flex items-center ml-auto">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map(renderNavLink)}
              {user ? (
                <div
                  className="relative group"
                  onMouseEnter={() => setOpenSubmenu('Members')}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <span className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1 py-2 cursor-default">
                    Members
                    <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
                  </span>
                  <div className="absolute top-full left-0 h-2 w-full" />
                  {openSubmenu === 'Members' && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 bg-background border border-border rounded-sm shadow-lg min-w-48 py-2 z-50">
                      <Link
                        to="/messages"
                        className="block px-4 py-2 text-sm tracking-wider text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                      >
                        Messages
                      </Link>
                      <Link
                        to="/member-videos"
                        className="block px-4 py-2 text-sm tracking-wider text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                      >
                        Member Videos
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1.5"
                >
                  <LogIn size={14} />
                  Login
                </Link>
              )}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="text-sm tracking-widest uppercase whitespace-nowrap text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-1.5"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-foreground"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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
            {user ? (
              <div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setOpenSubmenu(openSubmenu === 'Members' ? null : 'Members')}
                    className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors flex-1 cursor-pointer text-left"
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setOpenSubmenu(openSubmenu === 'Members' ? null : 'Members')}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${openSubmenu === 'Members' ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                <div className={`overflow-hidden transition-all duration-200 ${openSubmenu === 'Members' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="pl-4 border-l border-border ml-2">
                    <Link
                      to="/messages"
                      onClick={() => { setIsOpen(false); setOpenSubmenu(null); }}
                      className="block py-2 text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors"
                    >
                      Messages
                    </Link>
                    <Link
                      to="/member-videos"
                      onClick={() => { setIsOpen(false); setOpenSubmenu(null); }}
                      className="block py-2 text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors"
                    >
                      Member Videos
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <LogIn size={14} />
                Login
              </Link>
            )}
            {user && (
              <button
                onClick={handleSignOut}
                className="block py-3 text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 w-full text-left"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
