import React from 'react';
import { Shield } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/bdb109631_geolabs_trans.png';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#171C26] to-[#1F3451] shadow-lg relative z-30">
      <div className="w-full flex items-stretch justify-between">
        {/* Logo — overflows header */}
        <a href="/" className="flex items-stretch hover:opacity-90 transition-opacity flex-shrink-0">
          <div className="bg-[#F5C400] flex items-end justify-center px-6 pb-0 pt-2" style={{ marginBottom: '-14px' }}>
            <img src={LOGO_URL} alt="Geolabs Logo" className="h-20 w-auto object-contain" />
          </div>
        </a>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 px-5">
          <Shield className="w-3.5 h-3.5 text-[#F5C400]" />
          <span>Secure & Confidential</span>
        </div>
      </div>
    </header>
  );
}