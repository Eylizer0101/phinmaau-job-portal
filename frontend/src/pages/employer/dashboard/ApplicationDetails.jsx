// src/pages/employer/dashboard/ApplicationDetails.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from "../../services/api"; // ✅ CHANGED: Import api instead of axios
import EmployerLayout from '../../../layouts/EmployerLayout';

const UI = {
  page: 'mx-auto max-w-7xl px-1 py-8',
  section: 'space-y-6',

  // Surfaces
  card: 'bg-white border border-gray-200 rounded-2xl shadow-sm',
  cardSoft: 'bg-gray-50 border border-gray-200 rounded-2xl',
  inset: 'bg-gray-50 border border-gray-200 rounded-xl',
  divider: 'border-t border-gray-100',

  // Text
  h1: 'text-2xl sm:text-3xl font-bold tracking-tight text-gray-900',
  h2: 'text-lg font-semibold text-gray-900',
  h3: 'text-base font-semibold text-gray-900',
  body: 'text-sm text-gray-600',
  label: 'text-xs font-medium text-gray-600',
  value: 'text-sm font-semibold text-gray-900',

  // Focus
  ring:
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2',

  // Buttons
  btnBase:
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none',
  btnSm: 'h-9 px-3 text-sm',
  btnMd: 'h-10 px-4 text-sm',
  btnLg: 'h-11 px-5 text-sm',

  btnPrimary: 'bg-green-600 text-white hover:bg-green-700',
  btnSecondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50',
  btnDanger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  btnSoft: 'bg-green-50 text-green-800 border border-green-100 hover:bg-green-100',

  // Pills / Badges
  badgeBase: 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border',
};

const SvgIcon = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'back':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      );
    case 'file':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'user':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case 'doc':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case 'briefcase':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-3 0h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 13h18" />
        </svg>
      );
    case 'clock':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'download':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v12m0 0l4-4m-4 4l-4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 21h14" />
        </svg>
      );
    case 'check':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'x':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 9l-6 6m0-6l6 6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return <span className={className} />;
  }
};

const Spinner = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
    />
  </svg>
);

const Alert = ({ type = 'error', children, onClose }) => {
  const styles =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-900'
      : 'bg-red-50 border-red-200 text-red-900';

  const icon =
    type === 'success' ? (
      <span className="text-green-700">
        <SvgIcon name="check" className="w-5 h-5" />
      </span>
    ) : (
      <span className="text-red-700">
        <SvgIcon name="x" className="w-5 h-5" />
      </span>
    );

  return (
    <div className={`border rounded-xl p-4 ${styles}`} role="alert" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 text-sm font-medium">{children}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`${UI.btnBase} ${UI.btnSm} ${UI.btnSecondary} ${UI.ring} !h-8 !px-2`}
            aria-label="Close alert"
          >
            <span className="text-gray-600">✕</span>
          </button>
        )}
      </div>
    </div>
  );
};

