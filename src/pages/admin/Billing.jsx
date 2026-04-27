import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '../../components/admin/AdminLayout';

export default function Billing() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', '/admin/billing');
    }
  }, []);

  useEffect(() => {
    base44.entities.Subscription.list().then(subs => {
      const s = subs[0];
      setSub(s || null);
      setForm(s || {
        tenantName: 'Geolabs, Inc.',
        billingEmail: '',
        planName: 'Professional',
        monthlyRate: 50,
        status: 'active',
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
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

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    const response = await base44.functions.invoke('createCheckout', {});
    if (response.data?.redirectUrl) {
      window.location.href = response.data.redirectUrl;
    } else {
      alert('Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800',
    past_due: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
    trial: 'bg-blue-100 text-blue-800',
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-navy">Billing & Subscription</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Geolabs ATS — subscription management</p>
        </div>

        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-green-800">Payment Successful!</div>
              <div className="text-xs text-green-700">Your subscription is now active.</div>
            </div>
          </div>
        )}

        {/* Plan card */}
        <div className="bg-gradient-to-br from-navy to-[#0b1224] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold">{sub?.planName || 'Professional'} Plan</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[sub?.status || 'active']}`}>
                  {sub?.status ? sub.status.replace('_', ' ').toUpperCase() : 'ACTIVE'}
                </span>
              </div>
              <div className="text-3xl font-bold">${sub?.monthlyRate ?? 50}<span className="text-sm font-normal text-white/70">/month</span></div>
              <div className="text-xs text-white/60 mt-1">{sub?.tenantName || 'Geolabs, Inc.'}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 mb-5">
            <div>
              <div className="text-[10px] text-white/50 uppercase tracking-wide">Start Date</div>
              <div className="text-sm font-semibold mt-0.5">{sub?.subscriptionStartDate || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/50 uppercase tracking-wide">Next Billing</div>
              <div className="text-sm font-semibold mt-0.5">{sub?.nextBillingDate || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/50 uppercase tracking-wide">Billing Email</div>
              <div className="text-sm font-semibold mt-0.5 truncate">{sub?.billingEmail || '—'}</div>
            </div>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            className="bg-white text-navy hover:bg-white/90 font-semibold text-sm px-5 h-10 rounded-xl flex items-center gap-2"
          >
            {checkoutLoading
              ? <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
              : <CreditCard className="w-4 h-4" />
            }
            {checkoutLoading ? 'Redirecting...' : `Pay $${sub?.monthlyRate ?? 50}/month`}
            {!checkoutLoading && <ExternalLink className="w-3.5 h-3.5 opacity-60" />}
          </Button>
        </div>

        {/* Subscription details */}
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
                  <Input type="number" value={form.monthlyRate || 50} onChange={e => update('monthlyRate', parseFloat(e.target.value))} className="h-9 text-sm" />
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
              </div>
              <p className="text-[11px] text-[#9ca3af]">Start date and next billing date are set automatically when payment is received.</p>
              <div className="flex gap-2 pt-2">
                <Button onClick={save} disabled={saving} className="rounded-full px-5 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                  Save
                </Button>
                <Button onClick={() => setEditing(false)} variant="outline" className="rounded-full px-5 h-9 text-sm">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Tenant', sub?.tenantName || 'Geolabs, Inc.'],
                ['Billing Email', sub?.billingEmail || '—'],
                ['Plan', sub?.planName || 'Professional'],
                ['Monthly Rate', `$${sub?.monthlyRate ?? 50}/month`],
                ['Status', sub?.status?.replace('_', ' ') || 'Active'],
                ['Start Date', sub?.subscriptionStartDate || '—'],
                ['Next Billing', sub?.nextBillingDate || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">{label}</div>
                  <div className="text-xs font-medium text-navy capitalize mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}