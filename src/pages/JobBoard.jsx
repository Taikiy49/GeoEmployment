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

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

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

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative overflow-hidden h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-[#060e1a]" />
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-20">
          <source src="https://geolabs-s3-bucket.s3.us-west-1.amazonaws.com/geolabs-cover.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060e1a]/80 via-transparent to-[#0d1b2a]/60" />
        <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-[#F5C400]/8 to-transparent pointer-events-none" />

        {/* Glowing orbs */}
        <GlowOrb className="w-96 h-96 bg-[#F5C400]/10 -top-20 -right-20" />
        <GlowOrb className="w-64 h-64 bg-blue-500/10 bottom-20 left-10" />

        <Particles />

        {/* Animated grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#F5C400 1px, transparent 1px), linear-gradient(90deg, #F5C400 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative max-w-6xl mx-auto px-6 w-full flex flex-col items-center text-center"
        >
          <div className="max-w-3xl w-full">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 bg-[#F5C400]/10 border border-[#F5C400]/30 rounded-full px-5 py-2 mb-8"
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-[#F5C400]"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[11px] font-bold text-[#F5C400] tracking-widest uppercase">Now Hiring — Hawaii's Best Engineering Firm</span>
            </motion.div>

            {/* Headline with staggered words */}
            <div className="mb-7">
              {['Build a career', 'that moves', 'the earth.'].map((line, li) => (
                <motion.div
                  key={li}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 + li * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className={`text-5xl sm:text-7xl font-black leading-[1.0] tracking-tight ${li === 1 ? 'text-[#F5C400]' : 'text-white'}`}
                >
                  {line}
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-gray-300 text-lg leading-relaxed mb-8 font-light max-w-xl mx-auto"
            >
              Hawaii's premier 100% employee-owned geotechnical engineering firm. Work on landmark projects across the Pacific Basin alongside award-winning engineers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <motion.a
                href="#open-roles"
                onClick={e => { e.preventDefault(); document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold px-8 py-4 rounded-xl text-sm transition-colors shadow-2xl shadow-[#F5C400]/30"
              >
                View Open Roles <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="#about"
                onClick={e => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl text-sm transition-all"
              >
                Learn About Us
              </motion.a>
            </motion.div>


          </div>
        </motion.div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#060e1a] to-transparent pointer-events-none" />

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Scroll</div>
          <div className="w-5 h-8 border border-gray-600 rounded-full flex items-start justify-center p-1">
            <motion.div
              className="w-1.5 h-1.5 bg-[#F5C400] rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ── BENEFITS ── */}
      <section id="benefits" className="py-28 bg-white relative overflow-hidden">
        <GlowOrb className="w-80 h-80 bg-[#F5C400]/5 -top-20 -right-20" />
        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block text-[11px] font-black uppercase tracking-widest text-[#b8910a] mb-4 bg-[#F5C400]/10 px-4 py-2 rounded-full border border-[#F5C400]/30"
            >
              Compensation & Benefits
            </motion.span>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">Everything you need to thrive</h2>
            <p className="text-gray-400 font-light text-lg max-w-xl mx-auto">Comprehensive benefits designed for your long-term well-being and financial success.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all duration-400 overflow-hidden cursor-default"
              >
                {/* Bottom color accent on hover */}
                <div className="absolute inset-x-0 bottom-0 h-0.5 group-hover:h-1 transition-all duration-300" style={{ background: b.color }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 20% 80%, ${b.color}08, transparent 60%)` }} />

                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                  transition={{ duration: 0.4 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${b.color}15`, border: `1px solid ${b.color}30` }}
                >
                  <b.icon className="w-6 h-6" style={{ color: b.color }} />
                </motion.div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* ── OPEN ROLES ── */}
      <section id="open-roles" className="py-28 bg-[#f8f9fb] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F5C400]/30 to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-12"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block text-[11px] font-black uppercase tracking-widest text-[#F5C400] mb-4 bg-[#060e1a] px-4 py-2 rounded-full border border-[#F5C400]/20"
            >
              Open Positions
            </motion.span>
            <h2 className="text-4xl sm:text-5xl font-black text-[#060e1a] tracking-tight">Find your next role</h2>
            <p className="text-gray-400 font-light mt-2 text-sm">
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
                className="w-full h-13 pl-11 pr-4 py-3.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400] transition-all shadow-sm text-gray-800 placeholder-gray-400"
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
                      ? 'bg-[#060e1a] text-[#F5C400] border-[#060e1a] shadow-lg shadow-[#060e1a]/20'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#060e1a] hover:text-[#060e1a]'
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
                  className="bg-white rounded-2xl border border-gray-100 p-6 h-28"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-gray-100 py-20 text-center shadow-sm"
            >
              <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No open positions match your search.</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting your filters or check back soon.</p>
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
                      className="group relative flex items-start justify-between gap-5 bg-white hover:bg-[#060e1a] border border-gray-100 hover:border-[#F5C400]/30 rounded-2xl p-6 transition-all duration-400 shadow-sm hover:shadow-2xl hover:-translate-y-1 overflow-hidden block"
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
                            <h3 className="text-base font-bold text-gray-900 group-hover:text-white transition-colors">
                              {job.title}
                            </h3>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F5C400]/10 text-[#b8910a] border border-[#F5C400]/20">
                              {EMP_LABELS[job.employmentType] || job.employmentType}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap mb-2">
                            <span className="font-medium text-gray-500 group-hover:text-gray-300">{job.department}</span>
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
                            <p className="text-xs text-gray-400 group-hover:text-gray-500 leading-relaxed line-clamp-1 max-w-2xl">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                        {job.salaryMin && job.salaryMax && (
                          <div className="text-sm font-bold text-gray-700 group-hover:text-[#F5C400] transition-colors">
                            ${Number(job.salaryMin).toLocaleString()}–${Number(job.salaryMax).toLocaleString()}
                            <span className="text-xs font-normal text-gray-400 group-hover:text-gray-500">/yr</span>
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
            className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5 bg-white border border-gray-100 rounded-2xl shadow-sm"
          >
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#b8910a]" />
              </div>
              <span className="text-xs font-black text-gray-800 uppercase tracking-widest whitespace-nowrap">Equal Opportunity Employer</span>
            </div>
            <div className="w-px h-8 bg-gray-100 hidden sm:block flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Geolabs provides equal employment opportunities to all employees and applicants without regard to race, color, religion, gender, sexual orientation, national origin, age, disability, or veteran status. ADA-compliant and committed to reasonable accommodations.
            </p>
          </motion.div>

          {!search && filtered.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-xs text-gray-400 mt-10"
            >
              Don't see a perfect fit?{' '}
              <Link to="/apply" className="text-[#b8910a] font-semibold hover:text-[#F5C400] transition-colors underline underline-offset-2">
                Submit a general application →
              </Link>
            </motion.p>
          )}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#b8910a] mb-5 bg-[#F5C400]/10 px-4 py-2 rounded-full border border-[#F5C400]/30">About Geolabs</span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">Hawaii's most trusted geotechnical firm for 50+ years</h2>
              <p className="text-gray-500 leading-relaxed mb-5 text-base">
                Founded in the 1970s, Geolabs, Inc. is a 100% employee-owned company headquartered in Waipahu, Hawaii. We specialize in geotechnical engineering, materials testing, and environmental services across the Pacific Basin.
              </p>
              <p className="text-gray-500 leading-relaxed mb-10 text-base">
                Our ESOP structure means every employee is a true owner — with a direct stake in the success and quality of every project we deliver.
              </p>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s, i) => <StatCard key={i} {...s} delay={i * 0.1} />)}
              </div>
            </motion.div>

            <div className="space-y-4">
              {[
                { icon: Building2, title: 'Geotechnical Engineering', desc: 'Subsurface investigations, foundation analysis, slope stability, and seismic hazard assessments for major infrastructure projects.' },
                { icon: CheckCircle, title: 'Materials Testing & Inspection', desc: 'Construction quality control, materials testing laboratories, and special inspections for public and private sector clients.' },
                { icon: Award, title: 'Award-Winning Work', desc: "Recognized with 16 engineering excellence awards for our contributions to Hawaii's built environment and infrastructure." },
                { icon: Users, title: 'Employee Ownership (ESOP)', desc: 'As an employee-owned company, every team member shares in our success, driving a culture of quality and pride.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ x: 6, scale: 1.01 }}
                  className="flex gap-4 p-5 bg-gray-50 border border-gray-100 hover:border-[#F5C400]/50 hover:bg-[#F5C400]/[0.03] rounded-2xl transition-all duration-300 group cursor-default"
                >
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="w-11 h-11 rounded-xl bg-[#F5C400]/15 border border-[#F5C400]/20 flex items-center justify-center flex-shrink-0"
                  >
                    <item.icon className="w-5 h-5 text-[#b8910a]" />
                  </motion.div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-[#b8910a] transition-colors">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-28 bg-[#060e1a] relative overflow-hidden">
        <Particles />
        <GlowOrb className="w-96 h-96 bg-[#F5C400]/8 top-0 right-0" />
        <GlowOrb className="w-64 h-64 bg-blue-500/5 bottom-0 left-0" />

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#F5C400 1px, transparent 1px), linear-gradient(90deg, #F5C400 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#F5C400] mb-4 bg-[#F5C400]/10 px-4 py-2 rounded-full border border-[#F5C400]/20">Get In Touch</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">Questions about working at Geolabs?</h2>
            <p className="text-gray-400 font-light text-lg max-w-xl mx-auto">Our HR team is happy to answer any questions about open positions, benefits, or the application process.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Mail, label: 'Email HR', value: 'hr@geolabs.com', href: 'mailto:hr@geolabs.com', color: '#3b82f6' },
              { icon: Phone, label: 'Call Us', value: '(808) 671-2000', href: 'tel:+18086712000', color: '#22c55e' },
              { icon: MapPin, label: 'Our Office', value: '94-429 Koaki St, Suite 200 · Waipahu, HI 96797', href: null, color: '#F5C400' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative bg-[#0d1b2a] border border-[#1e2a3a] hover:border-[#F5C400]/30 rounded-2xl p-7 group overflow-hidden cursor-default transition-all duration-300"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${item.color}10, transparent 70%)` }} />
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.15 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </motion.div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{item.label}</div>
                {item.href ? (
                  <a href={item.href} className="text-sm font-semibold text-white hover:text-[#F5C400] transition-colors leading-relaxed block">{item.value}</a>
                ) : (
                  <div className="text-sm font-semibold text-white leading-relaxed">{item.value}</div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative bg-gradient-to-br from-[#F5C400]/10 to-[#F5C400]/5 border border-[#F5C400]/20 rounded-3xl p-10 text-center overflow-hidden"
          >
            <GlowOrb className="w-48 h-48 bg-[#F5C400]/10 top-0 right-0" />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-2xl bg-[#F5C400]/10 border border-[#F5C400]/30 flex items-center justify-center mx-auto mb-6"
            >
              <Briefcase className="w-8 h-8 text-[#F5C400]" />
            </motion.div>
            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Ready to join the team?</h3>
            <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-md mx-auto">Browse our open positions and submit your application online. Our team reviews every application personally.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.a
                href="#open-roles"
                onClick={e => { e.preventDefault(); document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' }); }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-[#F5C400] hover:bg-[#EFB506] text-[#0d1117] font-bold px-8 py-4 rounded-xl text-sm transition-colors shadow-2xl shadow-[#F5C400]/30"
              >
                View Open Roles <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="/apply"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold px-8 py-4 rounded-xl text-sm transition-all"
              >
                Submit General Application
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}