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
  temporary: 'Temporary', internship: 'Internship'
};

const BENEFITS = [
  { icon: Heart, title: 'Full Family Medical', desc: 'Medical, dental, drug & vision — Geolabs covers family coverage after 12 months.' },
  { icon: TrendingUp, title: 'ESOP Ownership', desc: 'Be a true owner. Our Employee Stock Ownership Plan gives you a real stake in the company.' },
  { icon: Clock, title: 'Generous PTO', desc: '14 days your first year, scaling up to 28 days at 20+ years — plus 10 holidays.' },
  { icon: Shield, title: '401K + Life Insurance', desc: 'Company-supported retirement savings and group term life insurance for peace of mind.' },
  { icon: Star, title: 'FSA Savings', desc: 'Flexible Spending Account to reduce taxes on healthcare and dependent care expenses.' },
  { icon: Award, title: '50+ Years of Excellence', desc: '16 engineering awards and a legacy of innovative, high-quality geotechnical work.' },
];

const STATS = [
  { stat: '1975', label: 'Year Established' },
  { stat: '1991', label: 'Inception of ESOP' },
  { stat: '80+', label: 'Staff Members' },
  { stat: '16', label: 'Awards Won' },
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
    base44.entities.JobRequisition.filter({ status: 'published' }, '-publishedDate', 100).then((j) => {
      setJobs(j);
      setLoading(false);
    });
  }, []);

  const departments = ['all', ...new Set(jobs.map((j) => j.department).filter(Boolean))];

  const filtered = jobs.filter((j) => {
    const matchDept = deptFilter === 'all' || j.department === deptFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q) || j.office?.toLowerCase().includes(q);
    return matchDept && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white font-inter">
      <Header />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-10">
          <source src="https://geolabs-s3-bucket.s3.us-west-1.amazonaws.com/geolabs-cover.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/60 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="w-8 h-0.5 bg-[#F5C400]" />
            <span className="text-[11px] font-black text-[#b87333] tracking-widest uppercase">Now Hiring</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6 max-w-2xl"
          >
            Build a career<br />
            <span className="text-[#b87333]">that moves</span><br />
            the earth.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-500 text-base leading-relaxed mb-10 max-w-xl font-light"
          >
            Hawaii's premier 100% employee-owned geotechnical engineering firm. Work on landmark projects across the Pacific Basin alongside award-winning engineers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            <a
              href="#open-roles"
              onClick={(e) => { e.preventDefault(); document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold px-7 py-3.5 rounded text-sm transition-all uppercase tracking-wide"
            >
              View Open Roles <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-10 mt-16 pt-10 border-t border-gray-100">
            {STATS.map((s, i) => (
              <div key={i}>
                <div className="text-3xl font-black text-[#b87333]">{s.stat}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section id="benefits" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-0.5 bg-[#F5C400]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#b87333]">Compensation & Benefits</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Everything you need to thrive</h2>
            <p className="text-gray-400 font-light mt-2">Comprehensive benefits designed for your long-term success</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="bg-white p-8 hover:bg-[#fffdf5] transition-colors group"
              >
                <div className="w-10 h-10 rounded bg-[#F5C400]/15 flex items-center justify-center mb-5 group-hover:bg-[#F5C400]/25 transition-colors">
                  <b.icon className="w-5 h-5 text-[#b87333]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">{b.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-0.5 bg-[#F5C400]" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#b87333]">About Geolabs</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">
                More than a job.<br />
                <span className="text-[#b87333]">It's your company.</span>
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 font-light">
                Founded in 1975 and employee-owned since 1991, Geolabs has spent nearly five decades delivering exceptional geotechnical engineering. When you join, you're not just an employee — you're an owner.
              </p>
              <div className="space-y-3">
                {[
                  'Work on high-profile infrastructure projects across Hawaii and the Pacific',
                  'Mentorship from licensed professional engineers and senior scientists',
                  'Stability and growth with a 50-year award-winning track record',
                  'Real ownership through our Employee Stock Ownership Plan (ESOP)',
                ].map((pt, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded-sm bg-[#F5C400] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1 bg-[#0d1117]" style={{ clipPath: 'polygon(0 50%, 35% 100%, 100% 0, 35% 60%)' }} />
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded overflow-hidden shadow-lg">
                <img
                  src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/a3e1d3d0a_SWVTTestingatBlaisdellCenter1.jpg"
                  alt="Geolabs field work"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#F5C400] text-[#0d1117] rounded px-5 py-4 shadow-lg font-black text-center">
                <div className="text-2xl">100%</div>
                <div className="text-[10px] font-bold tracking-wide uppercase">Employee Owned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EEO ── */}
      <section className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-0.5 bg-[#F5C400]" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Equal Opportunity Employer</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Geolabs provides equal employment opportunities to all employees and applicants without regard to race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status. ADA-compliant and committed to reasonable accommodations.
          </p>
        </div>
      </section>

      {/* ── OPEN ROLES ── */}
      <section id="open-roles" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-0.5 bg-[#F5C400]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#b87333]">Open Positions</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Find your next role</h2>
            <p className="text-gray-400 font-light mt-2 text-sm">
              {loading ? 'Loading positions…' : `${jobs.length} open position${jobs.length !== 1 ? 's' : ''} across our offices`}
            </p>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search positions, departments, locations…"
                className="w-full h-11 pl-11 pr-4 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400] transition-all text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map((d) => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`h-11 px-4 rounded text-xs font-bold border transition-all uppercase tracking-wide whitespace-nowrap ${
                    deptFilter === d
                      ? 'bg-[#0d1117] text-[#F5C400] border-[#0d1117]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#0d1117] hover:text-[#0d1117]'
                  }`}
                >
                  {d === 'all' ? 'All Departments' : d}
                </button>
              ))}
            </div>
          </div>

          {/* Job list */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded border border-gray-100 p-6 animate-pulse h-24" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 py-20 text-center rounded">
              <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No open positions match your search.</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting your filters or check back soon.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded overflow-hidden">
              {filtered.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                >
                  <Link
                    to={`/apply/${job.id}`}
                    className="group flex items-center justify-between gap-5 bg-white hover:bg-[#fffdf5] px-6 py-5 transition-all"
                  >
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded bg-[#F5C400]/15 border border-[#F5C400]/30 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-[#b87333]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#b87333] transition-colors">
                            {job.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F5C400]/15 text-[#b87333] border border-[#F5C400]/30 uppercase tracking-wide">
                            {EMP_LABELS[job.employmentType] || job.employmentType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <span className="font-medium text-gray-500 uppercase tracking-wide text-[10px]">{job.department}</span>
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
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {job.salaryMin && job.salaryMax && (
                        <div className="text-sm font-bold text-gray-700 group-hover:text-[#b87333] transition-colors hidden sm:block">
                          ${Number(job.salaryMin).toLocaleString()}–${Number(job.salaryMax).toLocaleString()}
                          <span className="text-xs font-normal text-gray-400">/yr</span>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#b87333] transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!search && filtered.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-8">
              Don't see a perfect fit?{' '}
              <Link to="/apply" className="text-[#b87333] font-semibold hover:underline transition-colors">
                Submit a general application →
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-0.5 bg-[#F5C400]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#b87333]">Contact</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Get in touch</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { loc: 'Oahu (HQ)', addr: '94-429 Koaki St, Suite 200\nWaipahu, HI 96797', phone: '(808) 841-5064', email: 'hawaii@geolabs.net' },
              { loc: 'Maui', addr: '780 Alua Street, 1st Floor\nWailuku, HI 96793', phone: '(808) 244-4435', email: 'maui@geolabs.net' },
              { loc: 'HR / Employment', addr: 'employment@geolabs.net', phone: '(808) 913-5146', email: 'employment@geolabs.net' },
            ].map((office, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#b87333] mb-3">{office.loc}</div>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed mb-3">{office.addr}</p>
                <p className="text-sm text-gray-500">{office.phone}</p>
                <a href={`mailto:${office.email}`} className="text-sm text-[#b87333] hover:underline">{office.email}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}