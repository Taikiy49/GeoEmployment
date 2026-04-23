import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AdminLayout from '../../components/admin/AdminLayout';
import { StageBadge } from './Dashboard';
import KanbanBoard from '../../components/admin/KanbanBoard';

const STAGES = ['all', 'applied', 'under_review', 'phone_screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];

export default function ApplicationsList() {
  const [apps, setApps] = useState([]);
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reqId = urlParams.get('requisitionId');
    const stageParam = urlParams.get('stage');
    if (reqId) setJobFilter(reqId);
    if (stageParam) setStageFilter(stageParam);

    Promise.all([
      base44.entities.Application.filter({ status: 'active' }, '-created_date', 500),
      base44.entities.JobRequisition.list('-created_date', 200),
    ]).then(([a, r]) => {
      setApps(a);
      setReqs(r);
      setLoading(false);
    });
  }, []);

  const filtered = apps.filter(app => {
    const matchStage = stageFilter === 'all' || app.stage === stageFilter;
    const matchJob = jobFilter === 'all' || app.requisitionId === jobFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.positionAppliedFor?.toLowerCase().includes(q) ||
      app.requisitionTitle?.toLowerCase().includes(q);
    return matchStage && matchJob && matchSearch;
  });

  const reqMap = reqs.reduce((acc, r) => { acc[r.id] = r; return acc; }, {});

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-navy">Applications</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">{filtered.length} result{filtered.length !== 1 ? 's' : ''} of {apps.length} total</p>
          </div>
          <div className="flex items-center gap-1 bg-[#f3f4f6] rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-navy' : 'text-[#9ca3af] hover:text-navy'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-navy' : 'text-[#9ca3af] hover:text-navy'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, position..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <select
              value={jobFilter}
              onChange={e => setJobFilter(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-[#e5e7eb] bg-white min-w-[200px]"
            >
              <option value="all">All Jobs</option>
              {reqs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  stageFilter === s
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#9ca3af]'
                }`}
              >
                {s === 'all' ? 'All Stages' : s.replace('_', ' ')}
                {s !== 'all' && ` (${apps.filter(a => a.stage === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && !loading && (
          <KanbanBoard apps={apps} setApps={setApps} jobFilter={jobFilter} />
        )}

        {/* Table */}
        {viewMode === 'list' && <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-[#6b7280]">No applications match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Applicant</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden sm:table-cell">Position</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Stage</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden md:table-cell">Applied</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden lg:table-cell">Recruiter</th>
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filtered.map(app => (
                    <tr key={app.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy text-sm">{app.firstName} {app.lastName}</div>
                        <div className="text-[10px] text-[#9ca3af]">{app.email}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="text-sm text-[#374151]">{app.requisitionTitle || app.positionAppliedFor || '—'}</div>
                        <div className="text-[10px] text-[#9ca3af]">{reqMap[app.requisitionId]?.department || ''}</div>
                      </td>
                      <td className="px-4 py-3"><StageBadge stage={app.stage} /></td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-[#6b7280]">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : new Date(app.created_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#6b7280]">
                        {app.assignedRecruiterEmail || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/applications/${app.id}`}
                          className="flex items-center gap-1 text-xs text-bronze hover:underline justify-end"
                        >
                          Review <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>}
      </div>
    </AdminLayout>
  );
}