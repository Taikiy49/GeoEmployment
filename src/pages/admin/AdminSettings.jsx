import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Shield, Building, Plus, Bell, BellOff, Mail, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const STAGE_KEYS = ['under_review', 'phone_screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
const STAGE_LABELS = {
  under_review: 'Under Review', phone_screen: 'Phone Screen', interview: 'Interview',
  offer: 'Offer Extended', hired: 'Hired', rejected: 'Not Selected', withdrawn: 'Withdrawn',
};

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [togglingNotif, setTogglingNotif] = useState(null);

  const load = () => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === 'admin') {
        base44.entities.User.list().then(us => setUsers(us)).catch(() => {});
      }
    });
    base44.entities.EmailTemplate.list('-created_date', 100).then(t => setTemplates(t)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setInviteMessage('Please enter an email address'); return; }
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), 'admin');
      setInviteMessage('Invitation sent successfully!');
      setInviteEmail('');
      setTimeout(() => setInviteMessage(''), 3000);
      load();
    } catch (err) {
      setInviteMessage('Failed to send invitation: ' + err.message);
    }
    setInviting(false);
  };

  const handleToggleNotification = async (u) => {
    setTogglingNotif(u.id);
    const newVal = u.notificationsEnabled === false ? true : false;
    await base44.entities.User.update(u.id, { notificationsEnabled: newVal });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, notificationsEnabled: newVal } : x));
    setTogglingNotif(null);
  };

  const SectionCard = ({ icon: Icon, title, children }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#b8910a]" /> {title}
      </h2>
      {children}
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users, roles, and system preferences</p>
        </div>

        {/* Role Reference */}
        <SectionCard icon={Shield} title="Role-Based Access Control">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 whitespace-nowrap">HR Admin</span>
            <span className="text-xs text-gray-600">Full platform access — job requisitions, applications, settings, and management</span>
          </div>
        </SectionCard>

        {/* Invite */}
        {user?.role === 'admin' && (
          <SectionCard icon={Plus} title="Invite HR Admin">
            <div className="flex gap-2">
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="flex-1 h-10 px-4 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400]"
                onKeyPress={e => e.key === 'Enter' && handleInvite()}
              />
              <Button
                onClick={handleInvite}
                disabled={inviting}
                className="rounded-xl px-5 h-10 text-sm bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold"
              >
                {inviting ? 'Sending...' : 'Invite'}
              </Button>
            </div>
            {inviteMessage && (
              <p className={`text-xs mt-2 ${inviteMessage.includes('successfully') ? 'text-emerald-400' : 'text-red-400'}`}>
                {inviteMessage}
              </p>
            )}
          </SectionCard>
        )}

        {/* Email Templates Quick View */}
        <SectionCard icon={Mail} title="Candidate Email Templates">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#64748b]">Emails auto-sent when candidates move through hiring stages.</p>
            <Link to="/email-templates" className="flex items-center gap-1 text-xs text-[#b8910a] hover:text-[#F5C400] font-semibold transition-colors">
              Manage All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STAGE_KEYS.map(stageKey => {
              const stageTemplateMap = {};
              templates.forEach(t => { if (t.stageKey) stageTemplateMap[t.stageKey] = t; });
              const tmpl = stageTemplateMap[stageKey];
              return (
                <Link
                  key={stageKey}
                  to="/email-templates"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 hover:border-[#F5C400]/40 hover:bg-gray-50 transition-all"
                >
                  {tmpl
                    ? <CheckCircle className="w-3.5 h-3.5 text-[#b8910a] flex-shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  }
                  <span className="text-xs text-gray-600 font-medium flex-1">{STAGE_LABELS[stageKey]}</span>
                  <span className={`text-[10px] font-bold ${tmpl ? 'text-[#b8910a]' : 'text-gray-400 italic'}`}>
                    {tmpl ? 'Custom' : 'Default'}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              {templates.filter(t => t.stageKey).length} of {STAGE_KEYS.length} stages customized
            </p>
            <Link to="/email-templates" className="text-xs bg-[#F5C400]/10 text-[#b8910a] hover:bg-[#F5C400]/20 px-3 py-1.5 rounded-lg font-bold transition-colors border border-[#F5C400]/20">
              Edit Templates →
            </Link>
          </div>
        </SectionCard>

        {/* Notification Settings */}
        <SectionCard icon={Bell} title="Email Notification Settings">
          <p className="text-xs text-gray-500 mb-4">Control which HR admins receive email alerts for new applications.</p>
          <div className="space-y-2">
          {users.filter(u => u.role === 'admin').map(u => {
            const enabled = u.notificationsEnabled !== false;
            const isToggling = togglingNotif === u.id;
            return (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#b8910a]">{(u.full_name || u.email)[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{u.full_name || u.email}</p>
                    <p className="text-[10px] text-gray-400">{u.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleNotification(u)}
                  disabled={isToggling}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    enabled
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  {isToggling ? 'Saving...' : enabled ? 'On' : 'Off'}
                </button>
              </div>
            );
          })}
          {users.filter(u => u.role === 'admin').length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">No admin users found.</p>
          )}
          </div>
        </SectionCard>

        {/* Users table */}
        <SectionCard icon={Users} title="Platform Users">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Name</th>
                  <th className="text-left py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email</th>
                  <th className="text-left py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#b8910a]">{(u.full_name || u.email)[0].toUpperCase()}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">{u.email}</td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                        {u.role === 'admin' ? 'HR Admin' : u.role || 'User'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Compliance */}
        <SectionCard icon={Building} title="Compliance & Data Retention">
          <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
            {[
              'Application records are preserved with full audit trail even if email notifications are missed.',
              'EEO, disability, and veteran self-identification data is stored separately and access-restricted.',
              'All stage changes, note additions, and status updates are logged in the audit trail.',
              'Archived applications are retained for compliance record-keeping and are not permanently deleted.',
              'For secure deletion workflows, contact your system administrator.',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F5C400]/60 mt-1.5 flex-shrink-0" />
                <p>{t}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}