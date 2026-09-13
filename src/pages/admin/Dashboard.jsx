import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/localClient';
import { Link } from 'react-router-dom';
import { Briefcase, Users, TrendingUp, ChevronRight, ClipboardCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';

const STAGE_ORDER = ['applied', 'under_review', 'phone_screen', 'interview', 'offer', 'hired'];
const STAGE_LABELS = {
  applied: 'Applied', under_review: 'Under Review', phone_screen: 'Phone Screen',
  interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn'
};
const STAGE_COLORS = {
  applied: '#3b82f6', under_review: '#8b5cf6', phone_screen: '#f59e0b',
  interview: '#f97316', offer: '#10b981', hired: '#22c55e',
};

export default function Dashboard() {
  const [apps, setApps] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      appClient.entities.Application.filter({ status: 'active', isDraft: false }),
      appClient.entities.JobRequisition.list('-created_date', 100),
    ]).then(([a, r]) => {
      setApps(a);
      setReqs(r);
      setLoading(false);
    }).catch(() => { setError('The hiring overview could not be loaded.'); setLoading(false); });
  }, []);

  const stageCounts = STAGE_ORDER.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.stage === s).length;
    return acc;
  }, {});

  const activeReqs = reqs.filter(r => r.status === 'published').length;
  const awaitingReview = apps.filter(a => a.stage === 'applied').length;
  const thisWeek = apps.filter(a => {
    const d = new Date(a.submittedAt || a.created_date);
    const age = Date.now() - d.getTime();
    return age >= 0 && age < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const recentApps = [...apps].sort((a, b) =>
    new Date(b.submittedAt || b.created_date).getTime() - new Date(a.submittedAt || a.created_date).getTime()
  ).slice(0, 8);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#A65F2A] rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );
  if (error) return <AdminLayout><div className="mx-auto mt-20 max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"><p className="text-sm font-bold text-red-700">{error}</p><button onClick={() => window.location.reload()} className="mt-3 text-xs font-bold text-[#8A4A22]">Try again</button></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#A65F2A] animate-pulse" />
              <span className="text-[11px] font-bold text-[#8A4A22] tracking-widest uppercase">HR workspace</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hiring Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">Geolabs, Inc. — Applicant Tracking System</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Applications', value: apps.length, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
            { label: 'Open Positions', value: activeReqs, icon: Briefcase, color: '#A65F2A', bg: 'rgba(245,196,0,0.08)' },
            { label: 'New This Week', value: thisWeek, icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { label: 'Awaiting Review', value: awaitingReview, icon: ClipboardCheck, color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: kpi.bg, border: `1px solid ${kpi.color}20` }}
                >
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{kpi.value}</div>
              <div className="text-[11px] text-gray-500 font-medium">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-[#A65F2A]" />
            <h2 className="text-sm font-bold text-gray-900">Hiring Pipeline</h2>
            <span className="ml-auto text-[11px] text-gray-500">{apps.length} total candidates</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {STAGE_ORDER.map((stage, i) => {
              const count = stageCounts[stage] || 0;
              const pct = apps.length ? (count / apps.length) * 100 : 0;
              return (
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="text-center"
                >
                  <div className="text-2xl font-black text-gray-900 mb-0.5">{count}</div>
                  <div className="text-[10px] text-gray-500 mb-2 font-medium">{STAGE_LABELS[stage]}</div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: STAGE_COLORS[stage] }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Applications */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900">Recent Applications</h2>
              <Link to="/admin/applications" className="text-[11px] text-[#8A4A22] hover:text-[#A65F2A] flex items-center gap-0.5 font-medium transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {recentApps.map((app, idx) => (
                <Link
                  key={app.id}
                  to={`/admin/applications/${app.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#A65F2A]/10 border border-[#A65F2A]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#8A4A22]">{app.firstName?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{app.firstName} {app.lastName}</div>
                      <div className="text-[10px] text-gray-500">{app.positionAppliedFor || app.requisitionTitle || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StageBadge stage={app.stage} />
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-[#A65F2A] transition-colors" />
                  </div>
                </Link>
              ))}
              {recentApps.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No applications yet.</p>}
            </div>
          </motion.div>

          {/* Job Requisitions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900">Job Openings</h2>
              <Link to="/admin/jobs" className="text-[11px] text-[#8A4A22] hover:text-[#A65F2A] flex items-center gap-0.5 font-medium transition-colors">
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {reqs.slice(0, 8).map(req => {
                const count = apps.filter(a => a.requisitionId === req.id).length;
                return (
                  <Link
                    key={req.id}
                    to={`/admin/jobs/${req.id}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{req.title}</div>
                        <div className="text-[10px] text-gray-500">{req.department} · {req.office || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">{count} applicant{count !== 1 ? 's' : ''}</span>
                      <ReqStatusBadge status={req.status} />
                    </div>
                  </Link>
                );
              })}
              {reqs.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No requisitions yet.</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}

export function StageBadge({ stage }) {
  const map = {
    applied: 'bg-blue-50 text-blue-600 border-blue-200',
    under_review: 'bg-purple-50 text-purple-600 border-purple-200',
    phone_screen: 'bg-amber-50 text-amber-600 border-amber-200',
    interview: 'bg-orange-50 text-orange-600 border-orange-200',
    offer: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    hired: 'bg-green-50 text-green-600 border-green-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
    withdrawn: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const labels = {
    applied: 'Applied', under_review: 'Under Review', phone_screen: 'Phone Screen',
    interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[stage] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {labels[stage] || stage}
    </span>
  );
}

export function ReqStatusBadge({ status }) {
  const map = {
    draft: 'bg-gray-100 text-gray-500 border-gray-200',
    pending_approval: 'bg-amber-50 text-amber-600 border-amber-200',
    approved: 'bg-blue-50 text-blue-600 border-blue-200',
    published: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    paused: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    closed: 'bg-red-50 text-red-600 border-red-200',
    archived: 'bg-gray-100 text-gray-400 border-gray-200',
  };
  const labels = {
    draft: 'Draft', pending_approval: 'Pending', approved: 'Approved',
    published: 'Published', paused: 'Paused', closed: 'Closed', archived: 'Archived'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  );
}
