import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/localClient';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Briefcase, RefreshCw } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AdminLayout from '../../components/admin/AdminLayout';
import { ReqStatusBadge } from './Dashboard';

const STATUS_FILTERS = ['all', 'draft', 'published', 'paused', 'closed'];

export default function JobsList() {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    appClient.entities.JobRequisition.list('-created_date', 200).then(r => {
      setReqs(r);
      setLoading(false);
    }).catch(() => { setError('Job openings could not be loaded. Please try again.'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = reqs.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.department?.toLowerCase().includes(q) || r.office?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleStatusChange = async (req, newStatus) => {
    setError('');
    const now = new Date().toISOString();
    const history = [...(req.statusHistory || []), { status: newStatus, changedAt: now, changedBy: 'admin' }];
    const updates = { status: newStatus, statusHistory: history };
    if (newStatus === 'published') updates.publishedDate = now;
    if (newStatus === 'closed') updates.closedDate = now;
    try {
      await appClient.entities.JobRequisition.update(req.id, updates);
      load();
    } catch {
      setError('The opening status could not be changed. Please try again.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Job Openings</h1>
            <p className="text-sm text-gray-500 mt-0.5">{reqs.length} total · {reqs.filter(r => r.status === 'published').length} published</p>
          </div>
          <Link to="/admin/jobs/new" className={cn(buttonVariants(), 'rounded-xl px-5 h-10 text-sm bg-[#A65F2A] hover:bg-[#8A4A22] text-white font-bold shadow-lg shadow-[#A65F2A]/20')}>
            <Plus className="w-4 h-4 mr-1.5" /> New Opening
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, department, office..."
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A65F2A]/30 focus:border-[#A65F2A]"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                  statusFilter === s
                    ? 'bg-[#A65F2A]/10 text-[#8A4A22] border-[#A65F2A]/30'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-[#A65F2A] rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="py-14 text-center"><p className="text-sm font-semibold text-red-700">{error}</p><button onClick={load} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A4A22]"><RefreshCw className="h-3.5 w-3.5" />Try again</button></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No requisitions found.</p>
              <Link to="/admin/jobs/new" className="mt-3 inline-block text-xs text-[#8A4A22] hover:text-[#A65F2A] font-medium">Create your first requisition →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Title</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:table-cell">Department</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Type</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Deadline</th>
                    <th className="text-right px-5 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-4">
                        <Link to={`/admin/jobs/${req.id}`} className="font-semibold text-gray-900 hover:text-[#8A4A22] transition-colors">
                          {req.title}
                        </Link>
                        <div className="text-[10px] text-gray-400 mt-0.5">{req.office || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 hidden sm:table-cell">{req.department}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 hidden md:table-cell capitalize">{req.employmentType?.replace('_', ' ') || '—'}</td>
                      <td className="px-5 py-4"><ReqStatusBadge status={req.status} /></td>
                      <td className="px-5 py-4 text-gray-500 hidden lg:table-cell text-xs">{req.applicationDeadline || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {req.status === 'draft' && (
                            <button onClick={() => handleStatusChange(req, 'published')} className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors">Publish</button>
                          )}
                          {req.status === 'published' && (
                            <button onClick={() => handleStatusChange(req, 'paused')} className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100 transition-colors">Pause</button>
                          )}
                          {req.status === 'paused' && (
                            <button onClick={() => handleStatusChange(req, 'published')} className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors">Resume</button>
                          )}
                          <Link to={`/admin/jobs/${req.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link to={`/admin/jobs/${req.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
