import React from 'react';
import { Shield } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#171C26] to-[#1F3451] border-b border-[#F5C400]/20 shadow-lg">
      <div className="w-full px-4 py-3.5 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <img src={LOGO_URL} alt="Geolabs Logo" className="h-10 w-10 object-contain" />
          <div>
            <div className="text-sm font-bold text-white tracking-tight leading-tight">Geolabs, Inc.</div>
            <div className="text-[11px] text-gray-300 font-normal leading-tight">Geotechnical · Engineering · Drilling</div>
          </div>
        </a>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
          <Shield className="w-3.5 h-3.5 text-[#F5C400]" />
          <span>Secure & Confidential</span>
        </div>
      </div>
    </header>
  );
}