import React from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { BRAND_LOGO_URL } from '@/lib/brand';

export default function Header() {
  return (
    <header className="portal-header">
      <a href="#main-content" className="portal-skip-link">Skip to main content</a>
      <div className="portal-header__inner">
        <a href="/" className="portal-brand" aria-label="Geolabs, Inc. careers home">
          <img src={BRAND_LOGO_URL} alt="" width="48" height="48" />
          <span><strong>Geolabs, Inc.</strong><span>Careers</span></span>
        </a>
        <div className="portal-header__links">
          <span className="portal-header__trust"><LockKeyhole aria-hidden="true" size={14} /> Secure & Confidential</span>
          <a href="/#open-roles">Open positions <ArrowUpRight aria-hidden="true" size={16} /></a>
        </div>
      </div>
    </header>
  );
}
