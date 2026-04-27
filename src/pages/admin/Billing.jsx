import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CreditCard, CheckCircle2, ExternalLink, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../components/admin/AdminLayout';

export default function Billing() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
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
      setSub(subs[0] || null);
      setLoading(false);
    });
  }, []);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
      alert('Failed to cancel subscription: ' + (response.data?.error || 'Unknown error'));
    }
    setCancelLoading(false);
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

          <div className="flex gap-3 flex-wrap">
            {sub?.status !== 'active' && (
              <Button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                className="bg-white text-navy hover:bg-white/90 font-semibold text-sm px-5 h-10 rounded-xl flex items-center gap-2"
              >
                {checkoutLoading
                  ? <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
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
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-sm px-5 h-10 rounded-xl flex items-center gap-2"
              >
                {cancelLoading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                {cancelLoading ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            )}
          </div>
        </div>

        {/* Subscription details — read only, auto-managed by webhook */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Subscription Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Billing Email', sub?.billingEmail || '—'],
              ['Plan', sub?.planName || 'Professional'],
              ['Monthly Rate', `$${sub?.monthlyRate ?? 50}/month`],
              ['Status', sub?.status?.replace('_', ' ') || '—'],
              ['Start Date', sub?.subscriptionStartDate || '—'],
              ['Next Billing', sub?.nextBillingDate || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">{label}</div>
                <div className="text-xs font-medium text-navy mt-0.5">{value}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#9ca3af] mt-4">Dates and status are updated automatically after each payment.</p>
        </div>
      </div>
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Cancel Subscription?</h3>
                <p className="text-xs text-[#6b7280] mt-0.5">You'll keep access until the end of the current billing cycle.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}