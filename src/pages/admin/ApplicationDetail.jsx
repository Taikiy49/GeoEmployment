import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/localClient';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, FileText, Lock, MessageSquare, Clock, ExternalLink, Send, Shield, AlertTriangle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '../../components/admin/AdminLayout';
import DeliveryStatus from '../../components/admin/DeliveryStatus';
import { StageBadge } from './Dashboard';

const STAGES = ['applied', 'under_review', 'phone_screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
const STAGE_LABELS = {
  applied: 'Applied', under_review: 'Under Review', phone_screen: 'Phone Screen',
  interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn'
};

const veteranStatusLabel = value => ({
  protected: 'I identify as one or more of the following classifications of protected veterans',
  notProtected: 'I am not a protected veteran',
  noAnswer: 'I do not wish to self-identify',
})[value] || value || '—';

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
  const [actionError, setActionError] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setApp(null);
    Promise.all([
      appClient.entities.Application.filter({ id }),
      appClient.auth.me(),
    ]).then(([apps, u]) => {
      if (!active) return;
      if (apps[0]) {
        setApp(apps[0]);
        setNotes(apps[0].recruiterNotes || []);
      }
      setUser(u);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setActionError('The application could not be loaded. Please refresh and try again.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const handleStageChangeConfirmed = async () => {
    if (!confirmStage) return;
    const newStage = confirmStage;
    setConfirmStage(null);
    setUpdatingStage(true);
    setActionError('');
    const now = new Date().toISOString();
    const stageHistory = [...(app.stageHistory || []), {
      stage: newStage, changedAt: now, changedBy: user?.email || 'admin',
      note: `Stage moved to ${STAGE_LABELS[newStage]}`
    }];
    const auditTrail = [...(app.auditTrail || []), {
      action: `Stage changed to ${newStage}`, performedBy: user?.email || 'admin',
      performedAt: now, details: `From: ${app.stage} → To: ${newStage}`
    }];
    try {
      const updated = await appClient.entities.Application.update(id, { stage: newStage, stageHistory, auditTrail });
      setApp(updated);
    } catch {
      setActionError('The candidate stage could not be updated. Please try again.');
    } finally {
      setUpdatingStage(false);
    }
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
    setActionError('');
    try {
      const updated = await appClient.entities.Application.update(id, { recruiterNotes: updatedNotes, auditTrail });
      setApp(updated);
      setNotes(updatedNotes);
      setNewNote('');
    } catch {
      setActionError('The recruiter note could not be saved. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const formData = app?.applicationData || {};

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" /></div></AdminLayout>;
  if (!app) return <AdminLayout><p role="status" className="text-center py-16 text-[#64748b]">{actionError || 'Application not found.'}</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">
        {actionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{actionError}</div>}
        <DeliveryStatus application={app} />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-3"
        >
          <Link to="/admin/applications" aria-label="Back to applications" className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] mt-1">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-navy">{app.firstName} {app.lastName}</h1>
              <StageBadge stage={app.stage} />
            </div>
            <div className="text-xs text-[#64748b] mt-0.5">
              {app.email} · Applied {new Date(app.submittedAt || app.created_date).toLocaleDateString()} · {app.requisitionTitle || app.positionAppliedFor || 'Position TBD'}
            </div>
          </div>
        </motion.div>

        {/* Stage pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5"
        >
          <h2 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">Move Candidate</h2>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((stage, i) => (
              <motion.button
                key={stage}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStageChange(stage)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  app.stage === stage
                    ? 'bg-bronze text-white border-bronze'
                    : ['rejected', 'withdrawn'].includes(stage)
                      ? 'bg-white text-red-500 border-red-200 hover:bg-red-50'
                      : 'bg-white text-[#334155] border-[#e2e8f0] hover:border-bronze hover:text-bronze'
                }`}
              >
                {STAGE_LABELS[stage]}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main content */}
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
            {/* Personal info */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <DataSection title="Contact Information">
              <div className="grid grid-cols-2 gap-3">
                <DataRow label="Name" value={`${app.firstName} ${app.lastName}`} />
                <DataRow label="Email" value={app.email} />
                <DataRow label="Phone" value={formData.phone || app.phone || '—'} />
                <DataRow label="Cell" value={formData.cell || '—'} />
                <DataRow label="Address" value={[formData.address, formData.city, formData.state, formData.zip].filter(Boolean).join(', ')} />
              </div>
            </DataSection>
            </motion.div>

            {/* Application */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
              <DataSection title="Application Details">
              <div className="grid grid-cols-2 gap-3">
                <DataRow label="Position" value={app.positionAppliedFor || app.requisitionTitle || '—'} />
                <DataRow label="Available Start Date" value={formData.availableStartDate || '—'} />
                <DataRow label="Referred By" value={formData.referredBy || '—'} />
                <DataRow label="Knows Geolabs, Inc. Employee?" value={formData.knowEmployee || '—'} />
                {formData.knowEmployeeName && <DataRow label="Employee Name(s)" value={formData.knowEmployeeName} />}
              </div>
            </DataSection>
            </motion.div>

            {/* Employment history */}
            {formData.employment?.some(e => e.company) && (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <DataSection title="Employment History">
                  <div className="space-y-4">
                    {formData.employment.filter(e => e.company).map((e, i) => (
                      <div key={i} className="border-l-2 border-bronze-soft pl-4">
                        <div className="font-medium text-sm text-navy">{e.position}</div>
                        <div className="text-xs text-[#334155]">{e.company}</div>
                        <div className="text-[10px] text-[#94a3b8]">{e.dateFrom} – {e.dateTo || 'Present'}</div>
                        {e.duties && <div className="text-xs text-[#64748b] mt-1">{e.duties}</div>}
                      </div>
                    ))}
                  </div>
                </DataSection>
              </motion.div>
            )}

            {/* Education */}
            {(formData.highestEducationLevel || formData.education?.some(e => e.institution)) && (
              <DataSection title="Education">
                <div className="space-y-3">
                  <DataRow label="Highest Education Level" value={formData.highestEducationLevel || '—'} />
                  {(formData.education || []).filter(e => e.institution).map((e, i) => (
                    <div key={i} className="border-l-2 border-bronze-soft pl-4">
                      <div className="font-medium text-sm text-navy">{e.degree} {e.field && `— ${e.field}`}</div>
                      <div className="text-xs text-[#334155]">{e.institution}</div>
                      {e.yearCompleted && <div className="text-[10px] text-[#94a3b8]">{e.yearCompleted}</div>}
                    </div>
                  ))}
                </div>
              </DataSection>
            )}

            {/* Skills */}
            {(formData.skillsSummary || formData.skillsYearsExperience || formData.skillsPrimaryFocus
              || formData.skillsTechnical || formData.skillsCommunication || formData.certifications
              || formData.computerSkills || formData.fieldLabExperience) && (
              <DataSection title="Skills & Certifications">
                {formData.skillsYearsExperience && <DataRow label="Years of Relevant Experience" value={formData.skillsYearsExperience} />}
                {formData.skillsPrimaryFocus && <DataRow label="Primary Areas of Focus" value={formData.skillsPrimaryFocus} className="mt-2" />}
                {formData.skillsTechnical && <DataRow label="Technical Skills & Field / Lab Tools" value={formData.skillsTechnical} className="mt-2" />}
                {formData.certifications && <DataRow label="Certifications" value={formData.certifications} className="mt-2" />}
                {formData.computerSkills && <DataRow label="Software / Computer Skills" value={formData.computerSkills} className="mt-2" />}
                {formData.fieldLabExperience && <DataRow label="Field / Lab Experience" value={formData.fieldLabExperience} className="mt-2" />}
                {formData.skillsCommunication && <DataRow label="Communication & Team Skills" value={formData.skillsCommunication} className="mt-2" />}
                {formData.skillsSummary && <DataRow label="Additional Skills Summary" value={formData.skillsSummary} className="mt-2" />}
              </DataSection>
            )}

            {/* References */}
            {formData.references?.some(r => r.name) && (
              <DataSection title="References">
                <div className="space-y-4">
                  {formData.references.filter(r => r.name).map((r, i) => (
                    <div key={i} className="border-l-2 border-bronze-soft pl-4">
                      <div className="font-medium text-sm text-navy">{r.name}</div>
                      {(r.company || r.organization) && <div className="text-xs text-[#334155]">{r.company || r.organization}</div>}
                      <div className="flex flex-wrap gap-3 mt-1">
                        {r.phone && <span className="text-[10px] text-[#94a3b8]">📞 {r.phone}</span>}
                        {r.email && <span className="text-[10px] text-[#94a3b8]">✉ {r.email}</span>}
                        {r.relationship && <span className="text-[10px] text-[#94a3b8]">{r.relationship}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </DataSection>
            )}

            {/* Affiliations */}
            {formData.affiliations && (
              <DataSection title="Professional Affiliations">
                <DataRow label="Affiliations / Memberships" value={formData.affiliations} />
              </DataSection>
            )}

            {/* Certifications & Disclosures */}
            <DataSection title="Certifications & Legal Disclosures">
              <div className="grid grid-cols-2 gap-3">
                <DataRow label="Reference Authorization Initials" value={formData.certifyInitials || '—'} />
                <DataRow label="Medical Disclosure Initials" value={formData.medInitials || '—'} />
                <DataRow label="Can Perform Duties (ADA)" value={formData.canPerformDuties === true ? 'Yes' : formData.canPerformDuties === false ? 'No' : '—'} />
                <DataRow label="Accommodation Requested" value={formData.needsAccommodation === true ? 'Yes' : formData.needsAccommodation === false ? 'No' : '—'} />
                <DataRow label="Certification Agreed" value={formData.certificationAgreed ? 'Yes' : 'No'} />
                <DataRow label="Electronic Signature" value={formData.certificationSignature || '—'} />
                <DataRow label="Signature Date" value={formData.certificationDate || '—'} />
                <DataRow label="Drug Test Agreed" value={formData.drugTestAgreed ? 'Yes' : 'No'} />
                <DataRow label="Drug Test Signature" value={formData.drugTestSignature || '—'} />
                <DataRow label="Drug Test Date" value={formData.drugTestDate || '—'} />
              </div>
            </DataSection>

            {/* EEO section - access restricted */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
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
                  <DataRow label="Veteran Status" value={veteranStatusLabel(app.eeoData?.veteranStatus || formData.veteranStatus)} />
                </div>
              ) : (
                <p className="text-xs text-[#94a3b8] italic">EEO and veteran data is access-restricted. Click Reveal to view (HR Admin only).</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
              <h2 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-bronze" /> Recruiter Notes
              </h2>
              <div className="space-y-3 mb-4">
                {notes.length === 0 && <p className="text-xs text-[#94a3b8] italic">No notes yet.</p>}
                {[...notes].reverse().map((n, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-bronze-soft flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-bronze-dark">{(n.authorName || 'A')[0]}</span>
                    </div>
                    <div className="flex-1 bg-[#f9fafb] rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-[#334155]">{n.authorName || n.authorEmail}</span>
                        <span className="text-[10px] text-[#94a3b8]">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#334155] leading-relaxed">{n.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  aria-label="Recruiter note"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a recruiter note..."
                  rows={2}
                  className="text-sm flex-1 resize-none"
                />
                <Button
                  aria-label="Save recruiter note"
                  onClick={handleAddNote}
                  disabled={savingNote || !newNote.trim()}
                  className="rounded-lg px-4 h-auto bg-bronze hover:bg-bronze-dark text-white self-end"
                >
                  {savingNote ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              </div>
              </motion.div>

              {/* Sidebar */}
          <div className="space-y-4">
            {/* Resume */}
            {app.resumeFileUrl && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
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

            {(app.documents || []).length > 0 && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
                <h3 className="text-xs font-semibold text-navy mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-bronze" /> Application Files
                </h3>
                <div className="space-y-2.5">
                  {app.documents.map(document => (
                    <a
                      key={document.key}
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-xs text-bronze hover:underline"
                    >
                      {document.restricted ? <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-purple-600" /> : <Download className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                      <span>{document.label}{document.restricted ? ' (Restricted)' : ''}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter assignment */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
              <h3 className="text-xs font-semibold text-navy mb-2">Recruiter</h3>
              <p className="text-xs text-[#64748b]">{app.assignedRecruiterEmail || 'Unassigned'}</p>
            </div>

            {/* Stage history */}
            {(app.stageHistory || []).length > 0 && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
                <h3 className="text-xs font-semibold text-navy mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-bronze" /> Stage History
                </h3>
                <div className="space-y-2">
                  {[...(app.stageHistory || [])].reverse().map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-medium text-[#334155]">{STAGE_LABELS[h.stage] || h.stage}</div>
                        <div className="text-[10px] text-[#94a3b8]">{new Date(h.changedAt).toLocaleDateString()} · {h.changedBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit trail */}
            {(app.auditTrail || []).length > 0 && (
              <div className="bg-[#f9fafb] rounded-xl border border-[#e2e8f0] p-4">
                <h3 className="text-xs font-semibold text-[#64748b] mb-2">Audit Trail</h3>
                <div className="space-y-1.5">
                  {[...(app.auditTrail || [])].reverse().slice(0, 8).map((a, i) => (
                    <div key={i} className="text-[10px] text-[#94a3b8]">
                      <span className="text-[#64748b]">{a.action}</span> — {a.performedBy} · {new Date(a.performedAt).toLocaleDateString()}
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
                <p className="text-xs text-[#64748b] mt-0.5">This will update their stage and record the change in the audit history.</p>
              </div>
            </div>
            <div className="bg-[#f9fafb] rounded-lg p-3 mb-5 flex items-center gap-3 text-sm">
              <span className="text-[#64748b] text-xs">{STAGE_LABELS[app.stage]}</span>
              <span className="text-[#94a3b8]">→</span>
              <span className="font-semibold text-navy text-xs">{STAGE_LABELS[confirmStage]}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmStage(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-[#e2e8f0] text-[#334155] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStageChangeConfirmed}
                disabled={updatingStage}
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
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
      <h2 className="text-sm font-semibold text-navy mb-3 border-b border-[#f1f5f9] pb-2">{title}</h2>
      {children}
    </div>
  );
}

function DataRow({ label, value, className = '' }) {
  return (
    <div className={className}>
      <div className="text-[10px] text-[#94a3b8] uppercase tracking-wide">{label}</div>
      <div className="text-xs text-[#334155] mt-0.5 leading-relaxed">{value || '—'}</div>
    </div>
  );
}
