import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Lock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const header = useRef(null);
  const menuButton = useRef(null);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.key]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        menuButton.current?.focus();
      }
    };
    const onOutside = event => {
      if (!header.current?.contains(event.target)) setMobileOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1151px)');
    const onBreakpoint = () => { if (desktop.matches) setMobileOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', onOutside);
    desktop.addEventListener('change', onBreakpoint);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('focusin', onOutside);
      desktop.removeEventListener('change', onBreakpoint);
    };
  }, [mobileOpen]);

  return (
    <header ref={header} className="brand-header">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-white px-4 py-2 font-bold text-slate-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-3">
        Skip to main content
      </a>
      <div className="brand-header-inner">
        {/* Logo */}
        <Link to="/" state={{ scrollToTop: true }} className="brand-logo" aria-label="Geolabs, Inc. careers home">
          <img
            src="/geolabs-50th-anniversary.png"
            alt="Geolabs, Inc."
            width="906"
            height="300"
          />
        </Link>

        {/* Trust badge — Desktop */}
        <div className="brand-header-trust items-center gap-2 ml-auto text-xs font-semibold text-slate-300">
          <Lock aria-hidden="true" className="w-3.5 h-3.5 text-brand-accent" />
          Secure & Confidential
        </div>

        {/* Mobile hamburger */}
        <button
          ref={menuButton}
          type="button"
          className="brand-menu-toggle"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" className="brand-mobile-menu">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Lock aria-hidden="true" className="w-3.5 h-3.5 text-brand-accent" />
            Secure & Confidential
          </div>
        </div>
      )}
    </header>
  );
}
