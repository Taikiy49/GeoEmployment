import React, { useState, useEffect, useRef } from 'react';
import { appClient } from '@/api/localClient';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, ChevronRight, Search, Users, Award, TrendingUp, Heart, Star, Shield, FileText } from 'lucide-react';
import { motion, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';
import Header from '../components/app/Header';
import useSEO from '../hooks/useSEO';
import AppFooter from '../components/app/AppFooter';

const EMP_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship',
};

const BENEFITS = [
  { icon: Heart, title: 'Full Family Medical', desc: 'Medical, dental, drug & vision — Geolabs, Inc. covers family coverage after 12 months.', color: '#ef4444' },
  { icon: TrendingUp, title: 'ESOP Ownership', desc: 'Be a true owner. Our Employee Stock Ownership Plan gives you a real stake in the company.', color: '#22c55e' },
  { icon: Clock, title: 'Generous PTO', desc: '14 days your first year, scaling up to 28 days at 20+ years — plus 10 holidays.', color: '#3b82f6' },
  { icon: Shield, title: '401K + Life Insurance', desc: 'Company-supported retirement savings and group term life insurance for peace of mind.', color: '#8b5cf6' },
  { icon: Star, title: 'FSA Savings', desc: 'Flexible Spending Account to reduce taxes on healthcare and dependent care expenses.', color: '#A65F2A' },
  { icon: Award, title: '50+ Years of Excellence', desc: '16 engineering awards and a legacy of innovative, high-quality geotechnical work.', color: '#f97316' },
];

const STATS = [
  { value: 50, suffix: '+', label: 'Years in Business' },
  { value: 16, suffix: '', label: 'Engineering Awards' },
  { value: 100, suffix: '%', label: 'Employee-Owned' },
  { value: 500, suffix: '+', label: 'Projects Completed' },
];

// Animated counter hook
function useCounter(target, inView) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return count;
}

