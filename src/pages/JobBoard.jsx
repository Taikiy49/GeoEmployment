import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, Search, Shield, Briefcase, ArrowRight } from 'lucide-react';
import Header from '../components/app/Header';
import AppFooter from '../components/app/AppFooter';

const EMP_LABELS = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temporary: 'Temporary',
  internship: 'Internship',
};

const EMP_COLORS = {
  full_time: 'bg-green-50 text-green-700 border-green-100',
  part_time: 'bg-blue-50 text-blue-700 border-blue-100',
  contract: 'bg-purple-50 text-purple-700 border-purple-100',
  temporary: 'bg-amber-50 text-amber-700 border-amber-100',
  internship: 'bg-sky-50 text-sky-700 border-sky-100',
};

export default function JobBoard() {
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-bronze mb-3">We're Hiring</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
              Build a career in<br />geotechnical engineering.
            </h1>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed">
              Join our 100% employee-owned team of engineers, technicians, and drilling professionals serving Hawaiʻi and California.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:items-end">
            <div className="flex items-center gap-4 bg-gray-50 rounded-2xl px-6 py-5 border border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Open Roles</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{new Set(jobs.map(j => j.department)).size}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Departments</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">HI</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Hawaii-Based</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search positions, departments, locations…"
              className="w-full h-11 pl-11 pr-4 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-all"
            />
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

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-gray-400 mb-4">
            {filtered.length} position{filtered.length !== 1 ? 's' : ''} available
          </p>
        )}

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
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(job => (
              <Link
                key={job.id}
                to={`/apply/${job.id}`}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-bronze/40 hover:shadow-md transition-all duration-200 p-6 flex items-start justify-between gap-6"
              >
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-bronze/10 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                          <MapPin className="w-3 h-3" />
                          {job.office}
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
                    Apply <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Admin link */}
        <div className="mt-14 pt-8 border-t border-gray-100 text-center">
          <a
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" /> HR Admin Portal
          </a>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}