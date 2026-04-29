import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, ArrowRight, ChevronRight, Search, Users, Award, TrendingUp, Heart, Star, Shield, Mail, Phone, Building2, CheckCircle, Zap, Globe } from 'lucide-react';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useSpring } from 'framer-motion';
import Header from '../components/app/Header';
import useSEO from '../hooks/useSEO';
import AppFooter from '../components/app/AppFooter';

const EMP_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship',
};

const BENEFITS = [
  { icon: Heart, title: 'Full Family Medical', desc: 'Medical, dental, drug & vision — Geolabs covers family coverage after 12 months.', color: '#ef4444' },
  { icon: TrendingUp, title: 'ESOP Ownership', desc: 'Be a true owner. Our Employee Stock Ownership Plan gives you a real stake in the company.', color: '#22c55e' },
  { icon: Clock, title: 'Generous PTO', desc: '14 days your first year, scaling up to 28 days at 20+ years — plus 10 holidays.', color: '#3b82f6' },
  { icon: Shield, title: '401K + Life Insurance', desc: 'Company-supported retirement savings and group term life insurance for peace of mind.', color: '#8b5cf6' },
  { icon: Star, title: 'FSA Savings', desc: 'Flexible Spending Account to reduce taxes on healthcare and dependent care expenses.', color: '#F5C400' },
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
      className="relative bg-gradient-to-br from-[#0d1b2a] to-[#060e1a] border border-[#1e2a3a] hover:border-[#F5C400]/50 rounded-2xl p-6 text-center overflow-hidden group cursor-default transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5C400]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="text-4xl font-black text-[#F5C400] mb-1 tabular-nums">
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
          className="absolute w-1 h-1 rounded-full bg-[#F5C400]"
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
    "Join Geolabs — Hawaii's premier 100% employee-owned geotechnical engineering firm. Explore open positions across the Pacific Basin."
  );

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [hoveredJob, setHoveredJob] = useState(null);



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
    <div className="min-h-screen bg-[#060e1a] font-inter overflow-x-hidden">
      <Header />

      {/* ── OPEN ROLES ── */}
      <section id="open-roles" className="py-28 bg-[#060e1a] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F5C400]/30 to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">Open Positions</h2>
            <p className="text-gray-400 text-base">
              {loading ? 'Loading positions…' : `${jobs.length} open position${jobs.length !== 1 ? 's' : ''} across our offices`}
            </p>
          </motion.div>

          {/* Search + Dept filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search positions, departments, locations…"
                className="w-full h-13 pl-11 pr-4 py-3.5 text-sm bg-[#0d1b2a] border border-[#1e2a3a] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400] transition-all shadow-sm text-white placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map(d => (
                <motion.button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                    deptFilter === d
                      ? 'bg-[#F5C400] text-[#060e1a] border-[#F5C400] shadow-lg shadow-[#F5C400]/20'
                      : 'bg-[#0d1b2a] text-gray-300 border-[#1e2a3a] hover:border-[#F5C400] hover:text-[#F5C400]'
                  }`}
                >
                  {d === 'all' ? 'All Departments' : d}
                </motion.button>
              ))}
            </div>
          </motion.div>

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
               className="bg-[#0d1b2a] rounded-2xl border border-[#1e2a3a] py-20 text-center shadow-sm"
             >
               <Briefcase className="w-8 h-8 text-gray-600 mx-auto mb-3" />
               <p className="text-sm text-gray-400 font-medium">No open positions match your search.</p>
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
                      className="group relative flex items-start justify-between gap-5 bg-[#0d1b2a] hover:bg-[#0f2438] border border-[#1e2a3a] hover:border-[#F5C400]/30 rounded-2xl p-6 transition-all duration-400 shadow-sm hover:shadow-2xl hover:-translate-y-1 overflow-hidden block"
                    >
                      {/* Shimmer effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(245,196,0,0.03) 50%, transparent 70%)' }} />

                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <motion.div
                          animate={hoveredJob === job.id ? { rotate: [0, -5, 5, 0], scale: 1.1 } : {}}
                          transition={{ duration: 0.4 }}
                          className="w-12 h-12 rounded-xl bg-[#F5C400]/10 group-hover:bg-[#F5C400]/15 border border-[#F5C400]/20 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
                        >
                          <Briefcase className="w-5 h-5 text-[#F5C400]" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                             <h3 className="text-base font-bold text-white group-hover:text-[#F5C400] transition-colors">
                               {job.title}
                             </h3>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F5C400]/10 text-[#b8910a] border border-[#F5C400]/20">
                              {EMP_LABELS[job.employmentType] || job.employmentType}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap mb-2">
                            <span className="font-medium text-gray-400 group-hover:text-gray-300">{job.department}</span>
                            {job.office && (
                              <span className="flex items-center gap-1 group-hover:text-gray-400">
                                <MapPin className="w-3 h-3" /> {job.office}
                              </span>
                            )}
                            {job.applicationDeadline && (
                              <span className="flex items-center gap-1 group-hover:text-gray-400">
                                <Clock className="w-3 h-3" />
                                Closes {new Date(job.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {job.description && (
                            <p className="text-xs text-gray-500 group-hover:text-gray-400 leading-relaxed line-clamp-1 max-w-2xl">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                        {job.salaryMin && job.salaryMax && (
                           <div className="text-sm font-bold text-gray-300 group-hover:text-[#F5C400] transition-colors">
                             ${Number(job.salaryMin).toLocaleString()}–${Number(job.salaryMax).toLocaleString()}
                             <span className="text-xs font-normal text-gray-500 group-hover:text-gray-400">/yr</span>
                           </div>
                         )}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={hoveredJob === job.id ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                          className="flex items-center gap-1 text-[#F5C400] text-xs font-bold"
                        >
                          Apply now <ChevronRight className="w-3.5 h-3.5" />
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
            className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5 bg-[#0d1b2a] border border-[#1e2a3a] rounded-2xl shadow-sm"
          >
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#F5C400]" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">Equal Opportunity Employer</span>
            </div>
            <div className="w-px h-8 bg-[#1e2a3a] hidden sm:block flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Geolabs provides equal employment opportunities to all employees and applicants without regard to race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status. ADA-compliant and committed to reasonable accommodations.
            </p>
          </motion.div>

          {!search && filtered.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-xs text-gray-500 mt-10"
            >
              Don't see a perfect fit?{' '}
              <Link to="/apply" className="text-[#F5C400] font-semibold hover:text-[#EFB506] transition-colors underline underline-offset-2">
                Submit a general application →
              </Link>
            </motion.p>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}