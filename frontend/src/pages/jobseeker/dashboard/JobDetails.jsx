import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBriefcase,
  faMapMarkerAlt,
  faCalendarAlt,
  faUsers,
  faBuilding,
  faFileAlt,
  faCheckCircle,
  faExclamationCircle,
  faCalendarCheck,
  faTag,
  faUserTie,
  faGraduationCap,
  faTools,
  faExternalLinkAlt,
  faShareAlt,
  faXmark,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import JobSeekerLayout from '../../../layouts/JobSeekerLayout';

// ✅ IMPORTANT: Import your API instance
import api from "../../../services/api";

/**
 * Polished:
 * - Header card layout/spacing
 * - Safer toast timer handling via useRef
 * - Added UI.page (prevent undefined)
 * - Modal a11y improvements (aria-labelledby, prevent overlay close on inner click)
 */

const UI = {
  page: 'bg-white', // ✅ ensure defined

  container: 'max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-10 -mt-12',

  card: 'bg-white border border-black/10 rounded-2xl shadow-sm',
  pad: 'p-6 sm:p-8',

  insetPanel: 'rounded-2xl border border-black/10 overflow-hidden bg-white',
  insetHead: 'px-5 sm:px-6 py-4 bg-white',
  insetBody: 'px-5 sm:px-6 py-6',

  grid: 'grid grid-cols-1 lg:grid-cols-12 gap-8',
  left: 'lg:col-span-8',
  right: 'lg:col-span-4',

  h1: 'text-2xl sm:text-3xl font-bold tracking-tight text-black',
  h2: 'text-base sm:text-lg font-bold text-black',
  h3: 'text-sm font-bold text-black',
  body: 'text-sm sm:text-base text-black/70',
  meta: 'text-sm text-black/70',
  caption: 'text-xs text-black/50',
  label: 'text-sm font-semibold text-black',

  divider: 'border-t border-black/10',

  ring:
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#27AE60] focus-visible:ring-offset-2 focus-visible:ring-offset-white',

  btnBase:
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none motion-reduce:transition-none motion-reduce:transform-none',
  btnSm: 'h-9 px-3 text-sm',
  btnMd: 'h-10 px-4 text-sm',
  btnLg: 'h-11 px-5 text-base',
  btnPrimary: 'bg-[#27AE60] text-white hover:bg-[#1F9A55] active:bg-[#1B864B]',
  btnSecondary: 'bg-white text-black border border-black/20 hover:bg-black/5',
  btnGhost: 'bg-transparent text-black/70 hover:bg-black/5',

  chip:
    'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-black/10 bg-white text-black/80',
  badgeBase: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border',

  textarea:
    'w-full rounded-lg border border-black/20 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40 resize-y',

  alertBase: 'rounded-xl border p-4',
  alertError: 'bg-black/5 border-black/15 text-black',
  alertSuccess: 'bg-[#27AE60]/10 border-[#27AE60]/30 text-black',

  srOnly: 'sr-only',
};

// ✅ Dashboard-style outline SVG icons (same “design” style)
const SvgIcon = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'arrowLeft':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
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
    case 'users':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-1a4 4 0 00-4-4h-1M9 20H2v-1a4 4 0 014-4h1m7-4a4 4 0 10-8 0 4 4 0 008 0zm8 2a3 3 0 10-6 0 3 3 0 006 0z"
          />
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
    case 'exclamation':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.29 3.86l-7.4 12.82A2 2 0 004.62 20h14.76a2 2 0 001.73-3.32l-7.4-12.82a2 2 0 00-3.42 0z"
          />
        </svg>
      );
    case 'calendarCheck':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l2 2 4-4" />
        </svg>
      );
    case 'tag':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 7h.01M3 11l8.586 8.586a2 2 0 002.828 0L21 13a2 2 0 000-2.828L13.414 3.586A2 2 0 0012 3H5a2 2 0 00-2 2v6z"
          />
        </svg>
      );
    case 'userTie':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 20a8 8 0 0116 0"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2 2 2-2" />
        </svg>
      );
    case 'graduation':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
        </svg>
      );
    case 'tools':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.7 6.3a4 4 0 01-5.657 5.657l-5.04 5.04a2 2 0 102.829 2.828l5.04-5.04A4 4 0 0114.7 6.3z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-3 3" />
        </svg>
      );
    case 'external':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3h7v7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14L21 3" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6"
          />
        </svg>
      );
    case 'share':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V3" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8l5-5 5 5" />
        </svg>
      );
    case 'xmark':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'clock':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const CompanyLogo = ({ src, name }) => {
  const [failed, setFailed] = useState(false);
  const initial = (name?.trim()?.[0] || 'C').toUpperCase();

  if (!src || failed) {
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-black/10 bg-black/5 flex items-center justify-center flex-shrink-0">
        <span className="font-bold text-lg sm:text-xl text-black/70" aria-hidden="true">
          {initial}
        </span>
        <span className={UI.srOnly}>{name || 'Company'}</span>
      </div>
    );
  }

  return (
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-black/10 bg-white flex-shrink-0">
      <img
        src={src}
        alt={`${name || 'Company'} logo`}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </div>
  );
};

