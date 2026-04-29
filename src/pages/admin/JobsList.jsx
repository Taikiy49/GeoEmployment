import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Search, Copy, Archive, Eye, Pencil, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../components/admin/AdminLayout';
import { ReqStatusBadge } from './Dashboard';

const STATUS_FILTERS = ['all', 'draft', 'pending_approval', 'approved', 'published', 'paused', 'closed', 'archived'];

export default function JobsList() {
  const [reqs, setReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => {
    base44.entities.JobRequisition.list('-created_date', 200).then(r => {
      setReqs(r);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = reqs.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.department?.toLowerCase().includes(q) || r.office?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleDuplicate = async (req) => {
    const { id, created_date, updated_date, ...rest } = req;
    await base44.entities.JobRequisition.create({
      ...rest, title: `${rest.title} (Copy)`, status: 'draft',
      statusHistory: [], publishedDate: null, approvedDate: null, approvedBy: null,
    });
    load();
  };

  const handleArchive = async (req) => {
    await base44.entities.JobRequisition.update(req.id, { status: 'archived' });
    load();
  };

  const handleStatusChange = async (req, newStatus) => {
    const now = new Date().toISOString();
    const history = [...(req.statusHistory || []), { status: newStatus, changedAt: now, changedBy: 'admin' }];
    const updates = { status: newStatus, statusHistory: history };
    if (newStatus === 'published') updates.publishedDate = now;
    if (newStatus === 'closed') updates.closedDate = now;
    await base44.entities.JobRequisition.update(req.id, updates);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Job Requisitions</h1>
            <p className="text-sm text-[#64748b] mt-0.5">{reqs.length} total · {reqs.filter(r => r.status === 'published').length} published</p>
          </div>
          <Link to="/admin/jobs/new">
            <Button className="rounded-xl px-5 h-10 text-sm bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold shadow-lg shadow-[#F5C400]/20">
              <Plus className="w-4 h-4 mr-1.5" /> New Requisition
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, department, office..."
              className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-[#1e2a3a] bg-[#0d1b2a] text-white placeholder-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400]"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                  statusFilter === s
                    ? 'bg-[#F5C400]/10 text-[#F5C400] border-[#F5C400]/30'
                    : 'bg-[#0d1b2a] text-[#64748b] border-[#1e2a3a] hover:border-[#2d3f55] hover:text-white'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-2 border-[#1e2a3a] border-t-[#F5C400] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#1e2a3a] flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-[#4a5568]" />
              </div>
              <p className="text-sm text-[#64748b]">No requisitions found.</p>
              <Link to="/admin/jobs/new" className="mt-3 inline-block text-xs text-[#F5C400] hover:text-[#EFB506] font-medium">Create your first requisition →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2a3a] bg-[#060e1a]">
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Title</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest hidden sm:table-cell">Department</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest hidden md:table-cell">Type</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Status</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest hidden lg:table-cell">Deadline</th>
                    <th className="text-right px-5 py-3.5 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2a3a]/50">
                  {filtered.map(req => (
                    <tr key={req.id} className="hover:bg-[#1e2a3a]/30 transition-colors group">
                      <td className="px-5 py-4">
                        <Link to={`/admin/jobs/${req.id}`} className="font-semibold text-white hover:text-[#F5C400] transition-colors">
                          {req.title}
                        </Link>
                        <div className="text-[10px] text-[#4a5568] mt-0.5">{req.office || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#94a3b8] hidden sm:table-cell">{req.department}</td>
                      <td className="px-5 py-4 text-sm text-[#94a3b8] hidden md:table-cell capitalize">{req.employmentType?.replace('_', ' ') || '—'}</td>
                      <td className="px-5 py-4"><ReqStatusBadge status={req.status} /></td>
                      <td className="px-5 py-4 text-[#64748b] hidden lg:table-cell text-xs">{req.applicationDeadline || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {req.status === 'draft' && (
                            <button onClick={() => handleStatusChange(req, 'pending_approval')} className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">Submit</button>
                          )}
                          {req.status === 'pending_approval' && (
                            <button onClick={() => handleStatusChange(req, 'approved')} className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">Approve</button>
                          )}
                          {req.status === 'approved' && (
                            <button onClick={() => handleStatusChange(req, 'published')} className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Publish</button>
                          )}
                          {req.status === 'published' && (
                            <button onClick={() => handleStatusChange(req, 'paused')} className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">Pause</button>
                          )}
                          {req.status === 'paused' && (
                            <button onClick={() => handleStatusChange(req, 'published')} className="px-2.5 py-1 text-[10px] rounded-lg font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">Resume</button>
                          )}
                          <Link to={`/admin/jobs/${req.id}`} className="p-1.5 rounded-lg hover:bg-[#1e2a3a] text-[#4a5568] hover:text-white transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link to={`/admin/jobs/${req.id}/edit`} className="p-1.5 rounded-lg hover:bg-[#1e2a3a] text-[#4a5568] hover:text-white transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleDuplicate(req)} className="p-1.5 rounded-lg hover:bg-[#1e2a3a] text-[#4a5568] hover:text-white transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleArchive(req)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#4a5568] hover:text-red-400 transition-colors">
                            <Archive className="w-3.5 h-3.5" />
                          </button>
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