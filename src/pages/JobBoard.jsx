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
  { icon: Clock, title: 'Generous PTO', desc: '14 days your first year, scaling to 28 days at 20+ years — plus 10 paid holidays.' },
  { icon: Shield, title: '401K + Life Insurance', desc: 'Company-supported retirement savings and group term life insurance.' },
  { icon: Star, title: 'FSA Savings', desc: 'Flexible Spending Account to reduce taxes on healthcare and dependent care expenses.' },
  { icon: Award, title: '50+ Years of Excellence', desc: '16 engineering awards and a legacy of innovative geotechnical work in Hawaii.' },
];

const STATS = [
  { stat: '50+', label: 'Years of Experience' },
  { stat: '80+', label: 'Team Members' },
  { stat: '100%', label: 'Employee-Owned' },
  { stat: '16', label: 'Engineering Awards' },
];

function BenefitCard({ benefit, index }) {
  const Icon = benefit.icon;
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#0d1b2a',
        border: `1px solid ${hovered ? 'rgba(245,196,0,0.35)' : '#1e2a3a'}`,
        borderRadius: '16px',
        padding: '24px',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,196,0,0.1)', border: '1px solid rgba(245,196,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon style={{ width: 20, height: 20, color: '#F5C400' }} />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 8 }}>{benefit.title}</h3>
      <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{benefit.desc}</p>
    </div>
  );
}

const WHY_POINTS = [
  'Work on high-profile infrastructure projects across Hawaii and the Pacific',
  'Mentorship from licensed professional engineers and senior scientists',
  'Stability and growth with a 50-year award-winning track record',
  'Real ownership through our Employee Stock Ownership Plan (ESOP)',
];

