import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, ArrowRight, Users, Award, TrendingUp, Heart, Star, ChevronDown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen bg-[#FFFFFF]">
      <Header />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#171C26] via-[#1F3451] to-[#171C26]">
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="https://geolabs-s3-bucket.s3.us-west-1.amazonaws.com/geolabs-cover.mp4" type="video/mp4" />
        </video>
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-40">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#F5C400]/20 border border-[#F5C400]/40 rounded-lg px-4 py-2 mb-8"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 rounded-full bg-[#F5C400]"
              />
              <span className="text-xs font-bold text-[#F5C400] tracking-widest uppercase">Now Hiring</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6 tracking-tight"
            >
              Build a career that
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="block text-[#F5C400]"
              >
                moves the earth
              </motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-gray-200 text-lg leading-relaxed mb-10 max-w-2xl font-light"
            >
              Join Geolabs — Hawaii's premier 100% employee-owned geotechnical engineering firm. Work on landmark infrastructure projects across the Pacific Basin alongside award-winning engineers and scientists.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="#open-roles"
                onClick={e => { e.preventDefault(); document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 bg-[#F5C400] hover:bg-[#EFB506] text-[#171C26] font-bold px-7 py-3.5 rounded-lg transition-all text-sm shadow-lg hover:shadow-xl"
              >
                View Open Roles <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#why-geolabs"
                onClick={e => { e.preventDefault(); document.getElementById('why-geolabs')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-7 py-3.5 rounded-lg transition-colors text-sm border border-white/30 backdrop-blur-sm"
              >
                Why Geolabs?
              </a>
            </motion.div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-[#1F3451] backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {WHY_GEOLABS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <motion.div className="text-2xl font-bold text-[#F5C400]">
                  {s.stat}
                </motion.div>
                <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Geolabs */}
      <section id="why-geolabs" className="bg-[#FFFFFF] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/a3e1d3d0a_SWVTTestingatBlaisdellCenter1.jpg"
                  alt="Geolabs field work - Honolulu High Capacity Transit"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 to-[#0f172a]/40" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur-sm border border-white rounded-xl px-4 py-3 shadow-lg">
                    <p className="text-[#0f172a] text-xs font-bold">🏗️ SWVT Testing at Blaisdell Center</p>
                  </div>
                </div>
              </div>
              {/* Badge */}
              <div className="absolute -top-6 -right-6 bg-[#F5C400] text-[#171C26] rounded-xl px-5 py-4 shadow-xl font-bold">
                <div className="text-2xl">100%</div>
                <div className="text-xs font-bold">Employee Owned</div>
              </div>
            </div>

            {/* Text */}
            <div>
              <span className="inline-block text-xs font-black uppercase tracking-widest text-[#EFB506] mb-4 bg-[#F5C400]/10 px-3 py-1 rounded-lg">Why Join Geolabs</span>
              <h2 className="text-4xl font-black text-[#171C26] mb-6 leading-tight">
                More than a job<br />
                <span className="text-[#F5C400]">It's your company</span>
              </h2>
              <p className="text-gray-600 text-base leading-relaxed mb-8 font-light">
                Founded in 1975 and employee-owned since 1991, Geolabs has spent nearly five decades delivering exceptional geotechnical engineering. When you join, you're not just an employee — you're an owner with real equity.
              </p>
              <div className="space-y-4">
                {[
                  "Work on high-profile infrastructure projects across Hawaii and the Pacific",
                  'Mentorship from licensed professional engineers and senior scientists',
                  'Stability and growth with a 50-year award-winning track record',
                  'Real ownership through our Employee Stock Ownership Plan (ESOP)',
                ].map((pt, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F5C400]/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#F5C400]/40">
                      <div className="w-2 h-2 rounded-full bg-[#F5C400]" />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-[#1F3451]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-black uppercase tracking-widest text-[#F5C400] mb-4 bg-[#F5C400]/10 px-3 py-1 rounded-lg">Compensation & Benefits</span>
            <h2 className="text-4xl font-black text-white mb-2">Everything you need to thrive</h2>
            <p className="text-gray-300 font-light">Comprehensive benefits designed for your success and security</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                className="group flex flex-col items-start gap-4 bg-[#0f172a] border border-gray-600 rounded-xl p-6 transition-all duration-300 hover:border-yellow-400/50 cursor-pointer"
              >
                <motion.div
                  className="w-12 h-12 rounded-lg bg-[#F5C400]/10 flex items-center justify-center flex-shrink-0 border border-[#F5C400]/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <b.icon className="w-6 h-6 text-[#F5C400]" />
                </motion.div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">{b.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed font-light">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EEO / Culture */}
      <section className="py-12 bg-[#171C26]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-white mb-2">Equal Opportunity Employer</h3>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xl">
              Geolabs provides equal employment opportunities to all employees and applicants without regard to race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status. We're ADA-compliant and committed to reasonable accommodations.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-6 py-4">
            <Users className="w-6 h-6 text-[#F5C400]" />
            <div>
              <div className="text-white text-sm font-semibold">Inclusive Workplace</div>
              <div className="text-gray-400 text-[11px]">Diversity is our strength</div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section id="open-roles" className="py-20 bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-black uppercase tracking-widest text-[#EFB506] mb-4 bg-[#F5C400]/10 px-3 py-1 rounded-lg">Career Opportunities</span>
            <h2 className="text-4xl font-black text-[#171C26] mb-3">Find your next role</h2>
            <p className="text-gray-600 font-light">
              {loading ? 'Loading positions…' : `${jobs.length} open position${jobs.length !== 1 ? 's' : ''} across our offices`}
            </p>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search positions, departments, locations…"
                className="w-full h-12 pl-12 pr-4 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-light"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map(d => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`h-12 px-5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                    deptFilter === d
                      ? 'bg-[#171C26] text-[#F5C400] border-[#171C26]'
                      : 'bg-white text-[#21242C] border-gray-300 hover:border-[#F5C400] hover:text-[#F5C400]'
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
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                asChild
              >
                <Link
                  to={`/apply/${job.id}`}
                  className="group bg-white rounded-lg border border-gray-200 hover:border-yellow-400 hover:shadow-xl transition-all duration-300 p-6 flex items-start justify-between gap-6 hover:bg-yellow-50/30"
                >
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-[#F5C400]/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#F5C400]/25 transition-colors border border-[#F5C400]/20">
                      <Briefcase className="w-6 h-6 text-[#F5C400]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h2 className="text-base font-bold text-[#0f172a] group-hover:text-yellow-600 transition-colors">
                          {job.title}
                        </h2>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${EMP_COLORS[job.employmentType] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {EMP_LABELS[job.employmentType] || job.employmentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
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
                    <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply now <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            </div>
          )}


        </div>
      </section>

      <AppFooter />
    </div>
  );
}