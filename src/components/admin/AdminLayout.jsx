import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, Settings,
  Menu, Shield, ChevronRight, LogOut, CreditCard, Mail, X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BASE_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Job Requisitions', icon: Briefcase, to: '/jobs' },
  { label: 'Applications', icon: Users, to: '/applications' },
  { label: 'Email Templates', icon: Mail, to: '/email-templates' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

const BILLING_NAV = { label: 'Billing', icon: CreditCard, to: '/billing' };

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
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
            ? 'bg-[#F5C400]/10 text-[#b8910a] border border-[#F5C400]/30'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
        }`}
      >
        <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#b8910a]' : ''}`} />
        {item.label}
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F5C400]" />}
      </Link>
    );
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
            <img src={LOGO_URL} alt="Geolabs" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <div className="text-xs font-black text-gray-900 leading-tight tracking-wider">GEOLABS</div>
            <div className="text-[10px] text-[#b8910a] font-semibold tracking-wide">HR Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {nav.map(item => <NavItem key={item.to} item={item} />)}
      </nav>

      {/* User + Actions */}
      {currentUser && (
        <div className="px-3 pb-3 border-t border-gray-200 pt-3 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#b8910a]">{(currentUser.full_name || currentUser.email)[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-gray-900 truncate">{currentUser.full_name || currentUser.email}</div>
              <div className="text-[10px] text-gray-500">HR Admin</div>
            </div>
          </div>
          <a
            href="https://geolabs-employment.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <Shield className="w-3.5 h-3.5" />
            Applicant Portal
            <ChevronRight className="w-3 h-3 ml-auto" />
          </a>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-[11px] text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
            className="absolute top-4 left-60 z-50 p-2 rounded-lg bg-white border border-gray-200 text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Geolabs" className="w-6 h-6 object-contain" />
            <span className="text-sm font-bold text-gray-900">Geolabs HR</span>
          </div>
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}