export default function JobBoard() {
  useSEO(
    'Careers at Geolabs, Inc. | Geotechnical Engineering Jobs in Hawaii',
    "Join Geolabs — Hawaii's premier 100% employee-owned geotechnical engineering firm."
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
    <div className="min-h-screen bg-white">
      <Header />

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#060e1a]" style={{ minHeight: '88vh' }}>
        {/* background video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src="https://geolabs-s3-bucket.s3.us-west-1.amazonaws.com/geolabs-cover.mp4" type="video/mp4" />
        </video>

        {/* gold radial glow top-right */}
        <div
          className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(245,196,0,0.12) 0%, transparent 70%)' }}
        />

        {/* grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-32 flex flex-col lg:flex-row items-center gap-16">

          {/* ── left copy ── */}
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 border border-[#F5C400]/30 bg-[#F5C400]/10 rounded-full px-4 py-1.5 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#F5C400] animate-pulse" />
              <span className="text-[11px] font-bold text-[#F5C400] tracking-[0.12em] uppercase">Now Hiring · Honolulu, Hawaii</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.02] tracking-tight mb-8"
            >
              Build a career<br />
              <span style={{ color: '#F5C400' }}>that moves</span><br />
              the earth.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="text-lg text-gray-300 leading-relaxed mb-10 font-light max-w-xl"
            >
              Hawaii's premier 100% employee-owned geotechnical engineering firm. Work on landmark infrastructure projects across the Pacific Basin alongside award-winning engineers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26 }}
              className="flex flex-wrap gap-3 mb-14"
            >
              <a
                href="#open-roles"
                onClick={e => { e.preventDefault(); document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl text-sm transition-all"
                style={{ background: '#F5C400', color: '#0d1117', boxShadow: '0 8px 24px rgba(245,196,0,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#EFB506'}
                onMouseLeave={e => e.currentTarget.style.background = '#F5C400'}
              >
                View Open Roles <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#why-geolabs"
                onClick={e => { e.preventDefault(); document.getElementById('why-geolabs')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl text-sm text-white border border-white/20 hover:border-white/40 transition-all"
              >
                Why Geolabs
              </a>
            </motion.div>

            {/* stats row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-wrap gap-8"
            >
              {STATS.map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-black" style={{ color: '#F5C400' }}>{s.stat}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── right image card ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block flex-shrink-0 w-80"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(245,196,0,0.15)' }}>
              <img
                src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/a3e1d3d0a_SWVTTestingatBlaisdellCenter1.jpg"
                alt="Geolabs field work"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,14,26,0.85) 0%, transparent 60%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="text-xs font-semibold text-white mb-1">🏗️ SWVT Testing at Blaisdell Center</div>
                <div className="text-[10px] text-gray-400">Honolulu, Hawaii</div>
              </div>
              {/* ESOP badge */}
              <div className="absolute top-4 right-4 rounded-xl px-3 py-2 text-center font-black" style={{ background: '#F5C400', color: '#0d1117' }}>
                <div className="text-lg leading-none">100%</div>
                <div className="text-[9px] uppercase tracking-wide mt-0.5">Employee Owned</div>
              </div>
            </div>

            {/* open roles indicator */}
            <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(245,196,0,0.06)', border: '1px solid rgba(245,196,0,0.15)' }}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: '#F5C400' }} />
              <span className="text-sm text-gray-300">
                {loading ? 'Loading...' : <><strong className="text-white">{jobs.length}</strong> open position{jobs.length !== 1 ? 's' : ''} available</>}
              </span>
            </div>
          </motion.div>

        </div>

        {/* bottom wave fade */}
        <div className="absolute bottom-0 inset-x-0 h-20" style={{ background: 'linear-gradient(to top, #ffffff, transparent)' }} />
      </section>


      {/* ═══════════════════════════════════════
          WHY GEOLABS
      ═══════════════════════════════════════ */}
      <section id="why-geolabs" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                <img
                  src="https://media.base44.com/images/public/69ea7ba8b51b3834e92174e7/a3e1d3d0a_SWVTTestingatBlaisdellCenter1.jpg"
                  alt="Geolabs field work"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* decorative accent */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-2xl opacity-30" style={{ background: '#F5C400', zIndex: -1 }} />
            </div>

            {/* text */}
            <div>
              <span className="inline-block text-[11px] font-black uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full" style={{ color: '#F5C400', background: 'rgba(245,196,0,0.1)', border: '1px solid rgba(245,196,0,0.25)' }}>
                Why Join Geolabs
              </span>
              <h2 className="text-4xl font-black text-gray-900 mb-5 leading-tight tracking-tight">
                More than a job.<br />
                <span style={{ color: '#F5C400' }}>It's your company.</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8 text-base font-light">
                Founded in 1975 and employee-owned since 1991, Geolabs has spent nearly five decades delivering exceptional geotechnical engineering. When you join, you're not just an employee — you're an owner with real equity.
              </p>
              <div className="space-y-4">
                {WHY_POINTS.map((pt, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#F5C400' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          BENEFITS
      ═══════════════════════════════════════ */}
      <section className="py-28" style={{ background: '#060e1a' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full" style={{ color: '#F5C400', background: 'rgba(245,196,0,0.1)', border: '1px solid rgba(245,196,0,0.25)' }}>
              Compensation & Benefits
            </span>
            <h2 className="text-4xl font-black text-white tracking-tight mb-3">Everything you need to thrive</h2>
            <p className="text-gray-400 font-light">Comprehensive benefits designed for your long-term success</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {BENEFITS.map((b, i) => (
              <BenefitCard key={i} benefit={b} index={i} />
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          EEO STRIP
      ═══════════════════════════════════════ */}
      <section style={{ background: '#0d1b2a', borderTop: '1px solid #1e2a3a', borderBottom: '1px solid #1e2a3a' }} className="py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,196,0,0.1)', border: '1px solid rgba(245,196,0,0.2)' }}>
              <Users className="w-5 h-5" style={{ color: '#F5C400' }} />
            </div>
            <span className="text-sm font-bold text-white whitespace-nowrap">Equal Opportunity Employer</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Geolabs provides equal employment opportunities to all employees and applicants without regard to race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status. ADA-compliant and committed to reasonable accommodations.
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          OPEN ROLES
      ═══════════════════════════════════════ */}
      <section id="open-roles" className="py-28" style={{ background: '#f8f9fb' }}>
        <div className="max-w-6xl mx-auto px-6">

          {/* header */}
          <div className="mb-12">
            <span className="inline-block text-[11px] font-black uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full" style={{ color: '#b8910a', background: 'rgba(245,196,0,0.08)', border: '1px solid rgba(245,196,0,0.2)' }}>
              Open Positions
            </span>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Find your next role</h2>
                <p className="text-gray-500 font-light mt-2 text-sm">
                  {loading ? 'Loading positions…' : `${jobs.length} open position${jobs.length !== 1 ? 's' : ''} across our offices`}
                </p>
              </div>
            </div>
          </div>

          {/* search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search positions, departments, locations…"
                className="w-full h-12 pl-11 pr-4 text-sm bg-white border rounded-xl focus:outline-none transition-all text-gray-800 placeholder-gray-400 shadow-sm"
                style={{ borderColor: '#e5e7eb' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,196,0,0.12)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = ''; }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map(d => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className="h-12 px-4 rounded-xl text-xs font-bold border transition-all whitespace-nowrap"
                  style={
                    deptFilter === d
                      ? { background: '#060e1a', color: '#F5C400', borderColor: '#060e1a', boxShadow: '0 4px 12px rgba(6,14,26,0.2)' }
                      : { background: 'white', color: '#4b5563', borderColor: '#e5e7eb' }
                  }
                >
                  {d === 'all' ? 'All Departments' : d}
                </button>
              ))}
            </div>
          </div>

          {/* job listings */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-28 shadow-sm" />
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
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                >
                  <Link
                    to={`/apply/${job.id}`}
                    className="flex items-start justify-between gap-5 bg-white rounded-2xl p-6 block transition-all duration-300 shadow-sm"
                    style={{ border: '1px solid #e5e7eb' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#060e1a';
                      e.currentTarget.style.borderColor = '#060e1a';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 16px 40px rgba(6,14,26,0.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(245,196,0,0.1)', border: '1px solid rgba(245,196,0,0.2)' }}>
                        <Briefcase className="w-5 h-5" style={{ color: '#F5C400' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="text-base font-bold text-gray-900 job-title transition-colors">
                            {job.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(245,196,0,0.1)', color: '#b8910a', border: '1px solid rgba(245,196,0,0.2)' }}>
                            {EMP_LABELS[job.employmentType] || job.employmentType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap mb-2">
                          <span className="font-medium text-gray-500">{job.department}</span>
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
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-1 max-w-2xl">
                            {job.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                      {job.salaryMin && job.salaryMax && (
                        <div className="text-sm font-bold text-gray-700">
                          ${Number(job.salaryMin).toLocaleString()}–${Number(job.salaryMax).toLocaleString()}
                          <span className="text-xs font-normal text-gray-400">/yr</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs font-bold opacity-0 apply-cta transition-opacity" style={{ color: '#F5C400' }}>
                        Apply now <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!search && filtered.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-10">
              Don't see a perfect fit?{' '}
              <Link to="/apply" className="font-semibold transition-colors" style={{ color: '#b8910a' }}>
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