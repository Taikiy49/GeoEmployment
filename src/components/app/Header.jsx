import React from 'react';
import { Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="relative">
      <div
        className="px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0b1224 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <a
                href="https://www.geolabs.net"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-bronze to-bronze-dark flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-[#f9fafb] tracking-tight">
                    Geolabs, Inc.
                  </h1>
                  <p className="text-xs text-[rgba(229,231,235,0.92)] font-light">
                    Employment Application &amp; Required Notices
                  </p>
                </div>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12]">
                <Shield className="w-3 h-3 text-[#fdf2e9]" />
                <span className="text-[11px] font-medium text-[#fdf2e9] tracking-wide">
                  Secure · Confidential · Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-[3px] bg-gradient-to-r from-bronze-dark via-bronze to-bronze-light" />
    </header>
  );
}