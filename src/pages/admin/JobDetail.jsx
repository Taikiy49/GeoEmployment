import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../components/admin/AdminLayout';
import { ReqStatusBadge, StageBadge } from './Dashboard';

export default function JobDetail() {
  const { id } = useParams();
  const [req, setReq] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.JobRequisition.filter({ id }),
      base44.entities.Application.filter({ requisitionId: id }),
    ]).then(([reqs, applications]) => {
      setReq(reqs[0]);
      setApps(applications);
      setLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    const now = new Date().toISOString();
    const history = [...(req.statusHistory || []), { status: newStatus, changedAt: now, changedBy: 'admin' }];
    const updates = { status: newStatus, statusHistory: history };
    if (newStatus === 'published') updates.publishedDate = now;
    if (newStatus === 'closed') updates.closedDate = now;
    const updated = await base44.entities.JobRequisition.update(id, updates);
    setReq(updated);
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#1e2a3a] border-t-[#F5C400] rounded-full animate-spin" /></div></AdminLayout>;
  if (!req) return <AdminLayout><p className="text-center py-16 text-[#64748b]">Requisition not found.</p></AdminLayout>;

  const stageGroups = ['applied', 'under_review', 'phone_screen', 'interview', 'offer', 'hired'].reduce((acc, s) => {
    acc[s] = apps.filter(a => a.stage === s).length;
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link to="/admin/jobs" className="p-2 rounded-xl hover:bg-[#1e2a3a] text-[#64748b] hover:text-white transition-colors mt-0.5">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-black text-white">{req.title}</h1>
              <ReqStatusBadge status={req.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-[#64748b] flex-wrap">
              <span>{req.department}</span>
              {req.office && <><span>·</span><span>{req.office}</span></>}
              <span>·</span>
              <span className="capitalize">{req.employmentType?.replace('_', ' ')}</span>
              {req.applicationDeadline && <><span>·</span><span>Deadline: {req.applicationDeadline}</span></>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/admin/jobs/${id}/edit`}>
              <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 text-xs border-[#1e2a3a] bg-transparent text-[#94a3b8] hover:bg-[#1e2a3a] hover:text-white">
                <Pencil className="w-3 h-3 mr-1" /> Edit
              </Button>
            </Link>
            {req.status === 'draft' && (
              <Button size="sm" onClick={() => handleStatusChange('pending_approval')} className="rounded-xl h-9 px-4 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20">Submit</Button>
            )}
            {req.status === 'pending_approval' && (
              <Button size="sm" onClick={() => handleStatusChange('approved')} className="rounded-xl h-9 px-4 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20">Approve</Button>
            )}
            {req.status === 'approved' && (
              <Button size="sm" onClick={() => handleStatusChange('published')} className="rounded-xl h-9 px-4 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Publish</Button>
            )}
            {req.status === 'published' && (
              <Button size="sm" onClick={() => handleStatusChange('paused')} className="rounded-xl h-9 px-4 text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Pause</Button>
            )}
            {req.status === 'paused' && (
              <Button size="sm" onClick={() => handleStatusChange('published')} className="rounded-xl h-9 px-4 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Resume</Button>
            )}
            {(req.status === 'published' || req.status === 'paused') && (
              <Button size="sm" onClick={() => handleStatusChange('closed')} className="rounded-xl h-9 px-4 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20">Close</Button>
            )}
          </div>
        </div>

        {/* Pipeline summary */}
        <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Application Pipeline — <span className="text-[#F5C400]">{apps.length}</span> total</h2>
            <Link to={`/admin/applications?requisitionId=${id}`} className="text-xs text-[#F5C400] hover:text-[#EFB506] flex items-center gap-1 font-medium transition-colors">
              <Users className="w-3.5 h-3.5" /> View All
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(stageGroups).map(([stage, count]) => (
              <Link key={stage} to={`/admin/applications?requisitionId=${id}&stage=${stage}`} className="text-center p-2 rounded-xl hover:bg-[#1e2a3a] transition-colors group">
                <div className="text-xl font-black text-white group-hover:text-[#F5C400] transition-colors">{count}</div>
                <div className="text-[9px] text-[#64748b] mt-0.5 capitalize font-medium">{stage.replace('_', ' ')}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            {req.description && (
              <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5">
                <h2 className="text-sm font-bold text-white mb-3">Job Description</h2>
                <p className="text-sm text-[#94a3b8] whitespace-pre-line leading-relaxed">{req.description}</p>
              </div>
            )}
            {req.requiredQualifications && (
              <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5">
                <h2 className="text-sm font-bold text-white mb-3">Required Qualifications</h2>
                <p className="text-sm text-[#94a3b8] whitespace-pre-line leading-relaxed">{req.requiredQualifications}</p>
              </div>
            )}
            {req.preferredQualifications && (
              <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5">
                <h2 className="text-sm font-bold text-white mb-3">Preferred Qualifications</h2>
                <p className="text-sm text-[#94a3b8] whitespace-pre-line leading-relaxed">{req.preferredQualifications}</p>
              </div>
            )}
            {(req.screeningQuestions || []).length > 0 && (
              <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5">
                <h2 className="text-sm font-bold text-white mb-3">Screening Questions</h2>
                <ol className="space-y-2">
                  {req.screeningQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[10px] font-bold text-[#F5C400] mt-0.5">{i + 1}.</span>
                      <span className="text-[#94a3b8]">{q.question} {q.required && <span className="text-red-400 text-[10px]">*</span>}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-5 space-y-3">
              <h2 className="text-sm font-bold text-white">Details</h2>
              <InfoRow label="Headcount" value={req.headcount || 1} />
              {req.salaryMin && req.salaryMax && (
                <InfoRow label="Salary Range" value={`$${Number(req.salaryMin).toLocaleString()} – $${Number(req.salaryMax).toLocaleString()}`} />
              )}
              {req.hiringManagerEmail && <InfoRow label="Hiring Manager" value={req.hiringManagerEmail} />}
              {req.recruiterEmail && <InfoRow label="Recruiter" value={req.recruiterEmail} />}
              {req.publishedDate && <InfoRow label="Published" value={new Date(req.publishedDate).toLocaleDateString()} />}
            </div>

            {req.internalNotes && (
              <div className="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-4">
                <h3 className="text-xs font-bold text-amber-400 mb-1.5">Internal Notes</h3>
                <p className="text-xs text-amber-300/70 whitespace-pre-line">{req.internalNotes}</p>
              </div>
            )}

            {(req.statusHistory || []).length > 0 && (
              <div className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-4">
                <h3 className="text-xs font-bold text-white mb-3">Status History</h3>
                <div className="space-y-2">
                  {[...req.statusHistory].reverse().slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F5C400] mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-[#94a3b8] capitalize">{h.status.replace('_', ' ')}</div>
                        <div className="text-[10px] text-[#4a5568]">{new Date(h.changedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-[#1e2a3a]/50 last:border-0">
      <span className="text-[11px] text-[#4a5568] flex-shrink-0">{label}</span>
      <span className="text-[11px] font-semibold text-[#94a3b8] text-right">{value}</span>
    </div>
  );
}