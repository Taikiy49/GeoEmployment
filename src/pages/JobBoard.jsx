import React, { useEffect, useRef, useState } from 'react';
import { appClient } from '@/api/localClient';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Clock, MapPin, Pause, Play, Search, X } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import Header from '../components/app/Header';
import useSEO from '../hooks/useSEO';
import AppFooter from '../components/app/AppFooter';
import '../styles/careers.css';

const EMP_LABELS = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
  temporary: 'Temporary', internship: 'Internship',
};
const PAGE_SIZE = 10;

function closingDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

export default function JobBoard() {
  useSEO(
    'Careers at Geolabs, Inc. | Geotechnical Engineering Jobs in Hawaii',
    'Explore careers with Geolabs, Inc., an employee-owned geotechnical engineering and drilling team serving Hawaiʻi and California.'
  );

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const deptFilter = searchParams.get('department') || 'all';
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const videoRef = useRef(null);
  const [videoPaused, setVideoPaused] = useState(true);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [videoMessage, setVideoMessage] = useState('');

  useEffect(() => {
    if (reduceMotion) videoRef.current?.pause();
  }, [reduceMotion]);

  useEffect(() => {
    // The shared client does not expose cancellation. Ignore late responses from
    // an earlier retry/unmounted route, and offer recovery for a stalled request.
    let active = true;
    setLoading(true);
    setLoadError(false);
    const timeout = window.setTimeout(() => {
      if (!active) return;
      active = false;
      setLoading(false);
      setLoadError(true);
    }, 20_000);
    appClient.entities.JobRequisition.filter({ status: 'published' }, '-publishedDate', 100)
      .then(results => {
        if (!active) return;
        if (!Array.isArray(results)) throw new Error('Invalid job response');
        setJobs(results);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
        setLoading(false);
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [loadAttempt]);

  useEffect(() => {
    if (window.location.hash !== '#open-roles') return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('open-roles')?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, deptFilter]);

  const departments = ['all', ...new Set(jobs.map(job => job.department).filter(Boolean))];
  // Keep an old bookmarked department visible so it can be understood/reset.
  if (!departments.includes(deptFilter)) departments.push(deptFilter);
  const query = search.trim().toLocaleLowerCase('en-US');
  const filtered = jobs.filter(job => (
    (deptFilter === 'all' || job.department === deptFilter)
    && (!query || [job.title, job.department, job.office].some(value => String(value || '').toLocaleLowerCase('en-US').includes(query)))
  ));
  const hasFilters = Boolean(search || deptFilter !== 'all');

  function updateFilters(nextSearch, nextDepartment) {
    const next = new URLSearchParams(searchParams);
    if (nextSearch) next.set('q', nextSearch);
    else next.delete('q');
    if (nextDepartment !== 'all') next.set('department', nextDepartment);
    else next.delete('department');
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }

  function clearFilters() {
    updateFilters('', 'all');
    searchRef.current?.focus();
  }

  async function toggleVideo() {
    setVideoMessage('');
    if (!videoPaused) {
      videoRef.current?.pause();
      return;
    }
    try {
      await videoRef.current?.play();
    } catch {
      setVideoMessage('The video could not play. You can still explore and apply for every position below.');
    }
  }

  return (
    <div className="portal-theme careers-page">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <section className="careers-hero" aria-labelledby="careers-title">
          <div className="careers-hero__copy">
            <p className="careers-eyebrow">Careers at Geolabs, Inc.</p>
            <h1 id="careers-title">Shape Hawaiʻi<br />from the<br /><span>ground up.</span></h1>
            <p className="careers-hero__intro">
              Join an employee-owned geotechnical engineering and drilling team serving Hawaiʻi and California.
            </p>
            <a href="#open-roles" className="portal-button portal-button--primary careers-hero__action">
              Explore open roles <ArrowDown aria-hidden="true" size={18} />
            </a>
            <p className="careers-hero__note">Engineering · Drilling · Field services</p>
          </div>
          <div className="careers-hero__media">
            <div className="careers-hero__film">
              <video
                ref={videoRef}
                autoPlay={!reduceMotion}
                onPlay={() => setVideoPaused(false)}
                onPause={() => setVideoPaused(true)}
                onError={() => setVideoUnavailable(true)}
                muted loop playsInline preload="metadata" aria-hidden="true"
              >
                <source src="/geolabs-cover.mp4?v=20260730-2" type="video/mp4" onError={() => setVideoUnavailable(true)} />
              </video>
              {videoUnavailable && (
                <div className="careers-hero__media-fallback">
                  <p>Geolabs, Inc.</p>
                  <span>The field video is unavailable. All open positions are listed below.</span>
                </div>
              )}
              {!videoUnavailable && (
                <button type="button" className="careers-video-control" onClick={toggleVideo}>
                  {videoPaused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
                  {videoPaused ? 'Play background video' : 'Pause background video'}
                </button>
              )}
            </div>
            <div className="careers-hero__caption">
              <span>Geolabs in the field</span>
              <span>Hawaiʻi · California</span>
            </div>
            {videoMessage && <p role="status" className="careers-video-message">{videoMessage}</p>}
          </div>
        </section>

        <section id="open-roles" className="careers-opportunities" aria-labelledby="open-roles-title">
          <div className="careers-section-heading">
            <div>
              <p className="careers-eyebrow">Current opportunities</p>
              <h2 id="open-roles-title">Find your next role.</h2>
            </div>
            <p className="careers-section-heading__aside">Explore positions across our offices,<br />or introduce yourself with a general application.</p>
          </div>

          <div className="careers-filters">
            <div className="careers-search">
              <Search aria-hidden="true" size={20} />
              <label className="sr-only" htmlFor="careers-search">Search open positions</label>
              <input
                ref={searchRef} id="careers-search" type="search" value={search}
                onChange={event => updateFilters(event.target.value, deptFilter)}
                placeholder="Search positions, departments, locations…" autoComplete="off"
              />
              {search && (
                <button type="button" aria-label="Clear search" onClick={() => {
                  updateFilters('', deptFilter);
                  searchRef.current?.focus();
                }}><X aria-hidden="true" size={18} /></button>
              )}
            </div>
            <div className="careers-departments" role="group" aria-label="Filter by department">
              {departments.map(department => (
                <button key={department} type="button" aria-pressed={deptFilter === department}
                  className="careers-departments__button" onClick={() => updateFilters(search, department)}>
                  {department === 'all' ? 'All Departments' : department}
                </button>
              ))}
            </div>
          </div>

          <div className="careers-result-heading">
            <p role="status" aria-live="polite" aria-atomic="true">
              {loading ? 'Loading positions…' : loadError ? 'Positions unavailable' : `${filtered.length} open position${filtered.length !== 1 ? 's' : ''}${hasFilters ? ' matching your filters' : ''}`}
            </p>
            {hasFilters && <button type="button" className="careers-text-button" onClick={clearFilters}>Reset filters</button>}
          </div>

          <div className="careers-results" aria-busy={loading}>
            {loading ? (
              <div className="careers-empty"><p>Finding current opportunities…</p></div>
            ) : loadError ? (
              <div className="careers-empty">
                <h3>Open positions could not be loaded.</h3>
                <p role="alert">Try again, or use the General Application below. Your search filters have been kept.</p>
                <button type="button" className="portal-button portal-button--secondary" onClick={() => setLoadAttempt(attempt => attempt + 1)}>Try again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="careers-empty">
                <h3>{hasFilters ? 'No open positions match your search.' : 'No open positions are listed right now.'}</h3>
                <p>{hasFilters ? 'Try a different position, department, or location.' : 'You can still send a general application for our HR team to review.'}</p>
                {hasFilters && <button type="button" className="portal-button portal-button--secondary" onClick={clearFilters}>Clear search and filters</button>}
              </div>
            ) : (
              <ul className="careers-job-list">
                {filtered.slice(0, visibleCount).map(job => {
                  const deadline = closingDate(job.applicationDeadline);
                  return (
                    <li key={job.id}>
                      <Link to={`/apply/${job.id}`} className="careers-job">
                        <div className="careers-job__details">
                          {job.department && <p className="careers-job__department">{job.department}</p>}
                          <h3>{job.title}</h3>
                          <div className="careers-job__metadata">
                            {job.office && <span><MapPin aria-hidden="true" size={15} />{job.office}</span>}
                            {job.employmentType && <span>{EMP_LABELS[job.employmentType] || job.employmentType}</span>}
                            {deadline && <span><Clock aria-hidden="true" size={15} />Closes {deadline}</span>}
                          </div>
                          {job.description && <p className="careers-job__description">{job.description}</p>}
                        </div>
                        <div className="careers-job__action">
                          {job.salaryMin && job.salaryMax ? (
                            <span className="careers-job__salary">${Number(job.salaryMin).toLocaleString('en-US')}–${Number(job.salaryMax).toLocaleString('en-US')}<span>/yr</span></span>
                          ) : null}
                          <span className="careers-job__apply">Apply <ArrowUpRight aria-hidden="true" size={20} /></span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {!loading && !loadError && filtered.length > visibleCount && (
              <div className="careers-load-more">
                <p>Showing {visibleCount} of {filtered.length} positions</p>
                <button type="button" className="portal-button portal-button--secondary" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>Load more positions</button>
              </div>
            )}
          </div>

          <aside className="careers-general" aria-labelledby="general-application-title">
            <div>
              <p className="careers-eyebrow">Another way to join us</p>
              <h2 id="general-application-title">Don’t see the right position?</h2>
              <p>Submit a general application and our HR team will review your experience for current or future opportunities at Geolabs, Inc.</p>
            </div>
            <Link to="/apply" className="portal-button portal-button--primary">General Application <ArrowUpRight aria-hidden="true" size={18} /></Link>
          </aside>

          <aside className="careers-eeo" aria-labelledby="careers-eeo-title">
            <h2 id="careers-eeo-title">Equal Opportunity Employer</h2>
            <p>Geolabs, Inc. provides equal employment opportunities without regard to race, color, religion, gender or gender identity, sexual orientation, national origin, age, disability, genetic information, marital status, amnesty, covered-veteran status, lactation, or any other status protected by applicable law.</p>
          </aside>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
