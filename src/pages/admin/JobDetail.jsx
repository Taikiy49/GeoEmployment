import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/localClient';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Pencil, Users } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AdminLayout from '../../components/admin/AdminLayout';
import { ReqStatusBadge } from './Dashboard';

export default function JobDetail() {
  const { id } = useParams();
  const [req, setReq] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      appClient.entities.JobRequisition.filter({ id }),
      appClient.entities.Application.filter({ requisitionId: id, isDraft: false }),
    ]).then(([reqs, applications]) => {
      setReq(reqs[0]);
      setApps(applications);
      setLoading(false);
    }).catch(() => { setError('This job opening could not be loaded.'); setLoading(false); });
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setError('');
    const now = new Date().toISOString();
    const history = [...(req.statusHistory || []), { status: newStatus, changedAt: now, changedBy: 'admin' }];
    const updates = { status: newStatus, statusHistory: history };
    if (newStatus === 'published') updates.publishedDate = now;
    if (newStatus === 'closed') updates.closedDate = now;
    try {
      const updated = await appClient.entities.JobRequisition.update(id, updates);
      if (!updated) throw new Error('Job not found');
      setReq(updated);
    } catch {
      setError('The opening status could not be changed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gray-200 border-t-[#A65F2A] rounded-full animate-spin" /></div></AdminLayout>;
  if (error && !req) return <AdminLayout><div className="mx-auto mt-20 max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"><p className="text-sm font-bold text-red-700">{error}</p><button onClick={() => window.location.reload()} className="mt-3 text-xs font-bold text-[#8A4A22]">Try again</button></div></AdminLayout>;
  if (!req) return <AdminLayout><p className="text-center py-16 text-gray-500">Requisition not found.</p></AdminLayout>;

  const stageGroups = ['applied', 'under_review', 'phone_screen', 'interview', 'offer', 'hired'].reduce((acc, s) => {
    acc[s] = apps.filter(a => a.stage === s).length;
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link to="/admin/jobs" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors mt-0.5">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-black text-gray-900">{req.title}</h1>
              <ReqStatusBadge status={req.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span>{req.department}</span>
              {req.office && <><span>·</span><span>{req.office}</span></>}
              <span>·</span>
              <span className="capitalize">{req.employmentType?.replace('_', ' ')}</span>
              {req.applicationDeadline && <><span>·</span><span>Deadline: {req.applicationDeadline}</span></>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/admin/jobs/${id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-xl h-9 px-4 text-xs border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Link>
            {['draft', 'pending_approval', 'approved'].includes(req.status) && (
              <Button size="sm" disabled={updating} onClick={() => handleStatusChange('published')} className="rounded-xl h-9 px-4 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200">Publish</Button>
            )}
            {req.status === 'published' && (
              <Button size="sm" disabled={updating} onClick={() => handleStatusChange('paused')} className="rounded-xl h-9 px-4 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border border-yellow-200">Pause</Button>
            )}
            {req.status === 'paused' && (
              <Button size="sm" disabled={updating} onClick={() => handleStatusChange('published')} className="rounded-xl h-9 px-4 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200">Resume</Button>
            )}
            {(req.status === 'published' || req.status === 'paused') && (
              <Button size="sm" disabled={updating} onClick={() => handleStatusChange('closed')} className="rounded-xl h-9 px-4 text-xs bg-red-50 hover:bg-red-100 text-red-500 border border-red-200">Close</Button>
            )}
          </div>
        </div>

        {/* Pipeline summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Application Pipeline — <span className="text-[#8A4A22]">{apps.length}</span> total</h2>
            <Link to={`/admin/applications?requisitionId=${id}`} className="text-xs text-[#8A4A22] hover:text-[#A65F2A] flex items-center gap-1 font-medium transition-colors">
              <Users className="w-3.5 h-3.5" /> View All
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(stageGroups).map(([stage, count]) => (
              <Link key={stage} to={`/admin/applications?requisitionId=${id}&stage=${stage}`} className="text-center p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="text-xl font-black text-gray-900 group-hover:text-[#8A4A22] transition-colors">{count}</div>
                <div className="text-[9px] text-gray-500 mt-0.5 capitalize font-medium">{stage.replace('_', ' ')}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            {req.description && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Job Description</h2>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{req.description}</p>
              </div>
            )}
            {req.requiredQualifications && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Required Qualifications</h2>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{req.requiredQualifications}</p>
              </div>
            )}
            {req.preferredQualifications && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Preferred Qualifications</h2>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{req.preferredQualifications}</p>
              </div>
            )}
            {(req.screeningQuestions || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Screening Questions</h2>
                <ol className="space-y-2">
                  {req.screeningQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[10px] font-bold text-[#8A4A22] mt-0.5">{i + 1}.</span>
                      <span className="text-gray-600">{q.question} {q.required && <span className="text-red-500 text-[10px]">*</span>}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Details</h2>
              <InfoRow label="Headcount" value={req.headcount || 1} />
              {req.salaryMin && req.salaryMax && (
                <InfoRow label="Salary Range" value={`$${Number(req.salaryMin).toLocaleString()} – $${Number(req.salaryMax).toLocaleString()}`} />
              )}
              {req.hiringManagerEmail && <InfoRow label="Hiring Manager" value={req.hiringManagerEmail} />}
              {req.recruiterEmail && <InfoRow label="Recruiter" value={req.recruiterEmail} />}
              {req.publishedDate && <InfoRow label="Published" value={new Date(req.publishedDate).toLocaleDateString()} />}
            </div>

            {req.internalNotes && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
                <h3 className="text-xs font-bold text-amber-700 mb-1.5">Internal Notes</h3>
                <p className="text-xs text-amber-700/70 whitespace-pre-line">{req.internalNotes}</p>
              </div>
            )}

            {(req.statusHistory || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <h3 className="text-xs font-bold text-gray-900 mb-3">Status History</h3>
                <div className="space-y-2">
                  {[...req.statusHistory].reverse().slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#A65F2A] mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-semibold text-gray-700 capitalize">{h.status.replace('_', ' ')}</div>
                        <div className="text-[10px] text-gray-400">{new Date(h.changedAt).toLocaleDateString()}</div>
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
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-[11px] text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-[11px] font-semibold text-gray-700 text-right">{value}</span>
    </div>
  );
}
