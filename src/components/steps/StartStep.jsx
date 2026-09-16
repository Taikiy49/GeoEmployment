import React, { useState, useEffect } from 'react';
import { appClient } from '@/api/localClient';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import '@/styles/application-start.css';

const EMP_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temporary: 'Temporary',
  internship: 'Internship',
};

function JobMetadata({ job }) {
  return (
    <span className="application-start__job-meta">
      {job.department && <span>{job.department}</span>}
      {job.office && <span>{job.office}</span>}
      {job.employmentType && <span>{EMP_LABELS[job.employmentType] || job.employmentType}</span>}
      {job.salaryMin && job.salaryMax && (
        <span>${Number(job.salaryMin).toLocaleString('en-US')}–${Number(job.salaryMax).toLocaleString('en-US')}/yr</span>
      )}
    </span>
  );
}

function JobPanel({ job, selected = false }) {
  // A date-only deadline should not move to the previous day in Hawaii.
  const deadline = job.applicationDeadline
    ? new Date(`${String(job.applicationDeadline).slice(0, 10)}T12:00:00`)
    : null;
  return (
    <AccordionItem value={String(job.id || 'selected-position')} className="application-start__disclosure">
      <AccordionTrigger className="application-start__trigger">
        <span className="application-start__job-heading">
          <span>{selected ? 'Position details' : job.title}</span>
          {!selected && <JobMetadata job={job} />}
        </span>
      </AccordionTrigger>
      <AccordionContent className="application-start__disclosure-content">
        <p className="application-start__company-details">
          GEOLABS, INC. · Geotechnical Engineering and Drilling Services<br />
          94-429 Koaki Street, Suite 200 · Waipahu, Hawaii 96797<br />
          Telephone: (808) 841-5064 · hawaii@geolabs.net · Hawaii · California
        </p>
        {job.description && <p className="application-start__job-copy">{job.description}</p>}
        {job.requiredQualifications && (
          <div>
            <h4>Requirements</h4>
            <p className="application-start__job-copy">{job.requiredQualifications}</p>
          </div>
        )}
        {job.preferredQualifications && (
          <div>
            <h4>Preferred Qualifications</h4>
            <p className="application-start__job-copy">{job.preferredQualifications}</p>
          </div>
        )}
        {deadline && !Number.isNaN(deadline.getTime()) && (
          <p className="application-start__deadline">
            Application deadline: {deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <p className="application-start__legal">
          EQUAL OPPORTUNITY EMPLOYER: All qualified applicants and employees are treated fairly and without regard to race, color, religion, sex, or national origin, or other protected characteristics, in accordance with Title VII of the Civil Rights Act of 1964 and other applicable state and federal employment laws.
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function StartStep({ onNext, requisition }) {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(!requisition);
  const [jobsError, setJobsError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    if (requisition) {
      setLoadingJobs(false);
      setJobsError('');
      return;
    }
    let active = true;
    setLoadingJobs(true);
    setJobsError('');
    const timeout = setTimeout(() => {
      if (!active) return;
      active = false;
      setLoadingJobs(false);
      setJobsError('The list of openings is taking longer than expected. Try again, or begin a general application.');
    }, 15000);
    appClient.entities.JobRequisition.filter({ status: 'published' }, '-publishedDate', 50)
      .then(results => {
        if (!active) return;
        setJobs(Array.isArray(results) ? results : []);
        setLoadingJobs(false);
      })
      .catch(() => {
        if (!active) return;
        setJobsError('We could not load the current openings. Try again, or begin a general application.');
        setLoadingJobs(false);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [requisition, loadAttempt]);

  return (
    <div className="application-start">
      <div className="application-start__intro-grid">
        <section aria-labelledby="application-welcome-title">
          <p className="portal-eyebrow">{requisition ? 'Employment application' : 'General employment application'}</p>
          <h1 id="application-welcome-title" className="application-start__title">{requisition?.title || 'General Application'}</h1>
          {requisition && <JobMetadata job={requisition} />}
          <p className="application-start__intro">
            {requisition
              ? 'Take the next step toward joining our employee-owned geotechnical engineering and drilling team.'
              : 'Interested in joining Geolabs, Inc. but do not see the right opening? Tell us about your experience and our HR team will consider where you may fit.'}
          </p>
          <div className="application-start__actions">
            <button type="button" onClick={onNext} className="portal-button portal-button--primary">
              {requisition ? 'Begin Application' : 'Begin General Application'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            {requisition && (
              <a href="/" className="portal-button portal-button--secondary">
                <ArrowLeft size={18} aria-hidden="true" /> Back to Jobs
              </a>
            )}
          </div>
          <p className="application-start__time-note">Allow about 15–20 minutes. You can save your progress and return later.</p>
        </section>
        <aside className="application-start__preparation" aria-labelledby="application-preparation-title">
          <h3 id="application-preparation-title">Before you begin</h3>
          <ul className="application-start__checklist">
            <li>Have your work and education history ready.</li>
            <li>Gather contact details for your professional references.</li>
            <li>You can attach a résumé to help fill in your application. PDF, DOC, DOCX or TXT; 2 MB or smaller.</li>
          </ul>
          <p className="application-start__save-note">Progress saves in this browser. During the application, you can request a private email link to continue on another device.</p>
        </aside>
      </div>

      <div className="application-start__details-grid">
        <section aria-labelledby="application-openings-title">
          <h3 id="application-openings-title">{requisition ? 'About this position' : 'Current Openings'}</h3>
          <p className="application-start__section-intro">
            {requisition ? 'Review the responsibilities and qualifications before you begin.' : 'Expand each position to review responsibilities and requirements.'}
          </p>
          {requisition ? (
            <Accordion type="multiple" className="application-start__disclosures"><JobPanel job={requisition} selected /></Accordion>
          ) : loadingJobs ? (
            <div className="application-start__load-state" role="status">
              <Loader2 size={18} className="application-start__loading-icon" aria-hidden="true" /> Loading current openings…
            </div>
          ) : jobsError ? (
            <div className="application-start__load-state application-start__load-state--error">
              <p role="alert">{jobsError}</p>
              <button type="button" className="portal-button portal-button--secondary" onClick={() => setLoadAttempt(attempt => attempt + 1)}>Retry openings</button>
            </div>
          ) : jobs.length === 0 ? (
            <p className="application-start__load-state" role="status">No open positions at this time. You can still begin a general application.</p>
          ) : (
            <Accordion type="multiple" className="application-start__disclosures">{jobs.map(job => <JobPanel key={job.id} job={job} />)}</Accordion>
          )}
        </section>
        <section className="application-start__company" aria-labelledby="application-company-title">
          <p className="portal-eyebrow">Why Geolabs, Inc.</p>
          <h3 id="application-company-title">Own a stake in the work you help build.</h3>
          <p className="application-start__section-intro">Work alongside experienced engineers and field teams on infrastructure that matters, with the long-term benefits of employee ownership.</p>
          <ul className="application-start__benefits">
            <li>Hands-on field and lab experience</li>
            <li>Opportunities to work with professional engineers</li>
            <li>Competitive benefits and ESOP participation</li>
          </ul>
          <h4>Benefits include</h4>
          <ul className="application-start__benefits">
            <li>Employee Stock Ownership Plan</li>
            <li>Medical, dental, drug and vision</li>
            <li>Paid time off and holidays</li>
            <li>401(k), life insurance and FSA</li>
          </ul>
        </section>
      </div>

      <section className="application-start__applicant-information" aria-labelledby="application-information-title">
        <h3 id="application-information-title">Applicant information</h3>
        <Accordion type="multiple" className="application-start__disclosures">
          <AccordionItem value="equal-opportunity" className="application-start__disclosure">
            <AccordionTrigger className="application-start__trigger">Equal employment opportunity</AccordionTrigger>
            <AccordionContent className="application-start__disclosure-content">
              Geolabs, Inc. provides equal employment opportunities without regard to any status protected by applicable federal, state, and local laws.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="accessibility" className="application-start__disclosure">
            <AccordionTrigger className="application-start__trigger">Accessibility &amp; accommodations</AccordionTrigger>
            <AccordionContent className="application-start__disclosure-content">
              Reasonable accommodations are available to qualified applicants. Contact the HR Department if assistance is needed during the application process.
              <a href="mailto:employment@geolabs.net" className="application-start__contact-link">employment@geolabs.net</a>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
