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
    <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5">
      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#F5C400]" /> {title}
      </h2>
      {children}
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-sm text-[#64748b] mt-0.5">Manage users, roles, and system preferences</p>
        </div>

        {/* Role Reference */}
        <SectionCard icon={Shield} title="Role-Based Access Control">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#060e1a] border border-[#1e2a3a]">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">HR Admin</span>
            <span className="text-xs text-[#94a3b8]">Full platform access — job requisitions, applications, settings, and management</span>
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
                className="flex-1 h-10 px-4 text-sm rounded-xl border border-[#1e2a3a] bg-[#060e1a] text-white placeholder-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400]"
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
            <Link to="/admin/email-templates" className="flex items-center gap-1 text-xs text-[#F5C400] hover:text-[#EFB506] font-semibold transition-colors">
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
                  to="/admin/email-templates"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#1e2a3a] hover:border-[#F5C400]/30 hover:bg-[#060e1a] transition-all"
                >
                  {tmpl
                    ? <CheckCircle className="w-3.5 h-3.5 text-[#F5C400] flex-shrink-0" />
                    : <Circle className="w-3.5 h-3.5 text-[#2d3f55] flex-shrink-0" />
                  }
                  <span className="text-xs text-[#94a3b8] font-medium flex-1">{STAGE_LABELS[stageKey]}</span>
                  <span className={`text-[10px] font-bold ${tmpl ? 'text-[#F5C400]' : 'text-[#4a5568] italic'}`}>
                    {tmpl ? 'Custom' : 'Default'}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-[#1e2a3a] flex items-center justify-between">
            <p className="text-[11px] text-[#4a5568]">
              {templates.filter(t => t.stageKey).length} of {STAGE_KEYS.length} stages customized
            </p>
            <Link to="/admin/email-templates" className="text-xs bg-[#F5C400]/10 text-[#F5C400] hover:bg-[#F5C400]/20 px-3 py-1.5 rounded-lg font-bold transition-colors border border-[#F5C400]/20">
              Edit Templates →
            </Link>
          </div>
        </SectionCard>

        {/* Notification Settings */}
        <SectionCard icon={Bell} title="Email Notification Settings">
          <p className="text-xs text-[#64748b] mb-4">Control which HR admins receive email alerts for new applications.</p>
          <div className="space-y-2">
            {users.filter(u => u.role === 'admin').map(u => {
              const enabled = u.notificationsEnabled !== false;
              const isToggling = togglingNotif === u.id;
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-[#060e1a] border border-[#1e2a3a]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#F5C400]">{(u.full_name || u.email)[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{u.full_name || u.email}</p>
                      <p className="text-[10px] text-[#4a5568]">{u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleNotification(u)}
                    disabled={isToggling}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-[#1e2a3a] text-[#64748b] border-[#2d3f55] hover:bg-[#2d3f55]'
                    }`}
                  >
                    {enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    {isToggling ? 'Saving...' : enabled ? 'On' : 'Off'}
                  </button>
                </div>
              );
            })}
            {users.filter(u => u.role === 'admin').length === 0 && (
              <p className="text-xs text-[#4a5568] text-center py-6">No admin users found.</p>
            )}
          </div>
        </SectionCard>

        {/* Users table */}
        <SectionCard icon={Users} title="Platform Users">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  <th className="text-left py-2 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Name</th>
                  <th className="text-left py-2 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Email</th>
                  <th className="text-left py-2 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a3a]/50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#060e1a] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#F5C400]">{(u.full_name || u.email)[0].toUpperCase()}</span>
                        </div>
                        <span className="text-xs font-semibold text-white">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#64748b]">{u.email}</td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
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
          <div className="space-y-2 text-xs text-[#64748b] leading-relaxed">
            {[
              'Application records are preserved with full audit trail even if email notifications are missed.',
              'EEO, disability, and veteran self-identification data is stored separately and access-restricted.',
              'All stage changes, note additions, and status updates are logged in the audit trail.',
              'Archived applications are retained for compliance record-keeping and are not permanently deleted.',
              'For secure deletion workflows, contact your system administrator.',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F5C400]/40 mt-1.5 flex-shrink-0" />
                <p>{t}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}