import React from 'react';
import { Shield } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img src={LOGO_URL} alt="Geolabs Logo" className="h-10 w-10 object-contain" />
          <div>
            <div className="text-sm font-bold text-gray-900 tracking-tight leading-tight">Geolabs, Inc.</div>
            <div className="text-[11px] text-gray-400 font-normal leading-tight">Geotechnical · Engineering · Drilling</div>
          </div>
        </a>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Shield className="w-3.5 h-3.5 text-bronze" />
          <span>Secure & Confidential</span>
        </div>
      </div>
    </header>
  );
}