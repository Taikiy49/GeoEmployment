import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, CheckCircle2, Building, Users, Zap, Shield, Cloud, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '../../components/admin/AdminLayout';

export default function Billing() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [appCount, setAppCount] = useState(0);
  const [reqCount, setReqCount] = useState(0);

  useEffect(() => {
    Promise.all([
      base44.entities.Subscription.list(),
      base44.entities.Application.filter({ status: 'active' }),
      base44.entities.JobRequisition.filter({ status: 'published' }),
    ]).then(([subs, apps, reqs]) => {
      const s = subs[0];
      setSub(s || null);
      setForm(s || {
        tenantName: 'Geolabs, Inc.',
        billingEmail: '',
        planName: 'Professional',
        monthlyRate: 20,
        status: 'active',
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxUsers: 10,
        maxActiveRequisitions: 50,
        features: { resumeParsing: true, emailNotifications: true, pdfGeneration: true, multiTenant: false },
        notes: '',
      });
      setAppCount(apps.length);
      setReqCount(reqs.length);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    let updated;
    if (sub?.id) {
      updated = await base44.entities.Subscription.update(sub.id, form);
    } else {
      updated = await base44.entities.Subscription.create(form);
    }
    setSub(updated);
    setEditing(false);
    setSaving(false);
  };

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800',
    past_due: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
    trial: 'bg-blue-100 text-blue-800',
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-navy">Billing & Subscription</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Manage your Geolabs ATS subscription</p>
        </div>

        {/* Plan card */}
        <div className="bg-gradient-to-br from-navy to-[#0b1224] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold">{sub?.planName || 'Professional'} Plan</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[sub?.status || 'active']}`}>
                  {sub?.status ? sub.status.replace('_', ' ').toUpperCase() : 'ACTIVE'}
                </span>
              </div>
              <div className="text-3xl font-bold mt-1">${sub?.monthlyRate ?? 20}<span className="text-sm font-normal text-white/70">/month</span></div>
              <div className="text-xs text-white/60 mt-1">{sub?.tenantName || 'Geolabs, Inc.'}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
            <div>
              <div className="text-xl font-bold">{appCount}</div>
              <div className="text-[10px] text-white/60">Active Applications</div>
            </div>
            <div>
              <div className="text-xl font-bold">{reqCount}</div>
              <div className="text-[10px] text-white/60">Open Positions</div>
            </div>
            <div>
              <div className="text-xl font-bold">{sub?.nextBillingDate || '—'}</div>
              <div className="text-[10px] text-white/60">Next Billing</div>
            </div>
          </div>
        </div>

        {/* What's included */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">What's Included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Cloud, label: 'Cloud Hosting', desc: 'Managed server + storage infrastructure' },
              { icon: Zap, label: 'Resume Parsing (AI)', desc: 'Gemini-powered assistive autofill' },
              { icon: Mail, label: 'Email Delivery', desc: 'Transactional email notifications' },
              { icon: Shield, label: 'Security & Compliance', desc: 'Secure file storage, audit trails' },
              { icon: Users, label: 'Up to 10 Users', desc: 'Role-based access for your team' },
              { icon: Building, label: 'Data Backups', desc: 'Ongoing maintenance and updates' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#f9fafb] border border-[#f3f4f6]">
                <div className="w-7 h-7 rounded-lg bg-bronze-soft flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-bronze" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-navy">{item.label}</div>
                  <div className="text-[10px] text-[#9ca3af]">{item.desc}</div>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Subscription details (edit) */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy">Subscription Details</h2>
            {!editing && (
              <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="rounded-full h-7 px-3 text-xs">
                Edit
              </Button>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Tenant Name</label>
                  <Input value={form.tenantName || ''} onChange={e => update('tenantName', e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Billing Email</label>
                  <Input type="email" value={form.billingEmail || ''} onChange={e => update('billingEmail', e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Monthly Rate ($)</label>
                  <Input type="number" value={form.monthlyRate || 20} onChange={e => update('monthlyRate', parseFloat(e.target.value))} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Status</label>
                  <select value={form.status || 'active'} onChange={e => update('status', e.target.value)} className="w-full h-9 px-3 text-sm rounded-lg border border-[#e5e7eb] bg-white">
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="past_due">Past Due</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Subscription Start</label>
                  <Input type="date" value={form.subscriptionStartDate || ''} onChange={e => update('subscriptionStartDate', e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#374151] block mb-1">Next Billing Date</label>
                  <Input type="date" value={form.nextBillingDate || ''} onChange={e => update('nextBillingDate', e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={save} disabled={saving} className="rounded-full px-5 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : null}
                  Save
                </Button>
                <Button onClick={() => setEditing(false)} variant="outline" className="rounded-full px-5 h-9 text-sm">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Tenant', sub?.tenantName || 'Geolabs, Inc.'],
                ['Billing Email', sub?.billingEmail || '—'],
                ['Plan', sub?.planName || 'Professional'],
                ['Monthly Rate', `$${sub?.monthlyRate ?? 20}`],
                ['Status', sub?.status?.replace('_', ' ') || 'Active'],
                ['Start Date', sub?.subscriptionStartDate || '—'],
                ['Next Billing', sub?.nextBillingDate || '—'],
                ['Max Users', sub?.maxUsers ?? 10],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">{label}</div>
                  <div className="text-xs font-medium text-navy capitalize mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Multi-tenant roadmap */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <h3 className="text-xs font-semibold text-blue-800 mb-1">Multi-Tenant Expansion</h3>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            This system is architected to support multiple companies. When ready to onboard additional tenants, the subscription model scales to per-company billing at $20/month per tenant. Contact your administrator to enable multi-tenant mode.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}