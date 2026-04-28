import React from 'react';
import { Shield } from 'lucide-react';

export default function AppFooter() {
  return (
    <footer className="bg-[#171C26]">
      <div className="py-6 text-center border-b border-gray-700">
        <a href="/admin" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors">
          <Shield className="w-3.5 h-3.5" /> HR Admin Portal
        </a>
      </div>
      <div className="py-8 px-6 border-t border-gray-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png"
              alt="Geolabs"
              className="h-6 w-6 object-contain opacity-40"
            />
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Geolabs, Inc. All rights reserved.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            94-429 Koaki St, Suite 200 · Waipahu, HI 96797 · Equal Opportunity Employer
          </p>
        </div>
      </div>
    </footer>
  );
}