import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, LayoutGrid, List } from 'lucide-react';
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
      base44.entities.Application.filter({ status: 'active', isDraft: false }, '-created_date', 500),
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Applications</h1>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} result{filtered.length !== 1 ? 's' : ''} of {apps.length} total</p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, position..."
                className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400]"
              />
            </div>
            <select
              value={jobFilter}
              onChange={e => setJobFilter(e.target.value)}
              className="h-10 px-3 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#F5C400]/30"
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
                className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                  stageFilter === s
                    ? 'bg-[#F5C400]/10 text-[#b8910a] border-[#F5C400]/30'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900'
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
        {viewMode === 'list' && <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-[#F5C400] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500">No applications match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Applicant</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:table-cell">Position</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stage</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Applied</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Recruiter</th>
                    <th className="text-right px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-[#b8910a]">{app.firstName?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{app.firstName} {app.lastName}</div>
                            <div className="text-[10px] text-gray-400">{app.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <div className="text-sm text-gray-700">{app.requisitionTitle || app.positionAppliedFor || '—'}</div>
                        <div className="text-[10px] text-gray-400">{reqMap[app.requisitionId]?.department || ''}</div>
                      </td>
                      <td className="px-5 py-4"><StageBadge stage={app.stage} /></td>
                      <td className="px-5 py-4 hidden md:table-cell text-xs text-gray-500">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : new Date(app.created_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500">
                        {app.assignedRecruiterEmail || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/applications/${app.id}`}
                          className="flex items-center gap-1 text-xs text-[#b8910a] hover:text-[#F5C400] justify-end font-semibold transition-colors"
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