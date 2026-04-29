import React from 'react';
import { Shield } from 'lucide-react';

export default function AppFooter() {
  return (
    <footer className="bg-[#060e1a] border-t border-[#1e2a3a]">
      <div className="py-5 text-center border-b border-[#1e2a3a]">
        <a href="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#4a5568] hover:text-[#F5C400] transition-colors font-medium">
          <Shield className="w-3.5 h-3.5" /> HR Admin Portal
        </a>
      </div>
      <div className="py-7 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png"
              alt="Geolabs"
              className="h-6 w-6 object-contain opacity-30"
            />
            <p className="text-xs text-[#2d3f55]">
              © {new Date().getFullYear()} Geolabs, Inc. All rights reserved.
            </p>
          </div>
          <p className="text-xs text-[#2d3f55]">
            94-429 Koaki St, Suite 200 · Waipahu, HI 96797 · Equal Opportunity Employer
          </p>
        </div>
      </div>
    </footer>
  );
}