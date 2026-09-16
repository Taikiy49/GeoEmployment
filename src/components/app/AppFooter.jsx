import React from 'react';

export default function AppFooter() {
  return (
    <footer className="portal-footer">
      <div className="portal-footer__inner">
        <div><strong>Geolabs, Inc.</strong><p>Geotechnical engineering & drilling services</p></div>
        <div><p>94-429 Koaki St, Suite 200 · Waipahu, HI 96797</p><p>Equal Opportunity Employer</p></div>
        <p>© {new Date().getFullYear()} Geolabs, Inc.</p>
      </div>
    </footer>
  );
}
