import React from 'react';

export default function AppFooter() {
  return (
    <footer className="py-6 px-4 text-center">
      <p className="text-xs text-[#6b7280]">
        94-429 Koaki Street, Suite 200 · Waipahu, HI 96797 · Equal Opportunity Employer
      </p>
      <p className="text-[10px] text-[#9ca3af] mt-1">
        © {new Date().getFullYear()} Geolabs, Inc. All rights reserved.
      </p>
    </footer>
  );
}