import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import EmployerLayout from '../../../layouts/EmployerLayout';

/* =======================
   Small UI helpers
======================= */
const Icon = ({ name, className = 'h-5 w-5', ...props }) => {
  const common = { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', ...props };
  switch (name) {
    case 'search':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 9A8 8 0 006.3 5.3L4 10M4 15a8 8 0 0013.7 3.7L20 14" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.07 6.37a1 1 0 00.95.69h6.699c.969 0 1.371 1.24.588 1.81l-5.42 3.94a1 1 0 00-.364 1.118l2.07 6.37c.3.921-.755 1.688-1.538 1.118l-5.42-3.94a1 1 0 00-1.176 0l-5.42 3.94c-.783.57-1.838-.197-1.538-1.118l2.07-6.37a1 1 0 00-.364-1.118l-5.42-3.94c-.783-.57-.38-1.81.588-1.81h6.699a1 1 0 00.95-.69l2.07-6.37z"
          />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    case 'more-vertical':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      );
    default:
      return null;
  }
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Button = ({
  variant = 'secondary',
  size = 'md',
  leftIcon,
  children,
  className,
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-sm rounded-xl',
    xs: 'px-2 py-1.5 text-xs rounded-lg',
  };

  const variants = {
    secondary:
      'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-green-600',
    primary:
      'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600',
    neutral:
      'border border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100 focus-visible:ring-green-600',
    dangerSoft:
      'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-600',
    ghost:
      'bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:ring-green-600',
  };

  return (
    <button
      type="button"
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled}
      {...props}
    >
      {leftIcon}
      {children}
    </button>
  );
};

