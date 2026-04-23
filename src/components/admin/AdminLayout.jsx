import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, Settings,
  Menu, Shield, ChevronRight, LogOut, CreditCard
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BILLING_EMAIL = 'taikiy49@gmail.com';

const BASE_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Job Requisitions', icon: Briefcase, to: '/admin/jobs' },
  { label: 'Applications', icon: Users, to: '/admin/applications' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  const NAV = userEmail === BILLING_EMAIL
    ? [...BASE_NAV, { label: 'Billing', icon: CreditCard, to: '/admin/billing' }]
    : BASE_NAV;

  const NavItem = ({ item }) => {
    const active = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to));
    return (
      <Link
        to={item.to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-bronze text-white'
            : 'text-[#374151] hover:bg-[#f3f4f6]'
        }`}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2.5">
          <img
            src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png"
            alt="Geolabs"
            className="w-8 h-8 object-contain"
          />
          <div>
            <div className="text-xs font-semibold text-navy leading-tight">Geolabs, Inc.</div>
            <div className="text-[10px] text-[#9ca3af]">HR Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => <NavItem key={item.to} item={item} />)}
      </nav>

      {/* Public portal link */}
      <div className="px-3 py-3 border-t border-[#e5e7eb]">
        <Link
          to="/"
          className="flex items-center gap-2 text-[11px] text-[#9ca3af] hover:text-bronze transition-colors px-3 py-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          Applicant Portal
          <ChevronRight className="w-3 h-3 ml-auto" />
        </Link>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-2 text-[11px] text-[#9ca3af] hover:text-red-500 transition-colors px-3 py-1.5 w-full text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-52 bg-white border-r border-[#e5e7eb] fixed h-full z-20">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-52 bg-white shadow-xl z-50">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-52 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e5e7eb]">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-[#f3f4f6]">
            <Menu className="w-5 h-5 text-navy" />
          </button>
          <span className="text-sm font-semibold text-navy">Geolabs HR Admin</span>
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}