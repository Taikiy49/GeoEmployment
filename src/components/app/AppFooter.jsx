import React from 'react';

export default function AppFooter() {
  return (
    <footer className="bg-[#0d1117] border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png"
            alt="Geolabs"
            className="h-7 w-7 object-contain opacity-40"
          />
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Geolabs, Inc. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-xs text-gray-600">94-429 Koaki St, Suite 200 · Waipahu, HI 96797</p>
          <a href="/admin" className="text-xs text-gray-600 hover:text-[#F5C400] transition-colors font-medium">
            HR Admin Portal
          </a>
        </div>
      </div>
    </footer>
  );
}