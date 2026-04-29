import React from 'react';
import { Shield } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/bdb109631_geolabs_trans.png';

const NAV_LINKS = [
  { label: 'Open Roles', href: '#open-roles' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'About', href: '#eeo' },
];

export default function Header() {
  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="bg-gradient-to-r from-[#171C26] to-[#1F3451] shadow-lg relative z-30">
      <div className="w-full flex items-stretch justify-between">
        {/* Logo — overflows header slightly */}
        <a
          href="/"
          className="flex items-stretch hover:opacity-90 transition-opacity flex-shrink-0 relative"
          style={{ zIndex: 1 }}
        >
          <div className="bg-[#F5C400] flex items-end justify-center px-5 pb-1 pt-2" style={{ marginBottom: '-10px' }}>
            <img src={LOGO_URL} alt="Geolabs Logo" className="h-16 w-auto object-contain" />
          </div>
        </a>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1 px-4">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => scrollTo(e, link.href)}
              className="px-4 py-2 text-[12px] font-bold uppercase tracking-widest text-gray-300 hover:text-[#F5C400] transition-colors rounded-lg hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
          <div className="ml-3 flex items-center gap-1.5 text-[11px] text-gray-400 border-l border-white/10 pl-4">
            <Shield className="w-3.5 h-3.5 text-[#F5C400]" />
            <span>Secure & Confidential</span>
          </div>
        </nav>
      </div>
    </header>
  );
}