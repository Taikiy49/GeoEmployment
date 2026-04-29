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
    <header className="bg-gradient-to-r from-[#171C26] to-[#1F3451] shadow-lg relative z-30">
      <div className="w-full flex items-stretch justify-between">
        {/* Logo block — overflows header */}
        <a href="/" className="flex items-stretch hover:opacity-90 transition-opacity flex-shrink-0">
          <div className="bg-[#F5C400] flex items-end justify-center px-6 pb-2 pt-2" style={{ marginBottom: '-18px' }}>
            <img src={LOGO_URL} alt="Geolabs Logo" className="h-28 w-auto object-contain" />
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 px-6">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={e => {
                e.preventDefault();
                const id = link.href.replace('#', '');
                scrollTo(id);
              }}
              className="px-4 py-2 text-base font-bold text-gray-200 hover:text-[#F5C400] hover:bg-white/5 rounded-lg transition-all tracking-wide"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#open-roles"
            onClick={e => { e.preventDefault(); scrollTo('open-roles'); }}
            className="ml-3 px-5 py-2 bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] text-base font-bold rounded-lg transition-all shadow-md shadow-[#F5C400]/20 tracking-wide"
          >
            View Open Roles
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center px-5 text-gray-300 hover:text-white"
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0f1825] border-t border-white/10 px-4 py-3 space-y-1">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={e => {
                e.preventDefault();
                scrollTo(link.href.replace('#', ''));
                setMobileOpen(false);
              }}
              className="block px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-[#F5C400] hover:bg-white/5 rounded-lg transition-all"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#open-roles"
            onClick={e => { e.preventDefault(); scrollTo('open-roles'); setMobileOpen(false); }}
            className="block px-4 py-2.5 bg-[#F5C400] text-[#0d1117] text-sm font-bold rounded-lg text-center mt-2"
          >
            View Open Roles
          </a>
        </div>
      )}
    </header>
  );
}