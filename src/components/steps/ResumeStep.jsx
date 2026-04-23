import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FormSection from '../app/FormSection';
import NavigationButtons from '../app/NavigationButtons';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_SIZE = 5 * 1024 * 1024;

export default function ResumeStep({ formData, setFormData, onNext, onBack }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, parsing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      setErrorMsg('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.');
      setStatus('error');
      return;
    }
    if (f.size > MAX_SIZE) {
      setErrorMsg('File exceeds 5 MB limit.');
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('idle');
    setErrorMsg('');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, [handleFile]);

  const handleUploadAndParse = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setStatus('parsing');
      setFormData(prev => ({ ...prev, resumeFileUrl: file_url }));

      const parsed = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract structured data from this resume. Be thorough and extract all available information.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            contact: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                cell: { type: 'string' },
                address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip: { type: 'string' },
              },
            },
            targetRole: { type: 'string' },
            employment: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  company: { type: 'string' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                  position: { type: 'string' },
                  dateFrom: { type: 'string' },
                  dateTo: { type: 'string' },
                  duties: { type: 'string' },
                  reasonForLeaving: { type: 'string' },
                  supervisor: { type: 'string' },
                },
              },
            },
            education: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  institution: { type: 'string' },
                  degree: { type: 'string' },
                  field: { type: 'string' },
                  yearCompleted: { type: 'string' },
                },
              },
            },
            skills: { type: 'array', items: { type: 'string' } },
            certifications: { type: 'array', items: { type: 'string' } },
            references: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  company: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
      });

      setParsedPreview(parsed);
      mergeResumeData(parsed);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to parse resume.');
      setStatus('error');
    }
  };

  const mergeResumeData = (parsed) => {
    setFormData(prev => {
      const updated = { ...prev };

      // Merge contact info (don't overwrite non-empty fields)
      if (parsed.contact) {
        const c = parsed.contact;
        if (!updated.firstName && c.firstName) updated.firstName = c.firstName;
        if (!updated.lastName && c.lastName) updated.lastName = c.lastName;
        if (!updated.email && c.email) updated.email = c.email;
        if (!updated.phone && c.phone) updated.phone = c.phone;
        if (!updated.cell && c.cell) updated.cell = c.cell;
        if (!updated.address && c.address) updated.address = c.address;
        if (!updated.city && c.city) updated.city = c.city;
        if (!updated.state && c.state) updated.state = c.state;
        if (!updated.zip && c.zip) updated.zip = c.zip;
      }

      if (parsed.targetRole && !updated.positionAppliedFor) {
        updated.positionAppliedFor = parsed.targetRole;
      }

      // Merge employment
      if (parsed.employment?.length) {
        const emp = [...updated.employment];
        parsed.employment.slice(0, 3).forEach((job, i) => {
          if (!emp[i].company) emp[i].company = job.company || '';
          if (!emp[i].address) emp[i].address = job.address || '';
          if (!emp[i].phone) emp[i].phone = job.phone || '';
          if (!emp[i].position) emp[i].position = job.position || '';
          if (!emp[i].dateFrom) emp[i].dateFrom = job.dateFrom || '';
          if (!emp[i].dateTo) emp[i].dateTo = job.dateTo || '';
          if (!emp[i].duties) emp[i].duties = job.duties || '';
          if (!emp[i].reasonForLeaving) emp[i].reasonForLeaving = job.reasonForLeaving || '';
          if (!emp[i].supervisor) emp[i].supervisor = job.supervisor || '';
        });
        updated.employment = emp;
      }

      // Merge education
      if (parsed.education?.length) {
        const edu = [...updated.education];
        parsed.education.slice(0, 3).forEach((ed, i) => {
          if (!edu[i]) edu[i] = { institution: '', degree: '', field: '', yearCompleted: '' };
          if (!edu[i].institution) edu[i].institution = ed.institution || '';
          if (!edu[i].degree) edu[i].degree = ed.degree || '';
          if (!edu[i].field) edu[i].field = ed.field || '';
          if (!edu[i].yearCompleted) edu[i].yearCompleted = ed.yearCompleted || '';
        });
        updated.education = edu;
      }

      // Merge skills
      if (parsed.skills?.length && !updated.skillsSummary) {
        updated.skillsSummary = parsed.skills.join(', ');
      }
      if (parsed.certifications?.length && !updated.certifications) {
        updated.certifications = parsed.certifications.join(', ');
      }

      // Merge references
      if (parsed.references?.length) {
        const refs = [...updated.references];
        parsed.references.slice(0, 3).forEach((ref, i) => {
          if (!refs[i].name) refs[i].name = ref.name || '';
          if (!refs[i].company) refs[i].company = ref.company || '';
          if (!refs[i].phone) refs[i].phone = ref.phone || '';
        });
        updated.references = refs;
      }

      updated.resumeAutoFillTimestamp = new Date().toISOString();
      return updated;
    });
  };

  return (
    <div>
      <FormSection
        title="Resume Import"
        description="Upload your resume and our AI assistant will help pre-fill your application. You can review and edit all fields afterward."
      >
        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${dragOver
              ? 'border-bronze bg-bronze-soft'
              : file
                ? 'border-success bg-success-soft'
                : 'border-[#cbd5e1] bg-[#fafafa] hover:border-bronze hover:bg-bronze-softer'
            }
          `}
          onClick={() => document.getElementById('resume-input').click()}
        >
          <input
            id="resume-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-success" />
              <div className="text-left">
                <p className="text-sm font-medium text-[#111827]">{file.name}</p>
                <p className="text-[10px] text-[#6b7280]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setStatus('idle'); setParsedPreview(null); }}
                className="ml-2 p-1 rounded-full hover:bg-[#f3f4f6]"
              >
                <X className="w-4 h-4 text-[#6b7280]" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-[#9ca3af] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#374151]">
                Drag & drop your resume here
              </p>
              <p className="text-xs text-[#6b7280] mt-1">
                or click to browse · PDF, DOC, DOCX, TXT · Max 5 MB
              </p>
            </>
          )}
        </div>

        {/* Upload button */}
        {file && status !== 'success' && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleUploadAndParse}
              disabled={status === 'uploading' || status === 'parsing'}
              className="rounded-full px-6 h-9 text-sm bg-bronze hover:bg-bronze-dark text-white"
            >
              {(status === 'uploading' || status === 'parsing') && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {status === 'uploading' ? 'Uploading...' : status === 'parsing' ? 'Analyzing Resume...' : 'Upload & Analyze Resume'}
            </Button>
          </div>
        )}

        {/* Status messages */}
        {status === 'error' && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{errorMsg}</p>
          </div>
        )}

        {status === 'success' && parsedPreview && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success-soft border border-success-light">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              <p className="text-xs text-green-800">
                Resume parsed successfully. Fields have been pre-filled.
              </p>
            </div>

            {/* Preview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <PreviewCard
                title="Contact Snapshot"
                items={[
                  parsedPreview.contact?.firstName && parsedPreview.contact?.lastName
                    ? `${parsedPreview.contact.firstName} ${parsedPreview.contact.lastName}` : null,
                  parsedPreview.contact?.email,
                  parsedPreview.contact?.phone,
                ].filter(Boolean)}
              />
              <PreviewCard
                title="Recent Experience"
                items={parsedPreview.employment?.slice(0, 2).map(e =>
                  `${e.position || 'Position'} at ${e.company || 'Company'}`
                ) || []}
              />
              <PreviewCard
                title="Education & Skills"
                items={[
                  ...(parsedPreview.education?.slice(0, 1).map(e => e.degree || e.institution) || []),
                  ...(parsedPreview.skills?.slice(0, 3) || []),
                ]}
              />
            </div>

            {/* Dev JSON preview toggle */}
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1.5 text-[10px] text-[#9ca3af] hover:text-[#6b7280] transition"
            >
              {showJson ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showJson ? 'Hide' : 'Show'} parsed data
            </button>
            {showJson && (
              <pre className="text-[10px] bg-[#f9fafb] rounded-lg p-3 border border-[#e5e7eb] overflow-auto max-h-48 text-[#374151]">
                {JSON.stringify(parsedPreview, null, 2)}
              </pre>
            )}

            <p className="text-[10px] text-[#9ca3af]">
              Auto-filled at {new Date(formData.resumeAutoFillTimestamp).toLocaleString()}
            </p>
          </div>
        )}
      </FormSection>

      <NavigationButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function PreviewCard({ title, items }) {
  return (
    <div className="bg-bronze-softer border border-bronze-soft rounded-lg p-3">
      <h4 className="text-[10px] font-semibold text-bronze-dark mb-2 uppercase tracking-wider">
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-[11px] text-[#374151] truncate">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-[#9ca3af] italic">No data extracted</p>
      )}
    </div>
  );
}