import React from 'react';
import { BRAND_LOGO_URL } from '@/lib/brand';

export default function AppFooter() {
  return (
    <footer className="brand-footer bg-brand border-t border-brand text-white">

      <div className="py-8 px-[var(--page-gutter)]">
        <div className="max-w-[var(--page-max)] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={BRAND_LOGO_URL} alt="Geolabs, Inc." className="h-9 w-9 object-contain" />
            <p className="text-xs text-slate-200">
              © {new Date().getFullYear()} Geolabs, Inc. All rights reserved.
            </p>
          </div>
          <p className="text-xs text-slate-200">
            94-429 Koaki St, Suite 200 · Waipahu, HI 96797 · Equal Opportunity Employer
          </p>
        </div>
      </div>
    </footer>
  );
}
