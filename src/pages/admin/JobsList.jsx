import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Copy, Archive, Eye, Pencil, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      ...rest,
      title: `${rest.title} (Copy)`,
      status: 'draft',
      statusHistory: [],
      publishedDate: null,
      approvedDate: null,
      approvedBy: null,
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
            <h1 className="text-xl font-semibold text-navy">Job Requisitions</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">{reqs.length} total · {reqs.filter(r => r.status === 'published').length} active</p>
          </div>
          <Link to="/admin/jobs/new">
            <Button className="rounded-full px-5 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white">
              <Plus className="w-4 h-4 mr-1.5" /> New Requisition
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, department, office..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#9ca3af]'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-10 h-10 text-[#d1d5db] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280]">No requisitions found.</p>
              <Link to="/admin/jobs/new" className="mt-3 inline-block text-xs text-bronze hover:underline">Create your first requisition</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Title</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden sm:table-cell">Department</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide hidden lg:table-cell">Deadline</th>
                    <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f4f6]">
                  {filtered.map(req => (
                    <tr key={req.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/admin/jobs/${req.id}`} className="font-medium text-navy hover:text-bronze transition-colors">
                          {req.title}
                        </Link>
                        <div className="text-[10px] text-[#9ca3af]">{req.office || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-[#374151] hidden sm:table-cell">{req.department}</td>
                      <td className="px-4 py-3 text-[#374151] hidden md:table-cell capitalize">{req.employmentType?.replace('_', ' ') || '—'}</td>
                      <td className="px-4 py-3"><ReqStatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 text-[#6b7280] hidden lg:table-cell text-xs">
                        {req.applicationDeadline || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {req.status === 'draft' || req.status === 'approved' ? (
                            <button
                              onClick={() => handleStatusChange(req, req.status === 'approved' ? 'published' : 'pending_approval')}
                              className="px-2 py-1 text-[10px] rounded font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                              {req.status === 'approved' ? 'Publish' : 'Submit'}
                            </button>
                          ) : null}
                          {req.status === 'pending_approval' ? (
                            <button
                              onClick={() => handleStatusChange(req, 'approved')}
                              className="px-2 py-1 text-[10px] rounded font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              Approve
                            </button>
                          ) : null}
                          {req.status === 'published' ? (
                            <button
                              onClick={() => handleStatusChange(req, 'paused')}
                              className="px-2 py-1 text-[10px] rounded font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                            >
                              Pause
                            </button>
                          ) : null}
                          {req.status === 'paused' ? (
                            <button
                              onClick={() => handleStatusChange(req, 'published')}
                              className="px-2 py-1 text-[10px] rounded font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                              Resume
                            </button>
                          ) : null}
                          <Link to={`/admin/jobs/${req.id}`} className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-navy transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link to={`/admin/jobs/${req.id}/edit`} className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-navy transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleDuplicate(req)} className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-navy transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleArchive(req)} className="p-1.5 rounded hover:bg-[#f3f4f6] text-[#6b7280] hover:text-red-500 transition-colors">
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

function Briefcase({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}