const IconBadge = ({ icon }) => (
  <span className="w-10 h-10 rounded-xl bg-[#27AE60]/10 border border-[#27AE60]/25 flex items-center justify-center flex-shrink-0 text-[#27AE60]">
    <SvgIcon name={icon} className="w-5 h-5" />
  </span>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-black/40 mt-1">
      <SvgIcon name={icon} className="w-4 h-4" />
    </span>
    <div>
      <p className={UI.caption}>{label}</p>
      <p className={UI.meta}>{value}</p>
    </div>
  </div>
);

const StatItem = ({ icon, label, value, isPeso }) => (
  <div className="flex items-center gap-2 text-sm text-black/70">
    {isPeso ? (
      <span className="w-4 h-4 flex items-center justify-center text-[#27AE60] font-black leading-none" aria-hidden="true">
        ₱
      </span>
    ) : (
      <span className="text-[#27AE60]">
        <SvgIcon name={icon} className="w-4 h-4" />
      </span>
    )}
    <span className="text-black/50">{label}</span>
    <span className="font-semibold text-black">{value}</span>
  </div>
);

const Skeleton = () => (
  <div className={UI.container} aria-hidden="true">
    <div className={`${UI.card} ${UI.pad}`}>
      <div className="animate-pulse motion-reduce:animate-none space-y-6">
        <div className="h-6 w-56 bg-black/5 rounded" />
        <div className="h-24 bg-black/5 rounded-2xl" />
        <div className="h-96 bg-black/5 rounded-2xl" />
      </div>
    </div>
  </div>
);

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('');

  const [toast, setToast] = useState({ type: '', message: '' });

  const lastFocusedRef = useRef(null);
  const modalCloseBtnRef = useRef(null);
  const toastTimerRef = useRef(null);

  const sourcePage = location.state?.sourcePage || 'jobsearch';

  const setToastWithAutoClear = useCallback((type, message, ms = 1800) => {
    setToast({ type, message });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast({ type: '', message: '' }), ms);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const closeApplyModal = useCallback(() => {
    setShowApplyModal(false);
    setCoverLetter('');

    const el = lastFocusedRef.current;
    if (el && typeof el.focus === 'function') el.focus();
  }, []);

  const handleBackButton = useCallback(() => {
    if (sourcePage === 'myapplications') navigate('/jobseeker/my-applications');
    else navigate('/jobseeker/job-search');
  }, [navigate, sourcePage]);

  const formatSalary = useCallback((min, max) => {
    const hasMin = typeof min === 'number';
    const hasMax = typeof max === 'number';
    if (!hasMin && !hasMax) return 'Salary not specified';

    const fmt = (n) => `₱${Number(n).toLocaleString('en-PH')}`;
    if (hasMin && hasMax) return `${fmt(min)} – ${fmt(max)}`;
    if (hasMin) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  const formatDeadlineCountdown = useCallback((dateString) => {
    if (!dateString) return 'No deadline';
    const deadline = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Application closed';
    if (diffDays === 0) return 'Closes today';
    if (diffDays === 1) return 'Closes tomorrow';
    if (diffDays <= 7) return `Closes in ${diffDays} days`;
    return `Closes on ${deadline.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`;
  }, []);

  const isJobActive = useCallback(() => {
    if (!job) return false;
    if (!job.isActive || !job.isPublished) return false;
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) return false;
    return true;
  }, [job]);

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.get(`/jobs/${id}`);

      if (response.data.success) {
        const jobData = response.data.job;
        setJob(jobData);

        if (jobData.employerDetails) {
          setCompanyInfo({
            companyAddress: jobData.employerDetails.companyAddress || '',
            industry: jobData.employerDetails.industry || '',
            companyWebsite: jobData.employerDetails.companyWebsite || '',
          });
        } else setCompanyInfo(null);
      } else {
        setError('Job not found');
      }
    } catch (err) {
      if (err.response?.status === 404) setError('Job not found or has been removed');
      else if (err.response?.status === 500) setError('Server error. Please try again later.');
      else if (err.request) setError('Cannot connect to server. Please check your connection.');
      else setError('Error loading job details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkIfApplied = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.get(`/applications/check/${id}`);

      if (response.data.success) {
        setHasApplied(Boolean(response.data.hasApplied));
        if (response.data.application?.status) setApplicationStatus(response.data.application.status);
      }
    } catch {
      // non-blocking
    }
  }, [id]);

  const fetchSimilarJobs = useCallback(
    async (category) => {
      try {
        if (!category) return;

        // ✅ FIXED: Use api instance instead of hardcoded localhost
        const response = await api.get('/jobs', {
          params: { category, limit: 4 },
        });

        let jobsData = [];
        if (response.data.success && response.data.jobs) jobsData = response.data.jobs;
        else if (Array.isArray(response.data)) jobsData = response.data;

        setSimilarJobs(jobsData.filter((j) => j._id !== id).slice(0, 3));
      } catch {
        // non-blocking
      }
    },
    [id]
  );

  useEffect(() => {
    fetchJobDetails();
    checkIfApplied();
  }, [fetchJobDetails, checkIfApplied]);

  useEffect(() => {
    if (job?.category) fetchSimilarJobs(job.category);
  }, [job?.category, fetchSimilarJobs]);

  useEffect(() => {
    if (!showApplyModal) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeApplyModal();
    };

    window.addEventListener('keydown', onKeyDown);
    window.setTimeout(() => modalCloseBtnRef.current?.focus?.(), 0);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showApplyModal, closeApplyModal]);

  const statusBadge = useMemo(() => {
    if (!hasApplied) return null;

    const status = (applicationStatus || 'pending').toLowerCase();
    const map = {
      pending: { cls: 'bg-black/5 border-black/20 text-black/80', icon: 'clock', label: 'Pending' },
      shortlisted: { cls: 'bg-[#27AE60]/10 border-[#27AE60]/30 text-black', icon: 'checkCircle', label: 'Shortlisted' },
      accepted: { cls: 'bg-[#27AE60]/10 border-[#27AE60]/30 text-black', icon: 'checkCircle', label: 'Accepted' },
      rejected: { cls: 'bg-black/5 border-black/20 text-black', icon: 'exclamation', label: 'Rejected' },
    };
    const picked = map[status] || map.pending;

    return (
      <span className={`${UI.badgeBase} ${picked.cls}`}>
        <SvgIcon name={picked.icon} className="w-3.5 h-3.5" />
        Applied ({picked.label})
      </span>
    );
  }, [hasApplied, applicationStatus]);

  const handleShareJob = useCallback(() => {
    const jobUrl = window.location.href;
    const shareText = `Check out this job: ${job?.title} at ${job?.companyName}`;

    if (navigator.share) {
      navigator.share({ title: job?.title, text: shareText, url: jobUrl });
      return;
    }

    navigator.clipboard
      .writeText(jobUrl)
      .then(() => setToastWithAutoClear('success', 'Job link copied to clipboard.'))
      .catch(() => setToastWithAutoClear('error', 'Failed to copy link. Please try again.'));
  }, [job, setToastWithAutoClear]);

  const handleApplyClick = useCallback(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);

      if (user.role !== 'jobseeker') {
        setToastWithAutoClear('error', 'Only job seekers can apply for jobs.');
        return;
      }

      if (!user.jobSeekerProfile?.resumeUrl) {
        navigate('/jobseeker/my-profile');
        return;
      }

      if (!isJobActive()) {
        setToastWithAutoClear('error', 'This job is no longer accepting applications.');
        return;
      }

      if (hasApplied) {
        setToastWithAutoClear('error', `You already applied. Status: ${applicationStatus || 'pending'}`);
        return;
      }

      lastFocusedRef.current = document.activeElement;
      setCoverLetter('');
      setShowApplyModal(true);
    } catch {
      setToastWithAutoClear('error', 'Error checking user information.');
    }
  }, [navigate, isJobActive, hasApplied, applicationStatus, setToastWithAutoClear]);

  const handleSubmitApplication = useCallback(async () => {
    if (!job) return;

    try {
      setApplying(true);

      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.post(`/applications/apply/${job._id}`, 
        { coverLetter }
      );

      if (response.data.success) {
        setToastWithAutoClear('success', 'Application submitted successfully!');
        setHasApplied(true);
        setApplicationStatus('pending');
        window.setTimeout(() => closeApplyModal(), 900);
      }
    } catch (err) {
      if (err.response?.status === 401) setToastWithAutoClear('error', 'Session expired. Please login again.');
      else if (err.response?.status === 403) setToastWithAutoClear('error', 'Only job seekers can apply for jobs.');
      else setToastWithAutoClear('error', err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  }, [job, coverLetter, closeApplyModal, setToastWithAutoClear]);

  if (loading) {
    return (
      <JobSeekerLayout>
        <Skeleton />
      </JobSeekerLayout>
    );
  }

  if (error) {
    return (
      <JobSeekerLayout>
        <div className={UI.container}>
          <div className={`${UI.card} ${UI.pad} text-center`}>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-black/5 border border-black/10 flex items-center justify-center mb-4 text-black/60">
              <SvgIcon name="exclamation" className="w-7 h-7" />
            </div>

            <h1 className={UI.h2}>{error}</h1>
            <p className={`mt-2 ${UI.body}`}>The job you’re looking for might have been removed or is no longer available.</p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleBackButton} className={`${UI.btnBase} ${UI.btnMd} ${UI.btnSecondary} ${UI.ring}`} type="button">
                <SvgIcon name="arrowLeft" className="w-4 h-4" />
                Go Back
              </button>

              <button onClick={() => navigate('/jobseeker/job-search')} className={`${UI.btnBase} ${UI.btnMd} ${UI.btnPrimary} ${UI.ring}`} type="button">
                Browse Jobs
              </button>
            </div>
          </div>
        </div>
      </JobSeekerLayout>
    );
  }

  if (!job) return null;

  const jobActive = isJobActive();
  const primaryCtaLabel = hasApplied ? 'View Application' : jobActive ? 'Apply Now' : 'Application Closed';
  const primaryCtaIcon = hasApplied ? 'calendarCheck' : jobActive ? 'file' : 'exclamation';

  return (
    <JobSeekerLayout>
      
        <div className={UI.container}>
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button onClick={handleBackButton} className={`${UI.btnBase} ${UI.btnSm} ${UI.btnGhost} ${UI.ring}`} type="button">
              <SvgIcon name="arrowLeft" className="w-4 h-4" />
              Back to {sourcePage === 'myapplications' ? 'My Applications' : 'Job Search'}
            </button>
          </div>

          {/* Toast */}
          {toast.message && (
            <div className={`${UI.alertBase} ${toast.type === 'error' ? UI.alertError : UI.alertSuccess} mb-4`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live="polite">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{toast.message}</p>
                <button onClick={() => setToast({ type: '', message: '' })} className={`${UI.btnBase} ${UI.btnSm} ${UI.btnGhost} ${UI.ring}`} type="button">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Header Card */}
          <div className={`${UI.card} ${UI.pad} mb-6`}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex items-start gap-4 min-w-0">
                <CompanyLogo src={job.companyLogo} name={job.companyName} />

                <div className="min-w-0">
                  <h1
                    className={`${UI.h1} overflow-hidden text-ellipsis sm:truncate`}
                    style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
                    title={job.title}
                  >
                    {job.title}
                  </h1>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    <div className={`inline-flex items-center gap-2 ${UI.meta} min-w-0`}>
                      <span className="text-black/60">
                        <SvgIcon name="building" className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" title={job.companyName}>
                        {job.companyName}
                      </span>
                    </div>

                    <div className={`inline-flex items-center gap-2 ${UI.meta}`}>
                      <span className="text-black/60">
                        <SvgIcon name="location" className="w-4 h-4" />
                      </span>
                      <span>{job.location || 'Location not specified'}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.workMode && (
                      <span className={UI.chip}>
                        <span className="text-black/60">
                          <SvgIcon name="briefcase" className="w-3.5 h-3.5" />
                        </span>
                        {job.workMode}
                      </span>
                    )}

                    <span className={UI.chip}>
                      <span className="text-black/60">
                        <SvgIcon name="userTie" className="w-3.5 h-3.5" />
                      </span>
                      {job.experienceLevel || 'Mid Level'}
                    </span>

                    {job.category && (
                      <span className={UI.chip}>
                        <span className="text-black/60">
                          <SvgIcon name="tag" className="w-3.5 h-3.5" />
                        </span>
                        {job.category}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">{statusBadge}</div>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                    <StatItem icon="briefcase" label="Type" value={job.jobType || 'Not specified'} />
                    <StatItem isPeso label="Salary" value={formatSalary(job.salaryMin, job.salaryMax)} />
                    <StatItem icon="calendar" label="Deadline" value={formatDeadlineCountdown(job.applicationDeadline)} />
                    <StatItem icon="users" label="Vacancies" value={job.vacancies || 'Not specified'} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 w-full lg:w-56">
                <button
                  onClick={hasApplied ? () => navigate('/jobseeker/my-applications') : jobActive ? handleApplyClick : undefined}
                  disabled={!jobActive && !hasApplied}
                  className={`${UI.btnBase} ${UI.btnLg} ${(!jobActive && !hasApplied) ? 'bg-black/5 text-black/50 border border-black/10' : UI.btnPrimary} ${UI.ring} w-full`}
                  type="button"
                >
                  <SvgIcon name={primaryCtaIcon} className="w-4 h-4" />
                  {primaryCtaLabel}
                </button>

                <button onClick={handleShareJob} className={`${UI.btnBase} ${UI.btnLg} ${UI.btnSecondary} ${UI.ring} w-full`} type="button">
                  <SvgIcon name="share" className="w-4 h-4" />
                  Share Job
                </button>
              </div>
            </div>
          </div>

          <div className={`${UI.divider} mb-6`} />

          <div className={UI.grid}>
            {/* LEFT */}
            <div className={UI.left}>
              <div>
                <h2 className={UI.h2}>Job Details</h2>
                <p className={`mt-1 ${UI.body}`}>Read the description, requirements, and skills.</p>
              </div>

              <div className={`mt-6 ${UI.insetPanel}`}>
                <div className={UI.insetHead}>
                  <p className="text-xs font-semibold text-black/60">Details</p>
                </div>

                <div className={`${UI.insetBody} space-y-8`}>
                  <section>
                    <div className="flex items-start gap-3">
                      <IconBadge icon="file" />
                      <div className="min-w-0">
                        <h3 className={UI.h3}>Job Description</h3>
                        <p className={UI.caption}>What you'll do</p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm sm:text-base text-black/70 leading-relaxed whitespace-pre-wrap">
                      {job.description || 'No description provided.'}
                    </div>
                  </section>

                  <div className={UI.divider} />

                  <section>
                    <div className="flex items-start gap-3">
                      <IconBadge icon="tools" />
                      <div className="min-w-0">
                        <h3 className={UI.h3}>Requirements</h3>
                        <p className={UI.caption}>What you need</p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm sm:text-base text-black/70 leading-relaxed whitespace-pre-wrap">
                      {job.requirements || 'No requirements provided.'}
                    </div>
                  </section>

                  <div className={UI.divider} />

                  <section>
                    <div className="flex items-start gap-3">
                      <IconBadge icon="graduation" />
                      <div className="min-w-0">
                        <h3 className={UI.h3}>Skills Required</h3>
                        <p className={UI.caption}>Nice to have</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {Array.isArray(job.skillsRequired) && job.skillsRequired.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {job.skillsRequired.map((skill, idx) => (
                            <span
                              key={`${skill}-${idx}`}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#27AE60]/25 bg-[#27AE60]/10 text-black"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm sm:text-base text-black/70">No skills listed.</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className={UI.right}>
              <div className={UI.insetPanel}>
                <div className={UI.insetHead}>
                  <p className="text-xs font-semibold text-black/60">Overview</p>
                </div>

                <div className={`${UI.insetBody} space-y-6`}>
                  <div>
                    <h3 className={`${UI.h3} flex items-center gap-2`}>
                      <span className="text-[#27AE60]">
                        <SvgIcon name="building" className="w-4 h-4" />
                      </span>
                      About Company
                    </h3>

                    <div className="mt-4 space-y-4">
                      <div>
                        <p className={UI.caption}>Company Name</p>
                        <p className="font-semibold text-black">{job.companyName}</p>
                      </div>

                      {companyInfo?.companyAddress && (
                        <div>
                          <p className={UI.caption}>Address</p>
                          <p className={UI.meta}>{companyInfo.companyAddress}</p>
                        </div>
                      )}

                      {companyInfo?.industry && (
                        <div>
                          <p className={UI.caption}>Industry</p>
                          <p className={UI.meta}>{companyInfo.industry}</p>
                        </div>
                      )}

                      {companyInfo?.companyWebsite && (
                        <div>
                          <p className={UI.caption}>Website</p>
                          <a
                            href={companyInfo.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 font-semibold text-[#27AE60] hover:underline ${UI.ring} rounded`}
                          >
                            <span className="break-all">{companyInfo.companyWebsite}</span>
                            <SvgIcon name="external" className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={UI.divider} />

                  <div>
                    <h3 className={UI.h3}>Job Summary</h3>

                    <div className="mt-4 space-y-4">
                      <InfoRow icon="calendar" label="Posted Date" value={job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-PH') : 'N/A'} />
                      <InfoRow icon="calendarCheck" label="Application Deadline" value={formatDate(job.applicationDeadline)} />

                      <div className="flex items-start gap-3">
                        <span className="w-4 h-4 flex items-center justify-center text-black/40 font-black leading-none mt-0.5" aria-hidden="true">
                          ₱
                        </span>
                        <div>
                          <p className={UI.caption}>Salary Type</p>
                          <p className={UI.meta}>
                            {job.salaryType ? job.salaryType.charAt(0).toUpperCase() + job.salaryType.slice(1) : 'Monthly'}
                          </p>
                        </div>
                      </div>

                      <InfoRow icon="users" label="Total Applications" value={`${job.applicationCount || 0} applicants`} />
                    </div>
                  </div>

                  {similarJobs.length > 0 && (
                    <>
                      <div className={UI.divider} />

                      <div>
                        <h3 className={UI.h3}>Similar Jobs</h3>

                        <div className="mt-4 space-y-3">
                          {similarJobs.map((sj) => (
                            <button
                              key={sj._id}
                              onClick={() => navigate(`/jobseeker/job-details/${sj._id}`, { state: { sourcePage } })}
                              className={`w-full text-left rounded-xl border border-black/10 bg-white hover:bg-black/5 transition p-4 ${UI.ring}`}
                              type="button"
                            >
                              <p className="font-semibold text-black line-clamp-1">{sj.title}</p>
                              <p className="text-sm text-black/70 line-clamp-1">{sj.companyName}</p>
                              <p className="text-xs text-black/50 mt-1">
                                {sj.location} • {sj.jobType}
                              </p>
                            </button>
                          ))}

                          <button onClick={() => navigate('/jobseeker/job-search')} className={`${UI.btnBase} ${UI.btnMd} ${UI.btnSecondary} ${UI.ring} w-full`} type="button">
                            View More Jobs <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Apply Modal */}
          {showApplyModal && job && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60" onClick={closeApplyModal} aria-hidden="true" />

              <div className="relative min-h-full flex items-center justify-center p-4">
                <div
                  className={`${UI.card} w-full max-w-lg`}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="applyModalTitle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 id="applyModalTitle" className="text-xl font-bold text-black">
                          Apply for Job
                        </h3>
                        <p className="text-sm text-black/70 mt-1">
                          {job.title} • {job.companyName}
                        </p>
                      </div>

                      <button ref={modalCloseBtnRef} onClick={closeApplyModal} className={`${UI.btnBase} ${UI.btnSm} ${UI.btnGhost} ${UI.ring}`} type="button">
                        <SvgIcon name="xmark" className="w-4 h-4" />
                        <span className={UI.srOnly}>Close</span>
                      </button>
                    </div>

                    <div className="mt-5">
                      <label className={UI.label} htmlFor="coverLetter">
                        Cover Letter (Optional)
                      </label>
                      <textarea
                        id="coverLetter"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={5}
                        className={`${UI.textarea} mt-2 ${UI.ring}`}
                        placeholder="Tell the employer why you're a good fit for this position..."
                      />
                      <p className={`mt-2 ${UI.caption}`}>Your resume will be automatically attached to this application.</p>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                      <button
                        onClick={closeApplyModal}
                        className={`${UI.btnBase} ${UI.btnMd} ${UI.btnSecondary} ${UI.ring} w-full sm:w-auto`}
                        type="button"
                        disabled={applying}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleSubmitApplication}
                        disabled={applying}
                        className={`${UI.btnBase} ${UI.btnMd} ${UI.btnPrimary} ${UI.ring} w-full sm:w-auto`}
                        type="button"
                        aria-busy={applying}
                      >
                        {applying ? (
                          <>
                            <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin motion-reduce:animate-none" />
                            Applying...
                          </>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={UI.srOnly} aria-live="polite" aria-atomic="true">
            {toast.message}
          </div>
        </div>
      
    </JobSeekerLayout>
  );
};

export default JobDetails;