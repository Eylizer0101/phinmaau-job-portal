import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EmployerLayout from '../../../layouts/EmployerLayout';
import api from "../../../services/api";
const ManageJobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedJob, setSelectedJob] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Action-level loading:
   * - We still allow only ONE action at a time (simple + safe),
   *   BUT we only disable the row being acted on (not the whole table).
   */
  const [action, setAction] = useState({ type: '', jobId: '' });

  // Modal accessibility
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);

  // UI controls (tabs + search + filters + sort)
  const [tab, setTab] = useState('all'); // all | open | closed | draft | expired
  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest | deadline | applicants

  // ✅ NEW: broken logo fallback tracking (per job)
  const [badLogos, setBadLogos] = useState({});

  // ✅ Category/Industry dropdown REMOVED (employer already has industry set on register)
  const jobTypes = useMemo(() => ['Full-time', 'Part-time', 'Contract'], []);

  // ✅ NEW: Employer verification gate (Draft allowed, Publish blocked)
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const employerVerificationStatus =
    storedUser?.employerProfile?.verificationDocs?.overallStatus || 'unverified';

  const isEmployerVerified =
    employerVerificationStatus === 'verified' || storedUser?.isVerified === true;

  const verificationBannerMessage = useMemo(() => {
    if (isEmployerVerified) return '';
    if (employerVerificationStatus === 'pending') {
      return 'Verification is pending. You can save and edit drafts, but you cannot publish until approved by admin.';
    }
    if (employerVerificationStatus === 'rejected') {
      return 'Verification was rejected. You can save and edit drafts, but you cannot publish until you resubmit and get approved.';
    }
    if (employerVerificationStatus === 'suspended') {
      return 'Your company is suspended. You can save drafts, but publishing is disabled.';
    }
    return 'Your company is not verified yet. You can save and edit drafts, but you cannot publish until verified by admin.';
  }, [isEmployerVerified, employerVerificationStatus]);

  const closeModal = () => {
    setShowDeleteModal(false);
    setSelectedJob(null);
  };

  // ✅ NEW: lock body scroll when modal is open
  useEffect(() => {
    if (!showDeleteModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showDeleteModal]);

  // Fetch employer jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);

      const response = await api.get('/jobs/employer/my-jobs');

      if (response.data.success) {
        setJobs(response.data.jobs);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/employer/login');
      }
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 3500);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 2500);
    return () => clearTimeout(t);
  }, [success]);

  // Helpers
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return false;
    return d < new Date();
  };

  const safeTitle = (job) => (job.title && job.title.trim() ? job.title : '(Untitled Draft)');
  const safeCompany = (job) => (job.companyName && job.companyName.trim() ? job.companyName : '—');
  const safeCategory = (job) => (job.category && job.category.trim() ? job.category : '—');
  const safeJobType = (job) => (job.jobType && String(job.jobType).trim() ? job.jobType : 'Not specified');
  const safeWorkMode = (job) => (job.workMode && String(job.workMode).trim() ? job.workMode : 'Not specified');

  /**
   * ✅ UPDATED: status logic now includes Expired as a visible truth
   * (avoids "Active badge but Expired meta" confusion).
   */
  const getDerivedStatus = (job) => {
    if (job.isPublished === false) return 'draft';
    if (job.isActive && isExpired(job.applicationDeadline)) return 'expired';
    return job.isActive ? 'open' : 'closed';
  };

  const getStatusColor = (job) => {
    const s = getDerivedStatus(job);
    if (s === 'draft') return 'bg-gray-100 text-gray-800 border border-gray-200';
    if (s === 'open') return 'bg-green-50 text-green-800 border border-green-200';
    if (s === 'expired') return 'bg-amber-50 text-amber-800 border border-amber-200';
    return 'bg-red-50 text-red-800 border border-red-200';
  };

  const getStatusText = (job) => {
    const s = getDerivedStatus(job);
    if (s === 'draft') return 'Draft';
    if (s === 'open') return 'Open';
    if (s === 'expired') return 'Expired';
    return 'Closed';
  };

  const getMetaText = (job) => {
    if (job.isPublished === false) return 'Draft';
    if (!job.applicationDeadline) return '—';
    return isExpired(job.applicationDeadline) ? 'Expired' : 'On track';
  };

  // ✅ safer dates for sorting
  const safeDate = (d) => {
    const x = new Date(d || 0);
    return Number.isNaN(x.getTime()) ? new Date(0) : x;
  };

  // ✅ Publish draft (gated by employer verification)
  const handlePublish = async (jobId) => {
    try {
      // ✅ NEW: UI guard (backend still enforces)
      if (!isEmployerVerified) {
        setError(verificationBannerMessage || 'Your company is not verified yet. Publishing is disabled.');
        return;
      }

      const jobToUpdate = jobs.find(job => job._id === jobId);
      if (!jobToUpdate) return;

      if (action.jobId) return; // keep single in-flight action (safe)
      setAction({ type: 'publish', jobId });

      const updateData = {
        ...jobToUpdate,
        isPublished: true,
        isActive: true, // publish as Open by default
      };

      await api.put(`/jobs/${jobId}`, updateData);

      setJobs(prev =>
        prev.map(job => (job._id === jobId ? { ...job, isPublished: true, isActive: true } : job))
      );

      setSuccess('Job published successfully');
    } catch (err) {
      console.error('Error publishing job:', err);

      if (err.response?.status === 403 && err.response?.data?.code === 'EMPLOYER_NOT_VERIFIED') {
        setError(err.response?.data?.message || verificationBannerMessage || 'Verification required to publish.');
      } else {
        setError('Failed to publish job. Please complete required fields and try again.');
      }
    } finally {
      setAction({ type: '', jobId: '' });
    }
  };

  // Status change (open/close). Drafts not allowed; Expired requires update deadline first.
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const jobToUpdate = jobs.find(job => job._id === jobId);
      if (!jobToUpdate) return;

      if (jobToUpdate.isPublished === false) {
        setError('Draft jobs cannot be opened/closed. Publish it first.');
        return;
      }

      if (getDerivedStatus(jobToUpdate) === 'expired' && newStatus === 'open') {
        setError('This job is expired. Update the deadline before reopening.');
        return;
      }

      if (action.jobId) return; // one action at a time
      setAction({ type: 'status', jobId });

      const updateData = {
        ...jobToUpdate,
        isActive: newStatus === 'open',
      };

      await api.put(`/jobs/${jobId}`, updateData);

      setJobs(prev =>
        prev.map(job => (job._id === jobId ? { ...job, isActive: newStatus === 'open' } : job))
      );

      setSuccess(`Job updated: ${newStatus === 'open' ? 'Open' : 'Closed'}`);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update job status');
    } finally {
      setAction({ type: '', jobId: '' });
    }
  };

  // Delete job
  const handleDelete = async (jobId) => {
    try {
      if (action.jobId) return; // one action at a time
      setAction({ type: 'delete', jobId });

      await api.delete(`/jobs/${jobId}`);

      setJobs(prev => prev.filter(job => job._id !== jobId));
      closeModal();
      setSuccess('Job deleted successfully');
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job');
    } finally {
      setAction({ type: '', jobId: '' });
    }
  };

  const headerRight = useMemo(() => {
    return (
      <button
        onClick={() => navigate('/employer/post-job')}
        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Post New Job
      </button>
    );
  }, [navigate]);

  // ✅ UPDATED: counts now include expired + open
  const counts = useMemo(() => {
    const all = jobs.length;
    const draft = jobs.filter(j => j.isPublished === false).length;
    const open = jobs.filter(j => j.isPublished !== false && j.isActive && !isExpired(j.applicationDeadline)).length;
    const expired = jobs.filter(j => j.isPublished !== false && j.isActive && isExpired(j.applicationDeadline)).length;
    const closed = jobs.filter(j => j.isPublished !== false && !j.isActive).length;
    return { all, draft, open, expired, closed };
  }, [jobs]);

  // ✅ UPDATED: filtered + sorted list (deadline sort pushes no-deadline LAST)
  const filteredJobs = useMemo(() => {
    const norm = (s) => (s || '').toLowerCase().trim();
    const query = norm(q);

    let list = [...jobs];

    // Tabs (derived logic)
    if (tab === 'draft') list = list.filter(j => getDerivedStatus(j) === 'draft');
    if (tab === 'open') list = list.filter(j => getDerivedStatus(j) === 'open');
    if (tab === 'closed') list = list.filter(j => getDerivedStatus(j) === 'closed');
    if (tab === 'expired') list = list.filter(j => getDerivedStatus(j) === 'expired');

    // Search
    if (query) {
      list = list.filter(j => {
        const hay = [
          j.title,
          j.companyName,
          j.location,
          j.category,
          j.jobType,
          j.workMode,
        ].map(norm).join(' ');
        return hay.includes(query);
      });
    }

    // Filters (category removed)
    if (filterType !== 'all') list = list.filter(j => j.jobType === filterType);

    // Sort
    if (sortBy === 'newest') {
      list.sort((a, b) => safeDate(b.createdAt) - safeDate(a.createdAt));
    } else if (sortBy === 'deadline') {
      const deadlineValue = (j) => {
        if (!j.applicationDeadline) return new Date(8640000000000000); // max date (push to end)
        const d = new Date(j.applicationDeadline);
        return Number.isNaN(d.getTime()) ? new Date(8640000000000000) : d;
      };
      list.sort((a, b) => deadlineValue(a) - deadlineValue(b));
    } else if (sortBy === 'applicants') {
      list.sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0));
    }

    return list;
  }, [jobs, tab, q, filterType, sortBy]);

  const clearControls = () => {
    setTab('all');
    setQ('');
    setFilterType('all');
    setSortBy('newest');
  };

  // Modal a11y: focus + ESC + focus trap
  useEffect(() => {
    if (!showDeleteModal) return;

    const t = setTimeout(() => cancelBtnRef.current?.focus(), 0);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showDeleteModal]);

  return (
    <EmployerLayout>
     <div className="mx-auto max-w-7xl px-1 py-8">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
            <p className="mt-1 text-sm text-gray-600">View, edit, and manage your job postings</p>

            {/* ✅ NEW: Verification banner */}
            {!isEmployerVerified && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Verification required to publish</p>
                <p className="mt-1 text-sm text-amber-800">
                  Status: <span className="font-bold">{employerVerificationStatus}</span>. {verificationBannerMessage}
                </p>
              </div>
            )}
          </div>
          <div>{headerRight}</div>
        </div>

        {/* Tabs + Filters */}
        <div className="mb-5 space-y-3">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'open', label: 'Open', count: counts.open },
              { key: 'expired', label: 'Expired', count: counts.expired },
              { key: 'closed', label: 'Closed', count: counts.closed },
              { key: 'draft', label: 'Draft', count: counts.draft },
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition
                  ${tab === t.key ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold
                  ${tab === t.key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, company, location…"
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              />
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              >
                <option value="all">All job types</option>
                {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
              >
                <option value="newest">Sort: Newest</option>
                <option value="deadline">Sort: Deadline soon</option>
                <option value="applicants">Sort: Most applicants</option>
              </select>

              <button
                type="button"
                onClick={clearControls}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4" role="alert" aria-live="assertive">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>

              <button
                onClick={() => setError('')}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4" role="status" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-green-900">{success}</p>
              </div>

              <button
                onClick={() => setSuccess('')}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-green-800 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                aria-label="Dismiss success"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Table Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6">
            {loading ? (
              <div className="py-14 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-600" />
                <p className="mt-4 text-sm text-gray-600">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-14 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No matching jobs</h3>
                <p className="mt-2 text-sm text-gray-600">Try adjusting your search or filters.</p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={clearControls}
                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Clear filters
                  </button>
                  <button
                    onClick={() => navigate('/employer/post-job')}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Post New Job
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700">
                        Job Details
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700">
                        Type / Location
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700">
                        Applications
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700">
                        Deadline
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredJobs.map((job) => {
                      const title = safeTitle(job);
                      const busyThisRow = action.jobId === job._id;
                      const logoUrl = job.companyLogo && String(job.companyLogo).trim() ? job.companyLogo : '';
                      const derivedStatus = getDerivedStatus(job);

                      return (
                        <tr key={job._id} className="hover:bg-gray-50">
                          {/* Job Details */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {/* ✅ LOGO (fixed fallback if broken URL) */}
                              <div className="h-12 w-12 rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                                {logoUrl && !badLogos[job._id] ? (
                                  <img
                                    src={logoUrl}
                                    alt={`${safeCompany(job)} logo`}
                                    className="h-full w-full object-contain"
                                    onError={() => setBadLogos(prev => ({ ...prev, [job._id]: true }))}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-green-600">
                                    <span className="text-lg font-bold text-white">
                                      {(safeCompany(job) || title || 'J').charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <Link
                                  to={`/employer/edit-job/${job._id}`}
                                  className="block truncate text-base font-semibold text-gray-900 hover:text-green-700"
                                  title={title}
                                >
                                  {title}
                                </Link>
                                <div className="mt-1 text-sm text-gray-600">{safeCompany(job)}</div>
                                <div className="mt-1 text-xs text-gray-500">{safeCategory(job)}</div>
                              </div>
                            </div>
                          </td>

                          {/* Type/Location */}
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-900">
                                <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {safeJobType(job)} • {safeWorkMode(job)}
                              </div>

                              <div className="flex items-center text-sm text-gray-900">
                                <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location || '—'}
                              </div>
                            </div>
                          </td>

                          {/* Applications */}
                          <td className="px-6 py-4">
                            <div className="text-center">
                              <span className="inline-flex items-center justify-center rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-800 border border-green-200">
                                {job.applicationCount || 0}
                              </span>
                              <div className="mt-1 text-xs text-gray-500">applicants</div>
                            </div>
                          </td>

                          {/* Deadline */}
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(job.applicationDeadline)}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">{getMetaText(job)}</div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(job)}`}>
                              {getStatusText(job)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/employer/edit-job/${job._id}`}
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                                aria-label={`Edit ${title}`}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </Link>

                              {/* ✅ Draft: show Publish (gated) */}
                              {derivedStatus === 'draft' && (
                                <button
                                  onClick={() => handlePublish(job._id)}
                                  disabled={busyThisRow || !isEmployerVerified}
                                  title={!isEmployerVerified ? 'Verify your company to publish jobs.' : 'Publish this job'}
                                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label={`Publish ${title}`}
                                >
                                  {busyThisRow && action.type === 'publish' ? (
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-current" />
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  Publish
                                </button>
                              )}

                              {/* ✅ Open/Close only when published and not expired reopening */}
                              {derivedStatus !== 'draft' && (
                                <button
                                  onClick={() => handleStatusChange(job._id, job.isActive ? 'closed' : 'open')}
                                  disabled={busyThisRow || (derivedStatus === 'expired' && !job.isActive)}
                                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 ${
                                    job.isActive
                                      ? 'text-red-700 hover:bg-red-50 focus-visible:ring-red-500'
                                      : 'text-green-700 hover:bg-green-50 focus-visible:ring-green-600'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  aria-label={`${job.isActive ? 'Close' : 'Reopen'} ${title}`}
                                >
                                  {busyThisRow && action.type === 'status' ? (
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-current" />
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {job.isActive ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      )}
                                    </svg>
                                  )}
                                  {job.isActive ? 'Close posting' : 'Reopen'}
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedJob(job);
                                  setShowDeleteModal(true);
                                }}
                                disabled={busyThisRow}
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Delete ${title}`}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedJob && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              aria-describedby="delete-desc"
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            >
            

              <div className="p-6">
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <h3 id="delete-title" className="text-lg font-bold text-gray-900">
                      Delete Job Post
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>

                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="font-semibold text-red-900">
                    "{selectedJob.title || 'Untitled Draft'}"
                  </p>
                  <p id="delete-desc" className="mt-1 text-sm text-red-800">
                    All applications and related data will be permanently deleted.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    ref={cancelBtnRef}
                    onClick={closeModal}
                    disabled={action.type === 'delete' && action.jobId === selectedJob._id}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleDelete(selectedJob._id)}
                    disabled={action.type === 'delete' && action.jobId === selectedJob._id}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                  >
                    {action.type === 'delete' && action.jobId === selectedJob._id ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white" />
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Delete Job
                  </button>
                </div>

               
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
};

export default ManageJobs;