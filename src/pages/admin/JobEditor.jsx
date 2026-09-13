import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/localClient';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Plus, Trash2, Save, Send } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const DEPARTMENTS = ['Environmental', 'Engineering', 'Laboratory', 'Operations', 'Administrative', 'Management', 'Field Services', 'IT', 'Finance'];
const OFFICES = ['Waipahu, HI', 'Honolulu, HI', 'Hilo, HI', 'Remote', 'Other'];
const EMP_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
];

const EMPTY_FORM = {
  id: '', statusHistory: [], publishedDate: '',
  title: '', department: '', office: '', employmentType: 'full_time',
  description: '', requiredQualifications: '', preferredQualifications: '',
  salaryMin: '', salaryMax: '', applicationDeadline: '', headcount: 1,
  hiringManagerEmail: '', recruiterEmail: '', internalNotes: '',
  screeningQuestions: [], status: 'draft',
};

// Keep field components stable so typing does not remount the input and lose focus.
const Field = ({ label, required = false, children, hint = '' }) => (
  <label className="block">
    <span className="block text-[11px] font-medium text-[#334155] mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
    {children}
    {hint && <span className="block text-[10px] text-[#64748b] mt-1">{hint}</span>}
  </label>
);

const Select = ({ value, onChange, options, placeholder = '' }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="w-full h-9 px-3 text-sm rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-1 focus:ring-bronze focus:border-bronze"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
  </select>
);

