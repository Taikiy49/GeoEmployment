import React, { useState } from 'react';
import { Menu, X, Lock } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/bdb109631_geolabs_trans.png';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm relative z-30">
      <div className="w-full flex items-center justify-between px-6 h-20">
        {/* Logo */}
        <a href="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0">
          <img src={LOGO_URL} alt="Geolabs Logo" className="h-20 w-auto object-contain" />
        </a>

        {/* Trust badge — Desktop */}
        <div className="hidden md:flex items-center gap-2 ml-auto text-xs font-semibold text-gray-600">
          <Lock className="w-3.5 h-3.5 text-[#F5C400]" />
          Secure & Confidential
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center text-gray-700 hover:text-gray-900"
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 pb-3 border-b border-gray-200">
            <Lock className="w-3.5 h-3.5 text-[#F5C400]" />
            Secure & Confidential
          </div>
        </div>
      )}
    </header>
  );
}