import React from 'react';

export default function AppFooter() {
  return (
    <footer className="py-8 px-6 border-t border-gray-100 mt-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png"
            alt="Geolabs"
            className="h-6 w-6 object-contain opacity-60"
          />
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Geolabs, Inc. All rights reserved.
          </p>
        </div>
        <p className="text-xs text-gray-300">
          94-429 Koaki St, Suite 200 · Waipahu, HI 96797 · Equal Opportunity Employer
        </p>
      </div>
    </footer>
  );
}