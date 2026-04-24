import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, ArrowRight, Shield, Users, Award, TrendingUp, Heart, Star, ChevronDown } from 'lucide-react';
import Header from '../components/app/Header';
import useSEO from '../hooks/useSEO';
import AppFooter from '../components/app/AppFooter';

const EMP_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship',
};
const EMP_COLORS = {
  full_time: 'bg-green-50 text-green-700 border-green-100',
  part_time: 'bg-blue-50 text-blue-700 border-blue-100',
  contract: 'bg-purple-50 text-purple-700 border-purple-100',
  temporary: 'bg-amber-50 text-amber-700 border-amber-100',
  internship: 'bg-sky-50 text-sky-700 border-sky-100',
};

const BENEFITS = [
  { icon: Heart, title: 'Full Family Medical', desc: 'Medical, dental, drug & vision — Geolabs covers family coverage after 12 months.' },
  { icon: TrendingUp, title: 'ESOP Ownership', desc: 'Be a true owner. Our Employee Stock Ownership Plan gives you a real stake in the company.' },
  { icon: Clock, title: 'Generous PTO', desc: '14 days your first year, scaling up to 28 days at 20+ years — plus 10 holidays.' },
  { icon: Shield, title: '401K + Life Insurance', desc: 'Company-supported retirement savings and group term life insurance for peace of mind.' },
  { icon: Star, title: 'FSA Savings', desc: 'Flexible Spending Account to reduce taxes on healthcare and dependent care expenses.' },
  { icon: Award, title: '50+ Years of Excellence', desc: '16 engineering awards and a legacy of innovative, high-quality geotechnical work.' },
];

const WHY_GEOLABS = [
  { stat: '50+', label: 'Years of Experience' },
  { stat: '80+', label: 'Team Members' },
  { stat: '100%', label: 'Employee-Owned' },
  { stat: '16', label: 'Engineering Awards' },
];