// ======================= ACCESSIBLE DROPDOWN COMPONENT =======================
const AccessibleDropdown = ({ 
  trigger, 
  children, 
  align = 'right',
  width = 'w-48'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Focus first item when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const firstFocusable = dropdownRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 0);
      }
    }
  }, [isOpen]);

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
          if (e.key === 'ArrowDown' && !isOpen) {
            setIsOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-block"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute ${alignClasses[align]} mt-1 ${width} z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 focus:outline-none`}
          role="menu"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              triggerRef.current?.focus();
            }
            if (e.key === 'Tab' && !e.shiftKey) {
              const focusableElements = dropdownRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
              if (e.target === focusableElements[focusableElements.length - 1]) {
                setIsOpen(false);
              }
            }
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ 
  children, 
  onClick, 
  icon, 
  variant = 'default',
  disabled = false 
}) => {
  const variants = {
    default: 'text-gray-700 hover:bg-gray-50',
    danger: 'text-red-600 hover:bg-red-50',
    warning: 'text-amber-600 hover:bg-amber-50',
    success: 'text-green-600 hover:bg-green-50'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-gray-50 ${variants[variant]}`}
      role="menuitem"
      tabIndex={0}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

const Alert = ({ type = 'error', children, onClose }) => {
  const isError = type === 'error';
  const styles = isError
    ? 'border-red-200 bg-red-50 text-red-900'
    : 'border-green-200 bg-green-50 text-green-900';
  const ring = isError ? 'focus-visible:ring-red-600' : 'focus-visible:ring-green-600';

  return (
    <div
      className={cn('mb-5 flex items-start justify-between gap-4 rounded-xl border p-4 text-sm font-medium', styles)}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div className="min-w-0">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn('shrink-0 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2', ring)}
          aria-label="Dismiss message"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

const Modal = ({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  danger = false,
}) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => confirmRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200"
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-6">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'dangerSoft' : 'primary'}
            size="sm"
            onClick={onConfirm}
            ref={confirmRef}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ✅ UPDATED: shortlisted pill is now gray, not blue
const getStatusPill = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    case 'shortlisted':
      return 'bg-gray-100 text-gray-800 border border-gray-300';
    case 'accepted':
      return 'bg-green-50 text-green-800 border border-green-200';
    case 'rejected':
      return 'bg-red-50 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const prettyStatus = (s = '') => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Debounce hook
const useDebouncedValue = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* =======================
   Page
======================= */
const Applicants = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  // ✅ API base (same pattern with EmployerMessages.jsx)
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // ✅ track broken avatars so we can fallback to initials
  const [brokenAvatars, setBrokenAvatars] = useState(() => new Set());

  const getImageUrl = useCallback(
    (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${API_BASE}${url}`;
    },
    [API_BASE]
  );

  const markBroken = useCallback((key) => {
    setBrokenAvatars((prev) => {
      const next = new Set(prev);
      next.add(String(key));
      return next;
    });
  }, []);

  const Avatar = useCallback(
    ({ img, name, size = 48, altKey }) => {
      const initial = (name?.trim()?.[0] || 'U').toUpperCase();
      const src = img ? getImageUrl(img) : '';
      const isBroken = brokenAvatars.has(String(altKey));

      const boxStyle = { height: `${size}px`, width: `${size}px` };

      return (
        <div
          className="flex items-center justify-center rounded-full border border-gray-200 bg-gray-100 overflow-hidden shrink-0"
          style={boxStyle}
        >
          {src && !isBroken ? (
            <img
              src={src}
              alt={`${name}'s profile`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => markBroken(altKey)}
            />
          ) : (
            <span className="text-sm font-bold text-gray-700">{initial}</span>
          )}
        </div>
      );
    },
    [brokenAvatars, getImageUrl, markBroken]
  );

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const [allApplications, setAllApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedJob, setSelectedJob] = useState(jobId || 'all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);

  const [sort, setSort] = useState('newest'); // newest | oldest
  const [updatingId, setUpdatingId] = useState(null);

  // Reject confirm modal state
  const [rejectTarget, setRejectTarget] = useState(null); // { id, name } | null

  const isLoading = jobsLoading || appsLoading;
  const isBusy = !!updatingId;

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // read status from URL (?status=accepted)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const allowed = new Set(['pending', 'shortlisted', 'accepted', 'rejected', 'all']);
    if (status && allowed.has(status)) setStatusFilter(status);
  }, [location.search]);

  // keep selected job from route
  useEffect(() => {
    if (jobId) setSelectedJob(jobId);
  }, [jobId]);

  // auto-clear success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 2200);
    return () => clearTimeout(t);
  }, [success]);

  const syncStatusToURL = (value) => {
    setStatusFilter(value);

    const params = new URLSearchParams(location.search);
    if (value === 'all') params.delete('status');
    else params.set('status', value);

    navigate(
      { pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' },
      { replace: true }
    );
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handleAuthError = () => {
    localStorage.removeItem('token');
    navigate('/employer/login');
  };

  const fetchJobs = useCallback(async () => {
    try {
      setJobsLoading(true);
      const res = await axios.get('http://localhost:5000/api/jobs/employer/my-jobs', {
        headers: getAuthHeaders(),
      });
      if (res.data?.success) setJobs(res.data.jobs || []);
      else setJobs([]);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) return handleAuthError();
      setError('Failed to load jobs.');
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }, [navigate]);

  const fetchApplications = useCallback(async () => {
    try {
      setAppsLoading(true);
      clearMessages();

      let url = 'http://localhost:5000/api/applications/employer/all';
      if (selectedJob !== 'all') url = `http://localhost:5000/api/applications/job/${selectedJob}`;

      const res = await axios.get(url, { headers: getAuthHeaders() });

      if (res.data?.success) setAllApplications(res.data.applications || []);
      else setAllApplications([]);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) return handleAuthError();
      if (err.response?.status === 404) {
        setAllApplications([]);
        return;
      }
      setError('Failed to load applications. Please try again.');
      setAllApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, [selectedJob, navigate]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!jobsLoading) fetchApplications();
  }, [jobsLoading, selectedJob, fetchApplications]);

  const summary = useMemo(() => {
    const total = allApplications.length;
    const pending = allApplications.filter((a) => a.status === 'pending').length;
    const shortlisted = allApplications.filter((a) => a.status === 'shortlisted').length;
    const accepted = allApplications.filter((a) => a.status === 'accepted').length;
    const rejected = allApplications.filter((a) => a.status === 'rejected').length;
    return { total, pending, shortlisted, accepted, rejected };
  }, [allApplications]);

  const jobOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All jobs' },
      ...jobs.map((j) => ({
        value: j._id,
        label: `${j.title || '(Untitled)'} (${j.applicationCount || 0})`,
      })),
    ];
  }, [jobs]);

  const filteredApplications = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();

    const base =
      statusFilter === 'all'
        ? allApplications
        : allApplications.filter((a) => a.status === statusFilter);

    const searched = !q
      ? base
      : base.filter((a) => {
          const name = (a.jobseeker?.fullName || '').toLowerCase();
          const email = (a.jobseeker?.email || '').toLowerCase();
          const jobTitle = (a.job?.title || '').toLowerCase();
          const company = (a.job?.companyName || '').toLowerCase();
          const loc = (a.job?.location || '').toLowerCase();
          return [name, email, jobTitle, company, loc].some((t) => t.includes(q));
        });

    const sorted = [...searched].sort((a, b) => {
      const da = new Date(a.appliedAt || 0).getTime();
      const db = new Date(b.appliedAt || 0).getTime();
      return sort === 'oldest' ? da - db : db - da;
    });

    return sorted;
  }, [allApplications, debouncedQuery, sort, statusFilter]);

  // ✅ DAGDAG: Updated handleStatusUpdate with messaging success message
  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      if (isBusy) return;
      setUpdatingId(applicationId);
      clearMessages();

      const res = await axios.put(
        `http://localhost:5000/api/applications/${applicationId}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );

      if (res.data?.success) {
        setAllApplications((prev) =>
          prev.map((app) =>
            app._id === applicationId
              ? { ...app, status: newStatus, reviewedAt: res.data.reviewedAt || new Date() }
              : app
          )
        );
        
        // ✅ DAGDAG: Special message for shortlisted/accepted status
        if (newStatus === 'shortlisted') {
          setSuccess(`✅ Applicant shortlisted! Messaging is now enabled.`);
        } else if (newStatus === 'accepted') {
          setSuccess(`✅ Applicant accepted! Messaging remains enabled.`);
        } else {
          setSuccess(`Application marked as ${newStatus}.`);
        }
      } else {
        setError('Failed to update application status.');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) return handleAuthError();
      setError('Failed to update application status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All', count: summary.total },
      { key: 'pending', label: 'Pending', count: summary.pending },
      { key: 'shortlisted', label: 'Shortlisted', count: summary.shortlisted },
      { key: 'accepted', label: 'Accepted', count: summary.accepted },
      { key: 'rejected', label: 'Rejected', count: summary.rejected },
    ],
    [summary]
  );

  const clearFilters = () => {
    setQuery('');
    setSort('newest');
    setSelectedJob('all');
    syncStatusToURL('all');
  };

  const selectBase =
    'w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:bg-gray-50 disabled:opacity-60';
  const inputBase =
    'w-full rounded-xl border border-gray-300 pl-11 pr-10 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:bg-gray-50 disabled:opacity-60';

  return (
    <EmployerLayout>
      <div className="mx-auto max-w-7xl px-1 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applicants</h1>
            <p className="mt-1 text-sm text-gray-600">Manage and review job applications</p>
          </div>
        </div>

        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist" aria-label="Application status tabs">
          {tabs.map((t) => {
            const active = statusFilter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => syncStatusToURL(t.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2',
                  active
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                )}
                aria-pressed={active}
                role="tab"
                aria-selected={active}
              >
                {t.label}
                <span
                  className={cn(
                    'inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-bold',
                    active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-5">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              {/* Search */}
              <div className="lg:col-span-6">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-3.5 text-gray-400">
                    <Icon name="search" className="h-5 w-5" />
                  </span>

                  <label className="sr-only" htmlFor="applicantSearch">
                    Search applicants
                  </label>
                  <input
                    id="applicantSearch"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={inputBase}
                    placeholder="Search applicant, email, job title, company, location…"
                    disabled={isLoading}
                    autoComplete="off"
                  />

                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-3.5 rounded-lg p-1 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                      aria-label="Clear search"
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Job dropdown */}
              <div className="lg:col-span-3">
                <label className="sr-only" htmlFor="jobFilter">
                  Filter by job
                </label>
                <select
                  id="jobFilter"
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className={selectBase}
                  disabled={jobsLoading}
                >
                  {jobOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="lg:col-span-2">
                <label className="sr-only" htmlFor="sortFilter">
                  Sort applications
                </label>
                <select
                  id="sortFilter"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className={selectBase}
                  disabled={isLoading}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                </select>
              </div>

              {/* Clear */}
              <div className="lg:col-span-1">
                <Button variant="secondary" className="w-full" onClick={clearFilters} disabled={isLoading}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredApplications.length}</span> result(s)
              {selectedJob === 'all' ? '' : ' for selected job'}.
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6">
            {isLoading ? (
              <div className="py-14 text-center" role="status" aria-live="polite">
                <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-600" />
                <p className="mt-4 text-sm text-gray-600">Loading applicants…</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-14 text-center">
                <h3 className="text-lg font-semibold text-gray-900">No applicants found</h3>
                <p className="mt-2 text-sm text-gray-600">Try changing filters or clearing search.</p>
                {jobs.length === 0 && (
                  <div className="mt-6">
                    <Button variant="primary" onClick={() => navigate('/employer/post-job')}>
                      Post Your First Job
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Job applied
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Applied date
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredApplications.map((app) => {
                        const name = app.jobseeker?.fullName || 'Applicant';
                        const email = app.jobseeker?.email || '—';
                        const jobTitle = app.job?.title || 'Job Title';
                        const companyName = app.job?.companyName || 'Company';
                        const rowBusy = updatingId === app._id;

                        return (
                          <tr key={app._id} className="hover:bg-gray-50">
                            {/* Applicant */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {/* ✅ Avatar (image with fallback) */}
                                <Avatar
                                  img={app.jobseeker?.profileImage}
                                  name={name}
                                  size={48}
                                  altKey={`applicant_${app._id}`}
                                />

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-gray-900">{name}</div>
                                  <div className="truncate text-sm text-gray-600">{email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Job */}
                            <td className="px-6 py-4">
                              <div className="max-w-[18rem] truncate text-sm font-semibold text-gray-900" title={jobTitle}>
                                {jobTitle}
                              </div>
                              {selectedJob === 'all' && (
                                <div className="mt-0.5 max-w-[18rem] truncate text-xs text-gray-600" title={companyName}>
                                  {companyName}
                                </div>
                              )}
                            </td>

                            {/* Dates */}
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{formatDate(app.appliedAt)}</div>
                              <div className="mt-0.5 text-xs text-gray-600">
                                {app.reviewedAt ? `Reviewed: ${formatDate(app.reviewedAt)}` : 'Not reviewed'}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span
                                className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', getStatusPill(app.status))}
                                aria-label={`Status: ${prettyStatus(app.status)}`}
                              >
                                {prettyStatus(app.status)}
                              </span>
                            </td>

                            {/* ✅ UPDATED ACTIONS: View button + Three-dot dropdown with arrow IN ONE BOX */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {/* Primary Action - View Details */}
                                <Link
                                  to={`/employer/application/${app._id}`}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                                  aria-label={`View application of ${name}`}
                                >
                                  <Icon name="eye" className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Link>
                                
                                {/* Secondary Actions Menu - Three-dot and arrow in one box */}
                                <AccessibleDropdown
                                  trigger={
                                    <Button
                                      variant="secondary"
                                      size="xs"
                                      className="h-9 px-2 flex items-center justify-center gap-1"
                                      disabled={rowBusy}
                                      aria-label={`More actions for ${name}`}
                                    >
                                      {/* Three-dot icon */}
                                      <Icon name="more-vertical" className="h-4 w-4" />
                                      {/* Dropdown arrow */}
                                      <Icon name="chevron-down" className="h-3 w-3" />
                                    </Button>
                                  }
                                  align="right"
                                  width="w-48"
                                >
                                  {/* Dropdown content remains the same */}
                                  {/* Pending -> Shortlist */}
                                  {app.status === 'pending' && (
                                    <DropdownItem
                                      onClick={() => handleStatusUpdate(app._id, 'shortlisted')}
                                      icon={<Icon name="star" className="h-4 w-4 text-gray-600" />}
                                      disabled={rowBusy}
                                    >
                                      Shortlist
                                    </DropdownItem>
                                  )}
                                  
                                  {/* Shortlisted -> Accept */}
                                  {app.status === 'shortlisted' && (
                                    <DropdownItem
                                      onClick={() => handleStatusUpdate(app._id, 'accepted')}
                                      icon={<Icon name="check" className="h-4 w-4 text-green-600" />}
                                      disabled={rowBusy}
                                      variant="success"
                                    >
                                      Accept
                                    </DropdownItem>
                                  )}
                                  
                                  {/* For pending/shortlisted: Reject option */}
                                  {(app.status === 'pending' || app.status === 'shortlisted') && (
                                    <DropdownItem
                                      onClick={() => setRejectTarget({ id: app._id, name })}
                                      icon={<Icon name="x" className="h-4 w-4 text-red-600" />}
                                      disabled={rowBusy}
                                      variant="danger"
                                    >
                                      Reject
                                    </DropdownItem>
                                  )}
                                  
                                  {/* For accepted/rejected: Change status options */}
                                  {app.status === 'accepted' && (
                                    <>
                                      <DropdownItem
                                        onClick={() => handleStatusUpdate(app._id, 'shortlisted')}
                                        icon={<Icon name="star" className="h-4 w-4 text-gray-600" />}
                                        disabled={rowBusy}
                                      >
                                        Move to Shortlisted
                                      </DropdownItem>
                                      <DropdownItem
                                        onClick={() => setRejectTarget({ id: app._id, name })}
                                        icon={<Icon name="x" className="h-4 w-4 text-red-600" />}
                                        disabled={rowBusy}
                                        variant="danger"
                                      >
                                        Reject
                                      </DropdownItem>
                                    </>
                                  )}
                                  
                                  {app.status === 'rejected' && (
                                    <>
                                      <DropdownItem
                                        onClick={() => handleStatusUpdate(app._id, 'pending')}
                                        icon={<Icon name="refresh" className="h-4 w-4 text-amber-600" />}
                                        disabled={rowBusy}
                                      >
                                        Mark as Pending
                                      </DropdownItem>
                                      <DropdownItem
                                        onClick={() => handleStatusUpdate(app._id, 'shortlisted')}
                                        icon={<Icon name="star" className="h-4 w-4 text-gray-600" />}
                                        disabled={rowBusy}
                                      >
                                        Shortlist
                                      </DropdownItem>
                                    </>
                                  )}
                                </AccessibleDropdown>

                                {rowBusy && (
                                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
                                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-b-2 border-t-2 border-gray-400" />
                                    Updating…
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards - UPDATED: Also with View + Dropdown */}
                <div className="space-y-3 md:hidden">
                  {filteredApplications.map((app) => {
                    const name = app.jobseeker?.fullName || 'Applicant';
                    const email = app.jobseeker?.email || '—';
                    const jobTitle = app.job?.title || 'Job Title';
                    const companyName = app.job?.companyName || 'Company';
                    const rowBusy = updatingId === app._id;

                    return (
                      <div key={app._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* ✅ Avatar (image with fallback) */}
                            <Avatar
                              img={app.jobseeker?.profileImage}
                              name={name}
                              size={44}
                              altKey={`applicant_mobile_${app._id}`}
                            />

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-gray-900">{name}</div>
                              <div className="truncate text-xs text-gray-600">{email}</div>
                            </div>
                          </div>

                          <span
                            className={cn('shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', getStatusPill(app.status))}
                            aria-label={`Status: ${prettyStatus(app.status)}`}
                          >
                            {prettyStatus(app.status)}
                          </span>
                        </div>

                        <div className="mt-3 rounded-xl bg-gray-50 p-3">
                          <div className="truncate text-sm font-semibold text-gray-900" title={jobTitle}>
                            {jobTitle}
                          </div>
                          {selectedJob === 'all' && (
                            <div className="truncate text-xs text-gray-600" title={companyName}>
                              {companyName}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-600">
                            Applied: <span className="font-semibold text-gray-800">{formatDate(app.appliedAt)}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {app.reviewedAt ? `Reviewed: ${formatDate(app.reviewedAt)}` : 'Not reviewed'}
                          </div>
                        </div>

                        {/* ✅ UPDATED MOBILE ACTIONS: View + Dropdown */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            to={`/employer/application/${app._id}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                          >
                            <Icon name="eye" className="h-5 w-5" />
                            View
                          </Link>
                          
                          {/* Mobile dropdown trigger */}
                          <AccessibleDropdown
                            trigger={
                              <Button
                                variant="secondary"
                                size="md"
                                className="flex-1"
                                disabled={rowBusy}
                                aria-label={`More actions for ${name}`}
                              >
                                <Icon name="more-vertical" className="h-5 w-5" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            }
                            align="center"
                            width="w-56"
                          >
                            {/* Mobile dropdown content */}
                            {app.status === 'pending' && (
                              <DropdownItem
                                onClick={() => handleStatusUpdate(app._id, 'shortlisted')}
                                icon={<Icon name="star" className="h-4 w-4 text-gray-600" />}
                                disabled={rowBusy}
                              >
                                Shortlist
                              </DropdownItem>
                            )}
                            
                            {app.status === 'shortlisted' && (
                              <DropdownItem
                                onClick={() => handleStatusUpdate(app._id, 'accepted')}
                                icon={<Icon name="check" className="h-4 w-4 text-green-600" />}
                                disabled={rowBusy}
                                variant="success"
                              >
                                Accept
                              </DropdownItem>
                            )}
                            
                            {(app.status === 'pending' || app.status === 'shortlisted') && (
                              <DropdownItem
                                onClick={() => setRejectTarget({ id: app._id, name })}
                                icon={<Icon name="x" className="h-4 w-4 text-red-600" />}
                                disabled={rowBusy}
                                variant="danger"
                              >
                                Reject
                              </DropdownItem>
                            )}
                            
                            {rowBusy && (
                              <div className="px-4 py-2 text-xs text-gray-500">
                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-b-2 border-t-2 border-gray-400 mr-2" />
                                Updating…
                              </div>
                            )}
                          </AccessibleDropdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer note */}
        {!isLoading && (
          <div className="mt-4 text-xs text-gray-500">
            Tip: You can share links like <span className="font-semibold">?status=accepted</span>.
          </div>
        )}

        {/* Reject Confirm Modal */}
        <Modal
          open={!!rejectTarget}
          title="Reject application?"
          description={
            rejectTarget
              ? `This will mark ${rejectTarget.name}'s application as rejected. You can't undo this unless you manually change the status later.`
              : ''
          }
          confirmText="Reject"
          cancelText="Cancel"
          danger
          onClose={() => setRejectTarget(null)}
          onConfirm={() => {
            if (!rejectTarget) return;
            const { id } = rejectTarget;
            setRejectTarget(null);
            handleStatusUpdate(id, 'rejected');
          }}
        />
      </div>
    </EmployerLayout>
  );
};

export default Applicants;