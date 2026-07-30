import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, Settings,
  Menu, Shield, ChevronRight, LogOut, CreditCard, Mail, X
} from 'lucide-react';
import { appClient } from '@/api/localClient';
import { BRAND_LOGO_URL } from '@/lib/brand';

const BASE_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Job Requisitions', icon: Briefcase, to: '/admin/jobs' },
  { label: 'Applications', icon: Users, to: '/admin/applications' },
  { label: 'Email Templates', icon: Mail, to: '/admin/email-templates' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
];

const BILLING_NAV = { label: 'Billing', icon: CreditCard, to: '/admin/billing' };

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    appClient.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const nav = currentUser?.email === 'taikiy49@gmail.com'
    ? [...BASE_NAV, BILLING_NAV]
    : BASE_NAV;

  const NavItem = ({ item }) => {
    const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
    return (
      <Link
        to={item.to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? 'bg-[#A65F2A] text-white border border-[#C7834F] shadow-lg shadow-black/10'
            : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
        }`}
      >
        <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : ''}`} />
        {item.label}
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#111923] border-r border-white/10">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={BRAND_LOGO_URL} alt="Geolabs, Inc." className="w-11 h-11 object-contain" />
          <div>
            <div className="text-[10px] text-[#D69A6B] font-semibold tracking-wide">HR Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {nav.map(item => <NavItem key={item.to} item={item} />)}
      </nav>

      {/* User + Actions */}
      {currentUser && (
        <div className="px-3 pb-3 border-t border-white/10 pt-3 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#A65F2A]/10 border border-[#A65F2A]/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#8A4A22]">{(currentUser.full_name || currentUser.email)[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-white truncate">{currentUser.full_name || currentUser.email}</div>
              <div className="text-[10px] text-slate-400">HR Admin</div>
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <Shield className="w-3.5 h-3.5" />
            Applicant Portal
            <ChevronRight className="w-3 h-3 ml-auto" />
          </a>
          <button
            onClick={() => appClient.auth.logout()}
            className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 fixed h-full z-20 shadow-sm">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 z-50 shadow-2xl">
            <Sidebar />
          </aside>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 left-60 z-50 p-2 rounded-lg bg-[#111923] border border-white/10 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#111923] border-b border-[#A65F2A]/40">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={BRAND_LOGO_URL} alt="Geolabs, Inc." className="w-9 h-9 object-contain" />
            <span className="text-sm font-bold text-white">Geolabs, Inc. HR</span>
          </div>
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
