import React from 'react';
import { Shield } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/bdb109631_geolabs_trans.png';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#171C26] to-[#1F3451] border-b border-[#F5C400]/20 shadow-lg">
      <div className="w-full flex items-stretch justify-between">
        <a
          href="/"
          className="flex items-stretch hover:opacity-90 transition-opacity"
        >
          <div className="bg-[#F5C400] flex items-center justify-center px-4 py-2">
            <img src={LOGO_URL} alt="Geolabs Logo" className="h-12 w-auto object-contain" />
          </div>
        </a>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-300 px-4">
          <Shield className="w-3.5 h-3.5 text-[#F5C400]" />
          <span>Secure & Confidential</span>
        </div>
      </div>
    </header>
  );
}