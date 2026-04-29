import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Briefcase, Users, TrendingUp, Clock, ChevronRight, AlertCircle, Zap } from 'lucide-react';
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

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1e2a3a] border-t-[#F5C400] rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#F5C400] animate-pulse" />
              <span className="text-[11px] font-bold text-[#F5C400] tracking-widest uppercase">Live Dashboard</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Hiring Overview</h1>
            <p className="text-sm text-[#64748b] mt-0.5">Geolabs, Inc. — Applicant Tracking System</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Applications', value: apps.length, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
            { label: 'Open Positions', value: activeReqs, icon: Briefcase, color: '#F5C400', bg: 'rgba(245,196,0,0.08)' },
            { label: 'New This Week', value: thisWeek, icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { label: 'Pending Approval', value: pendingApproval, icon: AlertCircle, color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5 hover:border-[#2d3f55] transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: kpi.bg, border: `1px solid ${kpi.color}20` }}
                >
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <ChevronRight className="w-4 h-4 text-[#1e2a3a] group-hover:text-[#64748b] transition-colors" />
              </div>
              <div className="text-3xl font-black text-white mb-1">{kpi.value}</div>
              <div className="text-[11px] text-[#64748b] font-medium">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-[#F5C400]" />
            <h2 className="text-sm font-bold text-white">Hiring Pipeline</h2>
            <span className="ml-auto text-[11px] text-[#64748b]">{apps.length} total candidates</span>
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
                  <div className="text-2xl font-black text-white mb-0.5">{count}</div>
                  <div className="text-[10px] text-[#64748b] mb-2 font-medium">{STAGE_LABELS[stage]}</div>
                  <div className="h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
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
            className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white">Recent Applications</h2>
              <Link to="/admin/applications" className="text-[11px] text-[#F5C400] hover:text-[#EFB506] flex items-center gap-0.5 font-medium transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {recentApps.map((app, idx) => (
                <Link
                  key={app.id}
                  to={`/admin/applications/${app.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#1e2a3a] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#F5C400]">{app.firstName?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{app.firstName} {app.lastName}</div>
                      <div className="text-[10px] text-[#64748b]">{app.positionAppliedFor || app.requisitionTitle || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StageBadge stage={app.stage} />
                    <ChevronRight className="w-3 h-3 text-[#1e2a3a] group-hover:text-[#F5C400] transition-colors" />
                  </div>
                </Link>
              ))}
              {recentApps.length === 0 && <p className="text-xs text-[#64748b] text-center py-8">No applications yet.</p>}
            </div>
          </motion.div>

          {/* Job Requisitions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white">Job Requisitions</h2>
              <Link to="/admin/jobs" className="text-[11px] text-[#F5C400] hover:text-[#EFB506] flex items-center gap-0.5 font-medium transition-colors">
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
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#1e2a3a] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#1e2a3a] flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-3.5 h-3.5 text-[#64748b]" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{req.title}</div>
                        <div className="text-[10px] text-[#64748b]">{req.department} · {req.office || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#64748b]">{count} applicant{count !== 1 ? 's' : ''}</span>
                      <ReqStatusBadge status={req.status} />
                    </div>
                  </Link>
                );
              })}
              {reqs.length === 0 && <p className="text-xs text-[#64748b] text-center py-8">No requisitions yet.</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}

export function StageBadge({ stage }) {
  const map = {
    applied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    under_review: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    phone_screen: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    interview: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    offer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    hired: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    withdrawn: 'bg-[#1e2a3a] text-[#64748b] border-[#2d3f55]',
  };
  const labels = {
    applied: 'Applied', under_review: 'Under Review', phone_screen: 'Phone Screen',
    interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[stage] || 'bg-[#1e2a3a] text-[#64748b] border-[#2d3f55]'}`}>
      {labels[stage] || stage}
    </span>
  );
}

export function ReqStatusBadge({ status }) {
  const map = {
    draft: 'bg-[#1e2a3a] text-[#64748b] border-[#2d3f55]',
    pending_approval: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    closed: 'bg-red-500/10 text-red-400 border-red-500/20',
    archived: 'bg-[#1e2a3a] text-[#4a5568] border-[#2d3f55]',
  };
  const labels = {
    draft: 'Draft', pending_approval: 'Pending', approved: 'Approved',
    published: 'Published', paused: 'Paused', closed: 'Closed', archived: 'Archived'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[status] || 'bg-[#1e2a3a] text-[#64748b] border-[#2d3f55]'}`}>
      {labels[status] || status}
    </span>
  );
}