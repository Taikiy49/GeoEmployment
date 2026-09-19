import React, { useState } from 'react';
import { Menu, X, Lock } from 'lucide-react';
import { BRAND_LOGO_URL } from '@/lib/brand';
import { Link } from 'react-router-dom';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 bg-[#111923]/95 backdrop-blur-xl border-b border-[#A65F2A]/40 z-30 shadow-lg shadow-black/10">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-2 font-bold text-slate-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-3">
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 h-[4.5rem]">
        {/* Logo */}
        <Link to="/" state={{ scrollToTop: true }} className="flex items-center gap-1.5 group flex-shrink-0" aria-label="Geolabs, Inc. careers home">
          <img
            src={BRAND_LOGO_URL}
            alt="Geolabs, Inc."
            className="w-12 h-12 object-contain group-hover:-translate-y-0.5 transition-transform"
          />
          <span>
            <span className="block text-base leading-none font-extrabold tracking-[-0.015em] text-white">Geolabs, Inc.</span>
          </span>
        </Link>

        {/* Trust badge — Desktop */}
        <div className="hidden md:flex items-center gap-2 ml-auto text-xs font-semibold text-slate-300">
          <Lock aria-hidden="true" className="w-3.5 h-3.5 text-[#C7834F]" />
          Secure & Confidential
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center p-2 rounded-lg text-slate-200 hover:bg-white/10"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X aria-hidden="true" className="w-5 h-5" /> : <Menu aria-hidden="true" className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden bg-[#111923] border-t border-white/10 px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pb-3 border-b border-white/10">
            <Lock aria-hidden="true" className="w-3.5 h-3.5 text-[#C7834F]" />
            Secure & Confidential
          </div>
        </div>
      )}
    </header>
  );
}
