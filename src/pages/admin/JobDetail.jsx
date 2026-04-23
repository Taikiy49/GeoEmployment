import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Pencil, Users, Calendar, Clock, CheckCircle2 } from 'lucide-react';
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

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" /></div></AdminLayout>;
  if (!req) return <AdminLayout><p className="text-center py-16 text-[#6b7280]">Requisition not found.</p></AdminLayout>;

  const stageGroups = ['applied', 'under_review', 'phone_screen', 'interview', 'offer', 'hired'].reduce((acc, s) => {
    acc[s] = apps.filter(a => a.stage === s).length;
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link to="/admin/jobs" className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] mt-1">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-navy">{req.title}</h1>
              <ReqStatusBadge status={req.status} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[#6b7280] flex-wrap">
              <span>{req.department}</span>
              {req.office && <><span>·</span><span>{req.office}</span></>}
              <span>·</span>
              <span className="capitalize">{req.employmentType?.replace('_', ' ')}</span>
              {req.applicationDeadline && <><span>·</span><span>Deadline: {req.applicationDeadline}</span></>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/admin/jobs/${id}/edit`}>
              <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-xs">
                <Pencil className="w-3 h-3 mr-1" /> Edit
              </Button>
            </Link>
            {req.status === 'draft' && (
              <Button size="sm" onClick={() => handleStatusChange('pending_approval')} className="rounded-full h-8 px-4 text-xs bg-amber-500 hover:bg-amber-600 text-white">
                Submit for Approval
              </Button>
            )}
            {req.status === 'pending_approval' && (
              <Button size="sm" onClick={() => handleStatusChange('approved')} className="rounded-full h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                Approve
              </Button>
            )}
            {req.status === 'approved' && (
              <Button size="sm" onClick={() => handleStatusChange('published')} className="rounded-full h-8 px-4 text-xs bg-green-600 hover:bg-green-700 text-white">
                Publish
              </Button>
            )}
            {req.status === 'published' && (
              <Button size="sm" onClick={() => handleStatusChange('paused')} variant="outline" className="rounded-full h-8 px-4 text-xs">
                Pause
              </Button>
            )}
            {req.status === 'paused' && (
              <Button size="sm" onClick={() => handleStatusChange('published')} className="rounded-full h-8 px-4 text-xs bg-green-600 hover:bg-green-700 text-white">
                Resume
              </Button>
            )}
            {(req.status === 'published' || req.status === 'paused') && (
              <Button size="sm" onClick={() => handleStatusChange('closed')} variant="outline" className="rounded-full h-8 px-4 text-xs text-red-600 border-red-200 hover:bg-red-50">
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Pipeline summary */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">Application Pipeline — {apps.length} total</h2>
            <Link to={`/admin/applications?requisitionId=${id}`} className="text-xs text-bronze hover:underline flex items-center gap-0.5">
              <Users className="w-3.5 h-3.5 mr-0.5" /> View All Applications
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(stageGroups).map(([stage, count]) => (
              <Link key={stage} to={`/admin/applications?requisitionId=${id}&stage=${stage}`} className="text-center hover:bg-bronze-soft rounded-lg p-1 transition-colors">
                <div className="text-xl font-bold text-navy">{count}</div>
                <div className="text-[9px] text-[#6b7280] mt-0.5 capitalize">{stage.replace('_', ' ')}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            {req.description && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
                <h2 className="text-sm font-semibold text-navy mb-3">Job Description</h2>
                <p className="text-sm text-[#374151] whitespace-pre-line leading-relaxed">{req.description}</p>
              </div>
            )}
            {req.requiredQualifications && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
                <h2 className="text-sm font-semibold text-navy mb-3">Required Qualifications</h2>
                <p className="text-sm text-[#374151] whitespace-pre-line leading-relaxed">{req.requiredQualifications}</p>
              </div>
            )}
            {req.preferredQualifications && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
                <h2 className="text-sm font-semibold text-navy mb-3">Preferred Qualifications</h2>
                <p className="text-sm text-[#374151] whitespace-pre-line leading-relaxed">{req.preferredQualifications}</p>
              </div>
            )}
            {(req.screeningQuestions || []).length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
                <h2 className="text-sm font-semibold text-navy mb-3">Screening Questions</h2>
                <ol className="space-y-2">
                  {req.screeningQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[10px] font-semibold text-bronze mt-0.5">{i + 1}.</span>
                      <span className="text-[#374151]">{q.question} {q.required && <span className="text-red-400 text-[10px]">*</span>}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-semibold text-navy">Details</h2>
              <InfoRow label="Headcount" value={req.headcount || 1} />
              {req.salaryMin && req.salaryMax && (
                <InfoRow label="Salary Range" value={`$${Number(req.salaryMin).toLocaleString()} – $${Number(req.salaryMax).toLocaleString()}`} />
              )}
              {req.hiringManagerEmail && <InfoRow label="Hiring Manager" value={req.hiringManagerEmail} />}
              {req.recruiterEmail && <InfoRow label="Recruiter" value={req.recruiterEmail} />}
              {req.publishedDate && <InfoRow label="Published" value={new Date(req.publishedDate).toLocaleDateString()} />}
            </div>

            {req.internalNotes && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <h3 className="text-xs font-semibold text-amber-800 mb-1.5">Internal Notes</h3>
                <p className="text-xs text-amber-700 whitespace-pre-line">{req.internalNotes}</p>
              </div>
            )}

            {/* Status history */}
            {(req.statusHistory || []).length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-4">
                <h3 className="text-xs font-semibold text-navy mb-3">Status History</h3>
                <div className="space-y-2">
                  {[...req.statusHistory].reverse().slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-medium text-[#374151] capitalize">{h.status.replace('_', ' ')}</div>
                        <div className="text-[10px] text-[#9ca3af]">{new Date(h.changedAt).toLocaleDateString()}</div>
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
    <div className="flex items-start justify-between gap-2">
      <span className="text-[11px] text-[#9ca3af] flex-shrink-0">{label}</span>
      <span className="text-[11px] font-medium text-[#374151] text-right">{value}</span>
    </div>
  );
}