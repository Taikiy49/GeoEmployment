import React from 'react';
import { BRAND_LOGO_URL } from '@/lib/brand';

export default function AppFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">

      <div className="py-7 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={BRAND_LOGO_URL} alt="Geolabs, Inc." className="h-9 w-9 object-contain" />
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Geolabs, Inc. All rights reserved.
            </p>
          </div>
          <p className="text-xs text-gray-600">
            94-429 Koaki St, Suite 200 · Waipahu, HI 96797 · Equal Opportunity Employer
          </p>
        </div>
      </div>
    </footer>
  );
}
