import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowRight, ArrowLeft, Clock, ChevronDown, ChevronUp, MapPin, Briefcase } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/e4e60e6f1_geolabs.png';

const EMP_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temporary: 'Temporary',
  internship: 'Internship',
};

function CollapsibleCard({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-[11px] text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function JobPanel({ job }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-[#F5C400]/40 shadow-sm' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">{job.title}</div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {job.department && (
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {job.department}
              </span>
            )}
            {job.office && (
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {job.office}
              </span>
            )}
            {job.employmentType && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F5C400]/10 text-[#b8910a] border border-[#F5C400]/20">
                {EMP_LABELS[job.employmentType] || job.employmentType}
              </span>
            )}
            {job.salaryMin && job.salaryMax && (
              <span className="text-[10px] text-gray-400">
                ${Number(job.salaryMin).toLocaleString()}–${Number(job.salaryMax).toLocaleString()}/yr
              </span>
            )}
          </div>
        </div>
        <span className="mt-1 flex-shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 bg-white space-y-3 pt-4">
          <p className="text-[11px] text-gray-400">
            GEOLABS, INC. · Geotechnical Engineering and Drilling Services<br />
            94-429 Koaki Street, Suite 200 · Waipahu, Hawaii 96797<br />
            Telephone: (808) 841-5064 · hawaii@geolabs.net · Hawaii · California
          </p>

          {job.description && (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
          )}

          {job.requiredQualifications && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Requirements</h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.requiredQualifications}</p>
            </div>
          )}

          {job.preferredQualifications && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">Preferred Qualifications</h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.preferredQualifications}</p>
            </div>
          )}

          {job.applicationDeadline && (
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Application deadline: {new Date(job.applicationDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          <p className="text-[10px] text-gray-400 italic pt-1 border-t border-gray-100">
            EQUAL OPPORTUNITY EMPLOYER: All qualified applicants and employees are treated fairly and without regard to race, color, religion, sex, or national origin, or other protected characteristics, in accordance with Title VII of the Civil Rights Act of 1964 and other applicable state and federal employment laws.
          </p>
        </div>
      )}
    </div>
  );
}

export default function StartStep({ onNext, requisition, onBack }) {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    // Only load the job board list when there's no specific requisition
    if (!requisition) {
      base44.entities.JobRequisition.filter({ status: 'published' }, '-publishedDate', 50)
        .then(j => { setJobs(j); setLoadingJobs(false); });
    } else {
      setLoadingJobs(false);
    }
  }, [requisition]);

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-8">
        <img src={LOGO_URL} alt="Geolabs" className="w-14 h-14 object-contain flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Geolabs, Inc. — Employment Opportunities</h2>
          <p className="text-sm text-gray-500 mt-1">
            Join a 100% employee-owned geotechnical engineering and drilling firm serving Hawaiʻi and California. Offices in Waipahu, HI and California.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[#F5C400]/10 text-[#b8910a] border border-[#F5C400]/20">Employee-Owned (ESOP)</span>
            <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Field &amp; Office Roles</span>
            <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">Hawaiʻi · California</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT: CTA + Job listings */}
        <div className="lg:col-span-2 space-y-5">

          {/* Hero CTA */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Build your career with Geolabs.</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our staff engineers, engineering technicians, and drilling team support infrastructure and development projects throughout Hawaiʻi and beyond. If you are motivated, detail-oriented, and willing to learn, we encourage you to apply.
            </p>
            <ul className="space-y-1.5">
              {['Hands-on field and lab experience', 'Opportunities to work with professional engineers', 'Competitive benefits and ESOP participation'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5C400] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {requisition && (
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Jobs
                  </a>
                )}
                <button
                 onClick={onNext}
                 className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F5C400] hover:bg-[#EFB506] text-gray-900 text-sm font-semibold rounded-xl transition-all shadow-sm"
                >
                  {requisition ? `Apply for ${requisition.title}` : 'Apply Now'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Estimated time: 15–20 minutes
              </p>
            </div>
          </div>

          {/* Current Openings */}
          {!requisition && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Current Openings</h3>
                <p className="text-xs text-gray-400 mt-0.5">Expand each position to review responsibilities and requirements.</p>
              </div>
              {loadingJobs ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : jobs.length === 0 ? (
                <div className="border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
                  No open positions at this time. Check back soon.
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map(job => <JobPanel key={job.id} job={job} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: EEO + Benefits sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <CollapsibleCard title="Equal Employment Opportunity">
            Geolabs, Inc. provides equal employment opportunities to all employees and applicants without regard to race, color, religion, gender or gender identity, sexual orientation, national origin, age, disability, genetic information, marital status, amnesty or status as a covered veteran and lactation in accordance with applicable federal, state, and local laws.
          </CollapsibleCard>

          <CollapsibleCard title="Accessibility & Accommodations">
            As an ADA-compliant employer, Geolabs is committed to providing reasonable accommodations for qualified applicants and employees who are able to perform the essential functions of their position satisfactorily.
          </CollapsibleCard>

          <CollapsibleCard title="Benefits Snapshot">
            <ul className="space-y-1.5 mt-1">
              {[
                'Medical, Dental, Drug & Vision',
                'Paid Time Off (PTO) — up to 28 days',
                'Holidays — 10 days/year',
                '401(k) Plan',
                'Employee Stock Ownership Plan (ESOP)',
                'Group Term Life Insurance',
                'Flexible Spending Account (FSA)',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-[#F5C400] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CollapsibleCard>
        </aside>
      </div>
    </div>
  );
}