export default function JobBoard() {
  useSEO(
    'Careers at Geolabs, Inc. | Geotechnical Engineering Jobs in Hawaii',
    'Join Geolabs — Hawaii\'s premier 100% employee-owned geotechnical engineering firm. Explore open positions in geotechnical engineering, drilling, and environmental science across the Pacific Basin.'
  );

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showJobs, setShowJobs] = useState(false);

  useEffect(() => {
    base44.entities.JobRequisition.filter({ status: 'published' }, '-publishedDate', 100).then(j => {
      setJobs(j);
      setLoading(false);
    });
  }, []);

  const departments = ['all', ...new Set(jobs.map(j => j.department).filter(Boolean))];

  const filtered = jobs.filter(j => {
    const matchDept = deptFilter === 'all' || j.department === deptFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q) || j.office?.toLowerCase().includes(q);
    return matchDept && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0f172a]">
        {/* Background video — replace src with your .mov/.mp4 URL */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          src="https://us-east.storage.cloudconvert.com/tasks/03899d04-144b-42d3-a387-46f17eb47f56/Waihonua%20Drilled%20Shaft%20Installation%20v1%20%281%29.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=cloudconvert-production%2F20260424%2Fva%2Fs3%2Faws4_request&X-Amz-Date=20260424T005308Z&X-Amz-Expires=86400&X-Amz-Signature=1db6596def668408c09102198cf0d90c380900cad142ceaf53eb975720863f67&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22Waihonua%20Drilled%20Shaft%20Installation%20v1%20%281%29.mp4%22&response-content-type=video%2Fmp4&x-id=GetObject"
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-bronze/20 border border-bronze/30 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-bronze animate-pulse" />
              <span className="text-xs font-semibold text-bronze tracking-wide uppercase">We're Hiring</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
              Build a career that<br />
              <span className="text-bronze">moves the earth.</span>
            </h1>
            <p className="text-gray-300 text-base leading-relaxed mb-8 max-w-xl">
              Join Geolabs — Hawaii's premier 100% employee-owned geotechnical engineering firm with 50 years of experience. Work on landmark projects across the Pacific Basin alongside award-winning engineers and scientists.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#open-roles"
                onClick={e => { e.preventDefault(); document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 bg-bronze hover:bg-bronze-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                View Open Roles <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#why-geolabs"
                onClick={e => { e.preventDefault(); document.getElementById('why-geolabs')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm border border-white/20"
              >
                Why Geolabs?
              </a>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {WHY_GEOLABS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-bronze">{s.stat}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Geolabs */}
      <section id="why-geolabs" className="bg-gray-50 border-b border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 relative">
                <img
                  src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/a3e1d3d0a_SWVTTestingatBlaisdellCenter1.jpg"
                  alt="Geolabs field work - Honolulu High Capacity Transit"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3">
                    <p className="text-white text-xs font-medium">🏗️ SWVT Testing at Blaisdell Center</p>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-bronze text-white rounded-2xl px-4 py-3 shadow-lg">
                <div className="text-lg font-bold">100%</div>
                <div className="text-[10px] font-medium opacity-90">Employee Owned</div>
              </div>
            </div>

            {/* Text */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-bronze mb-3">Why Join Us</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-5 leading-snug">
                More than a job —<br />it's your company.
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Founded in 1975 and employee-owned since 1991, Geolabs has spent nearly five decades delivering exceptional geotechnical engineering across Hawaii and the Pacific Basin. When you join Geolabs, you're not just an employee — you're an owner.
              </p>
              <div className="space-y-3">
                {[
                  "Work on high-profile projects shaping Hawaii's infrastructure",
                  'Gain mentorship from licensed PEs and senior scientists',
                  'Grow with a stable, award-winning firm with 50+ years of history',
                  'Earn ownership through our Employee Stock Ownership Plan (ESOP)',
                ].map((pt, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-bronze/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze" />
                    </div>
                    <p className="text-sm text-gray-600">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-bronze mb-2">Compensation & Benefits</p>
            <h2 className="text-2xl font-bold text-gray-900">Everything you need to thrive</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <div key={i} className="group flex items-start gap-4 bg-gray-50 hover:bg-bronze-softer border border-gray-100 hover:border-bronze/20 rounded-2xl p-5 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-bronze/10 group-hover:bg-bronze/20 flex items-center justify-center flex-shrink-0 transition-colors">
                  <b.icon className="w-5 h-5 text-bronze" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EEO / Culture */}
      <section className="py-12 bg-[#0f172a]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-white mb-2">Equal Opportunity Employer</h3>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xl">
              Geolabs provides equal employment opportunities to all employees and applicants without regard to race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status. We're ADA-compliant and committed to reasonable accommodations.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-6 py-4">
            <Users className="w-6 h-6 text-bronze" />
            <div>
              <div className="text-white text-sm font-semibold">Inclusive Workplace</div>
              <div className="text-gray-400 text-[11px]">Diversity is our strength</div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section id="open-roles" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-bronze mb-2">Open Positions</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Find your next role</h2>
            <p className="text-sm text-gray-400">
              {loading ? 'Loading positions…' : `${jobs.length} open position${jobs.length !== 1 ? 's' : ''} across our offices`}
            </p>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search positions, departments, locations…"
                className="w-full h-11 pl-11 pr-4 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map(d => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`h-11 px-4 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${
                    deptFilter === d
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {d === 'all' ? 'All Departments' : d}
                </button>
              ))}
            </div>
          </div>

          {/* Job Listings */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-48 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
              <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No open positions match your search.</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting your filters or check back soon.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(job => (
                <Link
                  key={job.id}
                  to={`/apply/${job.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-bronze/40 hover:shadow-lg transition-all duration-200 p-6 flex items-start justify-between gap-6"
                >
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-bronze/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-bronze/20 transition-colors">
                      <Briefcase className="w-5 h-5 text-bronze" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h2 className="text-base font-semibold text-gray-900 group-hover:text-bronze transition-colors">
                          {job.title}
                        </h2>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${EMP_COLORS[job.employmentType] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {EMP_LABELS[job.employmentType] || job.employmentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap mb-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          {job.department}
                        </span>
                        {job.office && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> {job.office}
                          </span>
                        )}
                        {job.applicationDeadline && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Closes {new Date(job.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 max-w-2xl">
                          {job.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-0.5">
                    {job.salaryMin && job.salaryMax && (
                      <div className="text-sm font-semibold text-gray-700">
                        ${Number(job.salaryMin).toLocaleString()}–${Number(job.salaryMax).toLocaleString()}
                        <span className="text-xs font-normal text-gray-400">/yr</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-bronze text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply now <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}


        </div>
      </section>

      {/* Admin link */}
      <div className="py-6 text-center border-t border-gray-100 bg-white">
        <a href="/admin" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <Shield className="w-3.5 h-3.5" /> HR Admin Portal
        </a>
      </div>

      <AppFooter />
    </div>
  );
}