export default function JobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isNew) {
      appClient.entities.JobRequisition.filter({ id }).then(([req]) => {
        if (!active) return;
        if (req) setForm({ ...EMPTY_FORM, ...req });
        else setError('This job opening could not be found. Return to Job Openings to choose another.');
        setLoading(false);
      }).catch(() => {
        if (!active) return;
        setError('This job opening could not be loaded. Please try again.');
        setLoading(false);
      });
    }
    return () => { active = false; };
  }, [id, isNew]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addQuestion = () => {
    update('screeningQuestions', [
      ...(form.screeningQuestions || []),
      { question: '', type: 'text', required: false, choices: [] }
    ]);
  };

  const updateQuestion = (idx, field, value) => {
    const qs = [...(form.screeningQuestions || [])];
    qs[idx] = { ...qs[idx], [field]: value };
    update('screeningQuestions', qs);
  };

  const removeQuestion = (idx) => {
    const qs = [...(form.screeningQuestions || [])];
    qs.splice(idx, 1);
    update('screeningQuestions', qs);
  };

  const save = async (targetStatus = '') => {
    setSaving(true);
    setError('');
    const now = new Date().toISOString();
    const data = { ...form };
    if (isNew && !data.id) {
      data.id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? `job-${crypto.randomUUID()}`
        : `job-${Date.now()}`;
    }
    if (targetStatus) {
      const prevStatus = data.status;
      data.status = targetStatus;
      data.statusHistory = [
        ...(data.statusHistory || []),
        { status: targetStatus, changedAt: now, changedBy: 'admin', note: `Status changed from ${prevStatus} to ${targetStatus}` }
      ];
      if (targetStatus === 'published') data.publishedDate = now;
    }

    try {
      if (isNew) {
        const created = await appClient.entities.JobRequisition.create(data);
        navigate(`/admin/jobs/${created?.id || data.id}`);
      } else {
        await appClient.entities.JobRequisition.update(id, data);
        navigate(`/admin/jobs/${id}`);
      }
    } catch {
      setError('This job opening could not be saved. Please try again.');
    }
    setSaving(false);
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/admin/jobs" aria-label="Back to job openings" className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-navy">{isNew ? 'New Job Opening' : 'Edit Job Opening'}</h1>
        </div>

        {/* Basic Info */}
        <section className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-navy border-b border-[#f1f5f9] pb-3">Basic Information</h2>
          <Field label="Job Title" required>
            <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g., Environmental Scientist II" className="h-9 text-sm" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Department" required>
              <Select value={form.department} onChange={v => update('department', v)} options={DEPARTMENTS} placeholder="Select department" />
            </Field>
            <Field label="Office / Location">
              <Select value={form.office} onChange={v => update('office', v)} options={OFFICES} placeholder="Select office" />
            </Field>
            <Field label="Employment Type" required>
              <Select value={form.employmentType} onChange={v => update('employmentType', v)} options={EMP_TYPES} />
            </Field>
            <Field label="Number of Openings">
              <Input type="number" value={form.headcount} onChange={e => update('headcount', parseInt(e.target.value) || 1)} min="1" className="h-9 text-sm" />
            </Field>
            <Field label="Salary Min (Annual)">
              <Input type="number" value={form.salaryMin} onChange={e => update('salaryMin', e.target.value)} placeholder="e.g., 55000" className="h-9 text-sm" />
            </Field>
            <Field label="Salary Max (Annual)">
              <Input type="number" value={form.salaryMax} onChange={e => update('salaryMax', e.target.value)} placeholder="e.g., 85000" className="h-9 text-sm" />
            </Field>
            <Field label="Application Deadline">
              <Input type="date" value={form.applicationDeadline} onChange={e => update('applicationDeadline', e.target.value)} className="h-9 text-sm" />
            </Field>
          </div>
        </section>

        {/* Assignments */}
        <section className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-navy border-b border-[#f1f5f9] pb-3">Team Assignments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Hiring Manager Email">
              <Input type="email" value={form.hiringManagerEmail} onChange={e => update('hiringManagerEmail', e.target.value)} placeholder="manager@geolabs.net" className="h-9 text-sm" />
            </Field>
            <Field label="Recruiter Email">
              <Input type="email" value={form.recruiterEmail} onChange={e => update('recruiterEmail', e.target.value)} placeholder="recruiter@geolabs.net" className="h-9 text-sm" />
            </Field>
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-navy border-b border-[#f1f5f9] pb-3">Job Description</h2>
          <Field label="Job Description" required>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={6} placeholder="Describe the role, responsibilities, and team..." className="text-sm" />
          </Field>
          <Field label="Required Qualifications">
            <Textarea value={form.requiredQualifications} onChange={e => update('requiredQualifications', e.target.value)} rows={4} placeholder="List required education, experience, certifications..." className="text-sm" />
          </Field>
          <Field label="Preferred Qualifications">
            <Textarea value={form.preferredQualifications} onChange={e => update('preferredQualifications', e.target.value)} rows={3} placeholder="Nice-to-have qualifications..." className="text-sm" />
          </Field>
        </section>

        {/* Screening Questions */}
        <section className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <h2 className="text-sm font-semibold text-navy">Screening Questions</h2>
            <Button onClick={addQuestion} variant="outline" size="sm" className="h-7 text-xs rounded-full px-3">
              <Plus className="w-3 h-3 mr-1" /> Add Question
            </Button>
          </div>
          {(form.screeningQuestions || []).length === 0 && (
            <p className="text-xs text-[#94a3b8] text-center py-3">No screening questions. Add questions to pre-qualify applicants.</p>
          )}
          <div className="space-y-3">
            {(form.screeningQuestions || []).map((q, idx) => (
              <div key={idx} className="bg-[#f9fafb] rounded-lg border border-[#e2e8f0] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      aria-label={`Screening question ${idx + 1}`}
                      value={q.question}
                      onChange={e => updateQuestion(idx, 'question', e.target.value)}
                      placeholder="Enter your screening question..."
                      className="h-9 text-sm"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        aria-label={`Answer type for question ${idx + 1}`}
                        value={q.type}
                        onChange={e => updateQuestion(idx, 'type', e.target.value)}
                        className="h-7 px-2 text-xs rounded border border-[#e2e8f0] bg-white"
                      >
                        <option value="text">Text Answer</option>
                        <option value="yes_no">Yes / No</option>
                        <option value="multiple_choice">Multiple Choice</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-[#64748b]">
                        <input
                          type="checkbox"
                          checked={q.required || false}
                          onChange={e => updateQuestion(idx, 'required', e.target.checked)}
                          className="w-3.5 h-3.5 rounded"
                        />
                        Required
                      </label>
                    </div>
                    {q.type === 'multiple_choice' && (
                      <Input
                        aria-label={`Choices for question ${idx + 1}`}
                        value={(q.choices || []).join(', ')}
                        onChange={e => updateQuestion(idx, 'choices', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="Choice 1, Choice 2, Choice 3"
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                  <button aria-label={`Remove question ${idx + 1}`} onClick={() => removeQuestion(idx)} className="p-1.5 rounded hover:bg-red-50 text-[#94a3b8] hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Internal Notes */}
        <section className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-navy border-b border-[#f1f5f9] pb-3">Internal Notes</h2>
          <Field label="Notes (not visible to applicants)" hint="Budget notes, hiring context, sourcing strategy, etc.">
            <Textarea value={form.internalNotes} onChange={e => update('internalNotes', e.target.value)} rows={3} className="text-sm" />
          </Field>
        </section>

        {/* Actions */}
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
          <Link to="/admin/jobs">
            <Button variant="outline" className="rounded-full px-5 h-9 text-sm">Cancel</Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={() => save()} disabled={saving} variant="outline" className="rounded-full px-5 h-9 text-sm">
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Draft
            </Button>
            <Button
              onClick={() => save('published')}
              disabled={saving || !form.title || !form.department || !form.description}
              className="rounded-full px-5 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
              Publish Opening
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
