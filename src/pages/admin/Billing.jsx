import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, CheckCircle2, ExternalLink, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../components/admin/AdminLayout';

const STATUS_CONFIG = {
  active: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  past_due: { color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  cancelled: { color: 'bg-[#1e2a3a] text-[#64748b] border-[#2d3f55]', dot: 'bg-[#64748b]' },
  trial: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
};

export default function Billing() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', '/admin/billing');
    }
  }, []);

  useEffect(() => {
    base44.entities.Subscription.list().then(subs => {
      setSub(subs[0] || null);
      setLoading(false);
    });
  }, []);

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

  const handleCancel = async () => {
    setCancelLoading(true);
    setShowCancelConfirm(false);
    const response = await base44.functions.invoke('cancelSubscription', {});
    if (response.data?.success) {
      setSub(prev => ({ ...prev, status: 'cancelled' }));
    } else {
      alert('Failed to cancel: ' + (response.data?.error || 'Unknown error'));
    }
    setCancelLoading(false);
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#F5C400] rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const status = sub?.status || 'active';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Billing & Subscription</h1>
          <p className="text-sm text-gray-500 mt-0.5">Geolabs ATS — subscription management</p>
        </div>

        {paymentSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-300">Payment Successful!</div>
              <div className="text-xs text-emerald-400/70">Your subscription is now active.</div>
            </div>
          </div>
        )}

        {/* Plan card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-7 shadow-xl">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#F5C400]/10 blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between mb-6 relative">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-black text-white">{sub?.planName || 'Professional'} Plan</span>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-[#F5C400]">${sub?.monthlyRate ?? 50}</span>
                <span className="text-sm text-[#64748b] mb-1.5">/month</span>
              </div>
              <div className="text-xs text-[#4a5568] mt-1">{sub?.tenantName || 'Geolabs, Inc.'}</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-[#F5C400]" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5 mb-6">
            {[
              { label: 'Start Date', value: sub?.subscriptionStartDate || '—' },
              { label: 'Next Billing', value: sub?.nextBillingDate || '—' },
              { label: 'Billing Email', value: sub?.billingEmail || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{label}</div>
                <div className="text-xs font-semibold text-gray-300 truncate">{value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            {sub?.status !== 'active' && (
              <Button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold text-sm px-6 h-11 rounded-xl flex items-center gap-2 shadow-lg shadow-[#F5C400]/20"
              >
                {checkoutLoading
                  ? <div className="w-4 h-4 border-2 border-[#0d1117]/30 border-t-[#0d1117] rounded-full animate-spin" />
                  : <CreditCard className="w-4 h-4" />
                }
                {checkoutLoading ? 'Redirecting...' : `Subscribe — $${sub?.monthlyRate ?? 50}/month`}
                {!checkoutLoading && <ExternalLink className="w-3.5 h-3.5 opacity-60" />}
              </Button>
            )}
            {sub?.status === 'active' && (
              <Button
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelLoading}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 hover:text-white font-semibold text-sm px-6 h-11 rounded-xl flex items-center gap-2"
              >
                {cancelLoading
                  ? <div className="w-4 h-4 border-2 border-[#94a3b8]/30 border-t-[#94a3b8] rounded-full animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            )}
          </div>
        </div>

        {/* Plan features */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-[#b8910a]" />
            <h2 className="text-sm font-bold text-gray-900">What's Included</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Unlimited Applications', 'AI Resume Parsing', 'Email Notifications', 'PDF Export',
              'Kanban Pipeline', 'Email Templates', 'Audit Trail', 'EEO Compliance'
            ].map(f => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Subscription Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Billing Email', sub?.billingEmail || '—'],
              ['Plan', sub?.planName || 'Professional'],
              ['Monthly Rate', `$${sub?.monthlyRate ?? 50}/month`],
              ['Status', sub?.status?.replace('_', ' ') || '—'],
              ['Start Date', sub?.subscriptionStartDate || '—'],
              ['Next Billing', sub?.nextBillingDate || '—'],
            ].map(([label, value]) => (
              <div key={label} className="py-2 border-b border-gray-100 last:border-0">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">{label}</div>
                <div className="text-xs font-semibold text-gray-700">{value}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-4">Dates and status update automatically after each payment.</p>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Cancel Subscription?</h3>
                <p className="text-xs text-gray-500 mt-0.5">You'll keep access until the end of your current billing cycle.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Keep Subscription
              </button>
              <button onClick={handleCancel} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500/80 hover:bg-red-500 transition-colors">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}