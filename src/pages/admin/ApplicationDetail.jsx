import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, FileText, Lock, MessageSquare, Clock, ExternalLink, Send, Shield, AlertTriangle, Download } from 'lucide-react';
import { generateInterviewPDF, generateFullPDF } from '@/utils/generateApplicationPDF';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '../../components/admin/AdminLayout';
import { StageBadge } from './Dashboard';

const STAGES = ['applied', 'under_review', 'phone_screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
const STAGE_LABELS = {
  applied: 'Applied', under_review: 'Under Review', phone_screen: 'Phone Screen',
  interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn'
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [notes, setNotes] = useState([]);
  const [showEEO, setShowEEO] = useState(false);
  const [user, setUser] = useState(null);
  const [confirmStage, setConfirmStage] = useState(null);
  const [exportingInterview, setExportingInterview] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Application.filter({ id }),
      base44.auth.me(),
    ]).then(([apps, u]) => {
      if (apps[0]) {
        setApp(apps[0]);
        setNotes(apps[0].recruiterNotes || []);
      }
      setUser(u);
      setLoading(false);
    });
  }, [id]);

  const handleStageChangeConfirmed = async () => {
    if (!confirmStage) return;
    const newStage = confirmStage;
    setConfirmStage(null);
    const now = new Date().toISOString();
    const stageHistory = [...(app.stageHistory || []), {
      stage: newStage, changedAt: now, changedBy: user?.email || 'admin',
      note: `Stage moved to ${STAGE_LABELS[newStage]}`
    }];
    const auditTrail = [...(app.auditTrail || []), {
      action: `Stage changed to ${newStage}`, performedBy: user?.email || 'admin',
      performedAt: now, details: `From: ${app.stage} → To: ${newStage}`
    }];
    const updated = await base44.entities.Application.update(id, { stage: newStage, stageHistory, auditTrail });
    setApp(updated);
  };

  const handleStageChange = (newStage) => {
    if (newStage === app.stage) return;
    setConfirmStage(newStage);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const now = new Date().toISOString();
    const note = {
      note: newNote.trim(),
      authorEmail: user?.email || 'admin',
      authorName: user?.full_name || 'Admin',
      createdAt: now,
      isPrivate: false,
    };
    const updatedNotes = [...notes, note];
    const auditTrail = [...(app.auditTrail || []), {
      action: 'Note added', performedBy: user?.email || 'admin',
      performedAt: now, details: 'Recruiter note added'
    }];
    const updated = await base44.entities.Application.update(id, { recruiterNotes: updatedNotes, auditTrail });
    setApp(updated);
    setNotes(updatedNotes);
    setNewNote('');
    setSavingNote(false);
  };

  const formData = app?.applicationData || {};

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" /></div></AdminLayout>;
  if (!app) return <AdminLayout><p className="text-center py-16 text-[#6b7280]">Application not found.</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link to="/admin/applications" className="p-1.5 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] mt-1">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-navy">{app.firstName} {app.lastName}</h1>
              <StageBadge stage={app.stage} />
            </div>
            <div className="text-xs text-[#6b7280] mt-0.5">
              {app.email} · Applied {new Date(app.submittedAt || app.created_date).toLocaleDateString()} · {app.requisitionTitle || app.positionAppliedFor || 'Position TBD'}
            </div>
          </div>
          {/* PDF Export Buttons */}
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={async () => { setExportingInterview(true); await generateInterviewPDF(app); setExportingInterview(false); }}
              disabled={exportingInterview}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#e5e7eb] bg-white text-[#374151] hover:border-bronze hover:text-bronze transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exportingInterview ? 'Generating…' : 'Interview Packet'}
            </button>
            <button
              onClick={async () => { setExportingFull(true); await generateFullPDF(app); setExportingFull(false); }}
              disabled={exportingFull}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-bronze text-white hover:bg-bronze-dark transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exportingFull ? 'Generating…' : 'Full Record (HR/Compliance)'}
            </button>
          </div>
        </div>

        {/* Stage pipeline */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
          <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">Move Candidate</h2>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map(stage => (
              <button
                key={stage}
                onClick={() => handleStageChange(stage)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  app.stage === stage
                    ? 'bg-bronze text-white border-bronze'
                    : ['rejected', 'withdrawn'].includes(stage)
                      ? 'bg-white text-red-500 border-red-200 hover:bg-red-50'
                      : 'bg-white text-[#374151] border-[#e5e7eb] hover:border-bronze hover:text-bronze'
                }`}
              >
                {STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Personal info */}
            <DataSection title="Contact Information">
              <div className="grid grid-cols-2 gap-3">
                <DataRow label="Name" value={`${app.firstName} ${app.lastName}`} />
                <DataRow label="Email" value={app.email} />
                <DataRow label="Phone" value={formData.phone || app.phone || '—'} />
                <DataRow label="Cell" value={formData.cell || '—'} />
                <DataRow label="Address" value={[formData.address, formData.city, formData.state, formData.zip].filter(Boolean).join(', ')} />
              </div>
            </DataSection>

            {/* Application */}
            <DataSection title="Application Details">
              <div className="grid grid-cols-2 gap-3">
                <DataRow label="Position" value={app.positionAppliedFor || app.requisitionTitle || '—'} />
                <DataRow label="Preferred Location" value={formData.preferredLocation || '—'} />
                <DataRow label="Desired Salary" value={formData.desiredSalary || '—'} />
                <DataRow label="Available Start" value={formData.availableStartDate || '—'} />
                <DataRow label="Referred By" value={formData.referredBy || '—'} />
              </div>
            </DataSection>

            {/* Employment history */}
            {formData.employment?.some(e => e.company) && (
              <DataSection title="Employment History">
                <div className="space-y-4">
                  {formData.employment.filter(e => e.company).map((e, i) => (
                    <div key={i} className="border-l-2 border-bronze-soft pl-4">
                      <div className="font-medium text-sm text-navy">{e.position}</div>
                      <div className="text-xs text-[#374151]">{e.company}</div>
                      <div className="text-[10px] text-[#9ca3af]">{e.dateFrom} – {e.dateTo || 'Present'}</div>
                      {e.duties && <div className="text-xs text-[#6b7280] mt-1">{e.duties}</div>}
                    </div>
                  ))}
                </div>
              </DataSection>
            )}

            {/* Education */}
            {formData.education?.some(e => e.institution) && (
              <DataSection title="Education">
                <div className="space-y-3">
                  {formData.education.filter(e => e.institution).map((e, i) => (
                    <div key={i} className="border-l-2 border-bronze-soft pl-4">
                      <div className="font-medium text-sm text-navy">{e.degree} {e.field && `— ${e.field}`}</div>
                      <div className="text-xs text-[#374151]">{e.institution}</div>
                      {e.yearCompleted && <div className="text-[10px] text-[#9ca3af]">{e.yearCompleted}</div>}
                    </div>
                  ))}
                </div>
              </DataSection>
            )}

            {/* Skills */}
            {(formData.skillsSummary || formData.certifications || formData.computerSkills || formData.fieldExperience) && (
              <DataSection title="Skills & Certifications">
                {formData.skillsSummary && <DataRow label="Skills" value={formData.skillsSummary} />}
                {formData.certifications && <DataRow label="Certifications" value={formData.certifications} className="mt-2" />}
                {formData.computerSkills && <DataRow label="Software / Computer Skills" value={formData.computerSkills} className="mt-2" />}
                {formData.fieldExperience && <DataRow label="Field Experience" value={formData.fieldExperience} className="mt-2" />}
              </DataSection>
            )}

            {/* References */}
            {formData.references?.some(r => r.name) && (
              <DataSection title="References">
                <div className="space-y-4">
                  {formData.references.filter(r => r.name).map((r, i) => (
                    <div key={i} className="border-l-2 border-bronze-soft pl-4">
                      <div className="font-medium text-sm text-navy">{r.name}</div>
                      {r.organization && <div className="text-xs text-[#374151]">{r.organization}</div>}
                      <div className="flex flex-wrap gap-3 mt-1">
                        {r.phone && <span className="text-[10px] text-[#9ca3af]">📞 {r.phone}</span>}
                        {r.email && <span className="text-[10px] text-[#9ca3af]">✉ {r.email}</span>}
                        {r.relationship && <span className="text-[10px] text-[#9ca3af]">{r.relationship}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </DataSection>
            )}

            {/* EEO section - access restricted */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <h2 className="text-sm font-semibold text-navy">Self-Identification Data</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Restricted</span>
                </div>
                <button
                  onClick={() => setShowEEO(!showEEO)}
                  className="text-[11px] text-purple-600 hover:underline flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  {showEEO ? 'Hide' : 'Reveal (HR Only)'}
                </button>
              </div>
              {showEEO ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <DataRow label="Gender" value={app.eeoData?.gender || formData.eeoGender || '—'} />
                  <DataRow label="Race / Ethnicity" value={app.eeoData?.race || formData.eeoRace || '—'} />
                  <DataRow label="Disability Status" value={app.eeoData?.disabilityStatus || formData.disabilityStatus || '—'} />
                  <DataRow label="Veteran Status" value={app.eeoData?.veteranStatus || formData.veteranStatus || '—'} />
                </div>
              ) : (
                <p className="text-xs text-[#9ca3af] italic">EEO, disability, and veteran data is access-restricted. Click Reveal to view (HR Admin only).</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
              <h2 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-bronze" /> Recruiter Notes
              </h2>
              <div className="space-y-3 mb-4">
                {notes.length === 0 && <p className="text-xs text-[#9ca3af] italic">No notes yet.</p>}
                {[...notes].reverse().map((n, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-bronze-soft flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-bronze-dark">{(n.authorName || 'A')[0]}</span>
                    </div>
                    <div className="flex-1 bg-[#f9fafb] rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-[#374151]">{n.authorName || n.authorEmail}</span>
                        <span className="text-[10px] text-[#9ca3af]">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#374151] leading-relaxed">{n.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a recruiter note..."
                  rows={2}
                  className="text-sm flex-1"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={savingNote || !newNote.trim()}
                  className="rounded-lg px-4 h-auto bg-bronze hover:bg-bronze-dark text-white self-end"
                >
                  {savingNote ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Resume */}
            {app.resumeFileUrl && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-4">
                <h3 className="text-xs font-semibold text-navy mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-bronze" /> Resume
                </h3>
                <a
                  href={app.resumeFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-bronze hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View / Download Resume
                </a>
              </div>
            )}

            {/* Recruiter assignment */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-4">
              <h3 className="text-xs font-semibold text-navy mb-2">Recruiter</h3>
              <p className="text-xs text-[#6b7280]">{app.assignedRecruiterEmail || 'Unassigned'}</p>
            </div>

            {/* Stage history */}
            {(app.stageHistory || []).length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-4">
                <h3 className="text-xs font-semibold text-navy mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-bronze" /> Stage History
                </h3>
                <div className="space-y-2">
                  {[...(app.stageHistory || [])].reverse().map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-medium text-[#374151]">{STAGE_LABELS[h.stage] || h.stage}</div>
                        <div className="text-[10px] text-[#9ca3af]">{new Date(h.changedAt).toLocaleDateString()} · {h.changedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit trail */}
            {(app.auditTrail || []).length > 0 && (
              <div className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4">
                <h3 className="text-xs font-semibold text-[#6b7280] mb-2">Audit Trail</h3>
                <div className="space-y-1.5">
                  {[...(app.auditTrail || [])].reverse().slice(0, 8).map((a, i) => (
                    <div key={i} className="text-[10px] text-[#9ca3af]">
                      <span className="text-[#6b7280]">{a.action}</span> — {a.performedBy} · {new Date(a.performedAt).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stage Change Confirm Modal */}
      {confirmStage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-navy">Move Candidate?</h3>
                <p className="text-xs text-[#6b7280] mt-0.5">This will update their stage and send an email notification.</p>
              </div>
            </div>
            <div className="bg-[#f9fafb] rounded-lg p-3 mb-5 flex items-center gap-3 text-sm">
              <span className="text-[#6b7280] text-xs">{STAGE_LABELS[app.stage]}</span>
              <span className="text-[#9ca3af]">→</span>
              <span className="font-semibold text-navy text-xs">{STAGE_LABELS[confirmStage]}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmStage(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStageChangeConfirmed}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors ${
                  ['rejected', 'withdrawn'].includes(confirmStage)
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-bronze hover:bg-bronze-dark'
                }`}
              >
                Yes, move to {STAGE_LABELS[confirmStage]}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function DataSection({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5">
      <h2 className="text-sm font-semibold text-navy mb-3 border-b border-[#f3f4f6] pb-2">{title}</h2>
      {children}
    </div>
  );
}

function DataRow({ label, value, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">{label}</div>
      <div className="text-xs text-[#374151] mt-0.5 leading-relaxed">{value || '—'}</div>
    </div>
  );
}