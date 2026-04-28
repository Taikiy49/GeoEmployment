import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Briefcase, Users, TrendingUp, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';

const STAGE_ORDER = ['applied', 'under_review', 'phone_screen', 'interview', 'offer', 'hired'];
const STAGE_LABELS = {
  applied: 'Applied', under_review: 'Under Review', phone_screen: 'Phone Screen',
  interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn'
};

export default function Dashboard() {
  const [apps, setApps] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Application.filter({ status: 'active' }),
      base44.entities.JobRequisition.list('-created_date', 100),
    ]).then(([a, r]) => {
      setApps(a);
      setReqs(r);
      setLoading(false);
    });
  }, []);

  const stageCounts = STAGE_ORDER.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.stage === s).length;
    return acc;
  }, {});

  const activeReqs = reqs.filter(r => r.status === 'published').length;
  const pendingApproval = reqs.filter(r => r.status === 'pending_approval').length;
  const thisWeek = apps.filter(a => {
    const d = new Date(a.submittedAt || a.created_date);
    return (Date.now() - d) < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const recentApps = [...apps].sort((a, b) =>
    new Date(b.submittedAt || b.created_date) - new Date(a.submittedAt || a.created_date)
  ).slice(0, 8);

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-navy">Dashboard</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Geolabs, Inc. — Applicant Tracking</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Active Applications', value: apps.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Open Job Postings', value: activeReqs, icon: Briefcase, color: 'text-bronze', bg: 'bg-bronze-soft' },
            { label: 'New This Week', value: thisWeek, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending Approval', value: pendingApproval, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
              className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm cursor-pointer"
            >
              <motion.div
                className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </motion.div>
              <div className="text-2xl font-bold text-navy">{kpi.value}</div>
              <div className="text-[11px] text-[#6b7280] mt-0.5">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Pipeline funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5"
        >
          <h2 className="text-sm font-semibold text-navy mb-4">Hiring Pipeline</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {STAGE_ORDER.map((stage, i) => (
              <motion.div
                key={stage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
                className="text-center"
              >
                <motion.div className="text-2xl font-bold text-navy">
                  {stageCounts[stage] || 0}
                </motion.div>
                <div className="text-[10px] text-[#6b7280] mt-0.5">{STAGE_LABELS[stage]}</div>
                <div className="mt-1.5 h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: apps.length ? `${((stageCounts[stage] || 0) / apps.length) * 100}%` : '0%' }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-bronze"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent applications */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-navy">Recent Applications</h2>
              <Link to="/admin/applications" className="text-[11px] text-bronze hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentApps.map((app, idx) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05, duration: 0.3 }}
                  asChild
                >
                  <Link
                    to={`/admin/applications/${app.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#f9fafb] transition-colors group"
                  >
                  <div>
                    <div className="text-xs font-medium text-navy">{app.firstName} {app.lastName}</div>
                    <div className="text-[10px] text-[#9ca3af]">{app.positionAppliedFor || app.requisitionTitle || '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StageBadge stage={app.stage} />
                    <ChevronRight className="w-3 h-3 text-[#d1d5db] group-hover:text-bronze transition-colors" />
                  </div>
                  </Link>
                  </motion.div>
                  ))}
                  {recentApps.length === 0 && <p className="text-xs text-[#9ca3af] text-center py-4">No applications yet.</p>}
                  </div>
                  </motion.div>

                  {/* Active jobs */}
                  <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5"
                  >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-navy">Job Requisitions</h2>
              <Link to="/admin/jobs" className="text-[11px] text-bronze hover:underline flex items-center gap-0.5">
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {reqs.slice(0, 8).map(req => {
                const count = apps.filter(a => a.requisitionId === req.id).length;
                return (
                  <Link
                    key={req.id}
                    to={`/admin/jobs/${req.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#f9fafb] transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-medium text-navy">{req.title}</div>
                      <div className="text-[10px] text-[#9ca3af]">{req.department} · {req.office || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6b7280]">{count} applicant{count !== 1 ? 's' : ''}</span>
                      <ReqStatusBadge status={req.status} />
                    </div>
                  </Link>
                );
              })}
              {reqs.length === 0 && <p className="text-xs text-[#9ca3af] text-center py-4">No requisitions yet.</p>}
              </div>
              </motion.div>
              </div>
              </div>
    </AdminLayout>
  );
}

export function StageBadge({ stage }) {
  const map = {
    applied: 'bg-blue-50 text-blue-700',
    under_review: 'bg-purple-50 text-purple-700',
    phone_screen: 'bg-amber-50 text-amber-700',
    interview: 'bg-orange-50 text-orange-700',
    offer: 'bg-emerald-50 text-emerald-700',
    hired: 'bg-green-100 text-green-800',
    rejected: 'bg-red-50 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-600',
  };
  const labels = {
    applied: 'Applied', under_review: 'Under Review', phone_screen: 'Phone Screen',
    interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${map[stage] || 'bg-gray-100 text-gray-600'}`}>
      {labels[stage] || stage}
    </span>
  );
}

export function ReqStatusBadge({ status }) {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    pending_approval: 'bg-amber-50 text-amber-700',
    approved: 'bg-blue-50 text-blue-700',
    published: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-50 text-yellow-700',
    closed: 'bg-red-50 text-red-700',
    archived: 'bg-gray-100 text-gray-500',
  };
  const labels = {
    draft: 'Draft', pending_approval: 'Pending', approved: 'Approved',
    published: 'Published', paused: 'Paused', closed: 'Closed', archived: 'Archived'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}