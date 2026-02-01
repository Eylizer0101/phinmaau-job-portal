import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../../services/api'; // ✅ Import the API instance

const UI = {
  // Page
  pageBg: 'bg-gray-50',
  container: 'max-w-6xl mx-auto px-4 sm:px-6 py-8',
  section: 'space-y-4',

  // Surfaces
  card: 'bg-white border border-gray-200 rounded-xl shadow-sm',
  cardHover:
    'hover:shadow-md hover:border-gray-300 transition duration-200 motion-reduce:transition-none',
  inset: 'bg-gray-50 border border-gray-200 rounded-lg',

  // Text
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textMuted: 'text-gray-500',

  // Typography (consistent hierarchy)
  heading1: 'text-2xl sm:text-3xl font-bold tracking-tight',
  heading2: 'text-sm font-semibold',
  heading3: 'text-lg sm:text-xl font-bold',
  body: 'text-sm sm:text-base',
  caption: 'text-xs',

  // Focus ring
  ring: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',

  // Buttons
  btnBase:
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none motion-reduce:transition-none motion-reduce:transform-none',
  btnSm: 'h-9 px-3 text-sm',
  btnMd: 'h-10 px-4 text-sm',
  btnLg: 'h-11 px-5 text-base',

  btnPrimary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  btnSecondary: 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-100',
  btnInfo: 'bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100',
  btnLink: 'text-emerald-700 hover:text-emerald-900 hover:underline',

  // Chips / badges
  chipBase: 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border',
  badgeBase: 'px-4 py-2 rounded-full font-semibold text-sm border',

  // Dividers
  divider: 'border-t border-gray-100',

  // Spinner
  spinner: 'animate-spin motion-reduce:animate-none',
};

// ✅ Dashboard-style outline SVG icons
const SvgIcon = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'file':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );

    case 'clock':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );

    case 'checkCircle':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );

    case 'timesCircle':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 9l-6 6m0-6l6 6m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );

    case 'eye':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );

    case 'briefcase':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-3 0h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13h18" />
        </svg>
      );

    case 'building':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 21h18M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 7h.01M9 11h.01M9 15h.01M12 7h.01M12 11h.01M12 15h.01M15 7h.01M15 11h.01M15 15h.01"
          />
        </svg>
      );

    case 'calendar':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );

    case 'location':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 21s7-4.438 7-11a7 7 0 10-14 0c0 6.562 7 11 7 11z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      );

    case 'download':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v12m0 0l4-4m-4 4l-4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 21h14" />
        </svg>
      );

    case 'refresh':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v6h6M20 20v-6h-6" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 10a8 8 0 00-14.657-4.657L4 10m0 4a8 8 0 0014.657 4.657L20 14"
          />
        </svg>
      );

    case 'login':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 17l5-5-5-5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12H3" />
        </svg>
      );

    case 'star':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.48 3.499a1 1 0 011.04 0l2.4 1.384a1 1 0 00.75.105l2.74-.7a1 1 0 011.21 1.21l-.7 2.74a1 1 0 00.105.75l1.384 2.4a1 1 0 010 1.04l-1.384 2.4a1 1 0 00-.105.75l.7 2.74a1 1 0 01-1.21 1.21l-2.74-.7a1 1 0 00-.75.105l-2.4 1.384a1 1 0 01-1.04 0l-2.4-1.384a1 1 0 00-.75-.105l-2.74.7A1 1 0 013.5 19.3l.7-2.74a1 1 0 00-.105-.75l-1.384-2.4a1 1 0 010-1.04l1.384-2.4a1 1 0 00.105-.75l-.7-2.74A1 1 0 014.71 3.594l2.74.7a1 1 0 00.75-.105l2.28-1.31z"
          />
        </svg>
      );

    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// ---------- Small UI helpers ----------
