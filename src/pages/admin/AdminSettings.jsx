import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, Users, Shield, Building, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '../../components/admin/AdminLayout';



export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  const load = () => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === 'admin') {
        base44.entities.User.list().then(us => setUsers(us)).catch(() => {});
      }
    });
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteMessage('Please enter an email address');
      return;
    }
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

  const ROLE_LABELS = {
    admin: 'HR Admin',
  };

  const ROLE_COLORS = {
    admin: 'bg-blue-100 text-blue-800',
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-navy">Settings</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Manage users, roles, and system preferences</p>
        </div>

        {/* Role Reference */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-bronze" /> Role-Based Access Control
          </h2>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#f9fafb] border border-[#f3f4f6]">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-blue-100 text-blue-800">
                HR Admin
              </span>
              <span className="text-xs text-[#6b7280]">Full platform access — job requisitions, applications, settings, and management</span>
            </div>
          </div>
          <p className="text-[10px] text-[#9ca3af] mt-3">
            Assign the HR Admin role to team members who need full platform access.
          </p>
        </div>

        {/* Invite form - visible to all admins */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
            <h2 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-bronze" /> Invite HR Admin
            </h2>
            <div className="flex gap-2">
              <Input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="h-9 text-sm flex-1"
                onKeyPress={e => e.key === 'Enter' && handleInvite()}
              />
              <Button
                onClick={handleInvite}
                disabled={inviting}
                className="rounded-lg px-4 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white"
              >
                {inviting ? 'Sending...' : 'Invite'}
              </Button>
            </div>
            {inviteMessage && (
              <p className={`text-xs mt-2 ${inviteMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {inviteMessage}
              </p>
            )}
          </div>
        )}

        {/* Users table */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-bronze" /> Platform Users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e7eb]">
                  <th className="text-left py-2 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Name</th>
                  <th className="text-left py-2 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Email</th>
                  <th className="text-left py-2 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f9fafb]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#fafafa]">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-bronze-soft flex items-center justify-center">
                          <span className="text-[9px] font-bold text-bronze-dark">{(u.full_name || u.email)[0].toUpperCase()}</span>
                        </div>
                        <span className="text-xs font-medium text-navy">{u.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-[#6b7280]">{u.email}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                        {ROLE_LABELS[u.role] || u.role || 'Standard User'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[#9ca3af] mt-3">
            All users should be assigned the HR Admin role for full platform access.
          </p>
        </div>

        {/* Compliance */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-bronze" /> Compliance & Data Retention
          </h2>
          <div className="space-y-2 text-xs text-[#6b7280] leading-relaxed">
            <p>• Application records are preserved with full audit trail even if email notifications are missed.</p>
            <p>• EEO, disability, and veteran self-identification data is stored separately and access-restricted.</p>
            <p>• All stage changes, note additions, and status updates are logged in the audit trail.</p>
            <p>• Archived applications are retained for compliance record-keeping and are not permanently deleted.</p>
            <p>• For secure deletion workflows, contact your system administrator.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}