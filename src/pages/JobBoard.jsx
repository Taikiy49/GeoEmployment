import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, ArrowRight, ChevronRight, Search, Users, Award, TrendingUp, Heart, Star, Shield } from 'lucide-react';

import { motion } from 'framer-motion';
import Header from '../components/app/Header';
import useSEO from '../hooks/useSEO';
import AppFooter from '../components/app/AppFooter';

const EMP_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship',
};

const BENEFITS = [
  { icon: Heart, title: 'Full Family Medical', desc: 'Medical, dental, drug & vision — Geolabs covers family coverage after 12 months.' },
  { icon: TrendingUp, title: 'ESOP Ownership', desc: 'Be a true owner. Our Employee Stock Ownership Plan gives you a real stake in the company.' },
  { icon: Clock, title: 'Generous PTO', desc: '14 days your first year, scaling up to 28 days at 20+ years — plus 10 holidays.' },
  { icon: Shield, title: '401K + Life Insurance', desc: 'Company-supported retirement savings and group term life insurance for peace of mind.' },
  { icon: Star, title: 'FSA Savings', desc: 'Flexible Spending Account to reduce taxes on healthcare and dependent care expenses.' },
  { icon: Award, title: '50+ Years of Excellence', desc: '16 engineering awards and a legacy of innovative, high-quality geotechnical work.' },
];


export default function JobBoard() {
  useSEO(
    'Careers at Geolabs, Inc. | Geotechnical Engineering Jobs in Hawaii',
    "Join Geolabs — Hawaii's premier 100% employee-owned geotechnical engineering firm. Explore open positions across the Pacific Basin."
  );

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

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
    <div className="min-h-screen bg-white font-inter">
      <Header />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
        {/* bg */}
        <div className="absolute inset-0 bg-[#060e1a]" />
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-30">
          <source src="https://geolabs-s3-bucket.s3.us-west-1.amazonaws.com/geolabs-cover.mp4" type="video/mp4" />
        </video>
        {/* dark overlay */}
        <div className="absolute inset-0 bg-[#060e1a]/50" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* EST. 1975 divider */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <div className="h-px w-16 bg-[#F5C400]" />
            <span className="text-[11px] font-bold text-[#F5C400] tracking-[0.3em] uppercase">Est. 1975</span>
            <div className="h-px w-16 bg-[#F5C400]" />
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-black text-white leading-none tracking-tight mb-2"
            style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}
          >
            GEOTECHNICAL
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="font-black leading-none tracking-tight text-[#F5C400] mb-6"
            style={{ fontSize: 'clamp(3rem, 10vw, 7rem)' }}
          >
            ENGINEERING
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-xl text-gray-300 italic mb-4 font-light"
          >
            & Drilling Services
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[11px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-10"
          >
            Hawaii · Pacific Basin · California
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.38 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#open-roles"
              onClick={e => { e.preventDefault(); document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold px-8 py-3.5 text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#F5C400]/20 hover:-translate-y-0.5"
            >
              View Open Roles <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://geolabs.base44.app/#contact"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold px-8 py-3.5 text-sm tracking-wider uppercase hover:border-[#F5C400] hover:text-[#F5C400] transition-all"
            >
              Contact Us →
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
          >
            <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <div className="w-px h-8 bg-gray-600" />
          </motion.div>
        </div>
      </section>



      {/* ── BENEFITS ── */}
      <section className="py-24 bg-[#060e1a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#F5C400] mb-4 bg-[#F5C400]/10 px-3 py-1.5 rounded-full border border-[#F5C400]/20">Compensation & Benefits</span>
            <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Everything you need to thrive</h2>
            <p className="text-gray-400 font-light">Comprehensive benefits designed for your long-term success</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="group bg-[#0d1b2a] border border-[#1e2a3a] hover:border-[#F5C400]/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center mb-4 group-hover:bg-[#F5C400]/15 transition-colors">
                  <b.icon className="w-5 h-5 text-[#F5C400]" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{b.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EEO strip ── */}
      <section className="bg-[#0d1b2a] border-y border-[#1e2a3a] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#F5C400]" />
            </div>
            <span className="text-sm font-bold text-white">Equal Opportunity Employer</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Geolabs provides equal employment opportunities to all employees and applicants without regard to race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status. ADA-compliant and committed to reasonable accommodations.
          </p>
        </div>
      </section>

      {/* ── OPEN ROLES ── */}
      <section id="open-roles" className="py-24 bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto px-6">
          {/* section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#F5C400] mb-3 bg-[#F5C400]/10 px-3 py-1.5 rounded-full border border-[#F5C400]/20">Open Positions</span>
              <h2 className="text-4xl font-black text-[#060e1a] tracking-tight">Find your next role</h2>
              <p className="text-gray-500 font-light mt-2 text-sm">
                {loading ? 'Loading positions…' : `${jobs.length} open position${jobs.length !== 1 ? 's' : ''} across our offices`}
              </p>
            </div>
          </div>

          {/* Search + Dept filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search positions, departments, locations…"
                className="w-full h-12 pl-11 pr-4 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400] transition-all shadow-sm text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map(d => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`h-12 px-4 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                    deptFilter === d
                      ? 'bg-[#060e1a] text-[#F5C400] border-[#060e1a] shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#060e1a] hover:text-[#060e1a]'
                  }`}
                >
                  {d === 'all' ? 'All Departments' : d}
                </button>
              ))}
            </div>
          </div>

          {/* Job cards */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-28" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center shadow-sm">
              <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No open positions match your search.</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting your filters or check back soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04, duration: 0.4 }}
                >
                  <Link
                    to={`/apply/${job.id}`}
                    className="group flex items-start justify-between gap-5 bg-white hover:bg-[#060e1a] border border-gray-100 hover:border-[#060e1a] rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {/* left */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-[#F5C400]/10 group-hover:bg-[#F5C400]/15 border border-[#F5C400]/20 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5">
                        <Briefcase className="w-5 h-5 text-[#F5C400]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-white transition-colors">
                            {job.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F5C400]/10 text-[#b8910a] border border-[#F5C400]/20 group-hover:bg-[#F5C400]/20">
                            {EMP_LABELS[job.employmentType] || job.employmentType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 group-hover:text-gray-400 flex-wrap mb-2">
                          <span className="font-medium text-gray-500 group-hover:text-gray-300">{job.department}</span>
                          {job.office && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {job.office}
                            </span>
                          )}
                          {job.applicationDeadline && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Closes {new Date(job.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {job.description && (
                          <p className="text-xs text-gray-400 group-hover:text-gray-500 leading-relaxed line-clamp-1 max-w-2xl">
                            {job.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* right */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                      {job.salaryMin && job.salaryMax && (
                        <div className="text-sm font-bold text-gray-700 group-hover:text-[#F5C400] transition-colors">
                          ${Number(job.salaryMin).toLocaleString()}–${Number(job.salaryMax).toLocaleString()}
                          <span className="text-xs font-normal text-gray-400 group-hover:text-gray-500">/yr</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[#F5C400] text-xs font-bold opacity-0 group-hover:opacity-100 transition-all">
                        Apply now <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA if no search */}
          {!search && filtered.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-8">
              Don't see a perfect fit?{' '}
              <Link to="/apply" className="text-[#b8910a] font-semibold hover:text-[#F5C400] transition-colors">
                Submit a general application →
              </Link>
            </p>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}