const CompanyLogo = ({ logoUrl, companyName }) => {
  const [failed, setFailed] = useState(false);
  const initial = (companyName?.trim()?.[0] || 'C').toUpperCase();

  // ✅ FIXED: Remove hardcoded localhost from logo URL logic
  const getLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url; // Let the browser handle relative URLs
    // For uploaded files, they'll be relative to the backend URL
    return url;
  };

  const finalLogoUrl = getLogoUrl(logoUrl);

  if (!finalLogoUrl || failed) {
    return (
      <div className="w-14 h-14 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
        <span className="font-bold text-lg text-gray-700" aria-hidden="true">
          {initial}
        </span>
        <span className="sr-only">{companyName || 'Company'}</span>
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0">
      <img
        src={finalLogoUrl}
        alt={`${companyName || 'Company'} logo`}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-hidden="true">
    <div className={`${UI.card} p-4`}>
      <div className="h-5 w-48 bg-gray-100 rounded mb-2" />
      <div className="h-4 w-80 bg-gray-100 rounded" />
    </div>
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`${UI.card} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg" />
              <div className="space-y-2">
                <div className="h-5 w-64 bg-gray-100 rounded" />
                <div className="h-4 w-80 bg-gray-100 rounded" />
                <div className="h-4 w-52 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-8 w-28 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------- Main component ----------
const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, shortlisted, accepted, rejected
  const [lastUpdated, setLastUpdated] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Prevent double fetch (fast clicks, re-renders)
  const inFlightRef = useRef(false);

  // Tabs a11y refs
  const tabRefs = useRef({});

  const getCompanyLogo = (application) => {
    // Priority 1: Logo from job
    if (application.job?.companyLogo) {
      const logo = application.job.companyLogo;
      if (logo.startsWith('http')) return logo;
      if (logo.startsWith('/')) return logo; // ✅ Let browser handle relative URLs
      return logo; // ✅ Backend will serve the correct URL
    }

    // Priority 2: Logo from employer profile
    if (application.employer?.employerProfile?.companyLogo) {
      const logo = application.employer.employerProfile.companyLogo;
      if (logo.startsWith('http')) return logo;
      if (logo.startsWith('/')) return logo; // ✅ Let browser handle relative URLs
      return logo; // ✅ Backend will serve the correct URL
    }

    return null;
  };

  const getQueryParams = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('status') || 'all';
  }, [location.search]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPesoRange = (min, max) => {
    const toNum = (v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    };

    const minN = toNum(min);
    const maxN = toNum(max);

    if (minN === null && maxN === null) return null;

    const fmt = (n) => n.toLocaleString('en-PH');

    if (minN !== null && maxN !== null) return `₱${fmt(minN)}–${fmt(maxN)}`;
    if (minN !== null) return `₱${fmt(minN)}+`;
    return `Up to ₱${fmt(maxN)}`;
  };

  // Status mapping
  const getStatusText = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'shortlisted':
        return 'For Interview';
      case 'accepted':
      case 'approved':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'shortlisted':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'accepted':
      case 'approved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  const fetchApplications = useCallback(async () => {
    // prevent double calls
    if (inFlightRef.current) return;

    try {
      inFlightRef.current = true;

      setRefreshing(true);
      setLoading(true);
      setError('');
      setNeedsLogin(false);

      const token = localStorage.getItem('token');
      if (!token) {
        setNeedsLogin(true);
        setError('Please login to view your applications.');
        setApplications([]);
        return;
      }

      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.get('/applications/my-applications');
      // ✅ No need for manual headers - handled by interceptor in api.js

      if (response.data.success) {
        setApplications(response.data.applications || []);
        setLastUpdated(new Date());
      } else {
        setError(response.data.message || 'Failed to fetch applications.');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.response?.data?.message || 'Error loading applications. Please try again.');
    } finally {
      setRefreshing(false);
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    const statusFromUrl = getQueryParams();
    setFilter(statusFromUrl);
    fetchApplications();
  }, [getQueryParams, fetchApplications]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'all') navigate('/jobseeker/my-applications');
    else navigate(`/jobseeker/my-applications?status=${newFilter}`);
  };

  const statusCounts = useMemo(() => {
    const all = applications.length;

    const pending = applications.filter((app) => (app.status || '').toLowerCase() === 'pending')
      .length;

    const shortlisted = applications.filter((app) => (app.status || '').toLowerCase() === 'shortlisted')
      .length;

    const accepted = applications.filter((app) =>
      ['accepted', 'approved'].includes((app.status || '').toLowerCase())
    ).length;

    const rejected = applications.filter((app) => (app.status || '').toLowerCase() === 'rejected')
      .length;

    return { all, pending, shortlisted, accepted, rejected };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (filter === 'all') return applications;

    if (filter === 'accepted') {
      return applications.filter((app) =>
        ['accepted', 'approved'].includes((app.status || '').toLowerCase())
      );
    }

    return applications.filter((app) => (app.status || '').toLowerCase() === filter.toLowerCase());
  }, [applications, filter]);

  const filterLabel = useMemo(() => {
    if (filter === 'all') return 'All Applications';
    if (filter === 'shortlisted') return 'For Interview Applications';
    if (filter === 'accepted') return 'Accepted Applications';
    if (filter === 'pending') return 'Pending Applications';
    if (filter === 'rejected') return 'Rejected Applications';
    return `${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`;
  }, [filter]);

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All', count: statusCounts.all },
      { key: 'pending', label: 'Pending', count: statusCounts.pending },
      { key: 'shortlisted', label: 'For Interview', count: statusCounts.shortlisted },
      { key: 'accepted', label: 'Accepted', count: statusCounts.accepted },
      { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
    ],
    [statusCounts]
  );

  const updatedText = useMemo(() => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }, [lastUpdated]);

  // Tabs keyboard navigation (A11y)
  const focusTab = (key) => {
    const el = tabRefs.current[key];
    if (el) el.focus();
  };

  const onTabKeyDown = (e, currentKey) => {
    const keys = tabs.map((t) => t.key);
    const currentIndex = keys.indexOf(currentKey);

    const go = (nextIndex) => {
      const nextKey = keys[nextIndex];
      handleFilterChange(nextKey);
      setTimeout(() => focusTab(nextKey), 0);
    };

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        go((currentIndex + 1) % keys.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        go((currentIndex - 1 + keys.length) % keys.length);
        break;
      case 'Home':
        e.preventDefault();
        go(0);
        break;
      case 'End':
        e.preventDefault();
        go(keys.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`${UI.pageBg} min-h-screen`}>
      <div className={UI.container}>
        <div className={UI.section}>
          {/* Header / Hero */}
          <div
            className="
              relative rounded-2xl
              bg-gradient-to-r from-[#0e4739] via-[#17785b] to-green-600
              p-6 sm:p-8 text-white shadow-sm overflow-hidden
            "
          >
            {/* Soft glow */}
            <div className="pointer-events-none absolute inset-0 z-0">
              <div
                className="
                  absolute
                  w-[70px] sm:w-[110px] h-[70px] sm:h-[110px]
                  rounded-full blur-[28px] sm:blur-[38px]
                  bottom-[-55px] sm:bottom-[-70px]
                  right-[-40px]
                  opacity-60
                "
                style={{
                  background:
                    'radial-gradient(circle, rgba(110,231,183,0.25) 0%, rgba(110,231,183,0.12) 45%, transparent 75%)',
                }}
              />
            </div>

            {/* Watermark image */}
            <img
              src="/images/myapplication1.png"
              alt=""
              className="
                pointer-events-none absolute
                right-[18px] sm:right-[28px]
                top-1/2 -translate-y-1/2
                w-32 h-32 sm:w-40 sm:h-40
                object-contain opacity-60
                mix-blend-soft-light saturate-120 z-0
              "
              style={{
                WebkitMaskImage:
                  'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 80%)',
                maskImage:
                  'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 80%)',
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className={UI.heading1}>My Applications</h1>

                <p className="text-sm sm:text-base text-white/90">
                  Track the status of your job applications
                  {filter !== 'all' && <span className="ml-2 font-semibold">• {filterLabel}</span>}
                </p>

                {lastUpdated && (
                  <p className="text-xs text-white/70" aria-live="polite">
                    Updated {updatedText}
                  </p>
                )}
              </div>

             
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 p-4"
              role="alert"
              aria-live="polite"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-red-800 font-semibold">{error}</p>

                <div className="flex flex-col sm:flex-row gap-2">
                  {needsLogin ? (
                    <Link
                      to="/login"
                      className={`${UI.btnBase} ${UI.btnMd} ${UI.btnPrimary} ${UI.ring} w-full sm:w-auto`}
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5">
                        <SvgIcon name="login" className="w-4 h-4" />
                      </span>
                      Login
                    </Link>
                  ) : (
                    <button
                      onClick={fetchApplications}
                      disabled={loading || refreshing}
                      className={`${UI.btnBase} ${UI.btnMd} ${UI.btnSecondary} ${UI.ring} w-full sm:w-auto`}
                      type="button"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5">
                        {refreshing ? (
                          <svg className={`w-4 h-4 ${UI.spinner}`} viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 2a10 10 0 1010 10"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : (
                          <SvgIcon name="refresh" className="w-4 h-4" />
                        )}
                      </span>
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className={`${UI.card} p-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className={`${UI.heading2} ${UI.textPrimary}`}>Status</h2>
                <p className={`text-sm ${UI.textSecondary}`}>Filter your applications</p>
              </div>

              {/* Accessible segmented tabs */}
              <div
                role="tablist"
                aria-label="Application status filters"
                className="inline-flex flex-wrap gap-2 bg-gray-100 p-1 rounded-xl"
              >
                {tabs.map((t) => {
                  const active = filter === t.key;

                  const iconName =
                    t.key === 'all'
                      ? 'file'
                      : t.key === 'pending'
                      ? 'clock'
                      : t.key === 'shortlisted'
                      ? 'star'
                      : t.key === 'accepted'
                      ? 'checkCircle'
                      : 'timesCircle';

                  return (
                    <button
                      key={t.key}
                      ref={(el) => (tabRefs.current[t.key] = el)}
                      role="tab"
                      id={`tab-${t.key}`}
                      aria-selected={active}
                      aria-controls={`panel-${t.key}`}
                      tabIndex={active ? 0 : -1}
                      onKeyDown={(e) => onTabKeyDown(e, t.key)}
                      onClick={() => handleFilterChange(t.key)}
                      className={[
                        UI.btnBase,
                        UI.btnSm,
                        UI.ring,
                        'rounded-lg',
                        active ? 'bg-white shadow-sm text-emerald-800' : 'text-gray-700 hover:bg-gray-200',
                      ].join(' ')}
                      type="button"
                    >
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        <SvgIcon name={iconName} className="w-4 h-4" />
                      </span>

                      <span>{t.label}</span>
                      <span className="ml-1 inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-800">
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div aria-live="polite" aria-busy="true">
              <LoadingSkeleton />
            </div>
          ) : filteredApplications.length === 0 ? (
            // Empty state
            <div className={`${UI.card} p-8 sm:p-10 text-center`} role="region" aria-label="Empty state">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5 text-gray-500">
                <SvgIcon name="file" className="w-7 h-7" />
              </div>

              <h3 className={`text-xl sm:text-2xl font-bold tracking-tight ${UI.textPrimary}`}>
                {filter === 'all'
                  ? 'No Applications Yet'
                  : filter === 'shortlisted'
                  ? 'No For Interview Applications'
                  : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`}
              </h3>

              <p className={`mt-2 max-w-lg mx-auto ${UI.body} ${UI.textSecondary}`}>
                {filter === 'all'
                  ? "You don't have applications yet. Browse jobs and apply when you're ready."
                  : `No results for "${filter === 'shortlisted' ? 'For Interview' : filter}". Try another status or view all.`}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                {filter === 'all' ? (
                  <Link to="/jobseeker/job-search" className={`${UI.btnBase} ${UI.btnLg} ${UI.btnPrimary} ${UI.ring}`}>
                    <span className="inline-flex items-center justify-center w-5 h-5">
                      <SvgIcon name="briefcase" className="w-4 h-4" />
                    </span>
                    Browse Jobs
                  </Link>
                ) : (
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`${UI.btnBase} ${UI.btnLg} ${UI.btnSecondary} ${UI.ring}`}
                    type="button"
                  >
                    View All Applications
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              id={`panel-${filter}`}
              role="tabpanel"
              aria-labelledby={`tab-${filter}`}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                      <SvgIcon name="file" className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold ${UI.textPrimary}`}>{filterLabel}</p>
                      <p className={`text-sm ${UI.textSecondary}`} aria-live="polite">
                        Showing {filteredApplications.length} of {applications.length}
                      </p>
                    </div>
                  </div>

                  {filter !== 'all' && (
                    <button
                      onClick={() => handleFilterChange('all')}
                      className={`${UI.btnBase} ${UI.btnSm} ${UI.btnSecondary} ${UI.ring} w-full sm:w-auto`}
                      type="button"
                    >
                      View All
                    </button>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="grid gap-4">
                {filteredApplications.map((application) => {
                  const statusText = getStatusText(application.status);
                  const statusBadge = getStatusBadgeClass(application.status);

                  const jobId = application.job?._id;
                  const jobTitle = application.job?.title || 'Job Title Not Available';
                  const companyName = application.job?.companyName || 'Company Not Specified';
                  const appliedAt = formatDate(application.appliedAt);

                  const locationText = application.job?.location || null;
                  const salaryText = formatPesoRange(application.job?.salaryMin, application.job?.salaryMax);
                  const jobTypeText = application.job?.jobType || null;

                  const resumeUrl = application.jobseeker?.jobSeekerProfile?.resumeUrl || '';
                  const logoUrl = getCompanyLogo(application);

                  return (
                    <div key={application._id} className={`${UI.card} ${UI.cardHover} overflow-hidden`}>
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          {/* Left */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-4">
                              <CompanyLogo logoUrl={logoUrl} companyName={companyName} />

                              <div className="min-w-0">
                                <h3 className={`${UI.heading3} ${UI.textPrimary} truncate`} title={jobTitle}>
                                  {jobTitle}
                                </h3>

                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                                  <div className={`inline-flex items-center gap-2 ${UI.textSecondary} min-w-0`}>
                                    <span className="text-gray-500">
                                      <SvgIcon name="building" className="w-4 h-4" />
                                    </span>
                                    <span className="truncate" title={companyName}>
                                      {companyName}
                                    </span>
                                  </div>

                                  <div className={`inline-flex items-center gap-2 ${UI.textSecondary}`}>
                                    <span className="text-gray-500">
                                      <SvgIcon name="calendar" className="w-4 h-4" />
                                    </span>
                                    <span>Applied {appliedAt}</span>
                                  </div>
                                </div>

                                {/* Chips */}
                                {(jobTypeText || locationText || salaryText) && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {jobTypeText && (
                                      <span className={`${UI.chipBase} bg-gray-50 text-gray-700 border-gray-200`}>
                                        <span className="text-gray-500">
                                          <SvgIcon name="briefcase" className="w-3.5 h-3.5" />
                                        </span>
                                        {jobTypeText}
                                      </span>
                                    )}

                                    {locationText && (
                                      <span className={`${UI.chipBase} bg-gray-50 text-gray-700 border-gray-200`}>
                                        <span className="text-gray-500">
                                          <SvgIcon name="location" className="w-3.5 h-3.5" />
                                        </span>
                                        {locationText}
                                      </span>
                                    )}

                                    {salaryText && (
                                      <span className={`${UI.chipBase} bg-emerald-50 text-emerald-800 border-emerald-100`}>
                                        {salaryText}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right */}
                          <div className="flex flex-col items-start lg:items-end gap-3">
                            <span className={`${UI.badgeBase} ${statusBadge}`} aria-label={`Status: ${statusText}`}>
                              {statusText}
                            </span>

                            <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
                              {jobId ? (
                                <Link
                                  to={`/jobseeker/job-details/${jobId}`}
                                  state={{ sourcePage: 'myapplications' }}
                                  className={`${UI.btnBase} ${UI.btnMd} ${UI.btnInfo} ${UI.ring} w-full sm:w-auto`}
                                >
                                  <span className="inline-flex items-center justify-center w-5 h-5">
                                    <SvgIcon name="eye" className="w-4 h-4" />
                                  </span>
                                  View Job
                                </Link>
                              ) : (
                                <span
                                  className={`${UI.btnBase} ${UI.btnMd} ${UI.btnInfo} opacity-60 cursor-not-allowed w-full sm:w-auto`}
                                  aria-disabled="true"
                                  title="Job is not available"
                                >
                                  <span className="inline-flex items-center justify-center w-5 h-5">
                                    <SvgIcon name="eye" className="w-4 h-4" />
                                  </span>
                                  View Job
                                </span>
                              )}

                              {resumeUrl && (
                                <a
                                  href={resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${UI.btnBase} ${UI.btnMd} ${UI.btnSecondary} ${UI.ring} w-full sm:w-auto`}
                                >
                                  <span className="inline-flex items-center justify-center w-5 h-5">
                                    <SvgIcon name="download" className="w-4 h-4" />
                                  </span>
                                  View Resume
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Cover Letter */}
                        {application.coverLetter && (
                          <div className={`mt-6 pt-6 ${UI.divider}`}>
                            <h4 className={`text-sm font-semibold ${UI.textPrimary}`}>Your Cover Letter</h4>
                            <p className={`mt-2 text-sm leading-relaxed ${UI.textSecondary} line-clamp-3`}>
                              {application.coverLetter}
                            </p>
                          </div>
                        )}

                        {/* Employer Notes */}
                        {application.notes && (
                          <div className={`mt-4 pt-4 ${UI.divider}`}>
                            <h4 className={`text-sm font-semibold ${UI.textPrimary}`}>Employer Notes</h4>
                            <div className={`mt-2 ${UI.inset} p-3`}>
                              <p className={`text-sm leading-relaxed ${UI.textSecondary}`}>{application.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="pt-2">
                <div className={`${UI.card} p-6`}>
                  <div>
                    <h3 className={`text-lg font-bold tracking-tight ${UI.textPrimary}`}>
                      Understanding Application Status
                    </h3>
                    <p className={`mt-1 text-sm ${UI.textSecondary}`}>Quick guide for what each status means.</p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                          <SvgIcon name="clock" className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-semibold ${UI.textPrimary}`}>Pending</p>
                          <p className={`mt-1 text-sm ${UI.textSecondary}`}>
                            Your application is under review. Check back for updates.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                          <SvgIcon name="star" className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-semibold ${UI.textPrimary}`}>For Interview</p>
                          <p className={`mt-1 text-sm ${UI.textSecondary}`}>
                            You passed initial screening. Wait for interview or next steps.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                          <SvgIcon name="checkCircle" className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-semibold ${UI.textPrimary}`}>Accepted</p>
                          <p className={`mt-1 text-sm ${UI.textSecondary}`}>The employer accepted your application.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
                          <SvgIcon name="timesCircle" className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-semibold ${UI.textPrimary}`}>Rejected</p>
                          <p className={`mt-1 text-sm ${UI.textSecondary}`}>Not selected this time. Keep applying.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className={`mt-4 text-xs ${UI.textMuted}`} aria-live="polite">
                    Showing {filteredApplications.length} application{filteredApplications.length === 1 ? '' : 's'}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplications;