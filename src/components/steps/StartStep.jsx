import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/localClient';
import {
  ArrowRight, ArrowLeft, Clock, ChevronDown, ChevronUp,
  MapPin, Briefcase, Check, ShieldCheck
} from 'lucide-react';

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
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-3.5 text-left hover:text-[#8A4A22] transition-colors"
      >
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.12em]">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 pr-8 text-xs text-slate-500 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

function JobPanel({ job }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-[#A65F2A]/40 shadow-sm' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-3 py-3 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
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
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#A65F2A]/10 text-[#8A4A22] border border-[#A65F2A]/20">
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
        <div className="px-3 pb-5 border-t border-gray-100 bg-white space-y-3 pt-4">
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

export default function StartStep({ onNext, requisition }) {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    // Only load the job board list when there's no specific requisition
    if (!requisition) {
      appClient.entities.JobRequisition.filter({ status: 'published' }, '-publishedDate', 50)
        .then(j => { setJobs(j); setLoadingJobs(false); });
    } else {
      setLoadingJobs(false);
    }
  }, [requisition]);

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-4">
      <div className="mb-8 border-b border-slate-200 pb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A65F2A]">
          {requisition ? 'Employment application' : 'General employment application'}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950">
          {requisition?.title || 'General Application'}
        </h2>
        <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-600">
          {requisition
            ? 'Take the next step toward joining our employee-owned geotechnical engineering and drilling team.'
            : 'Interested in joining Geolabs, Inc. but do not see the right opening? Tell us about your experience and our HR team will consider where you may fit.'}
        </p>
        {requisition && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
            {requisition.department && <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-[#A65F2A]" />{requisition.department}</span>}
            {requisition.office && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#A65F2A]" />{requisition.office}</span>}
            {requisition.employmentType && <span>{EMP_LABELS[requisition.employmentType] || requisition.employmentType}</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.8fr)] gap-6 items-start">
        {/* LEFT: CTA + Job listings */}
        <div className="space-y-6">

          {/* Hero CTA */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#F8F0E9]/70 p-6 sm:p-8 shadow-sm">
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#A65F2A]/10 blur-3xl" />
            <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A65F2A]">Why Geolabs, Inc.</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Own a stake in the work you help build.</h3>
            <p className="mt-3 max-w-xl text-sm text-slate-600 leading-relaxed">
              Work alongside experienced engineers and field teams on infrastructure that matters, with the long-term benefits of employee ownership.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {['Hands-on field and lab experience', 'Opportunities to work with professional engineers', 'Competitive benefits and ESOP participation'].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#A65F2A]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3">
                {requisition && (
                  <a
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Jobs
                  </a>
                )}
                <button
                 onClick={onNext}
                 className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#A65F2A] hover:bg-[#8A4A22] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-black/15"
                >
                  {requisition ? 'Begin Application' : 'Begin General Application'}
                  <ArrowRight className="w-4 h-4" />
                </button>
            </div>
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
                <div className="border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-400">
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

        {/* RIGHT: supporting details */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-slate-900">
              <Clock className="h-4 w-4 text-[#A65F2A]" />
              <h3 className="text-sm font-semibold">Before you begin</h3>
            </div>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Estimated time</dt><dd className="font-semibold text-slate-800">15–20 minutes</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Progress</dt><dd className="font-semibold text-slate-800">Saved automatically</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Privacy</dt><dd className="font-semibold text-slate-800">Confidential</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Benefits include</h3>
            <ul className="mt-3 space-y-2">
              {[
                'Employee Stock Ownership Plan',
                'Medical, dental, drug and vision',
                'Paid time off and holidays',
                '401(k), life insurance and FSA',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#A65F2A]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5">
            <div className="flex items-center gap-2 pt-4 text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#A65F2A]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Applicant information</span>
            </div>
            <CollapsibleCard title="Equal employment opportunity">
              Geolabs, Inc. provides equal employment opportunities without regard to any status protected by applicable federal, state, and local laws.
            </CollapsibleCard>
            <CollapsibleCard title="Accessibility & accommodations">
              Reasonable accommodations are available to qualified applicants. Contact the HR Department if assistance is needed during the application process.
            </CollapsibleCard>
          </div>
        </aside>
      </div>
    </div>
  );
}
