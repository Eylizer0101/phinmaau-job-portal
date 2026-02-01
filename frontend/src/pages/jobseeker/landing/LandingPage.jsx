// src/pages/jobseeker/landing/LandingPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBriefcase,
  faBuilding,
  faChartLine,
  faCheckCircle,
  faComments,
  faFileUpload,
  faGraduationCap,
  faHistory,
  faIdCard,
  faIndustry,
  faRocket,
  faSchool,
  faSearch,
  faShieldAlt,
  faUniversity,
  faUserCheck,
  faUserGraduate,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import JobSeekerNavbar from '../../../components/shared/JobSeekerNavbar';
import api from '../../../services/api';

const MAX_LATEST_JOBS = 4;

const LandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // Track broken logos per job id (avoid innerHTML injection)
  const [brokenLogos, setBrokenLogos] = useState(() => new Set());

  // Small toast for UX (instead of alert)
  const [toast, setToast] = useState(null); // { type: 'info' | 'error', message: string }

  // ✅ Redirect/loading state (guest gating UX)
  const [isRedirecting, setIsRedirecting] = useState(false);

  // ✅ Gating Modal State
  const [authModal, setAuthModal] = useState({
    open: false,
    title: 'Login Required',
    message: 'You need to log in first to continue.',
    // where to go when user confirms
    confirmTo: '/register'
  });

  const showToast = (message, type = 'info') => {
    setToast({ type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2200);
  };

  const fetchLandingJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await api.get('/jobs');

      let jobsData = [];
      if (response?.data?.success && response?.data?.jobs) jobsData = response.data.jobs;
      else if (response?.data?.data) jobsData = response.data.data;
      else if (Array.isArray(response?.data)) jobsData = response.data;

      const now = new Date();

      // filter: published + active + not expired
      const filtered = (jobsData || [])
        .filter((job) => {
          if (!job) return false;
          if (job.isPublished === false) return false;
          if (job.isActive === false) return false;

          if (!job.applicationDeadline) return true;
          const d = new Date(job.applicationDeadline);
          if (Number.isNaN(d.getTime())) return true;
          return d >= now;
        })
        // latest first
        .sort((a, b) => {
          const da = new Date(a?.createdAt || 0).getTime();
          const db = new Date(b?.createdAt || 0).getTime();
          return db - da;
        });

      setJobs(filtered);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      showToast('Failed to load jobs. Please try again.', 'error');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        window.setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  useEffect(() => {
    fetchLandingJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Close modal with ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!authModal.open) return;
      if (e.key === 'Escape') {
        setAuthModal((p) => ({ ...p, open: false }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [authModal.open]);

  // Helpers
  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary not specified';
    const formattedMin = min ? `₱${Number(min).toLocaleString()}` : '';
    const formattedMax = max ? `₱${Number(max).toLocaleString()}` : '';
    if (formattedMin && formattedMax) return `${formattedMin} - ${formattedMax}`;
    if (formattedMin) return `From ${formattedMin}`;
    return `Up to ${formattedMax}`;
  };

  const getSalaryPeriod = (type) => {
    if (!type) return 'Monthly';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const formatDeadline = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Closed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isJobNew = (job) => {
    if (!job?.createdAt) return false;
    const postedDate = new Date(job.createdAt);
    const now = new Date();
    const diffDays = (now - postedDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  const getSkillsArray = (job) => {
    const v = job?.skillsRequired;
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  // ✅ Open modal helper (centralized)
  const openAuthModal = (overrides = {}) => {
    if (isRedirecting) return;
    setAuthModal((prev) => ({
      ...prev,
      open: true,
      title: overrides.title || prev.title,
      message: overrides.message || prev.message,
      confirmTo: overrides.confirmTo || prev.confirmTo
    }));
  };

  // ✅ Confirm action in modal → loading → redirect
  const confirmAuthModal = () => {
    if (isRedirecting) return;

    setIsRedirecting(true);
    showToast('Redirecting…', 'info');

    // close modal immediately (or keep it open if you prefer)
    setAuthModal((p) => ({ ...p, open: false }));

    window.clearTimeout(confirmAuthModal._t);
    confirmAuthModal._t = window.setTimeout(() => {
      navigate(authModal.confirmTo || '/register');
      window.setTimeout(() => setIsRedirecting(false), 300);
    }, 900);
  };

  const redirectToRegisterIfGuest = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      openAuthModal({
        title: 'Create an Account',
        message: 'You need to register or log in to view details and apply for jobs.',
        confirmTo: '/register'
      });
      return true;
    }
    return false;
  };

  const requireJobSeekerRole = () => {
    const rawUser = localStorage.getItem('user');
    let parsed = null;
    try {
      parsed = JSON.parse(rawUser || 'null');
    } catch {
      parsed = null;
    }

    if (parsed?.role !== 'jobseeker') {
      showToast('Only job seekers can apply for jobs.', 'error');
      return false;
    }
    return true;
  };

  const handleCardClick = (job) => {
    if (isRedirecting) return;
    if (redirectToRegisterIfGuest()) return;
    navigate(`/jobseeker/job-details/${job._id || job.id}`);
  };

  const handleViewJobDetails = (job) => {
    if (isRedirecting) return;
    if (redirectToRegisterIfGuest()) return;
    navigate(`/jobseeker/job-details/${job._id || job.id}`);
  };

  const handleApplyClick = (job) => {
    if (isRedirecting) return;
    if (redirectToRegisterIfGuest()) return;
    if (!requireJobSeekerRole()) return;
    navigate(`/jobseeker/job-details/${job._id || job.id}`);
  };

  // ✅ Guest gating for ANY BUTTON (as requested)
  const handleAnyButtonClick = (e, to, modalText) => {
    // allow normal behavior if already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) return;

    // prevent the Link from navigating
    e.preventDefault();
    e.stopPropagation();

    openAuthModal({
      title: modalText?.title || 'Login Required',
      message: modalText?.message || 'You need to register or log in to continue.',
      confirmTo: to || '/register'
    });
  };

  const latestJobs = useMemo(() => jobs.slice(0, MAX_LATEST_JOBS), [jobs]);

  // UI content blocks
  const features = [
    {
      icon: faUniversity,
      title: 'Araullo Graduate Verification',
      description:
        'Get officially verified by Araullo University administration. Only real graduates and students can apply.'
    },
    {
      icon: faShieldAlt,
      title: 'Verified Companies Only',
      description: 'All employers are verified and legitimate. No scams, no fake jobs.'
    },
    {
      icon: faIndustry,
      title: 'Direct Industry Application',
      description: 'Apply directly to industries that match your skills and qualifications.'
    },
    {
      icon: faUserCheck,
      title: 'Exclusive Opportunities',
      description: 'Access job postings exclusive to university graduates.'
    },
    {
      icon: faChartLine,
      title: 'Application Tracking',
      description: 'Track your application status from submission to hiring decision.'
    },
    {
      icon: faUsers,
      title: 'Alumni Network',
      description: 'Connect with alumni from your university in various industries.'
    }
  ];

  const verificationSteps = [
    {
      step: '01',
      title: 'Submit University Documents',
      description: 'Provide your student ID, graduation year, or university credentials',
      icon: faFileUpload
    },
    {
      step: '02',
      title: 'University Verification',
      description: 'Your university coordinator verifies your student/graduate status',
      icon: faUserCheck
    },
    {
      step: '03',
      title: 'Create Professional Profile',
      description: 'Build your profile with skills, portfolio, and career preferences',
      icon: faIdCard
    },
    {
      step: '04',
      title: 'Start Applying',
      description: 'Browse and apply to verified companies and industries',
      icon: faBriefcase
    }
  ];

  const systemStats = [
    { number: '30K+', label: 'Verified Graduates', icon: faUserGraduate },
    { number: '500+', label: 'Partner Companies', icon: faBuilding },
    { number: '85%', label: 'Hiring Success Rate', icon: faChartLine }
  ];

  const applicationStatusExample = [
    {
      company: 'Tech Innovations Inc.',
      position: 'Junior Developer',
      status: 'Under Review',
      date: '2 days ago',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    {
      company: 'Finance Solutions Co.',
      position: 'Financial Analyst',
      status: 'Interview Scheduled',
      date: '1 week ago',
      badge: 'bg-blue-100 text-blue-800'
    },
    {
      company: 'Marketing Masters',
      position: 'Digital Marketer',
      status: 'Offer Received',
      date: '2 weeks ago',
      badge: 'bg-green-100 text-green-800'
    },
    {
      company: 'Engineering Corp',
      position: 'Civil Engineer',
      status: 'Hired',
      date: '1 month ago',
      badge: 'bg-green-600 text-white'
    }
  ];

  const successStories = [
    {
      name: 'Juan Dela Cruz',
      role: 'Software Engineer',
      company: 'Tech Solutions Inc.',
      story:
        'Got hired as a Software Engineer 2 weeks after verification. The platform made sure I only applied to real companies.',
      university: 'University of the Philippines'
    },
    {
      name: 'Maria Santos',
      role: 'Marketing Manager',
      company: 'Digital Marketing Pro',
      story:
        "The university verification gave me confidence. Companies know I'm a real graduate from a real university.",
      university: 'Ateneo de Manila University'
    },
    {
      name: 'Roberto Lim',
      role: 'Data Analyst',
      company: 'Data Insights Co.',
      story:
        'Applied to 5 companies, got 3 interviews, and accepted an offer in 3 weeks. The tracking feature was super helpful.',
      university: 'Mapua University'
    }
  ];

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(MAX_LATEST_JOBS)].map((_, index) => (
        <div key={index} className="rounded-xl p-6 border border-gray-200 bg-white animate-pulse">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gray-100" />
            <div className="flex-1">
              <div className="h-4 w-1/3 rounded bg-gray-100 mb-2" />
              <div className="h-3 w-1/4 rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-6 w-3/4 rounded bg-gray-100 mb-4" />
          <div className="h-4 w-1/2 rounded bg-gray-100 mb-2" />
          <div className="h-3 w-1/3 rounded bg-gray-100 mb-4" />
          <div className="h-20 rounded bg-gray-100 mb-4" />
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <div className="h-10 w-28 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white -mt-4">
      <JobSeekerNavbar />

      {/* ✅ AUTH MODAL (modern gating popup) */}
      {authModal.open && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAuthModal((p) => ({ ...p, open: false }))}
            role="presentation"
          />

          {/* modal */}
          <div className="relative w-[92%] max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <span className="text-green-700 text-2xl font-bold" aria-hidden="true">!</span>
              </div>

              <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                {authModal.title}
              </h3>

              <p className="mt-2 text-sm sm:text-base text-gray-600 text-center">
                {authModal.message}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={confirmAuthModal}
                  disabled={isRedirecting}
                  className={[
                    "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold",
                    "bg-green-600 text-white hover:bg-green-700 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200",
                    isRedirecting ? "opacity-70 cursor-not-allowed" : ""
                  ].join(" ")}
                >
                  {isRedirecting && (
                    <span
                      className="inline-block h-4 w-4 rounded-full border-2 border-white/90 border-t-transparent animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {isRedirecting ? "Redirecting…" : "Go to Register"}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthModal((p) => ({ ...p, open: false }))}
                  disabled={isRedirecting}
                  className={[
                    "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold",
                    "bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200",
                    isRedirecting ? "opacity-70 cursor-not-allowed" : ""
                  ].join(" ")}
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 text-center text-xs text-gray-500">
                Tip: Create an account to view job details and apply safely.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className="fixed top-4 right-4 z-[9999]" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            className={[
              'rounded-lg px-4 py-3 shadow-lg border text-sm max-w-sm flex items-start gap-3',
              toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : toast.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-green-50 border-green-200 text-green-800'
            ].join(' ')}
            role="status"
          >
            {/* ✅ Spinner only when redirecting */}
            {isRedirecting && toast.type === 'info' && (
              <span
                className="mt-0.5 inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                aria-hidden="true"
              />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>

      {/* HERO */}
      <section className="px-4 py-16 md:py-28 bg-gradient-to-b from-white to-green-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-8">
            <div className="text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-8">
                <FontAwesomeIcon icon={faSchool} className="text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">FROM CAMPUS TO INDUSTRY</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Launch Your Career from <span className="text-green-600">Campus</span> to{' '}
                <span className="text-green-600">Industry</span>
              </h1>

              <p className="text-lg text-gray-700 mb-10 leading-relaxed">
                Verified graduates meet verified companies in one secure platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  to="/student/verification"
                  onClick={(e) =>
                    handleAnyButtonClick(e, '/register', {
                      title: 'Create an Account',
                      message: 'Please register first to start your verification journey.'
                    })
                  }
                  className="group inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-all duration-200 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
                >
                  <FontAwesomeIcon icon={faRocket} className="mr-2 text-lg" />
                  Start Your Journey
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="ml-2 text-sm transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  to="/jobs"
                  onClick={(e) =>
                    handleAnyButtonClick(e, '/register', {
                      title: 'Create an Account',
                      message: 'Create an account to browse industries and apply for jobs.'
                    })
                  }
                  className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold border border-green-600 hover:bg-green-50 text-green-600 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
                >
                  <FontAwesomeIcon icon={faSearch} className="mr-2" />
                  Explore Industries
                </Link>
              </div>

              <div className="flex items-center gap-8">
                {systemStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Verification Process</h3>

              <div className="space-y-6">
                {verificationSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{step.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-green-600" />
                  <div>
                    <div className="font-semibold text-green-800">Safe & Secure Platform</div>
                    <div className="text-sm text-green-700">Only verified students and legitimate companies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 py-12 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Benefits for Graduates</h2>
            <p className="text-gray-600">Everything you need for your career transition</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-5 rounded-lg border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <FontAwesomeIcon icon={feature.icon} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ LATEST JOB POSTS (ADD id FOR SCROLL TARGET) */}
      <section id="latest-jobs" className="px-4 py-12 bg-gray-50" style={{ scrollMarginTop: '90px' }}>
        <div className="container mx-auto max-w-6xl">
          {/* HEADER (buttons removed) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Latest Job Posts</h2>
              <p className="text-sm mt-1 text-gray-600">
                Browse verified jobs. Create an account to view details and apply.
              </p>
            </div>
          </div>

          {jobsLoading ? (
            renderSkeleton()
          ) : latestJobs.length === 0 ? (
            <div className="rounded-xl p-12 text-center shadow-sm bg-white border border-gray-200">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <FontAwesomeIcon icon={faSearch} className="text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">No jobs found</h3>
              <p className="text-sm text-gray-600">Please check back later.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {latestJobs.map((job) => {
                  const jobId = job._id || job.id;
                  const isNew = isJobNew(job);
                  const skills = getSkillsArray(job);
                  const companyName = job.companyName || 'Company';
                  const logoBroken = brokenLogos.has(jobId);

                  return (
                    <div
                      key={jobId}
                      className={[
                        "rounded-xl p-6 transition-all duration-200 bg-white border border-gray-200 hover:shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200",
                        isRedirecting ? "opacity-80 pointer-events-none" : ""
                      ].join(" ")}
                      onClick={() => handleCardClick(job)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View job: ${job.title} at ${companyName}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleCardClick(job);
                      }}
                    >
                      {/* Top */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 bg-gray-100 flex items-center justify-center">
                          {!job.companyLogo || logoBroken ? (
                            <span className="font-bold text-lg text-green-700">
                              {companyName.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <img
                              src={job.companyLogo}
                              alt={`${companyName} logo`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={() => {
                                setBrokenLogos((prev) => {
                                  const next = new Set(prev);
                                  next.add(jobId);
                                  return next;
                                });
                              }}
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="font-semibold text-sm text-gray-900">{companyName}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <span className="truncate">{job.location || 'Location not specified'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Title + NEW */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold break-words pr-4 flex-1 text-gray-900">
                            {job.title}
                          </h3>
                          {isNew && (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full whitespace-nowrap border border-green-200 bg-green-50 text-green-700">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Salary */}
                        <div className="text-left mb-2">
                          <div className="text-lg font-semibold text-green-700">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </div>
                          <div className="text-xs mt-0.5 font-medium text-gray-500">
                            {getSalaryPeriod(job.salaryType)}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-gray-700">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{job.jobType || 'Full-time'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{formatDeadline(job.applicationDeadline)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm leading-relaxed line-clamp-2 text-gray-600">
                          {job.description || 'No description available'}
                        </p>
                      </div>

                      {/* Skills */}
                      <div className="mb-5">
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(0, 4).map((skill, idx) => (
                            <span
                              key={`${jobId}-skill-${idx}`}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 bg-green-50 text-green-700"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 4 && (
                            <span className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-gray-100 text-gray-700">
                              +{skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewJobDetails(job);
                            }}
                            disabled={isRedirecting}
                            className={[
                              "px-4 py-2.5 text-sm font-medium rounded-lg bg-white text-gray-800 border border-gray-200 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200",
                              isRedirecting ? "opacity-60 cursor-not-allowed" : ""
                            ].join(" ")}
                            aria-label={`View details for ${job.title}`}
                          >
                            View Details
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyClick(job);
                            }}
                            disabled={isRedirecting}
                            className={[
                              "px-4 py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white border border-green-600 hover:bg-green-700 hover:border-green-700 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200",
                              isRedirecting ? "opacity-60 cursor-not-allowed" : ""
                            ].join(" ")}
                            aria-label={`Apply for ${job.title}`}
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ✅ SEE MORE -> REGISTER (as requested) */}
              {jobs.length > MAX_LATEST_JOBS && (
                <div className="mt-6 text-center">
                  <Link
                    to="/register"
                    onClick={(e) =>
                      handleAnyButtonClick(e, '/register', {
                        title: 'Create an Account',
                        message: 'Create an account to view more jobs and apply safely.'
                      })
                    }
                    className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200 rounded"
                  >
                    See more jobs
                    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </Link>
                  <div className="mt-1 text-xs text-gray-500">
                    Create an account to view more jobs
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* APPLICATION TRACKING */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Track Your Applications</h2>
              <p className="text-gray-600 mb-6">See where your applications stand from submission to final decision.</p>

              <ul className="space-y-3 mb-6">
                {[
                  'Real-time status updates',
                  'Interview scheduling',
                  'Company response tracking',
                  'Application history',
                  'Progress dashboard'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-sm" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Application Status</h3>
              <div className="space-y-3">
                {applicationStatusExample.map((app, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="font-medium text-gray-900">{app.company}</div>
                        <div className="text-sm text-gray-600">{app.position}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${app.badge}`}>{app.status}</div>
                    </div>
                    <div className="text-xs text-gray-500">{app.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section
        id="success-stories"
        className="px-4 py-12 bg-green-50"
        style={{ scrollMarginTop: '90px' }} // ✅ para di matakpan ng fixed navbar
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-lg text-gray-600">Hear from fellow university graduates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <span className="font-bold text-green-600">
                      {story.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{story.name}</h4>
                    <p className="text-sm text-gray-600">{story.university}</p>
                  </div>
                </div>

                <p className="text-gray-600 italic mb-4">"{story.story}"</p>

                <div className="flex justify-between items-center">
                  <div className="font-medium text-gray-900">{story.role}</div>
                  <div className="text-sm text-green-600">{story.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 py-12 bg-green-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start Your Career Journey</h2>
          <p className="text-white/90 mb-6">Join thousands of verified graduates finding career opportunities</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/student/verification"
              onClick={(e) =>
                handleAnyButtonClick(e, '/register', {
                  title: 'Create an Account',
                  message: 'Please register first to start verification.'
                })
              }
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-white text-green-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <FontAwesomeIcon icon={faUserCheck} className="mr-2" />
              Start Verification
            </Link>

            <Link
              to="/contact"
              onClick={(e) =>
                handleAnyButtonClick(e, '/register', {
                  title: 'Create an Account',
                  message: 'Please register first to continue.'
                })
              }
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold border border-white text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <FontAwesomeIcon icon={faComments} className="mr-2" />
              Contact Support
            </Link>
          </div>

          <div className="mt-6 text-white/80 text-sm">
            <p>• University-verified • Legitimate companies • Application tracking • Alumni network</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-600">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">AGAPAY</div>
                  <div className="text-base text-green-400">University Career Platform</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connecting verified university students and alumni with legitimate career opportunities.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">For Students</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/student/verification"
                    onClick={(e) => handleAnyButtonClick(e, '/register')}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    University Verification
                  </Link>
                </li>
                <li>
                  <Link
                    to="/jobs"
                    onClick={(e) => handleAnyButtonClick(e, '/register')}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    Explore Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/applications"
                    onClick={(e) => handleAnyButtonClick(e, '/register')}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    Track Applications
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    onClick={(e) => handleAnyButtonClick(e, '/register')}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    Your Profile
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">University Info</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/verification-process"
                    onClick={(e) => handleAnyButtonClick(e, '/register')}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    Verification Process
                  </Link>
                </li>
                <li>
                  <Link
                    to="/alumni"
                    onClick={(e) => handleAnyButtonClick(e, '/register')}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    Alumni Network
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    onClick={(e) => handleAnyButtonClick(e, '/register')}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    Student FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/resources"
                    onClick={(e) => handleAnyButtonClick(e, '/register')}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    Career Resources
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">For Companies</h4>
              <Link
                to="/employer"
                onClick={(e) =>
                  handleAnyButtonClick(e, '/register', {
                    title: 'Create an Account',
                    message: 'Please register first to continue.'
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-green-600 hover:bg-green-700 text-white mb-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
              >
                <FontAwesomeIcon icon={faBuilding} />
                Hire Verified Graduates
              </Link>
              <div className="text-gray-400 text-xs">
                <p>Companies must be verified to post jobs.</p>
                <p>Email: partners@agapay.com</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2024 AGAPAY. Exclusive to university students and alumni.</p>
            <div className="flex justify-center gap-6 mt-4">
              <Link
                to="/privacy"
                onClick={(e) => handleAnyButtonClick(e, '/register')}
                className="text-gray-400 hover:text-green-400 text-xs transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                onClick={(e) => handleAnyButtonClick(e, '/register')}
                className="text-gray-400 hover:text-green-400 text-xs transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/contact"
                onClick={(e) => handleAnyButtonClick(e, '/register')}
                className="text-gray-400 hover:text-green-400 text-xs transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
