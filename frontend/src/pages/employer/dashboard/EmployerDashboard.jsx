// src/pages/employer/dashboard/EmployerDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../../../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationCircle,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faPlus,
  faRotateRight,
  faBriefcase,
  faComments,
  faPaperclip,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

import EmployerLayout from '../../../layouts/EmployerLayout';

const EmployerDashboard = () => {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    jobs: { total: 0, active: 0, closed: 0, expiringSoon: 0 },
    applications: { total: 0, pending: 0, accepted: 0, rejected: 0, new7d: 0, needsReview: 0 },
    messages: { total: 0, unread: 0, interviews7d: 0 },
    recentJobs: [],
    recentApplications: [],
    recentMessages: [],
  });

  const [userData, setUserData] = useState({
    companyName: '',
    email: '',
    profileComplete: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const profileComplete = user.employerProfile && user.employerProfile.companyName;

    setUserData({
      companyName: user.employerProfile?.companyName || user.fullName || 'Company',
      email: user.email || '',
      profileComplete: Boolean(profileComplete),
    });
  };

  const fetchDashboardData = async (opts = { silent: false }) => {
    const { silent } = opts;

    try {
      setError('');
      if (silent) setRefreshing(true);
      else setLoading(true);

      // ✅ CHANGED: Use api instance instead of axios with localhost

      // ✅ Jobs + Apps
      const jobsResponse = await api.get('/jobs/employer/my-jobs');

      const appsResponse = await api.get('/applications/employer/all');

      // ✅ Messages endpoints
      const conversationsResponse = await api
        .get('/messages/conversations')
        .catch(() => ({ data: { success: false, data: [] } }));

      const unreadCountResponse = await api
        .get('/messages/unread-count')
        .catch(() => ({ data: { success: false, data: { unreadCount: 0 } } }));

      // ✅ Messages numbers
      const conversations = conversationsResponse?.data?.data || [];
      const unreadFromUnreadCount = unreadCountResponse?.data?.data?.unreadCount ?? 0;
      const unreadFromConversations = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      const finalUnread = Math.max(unreadFromUnreadCount, unreadFromConversations);

      // ✅ derived date helpers
      const now = new Date();
      const msInDay = 24 * 60 * 60 * 1000;
      const withinLastDays = (dateString, days) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        return now - d <= days * msInDay;
      };
      const withinNextDays = (dateString, days) => {
        if (!dateString) return false;
        const d = new Date(dateString);
        const diff = d - now;
        return diff >= 0 && diff <= days * msInDay;
      };

      if (jobsResponse.data.success) {
        const allJobs = jobsResponse.data.jobs || [];
        const activeJobs = allJobs.filter((job) => job.isActive && job.isPublished);

        // ✅ Expiring soon (deadline within next 3 days) - requires applicationDeadline in API response
        const expiringSoon = activeJobs.filter((job) => withinNextDays(job.applicationDeadline, 3)).length;

        if (appsResponse.data.success) {
          const allApplications = appsResponse.data.applications || [];
          const pendingApplications = allApplications.filter((app) => app.status === 'pending');
          const acceptedApplications = allApplications.filter((app) => app.status === 'accepted');
          const rejectedApplications = allApplications.filter((app) => app.status === 'rejected');

          // ✅ New applicants last 7 days
          const new7d = allApplications.filter((app) => withinLastDays(app.appliedAt, 7)).length;

          // ✅ Needs review = pending + shortlisted
          const needsReview = allApplications.filter((app) => ['pending', 'shortlisted'].includes(app.status)).length;

          // ✅ Interviews (based on lastMessage in conversations) next 7 days
          const interviews7d = conversations.filter((c) => {
            const lm = c?.lastMessage;
            if (!lm) return false;
            if (lm.messageType !== 'interview') return false;

            // interviewDetails.date is Date in schema; content may be string—handle both
            const interviewDate = lm?.interviewDetails?.date;
            if (!interviewDate) return false;
            return withinNextDays(interviewDate, 7);
          }).length;

          const sortedJobs = [...allJobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const sortedApps = [...allApplications].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

          const recentJobs = sortedJobs.slice(0, 3);
          const recentApplications = sortedApps.slice(0, 5);

          // ✅ Recent messages (from conversations)
          const recentMessages = conversations.slice(0, 5);

          setDashboardData({
            jobs: {
              total: allJobs.length,
              active: activeJobs.length,
              closed: allJobs.length - activeJobs.length,
              expiringSoon,
            },
            applications: {
              total: allApplications.length,
              pending: pendingApplications.length,
              accepted: acceptedApplications.length,
              rejected: rejectedApplications.length,
              new7d,
              needsReview,
            },
            messages: {
              total: conversations.length,
              unread: finalUnread,
              interviews7d,
            },
            recentJobs,
            recentApplications,
            recentMessages,
          });

          setLastUpdated(new Date());
        } else {
          // fallback if apps fail
          setDashboardData((prev) => ({
            ...prev,
            jobs: {
              total: allJobs.length,
              active: activeJobs.length,
              closed: allJobs.length - activeJobs.length,
              expiringSoon,
            },
            messages: {
              total: conversations.length,
              unread: finalUnread,
              interviews7d: prev?.messages?.interviews7d ?? 0,
            },
            recentMessages: conversations.slice(0, 5),
          }));

          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('We couldn\'t load your dashboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const attentionItems = useMemo(() => {
    const items = [];
    if (!userData.profileComplete) {
      items.push({ key: 'profile', label: 'Complete company profile', cta: 'Complete profile' });
    }
    if (dashboardData.applications.needsReview > 0) {
      items.push({
        key: 'needsReview',
        label: `${dashboardData.applications.needsReview} application${
          dashboardData.applications.needsReview > 1 ? 's' : ''
        } need review`,
        cta: 'Review',
      });
    }
    if (dashboardData.messages.unread > 0) {
      items.push({
        key: 'unread',
        label: `${dashboardData.messages.unread} unread message${dashboardData.messages.unread > 1 ? 's' : ''}`,
        cta: 'Open inbox',
      });
    }
    if (dashboardData.jobs.expiringSoon > 0) {
      items.push({
        key: 'expiringSoon',
        label: `${dashboardData.jobs.expiringSoon} job post${dashboardData.jobs.expiringSoon > 1 ? 's' : ''} expiring soon`,
        cta: 'View',
      });
    }
    return items;
  }, [
    dashboardData.applications.needsReview,
    dashboardData.messages.unread,
    dashboardData.jobs.expiringSoon,
    userData.profileComplete
  ]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return faClock;
      case 'accepted':
        return faCheckCircle;
      case 'rejected':
        return faTimesCircle;
      default:
        return faClock;
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', cls: 'text-yellow-800 bg-yellow-50 border-yellow-200' };
      case 'shortlisted':
        return { text: 'Shortlisted', cls: 'text-blue-800 bg-blue-50 border-blue-200' };
      case 'accepted':
        return { text: 'Accepted', cls: 'text-green-800 bg-green-50 border-green-200' };
      case 'rejected':
        return { text: 'Rejected', cls: 'text-red-800 bg-red-50 border-red-200' };
      default:
        return { text: 'Pending', cls: 'text-gray-800 bg-gray-50 border-gray-200' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getApplicantsCount = (job) => {
    if (typeof job?.applicationCount === 'number') return job.applicationCount;
    if (Array.isArray(job?.applications)) return job.applications.length;
    if (typeof job?.applications === 'number') return job.applications;
    return 0;
  };

  const handlePostJob = () => navigate('/employer/post-job');
  const handleManageJobs = () => navigate('/employer/manage-jobs');
  const handleViewApplicants = () => navigate('/employer/applicants');
  const handleViewMessages = () => navigate('/employer/messages');

  const handleAttentionCTA = (key) => {
    if (key === 'profile') return navigate('/employer/company-profile');
    if (key === 'needsReview') return navigate('/employer/applicants?status=pending,shortlisted');
    if (key === 'unread') return navigate('/employer/messages');
    if (key === 'expiringSoon') return navigate('/employer/manage-jobs?filter=expiring');
  };

  const getMessagePreview = (conv) => {
    const lm = conv?.lastMessage;
    if (!lm) return 'No messages yet';

    if (lm.messageType === 'interview') return 'Interview scheduled';
    if (lm.messageType === 'file') return 'Sent a file';
    return lm.content || 'Message';
  };

  const getMessageIconName = (conv) => {
    const lm = conv?.lastMessage;
    if (!lm) return 'chat';
    if (lm.messageType === 'interview') return 'calendar';
    if (lm.messageType === 'file') return 'clip';
    return 'chat';
  };

  // ✅ Crisp outline icons (single style for consistency across the page)
  const OutlineIcon = ({ name, className = 'w-5 h-5' }) => {
    switch (name) {
      case 'briefcase':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case 'users':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H2v-2a4 4 0 014-4h3m6-4a4 4 0 10-8 0 4 4 0 008 0zm6 2a3 3 0 10-6 0 3 3 0 006 0z"
            />
          </svg>
        );
      case 'mail':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 12h18a2 2 0 002-2V6a2 2 0 00-2-2H3a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'calendar':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'clip':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.19 9.19a2 2 0 11-2.83-2.83l8.49-8.49"
            />
          </svg>
        );
      case 'plus':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M12 5v14m7-7H5"
            />
          </svg>
        );
      case 'edit':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M16.862 3.487a2.1 2.0 0 012.97 2.97L8.5 17.79 4 19l1.21-4.5L16.862 3.487z"
            />
          </svg>
        );
      case 'arrow':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} vectorEffect="non-scaling-stroke" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        );
      case 'chat':
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M8 10h8m-8 4h5m9-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" shapeRendering="geometricPrecision">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const IconBadge = ({ name, tone = 'gray' }) => {
    const toneCls =
      tone === 'green'
        ? 'bg-green-50 text-green-700 border-green-100'
        : tone === 'blue'
        ? 'bg-blue-50 text-blue-700 border-blue-100'
        : tone === 'violet'
        ? 'bg-violet-50 text-violet-700 border-violet-100'
        : tone === 'amber'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : tone === 'red'
        ? 'bg-red-50 text-red-700 border-red-100'
        : 'bg-gray-100 text-gray-600 border-gray-200';

    return (
      <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${toneCls}`}>
        <OutlineIcon name={name} className="w-[18px] h-[18px]" />
      </div>
    );
  };

  const Panel = ({ title, subtitle, iconName, actionLabel, onAction, children }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <IconBadge name={iconName} tone="gray" />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
                {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
              </div>
            </div>
          </div>

          {actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="text-sm text-green-700 font-semibold underline-offset-4 hover:underline
                         focus:outline-none focus:ring-2 focus:ring-green-600 rounded px-1"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );

  const RowArrow = () => (
    <span className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
      View <OutlineIcon name="arrow" className="w-4 h-4" />
    </span>
  );

  const Skeleton = () => (
    <EmployerLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="h-6 w-56 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mt-3" />
          <div className="h-10 w-40 bg-gray-100 rounded animate-pulse mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-2" />
              <div className="h-3 w-40 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <div className="h-5 w-44 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-60 bg-gray-100 rounded animate-pulse mt-2" />
              </div>
              <div className="p-5 space-y-4">
                {[...Array(4)].map((__, r) => (
                  <div key={r} className="flex items-center justify-between">
                    <div className="h-4 w-52 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployerLayout>
  );

  if (loading) return <Skeleton />;

  // ✅ 5 Pills config (clickable)
  const pills = [
    {
      key: 'active',
      label: 'Active',
      value: dashboardData?.jobs?.active ?? 0,
      cls:
        'bg-green-600 text-white border-green-600 hover:bg-green-700',
      onClick: () => navigate('/employer/manage-jobs'),
      mutedWhenZero: false,
    },
    {
      key: 'new7d',
      label: 'New (7d)',
      value: dashboardData?.applications?.new7d ?? 0,
      cls:
        'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
      onClick: () => navigate('/employer/applicants?range=7d'),
      mutedWhenZero: true,
    },
    {
      key: 'interviews',
      label: 'Interviews (7d)',
      value: dashboardData?.messages?.interviews7d ?? 0,
      cls:
        'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
      onClick: () => navigate('/employer/messages'),
      mutedWhenZero: true,
    },
  ];

  const chipTone = (p) => {
    const v = Number(p.value || 0);

    // Active stays green
    if (p.key === 'active') return p.cls;

    // Needs review highlight
    if (p.highlightWhenPositive && v > 0) {
      return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
    }

    // Expiring soon warning
    if (p.warningWhenPositive && v > 0) {
      return 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100';
    }

    // Muted when zero
    if (p.mutedWhenZero && v === 0) {
      return 'bg-white text-gray-400 border-gray-200';
    }

    return p.cls;
  };

  const formatTime = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <EmployerLayout>
      <div className="space-y-6 -mt-2">
        {/* ===== Header (Hiring Overview – White Version) ===== */}
        <div className="rounded-2xl border border-gray-100 shadow-sm bg-white">
          <div className="p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* LEFT */}
              <div className="min-w-0">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="shrink-0">
                    <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-green-700">
                      <OutlineIcon name="briefcase" className="w-7 h-7" />
                    </div>
                  </div>

                  {/* Title + summary */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                        Hiring Overview
                      </h1>

                      {/* subtle status */}
                      {refreshing ? (
                        <span className="hidden md:inline-flex items-center text-xs font-semibold text-gray-500 border border-gray-200 bg-gray-50 px-2 py-1 rounded-full">
                          Updating…
                        </span>
                      ) : null}
                    </div>

                    <p className="text-sm md:text-base text-gray-600 mt-1">
                      You have{' '}
                      <span className="font-semibold text-gray-900">
                        {dashboardData?.jobs?.active ?? 0} active jobs
                      </span>
                      ,{' '}
                      <span className="font-semibold text-gray-900">
                        {dashboardData?.applications?.new7d ?? 0} new applicants
                      </span>{' '}
                      in the last 7 days, and{' '}
                      <span className="font-semibold text-gray-900">
                        {dashboardData?.applications?.needsReview ?? 0} need review
                      </span>
                      .
                    </p>

                    {/* ✅ 5 Chips (proper disabled state) */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {pills.map((p) => {
                        const v = Number(p.value || 0);
                        const disabled = p.mutedWhenZero && v === 0;

                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={p.onClick}
                            disabled={disabled}
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold transition
                              focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:opacity-60 ${chipTone(p)}`}
                            title={disabled ? 'No items' : 'View list'}
                          >
                            {p.label}: {v}
                          </button>
                        );
                      })}
                    </div>

                    {/* ✅ Attention strip (decision-first UI) */}
                    {attentionItems.length > 0 ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-amber-900">Needs attention</p>
                            <ul className="mt-2 space-y-1">
                              {attentionItems.slice(0, 3).map((it) => (
                                <li key={it.key} className="text-sm text-amber-900 flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-700" aria-hidden="true" />
                                  <span className="truncate">{it.label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="shrink-0 flex flex-col gap-2">
                            {attentionItems.slice(0, 2).map((it) => (
                              <button
                                key={it.key}
                                type="button"
                                onClick={() => handleAttentionCTA(it.key)}
                                className="inline-flex items-center justify-center px-3 py-2 rounded-lg
                                           bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold
                                           transition focus:outline-none focus:ring-2 focus:ring-amber-600"
                              >
                                {it.cta}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                        <p className="text-sm font-semibold text-green-900">All caught up</p>
                        <p className="text-sm text-green-800 mt-1">
                          No pending reviews, unread messages, or expiring jobs right now.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT ACTIONS */}
              <div className="flex flex-col items-start md:items-end gap-2 md:pt-1">
                <button
                  type="button"
                  onClick={handlePostJob}
                  className="inline-flex items-center px-4 py-2 rounded-lg
                     bg-green-600 hover:bg-green-700 text-white font-semibold
                     transition focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <OutlineIcon name="plus" className="w-5 h-5 mr-2" />
                  Post Job
                </button>

                {/* last updated */}
                {lastUpdated ? (
                  <button
                    type="button"
                    onClick={() => fetchDashboardData({ silent: true })}
                    className="text-xs text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline
                               focus:outline-none focus:ring-2 focus:ring-green-600 rounded px-1"
                    title="Refresh dashboard"
                  >
                    Updated {formatTime(lastUpdated)}
                  </button>
                ) : null}
              </div>
            </div>

            {/* Error banner */}
            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-700">
                    <OutlineIcon name="alert" className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-900">{error}</p>
                    <p className="text-sm text-red-800 mt-1">
                      Check your connection or token, then retry.
                    </p>
                    <button
                      type="button"
                      onClick={() => fetchDashboardData({ silent: true })}
                      className="mt-3 inline-flex items-center px-3 py-2 rounded-lg
                         bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                         transition focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

      {/* KPI cards (semantic clickable links for accessibility) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              key: 'activeJobs',
              label: 'Active Jobs',
              value: dashboardData.jobs.active,
              sub: `Total: ${dashboardData.jobs.total}`,
              image: '/images/case.png',
              href: '/employer/manage-jobs',
            },
            {
              key: 'applicants',
              label: 'Applicants',
              value: dashboardData.applications.total,
              sub: `${dashboardData.applications.pending} pending`,
              image: '/images/users3.png',
              href: '/employer/applicants',
            },
            {
              key: 'unread',
              label: 'Unread Messages',
              value: dashboardData.messages.unread,
              sub: `Total: ${dashboardData.messages.total}`,
              image: '/images/mail2.png',
              href: '/employer/messages',
            },
            {
              key: 'pending',
              label: 'Pending',
              value: dashboardData.applications.pending,
              sub: 'For review',
              image: '/images/pending7.png',
              href: '/employer/applicants?status=pending',
            },
          ].map((card) => (
            <Link
              key={card.key}
              to={card.href}
              className="relative rounded-2xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-green-600"
              aria-label={`${card.label}: ${card.value}. Click to view.`}
            >
              <div className="pointer-events-none absolute inset-0 z-0">
                <div
                  className="
                    absolute
                    w-[70px]
                    h-[70px]
                    rounded-full
                    blur-[35px]
                    top-[38%]
                    right-[22%]
                    transition-all duration-700 ease-out
                    group-hover:scale-110
                    group-hover:blur-[45px]
                    group-hover:opacity-80
                  "
                  style={{
                    background:
                      'radial-gradient(circle, rgba(110,231,183,0.25) 0%, rgba(110,231,183,0.14) 45%, transparent 75%)',
                  }}
                />
              </div>

              <div
                className="
                  relative z-10
                  h-full
                  p-6
                  rounded-2xl
                  overflow-hidden
                  text-white
                  bg-gradient-to-br
                  from-[#0e4739]
                  via-[#17785b]
                  to-green-500
                  shadow-[0_10px_30px_rgba(0,0,0,0.25)]
                  transition-all duration-500 ease-out
                  group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]
                  group-hover:scale-[1.02]
                  group-active:scale-[0.98]
                  group-hover:brightness-105
                "
              >
                <div className="absolute top-4 right-4 transition-all duration-500 ease-out opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                  <OutlineIcon name="arrow" className="w-5 h-5 text-white/90" />
                </div>

                <img
                  src={card.image}
                  alt=""
                  className="
                    pointer-events-none
                    absolute
                    right-[-18px]
                    top-1/2
                    -translate-y-1/2
                    w-20 h-20 md:w-22 md:h-22
                    object-contain
                    opacity-50
                    mix-blend-soft-light
                    saturate-150
                    transition-all duration-700 ease-out
                    group-hover:opacity-50
                    group-hover:saturate-180
                    group-hover:scale-105
                    group-hover:right-[-15px]
                  "
                  style={{
                    WebkitMaskImage:
                      'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0) 80%)',
                    maskImage:
                      'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0) 80%)',
                  }}
                />

                <div className="relative z-10">
                  <p className="text-3xl font-semibold leading-none transition-all duration-400 ease-out group-hover:text-[34px]">
                    {card.value}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-emerald-100/90 flex items-center gap-1 transition-all duration-400 group-hover:text-emerald-100">
                      {card.label}
                      <span className="text-base font-bold opacity-90 ml-1 transition-all duration-400 group-hover:ml-2 group-hover:opacity-100">
                        &gt;
                      </span>
                    </p>

                    <div className="text-xs text-emerald-200/70 transition-all duration-500 ease-out opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                      Click to view
                    </div>
                  </div>

                  {/* ✅ removed card.sub line here */}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent opacity-0 group-hover:opacity-5 group-hover:to-white/10 transition-all duration-500 ease-out" />
              </div>

              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500 ease-out pointer-events-none" />
            </Link>
          ))}
        </div>

        {/* Main panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel
            title="Recent job posts"
            subtitle="Your latest job listings"
            iconName="briefcase"
            actionLabel="View all"
            onAction={handleManageJobs}
          >
            {dashboardData.recentJobs.length > 0 ? (
              <div className="p-4 space-y-3">
                {dashboardData.recentJobs.map((job) => (
                  <Link
                    key={job._id}
                    to="/employer/manage-jobs"
                    className="group block w-full px-4 py-4 rounded-xl border border-gray-100 bg-white
                               shadow-sm transition hover:border-gray-200 hover:shadow-md
                               focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {job.location || '—'} • {getApplicantsCount(job)} applicants
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Posted {formatDate(job.createdAt)}</p>
                      </div>

                      <RowArrow />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-600">
                  <OutlineIcon name="briefcase" className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-900">No jobs yet</p>
                <p className="text-sm text-gray-600 mt-1">Post a job to start receiving applications.</p>
                <button
                  type="button"
                  onClick={handlePostJob}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold
                             transition focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <OutlineIcon name="plus" className="w-5 h-5 mr-2" />
                  Post job
                </button>
              </div>
            )}
          </Panel>

          <Panel
            title="Recent applications"
            subtitle="Latest candidates and statuses"
            iconName="users"
            actionLabel="View all"
            onAction={handleViewApplicants}
          >
            {dashboardData.recentApplications.length > 0 ? (
              <div className="p-4 space-y-3">
                {dashboardData.recentApplications.map((app) => {
                  const pill = getStatusPill(app.status);

                  return (
                    <Link
                      key={app._id}
                      to="/employer/applicants"
                      className="group block w-full px-4 py-4 rounded-xl border border-gray-100 bg-white
                                 shadow-sm transition hover:border-gray-200 hover:shadow-md
                                 focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-gray-900 truncate">
                              {app.jobseeker?.fullName || 'Applicant'}
                            </p>

                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${pill.cls}`}>
                              <FontAwesomeIcon icon={getStatusIcon(app.status)} className="mr-1.5" />
                              {pill.text}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 truncate mt-1">
                            Applied for:{' '}
                            <span className="font-semibold text-gray-800">{app.job?.title || 'Job position'}</span>
                          </p>

                          <p className="text-xs text-gray-400 mt-2">{getTimeAgo(app.appliedAt)}</p>
                        </div>

                        <RowArrow />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-600">
                  <OutlineIcon name="users" className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-900">No applications yet</p>
                <p className="text-sm text-gray-600 mt-1">Applications will show here once candidates apply.</p>
                <button
                  type="button"
                  onClick={handleManageJobs}
                  className="mt-4 inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold
                             transition focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  Manage jobs
                </button>
              </div>
            )}
          </Panel>
        </div>

        {/* ✅ Recent messages panel (ADDED) */}
        <Panel
          title="Recent messages"
          subtitle="Latest conversations and updates"
          iconName="mail"
          actionLabel="Open inbox"
          onAction={handleViewMessages}
        >
          {dashboardData.recentMessages.length > 0 ? (
            <div className="p-4 space-y-3">
              {dashboardData.recentMessages.map((conv) => {
                const iconName = getMessageIconName(conv);
                const unread = Number(conv?.unreadCount || 0);

                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => navigate(`/employer/messages?conversation=${conv._id}`)}
                    className="w-full text-left group px-4 py-4 rounded-xl border border-gray-100 bg-white
                             shadow-sm transition hover:border-gray-200 hover:shadow-md
                             focus:outline-none focus:ring-2 focus:ring-green-600"
                    aria-label={`Open conversation with ${conv?.otherUser?.fullName || 'user'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600 shrink-0">
                          <OutlineIcon name={iconName} className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">
                              {conv?.otherUser?.fullName || 'Conversation'}
                            </p>

                            {unread > 0 ? (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border bg-green-50 text-green-800 border-green-200">
                                {unread} new
                              </span>
                            ) : null}
                          </div>

                          <p className="text-sm text-gray-600 truncate mt-1">
                            {getMessagePreview(conv)}
                          </p>

                          <p className="text-xs text-gray-400 mt-2">
                            {getTimeAgo(conv?.lastMessageTime || conv?.lastMessage?.createdAt)}
                          </p>
                        </div>
                      </div>

                      <RowArrow />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-600">
                <OutlineIcon name="chat" className="w-6 h-6" />
              </div>
              <p className="font-semibold text-gray-900">No messages yet</p>
              <p className="text-sm text-gray-600 mt-1">Messages will show here once candidates contact you.</p>
              <button
                type="button"
                onClick={handleViewMessages}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold
                           transition focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                Open inbox
              </button>
            </div>
          )}
        </Panel>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">Quick actions</h2>
          <p className="text-sm text-gray-500 mt-1">Common tasks</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={handlePostJob}
              className="flex items-center p-4 rounded-xl border border-gray-200 bg-white transition
                         hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <div className="w-10 h-10 rounded-lg border border-green-100 bg-green-50 flex items-center justify-center mr-4 text-green-700">
                <OutlineIcon name="plus" className="w-[18px] h-[18px]" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-gray-900 truncate">Post job</p>
                <p className="text-xs text-gray-500 mt-1 truncate">Create a listing</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleManageJobs}
              className="flex items-center p-4 rounded-xl border border-gray-200 bg-white transition
                         hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <div className="w-10 h-10 rounded-lg border border-green-100 bg-green-50 flex items-center justify-center mr-4 text-green-700">
                <OutlineIcon name="edit" className="w-[18px] h-[18px]" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-gray-900 truncate">Manage jobs</p>
                <p className="text-xs text-gray-500 mt-1 truncate">Edit/close jobs</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleViewApplicants}
              className="flex items-center p-4 rounded-xl border border-gray-200 bg-white transition
                         hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <div className="w-10 h-10 rounded-lg border border-green-100 bg-green-50 flex items-center justify-center mr-4 text-green-700">
                <OutlineIcon name="users" className="w-[18px] h-[18px]" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-gray-900 truncate">Applicants</p>
                <p className="text-xs text-gray-500 mt-1 truncate">Review candidates</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleViewMessages}
              className="flex items-center p-4 rounded-xl border border-gray-200 bg-white transition
                         hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <div className="w-10 h-10 rounded-lg border border-green-100 bg-green-50 flex items-center justify-center mr-4 text-green-700">
                <OutlineIcon name="mail" className="w-[18px] h-[18px]" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-semibold text-gray-900 truncate">Messages</p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {dashboardData.messages.unread > 0 ? `${dashboardData.messages.unread} unread` : 'Open inbox'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
};

export default EmployerDashboard;