function StatCard({ value, suffix, label, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCounter(value, inView);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative bg-gradient-to-br from-[#0d1b2a] to-[#060e1a] border border-[#1e2a3a] hover:border-[#A65F2A]/50 rounded-2xl p-6 text-center overflow-hidden group cursor-default transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#A65F2A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="text-4xl font-black text-[#A65F2A] mb-1 tabular-nums">
          {count}{suffix}
        </div>
        <div className="text-xs font-semibold text-gray-400 tracking-wide">{label}</div>
      </div>
    </motion.div>
  );
}

// Floating particles background
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#A65F2A]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.4 + 0.1,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Glowing orb
function GlowOrb({ className }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export default function JobBoard() {
  useSEO(
    'Careers at Geolabs, Inc. | Geotechnical Engineering Jobs in Hawaii',
    "Join Geolabs, Inc. — Hawaii's premier 100% employee-owned geotechnical engineering firm. Explore open positions across the Pacific Basin."
  );

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [hoveredJob, setHoveredJob] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const reduceMotion = useReducedMotion();
  const videoRef = useRef(null);
  const [videoPaused, setVideoPaused] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) videoRef.current?.pause();
  }, [reduceMotion]);

  useEffect(() => {
    appClient.entities.JobRequisition.filter({ status: 'published' }, '-publishedDate', 100).then(j => {
      setJobs(j);
      setLoading(false);
    }).catch(() => { setLoadError(true); setLoading(false); });
  }, []);

  useEffect(() => {
    if (window.location.hash !== '#open-roles') return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('open-roles')?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const departments = ['all', ...new Set(jobs.map(j => j.department).filter(Boolean))];
  const filtered = jobs.filter(j => {
    const matchDept = deptFilter === 'all' || j.department === deptFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q) || j.office?.toLowerCase().includes(q);
    return matchDept && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-inter overflow-x-clip">
      <Header />
      <main id="main-content" tabIndex={-1}>
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-slate-950 text-white">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay={!reduceMotion}
          onPlay={() => setVideoPaused(false)}
          onPause={() => setVideoPaused(true)}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/geolabs-cover.mp4?v=20260730-2" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#111923]/75 via-[#111923]/40 to-[#111923]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111923]/45 via-transparent to-[#111923]/10" />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-14 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
              className="max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#A65F2A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A65F2A]" />
              Build what matters
            </div>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-[-0.045em] leading-[1.05]">
              Shape Hawaiʻi from
              <span className="block text-[#A65F2A]">the ground up.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
              Join an employee-owned geotechnical engineering and drilling team serving Hawaiʻi and California with technical rigor and lasting community impact.
            </p>
            <a
              href="#open-roles"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#A65F2A] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#A65F2A]/15 hover:bg-[#B87333] transition-colors"
            >
              Explore open roles <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            {[
              ['100%', 'Employee-owned'],
              ['50+', 'Years serving Hawaiʻi'],
              ['Equal', 'Opportunity employer'],
            ].map(([value, label]) => (
              <div key={label} className="bg-[#111923]/55 backdrop-blur-sm px-5 py-4">
                <div className="text-lg font-extrabold text-white">{value}</div>
                <div className="mt-0.5 text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="absolute bottom-3 right-4 rounded-lg border border-white/40 bg-[#111923]/80 px-3 py-2 text-xs font-semibold text-white hover:bg-[#111923]"
          onClick={() => {
            if (videoPaused) videoRef.current?.play().catch(() => {});
            else videoRef.current?.pause();
          }}
        >
          {videoPaused ? 'Play background video' : 'Pause background video'}
        </button>
      </section>

      {/* ── OPEN ROLES ── */}
      <section id="open-roles" className="py-14 sm:py-20 bg-white relative scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8 max-w-2xl"
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9a7800] mb-2">Current opportunities</p>
            <p className="text-slate-600 text-base">
              {loading ? 'Loading positions…' : `${jobs.length} open position${jobs.length !== 1 ? 's' : ''} across our offices`}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-6 flex flex-col gap-4 rounded-xl border border-[#A65F2A]/25 bg-[#FBF6F1] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#A65F2A] text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">Don’t see the right position?</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                  Submit a general application and our HR team will review your experience for current or future opportunities at Geolabs, Inc.
                </p>
              </div>
            </div>
            <Link
              to="/apply"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#A65F2A] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#8A4A22]"
            >
              General Application <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Search + Dept filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                aria-label="Search open positions"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search positions, departments, locations…"
                className="w-full h-12 pl-11 pr-4 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A65F2A]/40 focus:border-[#A65F2A] transition-all text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map(d => (
                <motion.button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  aria-pressed={deptFilter === d}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ${
                    deptFilter === d
                      ? 'bg-[#A65F2A] text-white border-[#A65F2A]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#A65F2A] hover:text-[#A65F2A]'
                  }`}
                >
                  {d === 'all' ? 'All Departments' : d}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {loadError && <p role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Open positions could not be loaded. Please refresh the page or use the General Application above.</p>}
          {/* Job cards */}
          {loading ? (
            <div className="space-y-3">
               {[1, 2, 3].map(i => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: [0.4, 0.7, 0.4] }}
                   transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                   className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] p-6 h-28"
                 />
               ))}
            </div>
          ) : filtered.length === 0 ? (
           <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center"
            >
              <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-700 font-medium">No open positions match your search.</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or check back soon.</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filtered.map((job, idx) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    onHoverStart={() => setHoveredJob(job.id)}
                    onHoverEnd={() => setHoveredJob(null)}
                  >
                    <Link
                      to={`/apply/${job.id}`}
                      className="group relative flex items-start justify-between gap-5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#A65F2A] rounded-lg p-5 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden block"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <motion.div
                          animate={hoveredJob === job.id ? { rotate: [0, -5, 5, 0], scale: 1.05 } : {}}
                          transition={{ duration: 0.4 }}
                          className="w-11 h-11 rounded-lg bg-[#A65F2A]/10 border border-[#A65F2A]/20 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
                        >
                          <Briefcase className="w-5 h-5 text-[#A65F2A]" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                             <h3 className="text-base font-bold text-gray-900 group-hover:text-[#A65F2A] transition-colors">
                              {job.title}
                             </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A65F2A]/10 text-[#8A4A22] border border-[#A65F2A]/20">
                              {EMP_LABELS[job.employmentType] || job.employmentType}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap mb-2">
                            <span className="font-medium">{job.department}</span>
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
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-1 max-w-2xl">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                        {job.salaryMin && job.salaryMax && (
                           <div className="text-sm font-bold text-gray-900">
                             ${Number(job.salaryMin).toLocaleString()}–${Number(job.salaryMax).toLocaleString()}
                             <span className="text-xs font-normal text-gray-500">/yr</span>
                           </div>
                         )}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={hoveredJob === job.id ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                          className="flex items-center gap-1 text-[#A65F2A] text-xs font-bold"
                        >
                          Apply <ChevronRight className="w-3.5 h-3.5" />
                        </motion.div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* EEO notice */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#A65F2A]/10 border border-[#A65F2A]/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#A65F2A]" />
              </div>
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider whitespace-nowrap">Equal Opportunity Employer</span>
            </div>
            <div className="w-px h-6 bg-gray-300 hidden sm:block flex-shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">
              Geolabs, Inc. provides equal employment opportunities without regard to race, color, religion, gender or gender identity, sexual orientation, national origin, age, disability, genetic information, marital status, amnesty, covered-veteran status, lactation, or any other status protected by applicable law.
            </p>
          </motion.div>

        </div>
      </section>

      </main>
      <AppFooter />
    </div>
  );
}