const ApplicationDetails = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();

  // ✅ API base (para gumana yung /uploads/... paths)
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // ✅ broken avatar tracker (fallback to initials if broken link)
  const [avatarBroken, setAvatarBroken] = useState(false);

  const getAssetUrl = useCallback(
    (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${API_BASE}${url}`;
    },
    [API_BASE]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [application, setApplication] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const tabs = useMemo(
    () => [
      { key: 'details', label: 'Applicant Details', icon: 'user' },
      { key: 'coverletter', label: 'Cover Letter', icon: 'doc' },
      { key: 'jobinfo', label: 'Job Information', icon: 'briefcase' },
      { key: 'timeline', label: 'Timeline', icon: 'clock' },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState('details');
  const [focusIndex, setFocusIndex] = useState(0);
  const tabRefs = useRef([]);

  const setToast = useCallback((setter, msg) => {
    setter(msg);
    window.clearTimeout(setToast._t);
    setToast._t = window.setTimeout(() => setter(''), 3000);
  }, []);
  // eslint-disable-next-line
  setToast._t = setToast._t || null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusMeta = (statusRaw) => {
    const s = (statusRaw || 'pending').toLowerCase();

    if (s === 'pending') {
      return { label: 'Pending', cls: 'bg-amber-50 text-amber-900 border-amber-200', dot: 'bg-amber-500' };
    }
    if (s === 'shortlisted') {
      // keeping teal para distinct pero pwede rin green if gusto mo
      return { label: 'Shortlisted', cls: 'bg-teal-50 text-teal-900 border-teal-200', dot: 'bg-teal-500' };
    }
    if (s === 'accepted') {
      return { label: 'Accepted', cls: 'bg-green-50 text-green-900 border-green-200', dot: 'bg-green-600' };
    }
    if (s === 'rejected') {
      return { label: 'Rejected', cls: 'bg-red-50 text-red-900 border-red-200', dot: 'bg-red-500' };
    }
    return { label: 'Unknown', cls: 'bg-gray-50 text-gray-900 border-gray-200', dot: 'bg-gray-400' };
  };

  const fetchApplicationDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ CHANGED: Use api instance instead of axios with localhost
      const response = await api.get(`/applications/${applicationId}`);

      if (response.data.success) {
        setApplication(response.data.application);
        setAvatarBroken(false); // ✅ reset avatar broken when data changes
      } else {
        setError('Application not found');
      }
    } catch (err) {
      console.error('Error fetching application details:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/employer/login');
      } else if (err.response?.status === 403) {
        setError('You are not authorized to view this application');
      } else if (err.response?.status === 404) {
        setError('Application not found');
      } else {
        setError('Failed to load application details');
      }
    } finally {
      setLoading(false);
    }
  }, [applicationId, navigate]);

  useEffect(() => {
    fetchApplicationDetails();
  }, [fetchApplicationDetails]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdating(true);
      setError('');
      
      // ✅ CHANGED: Use api instance instead of axios with localhost
      const response = await api.put(
        `/applications/${applicationId}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        setApplication((prev) => ({
          ...prev,
          status: newStatus,
          reviewedAt: new Date().toISOString(),
        }));
        setToast(setSuccess, `Status updated: ${statusMeta(newStatus).label}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setToast(setError, 'Failed to update application status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const resumeUrlRaw = application?.jobseeker?.jobSeekerProfile?.resumeUrl;
  const resumeUrl = resumeUrlRaw ? getAssetUrl(resumeUrlRaw) : '';
  const canDownloadResume = Boolean(resumeUrl);

  const downloadResume = () => {
    if (!resumeUrl) return setToast(setError, 'No resume available for this applicant');
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const onTabKeyDown = (e) => {
    const max = tabs.length - 1;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
    } else {
      return;
    }

    let next = focusIndex;

    if (e.key === 'ArrowRight') next = focusIndex === max ? 0 : focusIndex + 1;
    if (e.key === 'ArrowLeft') next = focusIndex === 0 ? max : focusIndex - 1;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = max;

    setFocusIndex(next);
    tabRefs.current[next]?.focus();
  };

  const openTab = (key) => {
    setActiveTab(key);
    const idx = tabs.findIndex((t) => t.key === key);
    if (idx >= 0) setFocusIndex(idx);
  };

  // --- UI states ---
  if (loading) {
    return (
      <EmployerLayout>
        <div className={UI.page}>
          <div className={`${UI.card} p-10`}>
            <div className="flex flex-col items-center justify-center gap-3">
              <Spinner className="w-10 h-10 text-green-600" />
              <p className="text-sm text-gray-600">Loading application details…</p>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  if (error && !application) {
    return (
      <EmployerLayout>
        <div className={UI.page}>
          <div className={`${UI.card} p-10 text-center`}>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
              <SvgIcon name="x" className="w-7 h-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900">Error</h3>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6">
              <Link
                to="/employer/applicants"
                className={`${UI.btnBase} ${UI.btnLg} ${UI.btnPrimary} ${UI.ring}`}
              >
                <SvgIcon name="back" className="w-4 h-4" />
                Back to Applicants
              </Link>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  const s = statusMeta(application?.status);
  const applicantName = application?.jobseeker?.fullName || 'Applicant';
  const applicantEmail = application?.jobseeker?.email || 'No email';
  const jobTitle = application?.job?.title || 'position';
  const appliedAt = formatDate(application?.appliedAt);

  // ✅ NEW: course + year graduated
  const course = application?.jobseeker?.jobSeekerProfile?.course || 'N/A';
  const graduationYear = application?.jobseeker?.jobSeekerProfile?.graduationYear || 'N/A';

  // ✅ UPDATED avatar: supports /uploads paths + fallback if broken
  const ProfileAvatar = () => {
    const imgRaw = application?.jobseeker?.profileImage;
    const img = imgRaw ? getAssetUrl(imgRaw) : '';
    const initial = (applicantName?.trim()?.[0] || 'A').toUpperCase();

    if (img && !avatarBroken) {
      return (
        <img
          src={img}
          alt={`${applicantName} profile`}
          className="h-16 w-16 rounded-full object-cover border border-gray-200"
          loading="lazy"
          onError={() => setAvatarBroken(true)}
        />
      );
    }

    return (
      <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center border border-green-200">
        <span className="text-2xl font-bold text-white" aria-hidden="true">
          {initial}
        </span>
        <span className="sr-only">{applicantName}</span>
      </div>
    );
  };

  const ResumeButton = ({ size = 'md', label = 'Resume' }) => {
    const sizeCls = size === 'lg' ? UI.btnLg : UI.btnMd;

    return (
      <button
        type="button"
        onClick={downloadResume}
        disabled={!canDownloadResume}
        className={`${UI.btnBase} ${sizeCls} ${UI.btnSecondary} ${UI.ring}`}
      >
        <SvgIcon name="download" className="w-5 h-5" />
        {label}
      </button>
    );
  };

  return (
    <EmployerLayout>
      <div className={UI.page}>
        <div className={UI.section}>
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Link
                    to="/employer/applicants"
                    className={`inline-flex items-center gap-2 hover:text-gray-900 ${UI.ring} rounded-lg px-1`}
                  >
                    <SvgIcon name="back" className="w-4 h-4" />
                    Back to Applications
                  </Link>
                </div>

                <h1 className={UI.h1}>Application Review</h1>
                <p className={UI.body}>Reviewing application for {jobTitle}</p>
              </div>

              <div className="flex flex-col sm:items-end gap-2">
                <span className={`${UI.badgeBase} ${s.cls}`}>
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                  {s.label}
                </span>
                <p className="text-sm text-gray-600">Applied: {appliedAt}</p>
              </div>
            </div>

            {/* Profile summary */}
            <div className={`${UI.cardSoft} p-5 sm:p-6`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <ProfileAvatar />

                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate" title={applicantName}>
                      {applicantName}
                    </h2>
                    <p className="text-sm text-gray-600 truncate" title={applicantEmail}>
                      {applicantEmail}
                    </p>
                    <div className="mt-1 inline-flex items-center gap-2 text-sm text-gray-600">
                      <SvgIcon name="briefcase" className="w-4 h-4 text-gray-400" />
                      <span className="truncate" title={application?.job?.title}>
                        {application?.job?.title || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <ResumeButton label="Resume" />

                  {application?.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('rejected')}
                        disabled={statusUpdating}
                        className={`${UI.btnBase} ${UI.btnMd} ${UI.btnDanger} ${UI.ring}`}
                      >
                        {statusUpdating ? <Spinner /> : <SvgIcon name="x" className="w-5 h-5" />}
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusUpdate('shortlisted')}
                        disabled={statusUpdating}
                        className={`${UI.btnBase} ${UI.btnMd} ${UI.btnPrimary} ${UI.ring}`}
                      >
                        {statusUpdating ? <Spinner /> : <SvgIcon name="check" className="w-5 h-5" />}
                        Shortlist
                      </button>
                    </>
                  )}

                  {application?.status === 'shortlisted' && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate('accepted')}
                      disabled={statusUpdating}
                      className={`${UI.btnBase} ${UI.btnMd} ${UI.btnPrimary} ${UI.ring}`}
                    >
                      {statusUpdating ? <Spinner /> : <SvgIcon name="check" className="w-5 h-5" />}
                      Accept
                    </button>
                  )}

                  {(application?.status === 'accepted' || application?.status === 'rejected') && (
                    <span className={`${UI.btnBase} ${UI.btnMd} bg-white border border-gray-200 text-gray-900 rounded-xl`}>
                      Finalized: {s.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}

          {/* Main card */}
          <div className={`${UI.card} overflow-hidden`}>
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div
                role="tablist"
                aria-label="Application sections"
                className="flex flex-wrap gap-2 p-2"
                onKeyDown={onTabKeyDown}
              >
                {tabs.map((t, idx) => {
                  const active = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      ref={(el) => (tabRefs.current[idx] = el)}
                      role="tab"
                      aria-selected={active}
                      aria-controls={`panel-${t.key}`}
                      id={`tab-${t.key}`}
                      tabIndex={idx === focusIndex ? 0 : -1}
                      onClick={() => openTab(t.key)}
                      className={[
                        UI.btnBase,
                        UI.btnSm,
                        UI.ring,
                        'rounded-xl',
                        active
                          ? 'bg-white border border-gray-200 shadow-sm text-green-700'
                          : 'bg-transparent text-gray-700 hover:bg-white/70',
                      ].join(' ')}
                      type="button"
                    >
                      <span
                        className={[
                          'w-8 h-8 rounded-xl flex items-center justify-center border',
                          active ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-700',
                        ].join(' ')}
                      >
                        <SvgIcon name={t.icon} className="w-4 h-4" />
                      </span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-8">
              {/* DETAILS */}
              {activeTab === 'details' && (
                <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" className="space-y-8">
                  <div>
                    <h3 className={UI.h2}>Contact Information</h3>
                    <p className={`${UI.body} mt-1`}>Basic applicant and application details.</p>

                    <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className={`${UI.inset} p-4 min-w-0`}>
                        <p className={UI.label}>Email</p>
                        <p className={`${UI.value} break-words`} title={applicantEmail}>
                          {applicantEmail}
                        </p>
                      </div>

                      <div className={`${UI.inset} p-4`}>
                        <p className={UI.label}>Contact Number</p>
                        <p className={UI.value}>
                          {application?.jobseeker?.jobSeekerProfile?.contactNumber || 'N/A'}
                        </p>
                      </div>

                      <div className={`${UI.inset} p-4`}>
                        <p className={UI.label}>Applied Date</p>
                        <p className={UI.value}>{appliedAt}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* ✅ REPLACED: Education -> Course & Year Graduated */}
                    <div>
                      <h3 className={UI.h2}>Academic Background</h3>
                      <div className={`${UI.inset} p-5 mt-3 space-y-3`}>
                        <div>
                          <p className={UI.label}>Course</p>
                          <p className="text-sm text-gray-900 font-semibold break-words">{course}</p>
                        </div>
                        <div className={UI.divider} />
                        <div>
                          <p className={UI.label}>Year Graduated</p>
                          <p className="text-sm text-gray-900 font-semibold break-words">{graduationYear}</p>
                        </div>
                      </div>

                      {/* ✅ MOVED HERE: Skills (para mapuno yung blank space sa left) */}
                      <div className="mt-6">
                        <h3 className={UI.h2}>Skills</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {application?.jobseeker?.jobSeekerProfile?.skills?.length ? (
                            application.jobseeker.jobSeekerProfile.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-900 text-sm font-semibold rounded-xl"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-600 italic">No skills listed</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={UI.h2}>Experience</h3>
                      <div className={`${UI.inset} p-5 mt-3`}>
                        <p className="text-sm text-gray-700 whitespace-pre-line break-words">
                          {application?.jobseeker?.jobSeekerProfile?.experience || 'No experience information provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COVER LETTER */}
              {activeTab === 'coverletter' && (
                <div role="tabpanel" id="panel-coverletter" aria-labelledby="tab-coverletter">
                  <h3 className={UI.h2}>Cover Letter</h3>
                  <div className={`${UI.inset} p-6 sm:p-8 mt-4`}>
                    {application?.coverLetter ? (
                      <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed break-words">
                        {application.coverLetter}
                      </p>
                    ) : (
                      <div className="text-center py-10">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                          <SvgIcon name="doc" className="w-7 h-7" />
                        </div>
                        <p className="mt-4 text-sm text-gray-600">No cover letter provided</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* JOB INFO */}
              {activeTab === 'jobinfo' && (
                <div role="tabpanel" id="panel-jobinfo" aria-labelledby="tab-jobinfo" className="space-y-6">
                  <div>
                    <h3 className={UI.h2}>Job Details</h3>
                    <div className={`${UI.inset} p-6 mt-4`}>
                      <h4 className="text-lg font-bold text-gray-900">{application?.job?.title || 'N/A'}</h4>
                      <p className="text-sm text-gray-600 mt-1 break-words">{application?.job?.companyName || 'N/A'}</p>

                      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          ['Location', application?.job?.location || 'N/A'],
                          ['Job Type', application?.job?.jobType || 'N/A'],
                          ['Work Mode', application?.job?.workMode || 'N/A'],
                          ['Experience Level', application?.job?.experienceLevel || 'N/A'],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-white p-4 rounded-xl border border-gray-200 min-w-0">
                            <p className="text-xs text-gray-600">{k}</p>
                            <p className="text-sm font-semibold text-gray-900 truncate" title={String(v)}>
                              {v}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <h5 className="text-sm font-semibold text-gray-900">Job Description</h5>
                        <div className="bg-white rounded-xl p-5 border border-gray-200 mt-3">
                          <p className="text-sm text-gray-700 whitespace-pre-line break-words">
                            {application?.job?.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TIMELINE */}
              {activeTab === 'timeline' && (
                <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline">
                  <h3 className={UI.h2}>Application Timeline</h3>

                  <div className="mt-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
                        <SvgIcon name="check" className="w-5 h-5" />
                      </div>
                      <div className="flex-1 pb-6 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">Application Submitted</p>
                        <p className="text-sm text-gray-600 mt-1">{appliedAt}</p>
                        <p className="text-sm text-gray-600 mt-2">Candidate applied for the position.</p>
                      </div>
                    </div>

                    {application?.reviewedAt && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
                          <SvgIcon name="doc" className="w-5 h-5" />
                        </div>
                        <div className="flex-1 pb-6 border-b border-gray-100">
                          <p className="font-semibold text-gray-900">Application Reviewed</p>
                          <p className="text-sm text-gray-600 mt-1">{formatDate(application.reviewedAt)}</p>
                          <div className="mt-2">
                            <span className={`${UI.badgeBase} ${s.cls}`}>
                              <span className={`w-2 h-2 rounded-full ${s.dot}`} aria-hidden="true" />
                              Status: {s.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center">
                        <SvgIcon name="file" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Resume</p>
                        <p className="text-sm text-gray-600 mt-1">{canDownloadResume ? 'Available' : 'Not provided'}</p>

                        {canDownloadResume && (
                          <button
                            type="button"
                            onClick={downloadResume}
                            className={`${UI.btnBase} ${UI.btnMd} ${UI.btnSecondary} ${UI.ring} mt-3`}
                          >
                            <SvgIcon name="download" className="w-5 h-5" />
                            Download Resume
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
};

export default ApplicationDetails;