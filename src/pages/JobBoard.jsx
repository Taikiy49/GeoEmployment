import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ChevronRight, Search, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Header from '../components/app/Header';
import AppFooter from '../components/app/AppFooter';

const EMP_LABELS = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship'
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
    <div className="min-h-screen" style={{
      background: `radial-gradient(ellipse at 15% 10%, rgba(184, 115, 51, 0.08) 0%, transparent 55%), #fbf7ea`,
    }}>
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bronze to-bronze-dark flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">Careers at Geolabs</h1>
          <p className="text-sm text-[#6b7280] max-w-md mx-auto leading-relaxed">
            Join our team of environmental and engineering professionals. Browse open positions below.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search positions..." className="pl-9 h-10 text-sm bg-white" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {departments.map(d => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={`px-3 py-2 rounded-full text-[11px] font-medium border transition-colors ${
                  deptFilter === d
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-bronze'
                }`}
              >
                {d === 'all' ? 'All Departments' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Job listings */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-bronze/30 border-t-bronze rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#e5e7eb]">
            <p className="text-sm text-[#6b7280]">No open positions match your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(job => (
              <Link
                key={job.id}
                to={`/apply/${job.id}`}
                className="block bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-5 hover:border-bronze hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h2 className="text-sm font-semibold text-navy group-hover:text-bronze transition-colors">{job.title}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 font-medium">Open</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#6b7280] flex-wrap">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.department}</span>
                      {job.office && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.office}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{EMP_LABELS[job.employmentType] || job.employmentType}</span>
                      {job.applicationDeadline && <span>Deadline: {job.applicationDeadline}</span>}
                    </div>
                    {job.description && (
                      <p className="text-xs text-[#9ca3af] mt-2 leading-relaxed line-clamp-2">{job.description}</p>
                    )}
                    {job.salaryMin && job.salaryMax && (
                      <div className="mt-2 text-[11px] font-medium text-bronze">
                        ${Number(job.salaryMin).toLocaleString()} – ${Number(job.salaryMax).toLocaleString()} / year
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-bronze flex-shrink-0">
                    <span className="text-xs font-medium">Apply</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-[11px] text-[#9ca3af] hover:text-bronze transition-colors">
            <Shield className="w-3.5 h-3.5" /> HR Admin Portal
          </Link>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}