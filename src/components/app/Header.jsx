import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/bdb109631_geolabs_trans.png';

const NAV_LINKS = [
  { label: 'Benefits', href: '#benefits' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm relative z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
          <img src={LOGO_URL} alt="Geolabs Logo" className="h-16 w-auto object-contain" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={e => {
                e.preventDefault();
                scrollTo(link.href.replace('#', ''));
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#b87333] uppercase tracking-wide transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#open-roles"
            onClick={e => { e.preventDefault(); scrollTo('open-roles'); }}
            className="ml-4 px-5 py-2 bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] text-sm font-bold rounded uppercase tracking-wide transition-all"
          >
            View Open Roles
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center px-2 text-gray-600 hover:text-gray-900"
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={e => {
                e.preventDefault();
                scrollTo(link.href.replace('#', ''));
                setMobileOpen(false);
              }}
              className="block px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-[#b87333] uppercase tracking-wide transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#open-roles"
            onClick={e => { e.preventDefault(); scrollTo('open-roles'); setMobileOpen(false); }}
            className="block px-4 py-2.5 bg-[#F5C400] text-[#0d1117] text-sm font-bold rounded uppercase text-center mt-2"
          >
            View Open Roles
          </a>
        </div>
      )}
    </header>
  );
}