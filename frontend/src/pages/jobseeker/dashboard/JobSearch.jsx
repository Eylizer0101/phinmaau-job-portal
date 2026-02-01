import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JobSeekerLayout from '../../../layouts/JobSeekerLayout';

// ✅ IMPORTANT: Import your API instance
import api from '../../../services/api'; // Adjust path if needed

const JobSearch = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const [filters, setFilters] = useState({
    jobType: '',
    category: '',
    workMode: '',
    minSalary: '',
    maxSalary: '',
    experienceLevel: '',
    salaryType: ''
  });

  const [layoutView, setLayoutView] = useState('grid');
  const [applyingJob, setApplyingJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  // ✅ Debounced search inputs
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedLocation, setDebouncedLocation] = useState('');

  // ✅ 60–30–10 Color System (Applied)
  // 60% Base: background
  // 30% Secondary: surfaces/cards/borders
  // 10% Accent: primary actions/highlights
  const COLORS = {
    // 10% ACCENT (Actions / Highlights)
    primary: '#27AE60',
    primaryHover: '#059669',
    primaryDark: '#047857',

    // 60% BASE (Page background)
    background: '#F9FAFB', // soft base background (dominant)

    // 30% SECONDARY (Surfaces / structure)
    card: '#FFFFFF',
    cardHover: '#F3F4F6',
    frame: '#F3F4F6',
    frameDark: '#E5E7EB',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Text
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textTertiary: '#6B7280',
    textMuted: '#9CA3AF',

    // Status
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Light text
    textLight: '#FFFFFF',
    textOnPrimary: '#FFFFFF'
  };

  // ✅ UPDATED: Industry list now matches EmployerRegisterPage.jsx industries
  const jobCategories = [
    'Accounting',
    'Advertising & Marketing',
    'Agriculture',
    'Architecture',
    'Automotive',
    'Banking & Finance',
    'Construction',
    'Education',
    'Energy & Utilities',
    'Engineering',
    'Food & Beverage',
    'Government',
    'Healthcare',
    'Hospitality & Tourism',
    'Human Resources',
    'Information Technology',
    'Legal',
    'Logistics & Supply Chain',
    'Manufacturing',
    'Media & Entertainment',
    'Real Estate',
    'Retail',
    'Security',
    'Telecommunications',
    'Transportation',
    'Others'
  ];

  // ✅ CHANGED: Removed Internship, Remote, Hybrid from Job Type
  const jobTypes = ['Full-time', 'Part-time', 'Contract'];
  const workModes = ['On-site', 'Remote', 'Hybrid'];

  // ✅ CHANGED: Experience Level (3 options only)
  const experienceLevels = ['Internship', 'Entry Level', 'Junior'];

  const salaryTypes = ['Monthly', 'Yearly', 'Hourly'];

  // ✅ UPDATED: show first 8 then show more (since industries are longer)
  const visibleCategories = showMoreCategories ? jobCategories : jobCategories.slice(0, 8);

  // ✅ debounce effect for search term + location
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location.trim()), 400);
    return () => clearTimeout(t);
  }, [location]);

  // ✅ fetch when filters OR debounced fields change
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, debouncedSearch, debouncedLocation]);

  const safeSalaryRange = useMemo(() => {
    const min = filters.minSalary !== '' ? Number(filters.minSalary) : '';
    const max = filters.maxSalary !== '' ? Number(filters.maxSalary) : '';

    if (min !== '' && max !== '' && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      return { minSalary: String(max), maxSalary: String(min) };
    }

    return { minSalary: filters.minSalary, maxSalary: filters.maxSalary };
  }, [filters.minSalary, filters.maxSalary]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // ✅ use debounced values for querying
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (debouncedLocation) params.append('location', debouncedLocation);

      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.category) params.append('category', filters.category);
      if (filters.workMode) params.append('workMode', filters.workMode);

      // ✅ salary (auto-swap if min > max)
      if (safeSalaryRange.minSalary) params.append('minSalary', safeSalaryRange.minSalary);
      if (safeSalaryRange.maxSalary) params.append('maxSalary', safeSalaryRange.maxSalary);

      // ✅ backend-based additional filters (optional; only included if selected)
      if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
      if (filters.salaryType) params.append('salaryType', filters.salaryType);

      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.get(`/jobs?${params.toString()}`);

      let jobsData = [];

      if (response.data.success && response.data.jobs) {
        jobsData = response.data.jobs;
      } else if (response.data.data) {
        jobsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        jobsData = response.data;
      } else if (response.data.success && response.data.data) {
        jobsData = response.data.data;
      }

      // ✅ ADDED: filter out expired jobs (deadline already passed)
      const now = new Date();
      const filteredJobs = (jobsData || []).filter((job) => {
        if (!job) return false;

        // keep only published + active (extra safety; backend already does this)
        if (job.isPublished === false) return false;
        if (job.isActive === false) return false;

        // remove expired by deadline
        if (!job.applicationDeadline) return true;
        const d = new Date(job.applicationDeadline);
        if (Number.isNaN(d.getTime())) return true;
        return d >= now;
      });

      setJobs(filteredJobs);

    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // ✅ immediate fetch on submit (no need to wait debounce)
    setDebouncedSearch(searchTerm.trim());
    setDebouncedLocation(location.trim());
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setDebouncedSearch('');
    setDebouncedLocation('');
    setFilters({
      jobType: '',
      category: '',
      workMode: '',
      minSalary: '',
      maxSalary: '',
      experienceLevel: '',
      salaryType: ''
    });
  };

  const formatSalary = (min, max, type) => {
    if (!min && !max) return 'Salary not specified';

    const formattedMin = min ? `₱${min.toLocaleString()}` : '';
    const formattedMax = max ? `₱${max.toLocaleString()}` : '';

    if (formattedMin && formattedMax) {
      return `${formattedMin} - ${formattedMax}`;
    } else if (formattedMin) {
      return `From ${formattedMin}`;
    } else {
      return `Up to ${formattedMax}`;
    }
  };

  const getSalaryPeriod = (type) => {
    if (!type) return 'Monthly';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Closed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;

    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleApplyClick = (job) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      alert('Please login to apply for jobs');
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(user);

      if (parsedUser.role !== 'jobseeker') {
        alert('Only job seekers can apply for jobs');
        return;
      }

      if (!parsedUser.jobSeekerProfile?.resumeUrl) {
        if (window.confirm('You need to upload a resume before applying. Go to your profile to upload one?')) {
          navigate('/jobseeker/my-profile');
        }
        return;
      }

      if (!job.isActive || !job.isPublished) {
        alert('This job is no longer accepting applications');
        return;
      }

      if (new Date(job.applicationDeadline) < new Date()) {
        alert('Application deadline has passed');
        return;
      }

      setApplyingJob(job);
      setCoverLetter('');
      setShowApplyModal(true);
      setApplyError('');
      setApplySuccess('');

    } catch (error) {
      console.error('Error checking user:', error);
      alert('Error checking user information');
    }
  };

  const handleSubmitApplication = async () => {
    if (!applyingJob) return;

    try {
      setApplyLoading(true);
      setApplyError('');
      setApplySuccess('');

      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.post(
        `/applications/apply/${applyingJob._id}`,
        { coverLetter }
      );

      if (response.data.success) {
        setApplySuccess('Application submitted successfully!');

        setTimeout(() => {
          setShowApplyModal(false);
          setApplyingJob(null);
          setCoverLetter('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      if (error.response?.data?.message) {
        setApplyError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setApplyError('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 403) {
        setApplyError('Only job seekers can apply for jobs');
      } else if (error.response?.status === 400) {
        setApplyError(error.response.data.message);
      } else {
        setApplyError('Failed to submit application. Please try again.');
      }
    } finally {
      setApplyLoading(false);
    }
  };

  const handleViewJobDetails = (job) => {
    navigate(`/jobseeker/job-details/${job._id || job.id}`);
  };

  const isJobNew = (job) => {
    if (!job.createdAt) return false;
    const postedDate = new Date(job.createdAt);
    const now = new Date();
    const diffTime = now - postedDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="rounded-xl p-6 animate-pulse"
          style={{
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`
          }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-xl"
              style={{ backgroundColor: COLORS.frame }}
            ></div>
            <div className="flex-1">
              <div
                className="h-4 w-1/3 rounded mb-2"
                style={{ backgroundColor: COLORS.frame }}
              ></div>
              <div
                className="h-3 w-1/4 rounded"
                style={{ backgroundColor: COLORS.frame }}
              ></div>
            </div>
          </div>
          <div
            className="h-6 w-3/4 rounded mb-4"
            style={{ backgroundColor: COLORS.frame }}
          ></div>
          <div
            className="h-4 w-1/2 rounded mb-2"
            style={{ backgroundColor: COLORS.frame }}
          ></div>
          <div
            className="h-3 w-1/3 rounded mb-4"
            style={{ backgroundColor: COLORS.frame }}
          ></div>
          <div
            className="h-20 rounded mb-4"
            style={{ backgroundColor: COLORS.frame }}
          ></div>
          <div className="flex justify-end pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <div
              className="h-10 w-24 rounded"
              style={{ backgroundColor: COLORS.frame }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <JobSeekerLayout>
      {/* ✅ 60% Base background */}
      <div style={{ backgroundColor: COLORS.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 -mt-12">
          {/* Combined Header and Search Bar Container */}
          <div className="mb-8">
            <div
              className="
      relative
      rounded-xl
      border border-gray-200
      p-6 md:p-8
      shadow-[0_4px_20px_rgba(0,0,0,0.08)]
      overflow-hidden
      text-white
      bg-gradient-to-br
      from-[#0e4739]
      via-[#17785b]
      to-green-500
      transition-all duration-300
      hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]
    "
            >

              {/* 💡 SOFT GLOW LIGHT (More subtle) */}
              <div className="pointer-events-none absolute inset-0 z-0">
                <div
                  className="
          absolute
          w-[160px] md:w-[200px]
          h-[160px] md:h-[200px]
          rounded-full
          blur-[40px] md:blur-[50px]
          top-[40%]
          right-[15%] md:right-[20%]
          opacity-60
        "
                  style={{
                    background:
                      'radial-gradient(circle, rgba(110,231,183,0.25) 0%, rgba(110,231,183,0.12) 45%, transparent 75%)'
                  }}
                />
              </div>

              {/* 🖼️ WATERMARK IMAGE */}
              <img
                src="/images/findjob.png"
                alt="Job search illustration"
                className="
        pointer-events-none
        absolute
        right-[20px] md:right-[40px]
        top-1/3
        -translate-y-1/2
        w-34 h-34 md:w-49 md:h-48
        object-contain
        opacity-50
        mix-blend-soft-light
        saturate-120
        z-0
      "
                style={{
                  WebkitMaskImage:
                    'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 80%)',
                  maskImage:
                    'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 80%)'
                }}
              />

              {/* CONTENT WRAPPER */}
              <div className="relative z-10">

                {/* Header */}
                <div className="mb-6 md:mb-8 text-start">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                    Find Your Dream Job
                  </h1>
                  <p className="text-base md:text-lg text-emerald-100/90">
                    Discover opportunities that match your passion
                  </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                    {/* Job Title Search */}
                    <div className="md:col-span-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold mb-2 text-white/90">
                          Job titles, company, or keywords
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {/* CHANGED: White to Gray */}
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="
                    block w-full
                    pl-10 pr-4 py-3.5
                    rounded-lg
                    bg-white
                    text-gray-900
                    border border-gray-300
                    focus:ring-2
                    focus:ring-emerald-500
                    focus:border-transparent
                    shadow-sm
                    transition-all duration-200
                    hover:border-gray-400
                    focus:bg-white
                  "
                            style={{ fontSize: '14px' }}
                            placeholder="Search jobs, companies, or keywords"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location Search */}
                    <div className="md:col-span-5">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold mb-2 text-white/90">
                          Location
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {/* CHANGED: White to Gray */}
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="
                    block w-full
                    pl-10 pr-4 py-3.5
                    rounded-lg
                    bg-white
                    text-gray-900
                    border border-gray-300
                    focus:ring-2
                    focus:ring-emerald-500
                    focus:border-transparent
                    shadow-sm
                    transition-all duration-200
                    hover:border-gray-400
                    focus:bg-white
                  "
                            style={{ fontSize: '14px' }}
                            placeholder="City, State, or Remote"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Search Button */}
                    <div className="md:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setLocation('');
                          setDebouncedSearch('');
                          setDebouncedLocation('');
                        }}
                        className="
                w-full py-3.5
                font-semibold
                rounded-lg
                bg-white
                text-emerald-700
                border border-emerald-300
                hover:bg-emerald-50
                hover:border-emerald-400
                hover:text-emerald-800
                transition-all duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-emerald-500
                shadow-sm
                hover:shadow-md
                active:scale-[0.98]
              "
                        style={{ fontSize: '14px' }}
                      >
                        Reset
                      </button>
                    </div>

                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-80 flex-shrink-0">
              <div
                className="rounded-xl p-6 shadow-sm sticky top-8"
                style={{
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.border}`
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-lg font-bold"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Filters
                  </h2>

                  {/* ✅ Accent usage (text only) */}
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline focus:outline-none"
                  >
                    Clear All
                  </button>
                </div>

                {/* Scrollable Filters Container */}
                <div className="space-y-8 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Job Type Filter */}
                  <div>
                    <h3
                      className="font-semibold mb-4 text-sm"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Job Type
                    </h3>
                    <div className="space-y-3">
                      {jobTypes.map(type => (
                        <label key={type} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="jobType"
                            checked={filters.jobType === type}
                            onChange={() => handleFilterChange('jobType', filters.jobType === type ? '' : type)}
                            className="h-4 w-4 focus:ring-0"
                            style={{
                              accentColor: COLORS.primary,
                              color: COLORS.primary
                            }}
                          />
                          <span
                            className="ml-3 text-sm transition-colors"
                            style={{
                              color: filters.jobType === type ? COLORS.primaryDark : COLORS.textSecondary,
                              fontWeight: filters.jobType === type ? '600' : '400'
                            }}
                          >
                            {type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Work Mode Filter */}
                  <div>
                    <h3
                      className="font-semibold mb-4 text-sm"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Work Mode
                    </h3>
                    <div className="space-y-3">
                      {workModes.map(mode => (
                        <label key={mode} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="workMode"
                            checked={filters.workMode === mode}
                            onChange={() => handleFilterChange('workMode', filters.workMode === mode ? '' : mode)}
                            className="h-4 w-4 focus:ring-0"
                            style={{
                              accentColor: COLORS.primary,
                              color: COLORS.primary
                            }}
                          />
                          <span
                            className="ml-3 text-sm transition-colors"
                            style={{
                              color: filters.workMode === mode ? COLORS.primaryDark : COLORS.textSecondary,
                              fontWeight: filters.workMode === mode ? '600' : '400'
                            }}
                          >
                            {mode}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <h3
                      className="font-semibold mb-4 text-sm"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Industry
                    </h3>
                    <div className="space-y-3">
                      {visibleCategories.map(category => (
                        <label key={category} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            checked={filters.category === category}
                            onChange={() => handleFilterChange('category', filters.category === category ? '' : category)}
                            className="h-4 w-4 focus:ring-0"
                            style={{
                              accentColor: COLORS.primary,
                              color: COLORS.primary
                            }}
                          />
                          <span
                            className="ml-3 text-sm transition-colors"
                            style={{
                              color: filters.category === category ? COLORS.primaryDark : COLORS.textSecondary,
                              fontWeight: filters.category === category ? '600' : '400'
                            }}
                          >
                            {category}
                          </span>
                        </label>
                      ))}

                      <button
                        onClick={() => setShowMoreCategories(!showMoreCategories)}
                        className="flex items-center text-xs font-medium mt-2 text-emerald-600 hover:text-emerald-700 hover:underline focus:outline-none"
                      >
                        {showMoreCategories ? 'Show Less' : `Show ${jobCategories.length - 8} More`}
                        <svg
                          className={`ml-1 w-4 h-4 transition-transform ${showMoreCategories ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* ✅ Experience Level Filter (CHANGED TO 3 ONLY) */}
                  <div>
                    <h3
                      className="font-semibold mb-4 text-sm"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Experience Level
                    </h3>
                    <div className="space-y-3">
                      {experienceLevels.map(level => (
                        <label key={level} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="experienceLevel"
                            checked={filters.experienceLevel === level}
                            onChange={() => handleFilterChange('experienceLevel', filters.experienceLevel === level ? '' : level)}
                            className="h-4 w-4 focus:ring-0"
                            style={{
                              accentColor: COLORS.primary,
                              color: COLORS.primary
                            }}
                          />
                          <span
                            className="ml-3 text-sm transition-colors"
                            style={{
                              color: filters.experienceLevel === level ? COLORS.primaryDark : COLORS.textSecondary,
                              fontWeight: filters.experienceLevel === level ? '600' : '400'
                            }}
                          >
                            {level}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Salary Range Filter */}
                  <div>
                    <h3
                      className="font-semibold mb-4 text-sm"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Salary Range
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label
                          className="block mb-2 text-xs font-medium"
                          style={{ color: COLORS.textSecondary }}
                        >
                          Min Salary (₱)
                        </label>
                        <input
                          type="number"
                          value={filters.minSalary}
                          onChange={(e) => handleFilterChange('minSalary', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg focus:ring-0.5 focus:border-transparent text-sm "
                          style={{
                            color: COLORS.textPrimary,
                            backgroundColor: COLORS.card,
                            border: `1px solid ${COLORS.border}`
                          }}
                          placeholder="Minimum"
                        />
                      </div>
                      <div>
                        <label
                          className="block mb-2 text-xs font-medium"
                          style={{ color: COLORS.textSecondary }}
                        >
                          Max Salary (₱)
                        </label>
                        <input
                          type="number"
                          value={filters.maxSalary}
                          onChange={(e) => handleFilterChange('maxSalary', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg focus:ring-0.5 focus:border-transparent text-sm"
                          style={{
                            color: COLORS.textPrimary,
                            backgroundColor: COLORS.card,
                            border: `1px solid ${COLORS.border}`
                          }}
                          placeholder="Maximum"
                        />
                      </div>

                      {/* ✅ Salary Type Filter (backend-based) */}
                      <div>
                        <label
                          className="block mb-2 text-xs font-medium"
                          style={{ color: COLORS.textSecondary }}
                        >
                          Salary Type
                        </label>
                        <select
                          value={filters.salaryType}
                          onChange={(e) => handleFilterChange('salaryType', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg focus:ring-0 focus:border-transparent text-sm"
                          style={{
                            color: COLORS.textPrimary,
                            backgroundColor: COLORS.card,
                            border: `1px solid ${COLORS.border}`
                          }}
                        >
                          <option value="">Any</option>
                          {salaryTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Job Listings */}
            <div className="flex-1">
              {/* Header with controls */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                </h2>

                {/* Layout Toggle Buttons */}
                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setLayoutView('grid')}
                    className={`p-2 rounded-md transition-colors ${layoutView === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    title="Grid View"
                  >
                    <svg
                      className={`w-5 h-5 ${layoutView === 'grid' ? 'text-green-600' : 'text-gray-500'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setLayoutView('list')}
                    className={`p-2 rounded-md transition-colors ${layoutView === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                    title="List View"
                  >
                    <svg
                      className={`w-5 h-5 ${layoutView === 'list' ? 'text-green-600' : 'text-gray-500'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Job Listings */}
              {loading ? (
                renderSkeleton()
              ) : jobs.length === 0 ? (
                <div
                  className="rounded-xl p-12 text-center shadow-sm"
                  style={{
                    backgroundColor: COLORS.card,
                    border: `1px solid ${COLORS.border}`
                  }}
                >
                  <svg
                    className="w-14 h-14 mx-auto mb-6"
                    style={{ color: COLORS.textTertiary }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3
                    className="text-xl font-semibold mb-3"
                    style={{ color: COLORS.textPrimary }}
                  >
                    No jobs found
                  </h3>
                  <p
                    className="mb-6 text-sm"
                    style={{ color: COLORS.textSecondary }}
                  >
                    Try adjusting your search criteria
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {/* 30% Secondary button */}
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                    >
                      Clear Search
                    </button>
                    {/* 10% Accent CTA */}
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-6 ${layoutView === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {jobs.map(job => {
                    const isNew = isJobNew(job);

                    // ✅ ADDED: skills safe display (array OR string)
                    const skillsArray = Array.isArray(job.skillsRequired)
                      ? job.skillsRequired
                      : typeof job.skillsRequired === 'string'
                        ? job.skillsRequired.split(',').map(s => s.trim()).filter(Boolean)
                        : [];

                    return (
                      <div
                        key={job._id || job.id}
                        className="rounded-xl p-6 transition-all duration-200 hover:shadow-lg bg-white"
                        style={{
                          border: `1px solid ${COLORS.border}`
                        }}
                      >
                        {/* TOP SECTION */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                            {job.companyLogo ? (
                              <img
                                src={job.companyLogo}
                                alt={job.companyName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.style.backgroundColor = COLORS.frame;
                                  e.target.parentElement.style.border = `1px solid ${COLORS.border}`;
                                  const initial = (job.companyName || 'Company').charAt(0).toUpperCase();
                                  e.target.parentElement.innerHTML =
                                    `<div class="w-full h-full flex items-center justify-center rounded-lg" style="background-color: ${COLORS.frame}; border: 1px solid ${COLORS.border}">
                                      <span class="font-bold text-lg" style="color: ${COLORS.primaryDark}">${initial}</span>
                                    </div>`;
                                }}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center rounded-lg"
                                style={{
                                  backgroundColor: COLORS.frame,
                                  border: `1px solid ${COLORS.border}`
                                }}
                              >
                                <span
                                  className="font-bold text-lg"
                                  style={{ color: COLORS.primaryDark }}
                                >
                                  {(job.companyName || 'Company').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Company and Location */}
                          <div className="flex-1">
                            <div className="mb-1">
                              <span
                                className="font-semibold text-sm"
                                style={{ color: COLORS.textPrimary }}
                              >
                                {job.companyName || 'Company'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs">
                              <svg
                                className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"
                                style={{ color: COLORS.textTertiary }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span
                                className="line-clamp-1"
                                style={{ color: COLORS.textSecondary }}
                              >
                                {job.location || 'Location not specified'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* JOB TITLE */}
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3
                              className="text-xl font-bold break-words pr-4 flex-1"
                              style={{ color: COLORS.textPrimary }}
                            >
                              {job.title}
                            </h3>
                            {isNew && (
                              // ✅ Accent used lightly but still readable
                              <span
                                className="px-2.5 py-1 text-xs font-bold rounded-full whitespace-nowrap flex-shrink-0"
                                style={{
                                  backgroundColor: `${COLORS.primary}20`,
                                  color: COLORS.primaryDark,
                                  border: `1px solid ${COLORS.primary}40`
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </div>

                          {/* Salary (hierarchy: slightly below title) */}
                          <div className="text-left mb-2">
                            <div
                              className="text-lg font-semibold"
                              style={{ color: COLORS.primaryDark }}
                            >
                              {formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}
                            </div>
                            <div
                              className="text-xs mt-0.5 font-medium"
                              style={{ color: COLORS.textTertiary }}
                            >
                              {getSalaryPeriod(job.salaryType)}
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center">
                              <svg
                                className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"
                                style={{ color: COLORS.textTertiary }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span style={{ color: COLORS.textSecondary, fontWeight: '500' }}>
                                {job.jobType || 'Full-time'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <svg
                                className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"
                                style={{ color: COLORS.textTertiary }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span style={{ color: COLORS.textSecondary, fontWeight: '500' }}>
                                {formatDate(job.applicationDeadline)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                          <p
                            className="text-sm leading-relaxed line-clamp-2"
                            style={{ color: COLORS.textSecondary, lineHeight: '1.5' }}
                          >
                            {job.description || 'No description available'}
                          </p>
                        </div>

                        {/* Skills */}
                        <div className="mb-5">
                          <div className="flex flex-wrap gap-2">
                            {skillsArray && skillsArray.slice(0, 4).map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg"
                                style={{
                                  backgroundColor: `${COLORS.primary}15`,
                                  color: COLORS.primaryDark,
                                  border: `1px solid ${COLORS.primary}30`
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                            {skillsArray && skillsArray.length > 4 && (
                              <span
                                className="px-3 py-1.5 text-xs font-medium rounded-lg"
                                style={{
                                  backgroundColor: COLORS.frame,
                                  color: COLORS.textSecondary,
                                  border: `1px solid ${COLORS.border}`
                                }}
                              >
                                +{skillsArray.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-4 border-t" style={{ borderColor: COLORS.border }}>
                          <div className="flex items-center gap-3">
                            {/* 30% Secondary */}
                            <button
                              onClick={() => handleViewJobDetails(job)}
                              className="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                            >
                              View Details
                            </button>
                            {/* 10% Accent */}
                            <button
                              onClick={() => handleApplyClick(job)}
                              className="px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
                              whitespace-nowrap bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700"
                            >
                              Apply Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apply Job Modal */}
        {showApplyModal && applyingJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-xl max-w-md w-full shadow-xl"
              style={{ backgroundColor: COLORS.card }}
            >
              

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-xl font-bold"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Apply for Job
                  </h3>
                  <button
                    onClick={() => {
                      setShowApplyModal(false);
                      setApplyingJob(null);
                      setCoverLetter('');
                      setApplyError('');
                      setApplySuccess('');
                    }}
                    className="rounded-full p-1 transition-colors focus:outline-none text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Job Info */}
                <div className="mb-6">
                  <div
                    className="rounded-lg p-4"
                    style={{ backgroundColor: COLORS.frame, border: `1px solid ${COLORS.border}` }}
                  >
                    <h4
                      className="font-semibold"
                      style={{ color: COLORS.textPrimary }}
                    >
                      {applyingJob.title}
                    </h4>
                    <p
                      className="text-sm mt-1"
                      style={{ color: COLORS.textSecondary }}
                    >
                      {applyingJob.companyName}
                    </p>
                    <div className="flex items-center mt-2 text-xs" style={{ color: COLORS.textTertiary }}>
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{applyingJob.location}</span>
                      <span className="mx-2">•</span>
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{applyingJob.jobType}</span>
                    </div>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="mb-6">
                  <label
                    className="block font-semibold mb-2 text-sm"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    style={{
                      color: COLORS.textPrimary,
                      backgroundColor: COLORS.card,
                      border: `1px solid ${COLORS.border}`
                    }}
                    placeholder="Tell the employer why you're a good fit for this position..."
                  />
                  <p
                    className="text-xs mt-2"
                    style={{ color: COLORS.textTertiary }}
                  >
                    Your resume will be automatically attached to this application.
                  </p>
                </div>

                {/* Error/Success Messages */}
                {applyError && (
                  <div
                    className="mb-4 p-3 rounded-lg"
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#DC2626'
                    }}
                  >
                    <p className="text-sm font-medium">{applyError}</p>
                  </div>
                )}

                {applySuccess && (
                  <div
                    className="mb-4 p-3 rounded-lg"
                    style={{
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      color: COLORS.primaryDark
                    }}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" style={{ color: COLORS.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium">{applySuccess}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  {/* 30% Secondary */}
                  <button
                    onClick={() => {
                      setShowApplyModal(false);
                      setApplyingJob(null);
                      setCoverLetter('');
                      setApplyError('');
                      setApplySuccess('');
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                    disabled={applyLoading}
                  >
                    Cancel
                  </button>

                  {/* 10% Accent CTA */}
                  <button
                    onClick={handleSubmitApplication}
                    disabled={applyLoading}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center border
                      ${applyLoading ? 'bg-emerald-600/70 border-emerald-600/70' : 'bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700'}
                      text-white
                    `}
                  >
                    {applyLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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
        )}

        {/* Custom scrollbar + focus */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${COLORS.card};
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${COLORS.border};
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${COLORS.textTertiary};
          }

          input:focus, textarea:focus, select:focus {
            outline: none;
            box-shadow: 0 0 0 3px ${COLORS.primary}20;
          }

          input[type="radio"] {
            border-radius: 50%;
          }

          input[type="radio"]:checked {
            background-color: ${COLORS.primary};
          }
        `}</style>
      </div>
    </JobSeekerLayout>
  );
};

export default JobSearch;