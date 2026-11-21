import React, { useState } from 'react';
import { Menu, X, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="brand-header sticky top-0 bg-brand border-b border-brand-accent z-30">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-2 font-bold text-slate-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-3">
        Skip to main content
      </a>
      <div className="brand-container flex items-center justify-between h-[78px]">
        {/* Logo */}
        <Link to="/" state={{ scrollToTop: true }} className="brand-logo flex items-center bg-brand-accent px-3 sm:px-5 h-[78px] w-[190px] sm:w-[260px] flex-shrink-0" aria-label="Geolabs, Inc. careers home">
          <img
            src="/geolabs-50-logo-long.png"
            alt="Geolabs, Inc."
            width="580"
            height="186"
            className="w-full h-auto object-contain"
          />
        </Link>

        {/* Trust badge — Desktop */}
        <div className="hidden md:flex items-center gap-2 ml-auto text-xs font-semibold text-slate-300">
          <Lock aria-hidden="true" className="w-3.5 h-3.5 text-brand-accent" />
          Secure & Confidential
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center min-h-11 min-w-11 p-2 rounded-lg text-slate-200 hover:bg-white/10"
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
        <div id="mobile-menu" className="md:hidden bg-brand border-t border-white/10 px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pb-3 border-b border-white/10">
            <Lock aria-hidden="true" className="w-3.5 h-3.5 text-brand-accent" />
            Secure & Confidential
          </div>
        </div>
      )}
    </header>
  );
}
