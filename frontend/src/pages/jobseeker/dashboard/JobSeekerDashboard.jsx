// src/pages/jobseeker/dashboard/JobSeekerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBriefcase, faClock, faCheckCircle, faTimesCircle,
  faBell, faFileAlt, faExclamationCircle,
  faSearch, faCalendarAlt, faUserCircle,
  faMapMarkerAlt, faMoneyBillWave, faChevronRight
} from '@fortawesome/free-solid-svg-icons';

const JobSeekerDashboard = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0,
    total: 0,
    interviewScheduled: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    profileComplete: false,
    profileScore: 0
  });

  // ✅ Handler para sa pag-click sa stats cards
  const handleStatsCardClick = (filter) => {
    // Mag-navigate sa MyApplications page with status filter
    if (filter === 'total') {
      navigate('/jobseeker/my-applications');
    } else {
      navigate(`/jobseeker/my-applications?status=${filter}`);
    }
  };

  // ✅ SIMPLIFIED LOGIC: Exact same as JobSearch
  const getCompanyLogo = (application) => {
    // Priority 1: Logo from job (same as JobSearch)
    if (application.job?.companyLogo) {
      const logo = application.job.companyLogo;
      if (logo.startsWith('http')) return logo;
      if (logo.startsWith('/')) return `http://localhost:5000${logo}`;
      return `http://localhost:5000/uploads/logos/${logo}`;
    }
    
    // Priority 2: Logo from employer profile
    if (application.employer?.employerProfile?.companyLogo) {
      const logo = application.employer.employerProfile.companyLogo;
      if (logo.startsWith('http')) return logo;
      if (logo.startsWith('/')) return `http://localhost:5000${logo}`;
      return `http://localhost:5000/uploads/logos/${logo}`;
    }
    
    return null; // Will trigger fallback
  };

  // Simple initials
  const getCompanyInitials = (companyName) => {
    if (!companyName) return 'CO';
    return companyName.charAt(0).toUpperCase();
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUserData();
  }, []);

  const fetchUserData = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    let profileScore = 0;
    if (user.jobSeekerProfile) {
      if (user.jobSeekerProfile.skills?.length > 0) profileScore += 30;
      if (user.jobSeekerProfile.resumeUrl) profileScore += 30;
      if (user.jobSeekerProfile.experience?.length > 0) profileScore += 20;
      if (user.jobSeekerProfile.education?.length > 0) profileScore += 20;
    }
    
    setUserData({
      name: user.fullName || 'Job Seeker',
      profileComplete: profileScore >= 80,
      profileScore
    });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // ✅ GAMITIN ANG API SERVICE
      const [appsResponse, notifResponse] = await Promise.all([
        api.get('/applications/my-applications'),
        api.get('/notifications')
      ]);

      console.log('📊 API Response:', appsResponse.data);
      
      if (appsResponse.data.success) {
        const allApplications = appsResponse.data.applications || [];
        
        // Debug: Show logo information
        allApplications.forEach((app, index) => {
          console.log(`App ${index}:`, {
            title: app.job?.title,
            company: app.job?.companyName,
            jobHasLogo: !!app.job?.companyLogo,
            jobLogo: app.job?.companyLogo,
            employerHasLogo: !!app.employer?.employerProfile?.companyLogo,
            employerLogo: app.employer?.employerProfile?.companyLogo
          });
        });
        
        setApplications(allApplications.slice(0, 3));
        
        const pending = allApplications.filter(app => app.status === 'pending').length;
        const accepted = allApplications.filter(app => app.status === 'accepted').length;
        const rejected = allApplications.filter(app => app.status === 'rejected').length;
        const interviewScheduled = allApplications.filter(app => app.status === 'interview_scheduled').length;
        
        setStats({ pending, accepted, rejected, interviewScheduled, total: allApplications.length });
      }

      if (notifResponse.data.success) {
        setNotifications(notifResponse.data.notifications.slice(0, 3) || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    const mockApplications = [
      {
        _id: '1',
        job: { 
          title: 'Frontend Developer', 
          companyName: 'TechCorp Inc.', 
          location: 'Manila', 
          salaryMin: 60000,
          salaryMax: 80000,
          jobType: 'Full-time',
          companyLogo: '/uploads/logos/techcorp.png'
        },
        employer: {
          employerProfile: {
            companyName: 'TechCorp Inc.',
            companyLogo: '/uploads/logos/techcorp.png'
          }
        },
        status: 'pending',
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: '2',
        job: { 
          title: 'Backend Engineer', 
          companyName: 'DataSys Solutions', 
          location: 'Cebu', 
          salaryMin: 70000,
          salaryMax: 90000,
          jobType: 'Full-time',
          companyLogo: '/uploads/logos/datasys.png'
        },
        employer: {
          employerProfile: {
            companyName: 'DataSys Solutions',
            companyLogo: '/uploads/logos/datasys.png'
          }
        },
        status: 'interview_scheduled',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        interviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    setApplications(mockApplications);
    setStats({ pending: 1, accepted: 0, rejected: 0, interviewScheduled: 1, total: 2 });
    setNotifications([]);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        icon: faClock, 
        label: 'Under Review',
        bg: 'bg-yellow-50', 
        text: 'text-yellow-800',
        border: 'border-yellow-200'
      },
      accepted: { 
        icon: faCheckCircle, 
        label: 'Accepted',
        bg: 'bg-green-50', 
        text: 'text-green-800',
        border: 'border-green-200'
      },
      rejected: { 
        icon: faTimesCircle, 
        label: 'Rejected',
        bg: 'bg-red-50', 
        text: 'text-red-800',
        border: 'border-red-200'
      },
      interview_scheduled: { 
        icon: faCalendarAlt, 
        label: 'Interview',
        bg: 'bg-blue-50', 
        text: 'text-blue-800',
        border: 'border-blue-200'
      }
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return '';
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

  // ✅ BAGO: Function para i-mark as read ang notification
  const markNotificationAsRead = async (notificationId) => {
    try {
      // Call backend API to mark as read
      const response = await api.put(`/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        // Update local state to remove the blue dot and blue background
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true } 
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback: Update locally anyway for better UX
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true } 
            : notif
        )
      );
    }
  };

  // ✅ BAGO: Updated handler para sa pag-click ng notification
  const handleNotificationClick = async (notification) => {
    // Mark as read first if unread
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }
    
    // Then handle the navigation
    if (notification.link) {
      navigate(notification.link);
      return;
    }
    
    // Kung wala, redirect sa notifications page
    navigate('/jobseeker/notifications');
  };

  // ✅ BAGO: Handler para sa pag-click ng recent application
  // Direct na sa MyApplications page
  const handleRecentApplicationClick = () => {
    navigate('/jobseeker/my-applications');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            {[1, 2].map(i => (
              <div key={i} className="border-t border-gray-200 pt-4 mt-4 first:border-0 first:pt-0 first:mt-0">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, <span className="text-green-600">{userData.name.split(' ')[0]}</span>
        </h1>
        <p className="text-gray-600 mt-1">Here's your job search overview for today</p>
      </div>

      {/* PROFILE COMPLETION */}
      {!userData.profileComplete && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4 border border-blue-200">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Complete your profile</p>
              <p className="text-sm text-gray-600">Increase your chances by {100 - userData.profileScore}%</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-32">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{userData.profileScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${userData.profileScore}%` }}
                ></div>
              </div>
            </div>
            <button
              onClick={() => navigate('/jobseeker/my-profile')}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-4 py-2 rounded-lg font-medium text-sm"
            >
              Complete
            </button>
          </div>
        </div>
      )}

      {/* STATS CARDS - NOW WITH SMOOTH ANIMATIONS! */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { key: 'total', label: 'Total Applications', value: stats.total, image: '/images/docu.png' },
          { key: 'pending', label: 'Pending', value: stats.pending, image: '/images/pending7.png' },
          { key: 'accepted', label: 'Accepted', value: stats.accepted, image: '/images/total1.png' },
          { key: 'rejected', label: 'Rejected', value: stats.rejected, image: '/images/rej.png' }
        ].map((stat) => (
          <div
            key={stat.key}
            onClick={() => handleStatsCardClick(stat.key)}
            className="relative rounded-2xl overflow-hidden group cursor-pointer"
          >

            {/* 💡 VERY SMALL SOFT LIGHT DOT */}
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
                    'radial-gradient(circle, rgba(110,231,183,0.25) 0%, rgba(110,231,183,0.14) 45%, transparent 75%)'
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
              {/* CLICK INDICATOR - Cheveron (SMOOTH FADE IN) */}
              <div className="absolute top-4 right-4 transition-all duration-500 ease-out opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>

              {/* 🖼️ WATERMARK ICON (NAKATAGO SA BG) */}
              <img
                src={stat.image}
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
                    'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0) 80%)'
                }}
              />

              {/* CONTENT (ON TOP) */}
              <div className="relative z-10">
                <p className="text-3xl font-semibold leading-none transition-all duration-400 ease-out group-hover:text-[34px]">
                  {stat.value}
                </p>

                {/* LABEL + ARROW */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-emerald-100/90 flex items-center gap-1 transition-all duration-400 group-hover:text-emerald-100">
                    {stat.label}
                    <span className="text-base font-bold opacity-90 ml-1 transition-all duration-400 group-hover:ml-2 group-hover:opacity-100">
                      &gt;
                    </span>
                  </p>
                  
                  {/* CLICK HINT (SMOOTH FADE IN) */}
                  <div className="text-xs text-emerald-200/70 transition-all duration-500 ease-out opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0">
                    Click to view
                  </div>
                </div>
              </div>

              {/* SMOOTH OVERLAY EFFECT */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent opacity-0 group-hover:opacity-5 group-hover:to-white/10 transition-all duration-500 ease-out" />
            </div>

            {/* SMOOTH BORDER EFFECT */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500 ease-out pointer-events-none" />
          </div>
        ))}
      </div>

      {/* INTERVIEWS BADGE */}
      {stats.interviewScheduled > 0 && (
        <div className="mb-6">
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            <span className="font-medium">You have {stats.interviewScheduled} interview{stats.interviewScheduled > 1 ? 's' : ''} scheduled</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* RECENT APPLICATIONS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Applications</h3>
              <p className="text-sm text-gray-500 mt-1">Track your latest job applications</p>
            </div>
            <Link 
              to="/jobseeker/my-applications" 
              className="text-sm font-medium text-[#27AE60] hover:text-[#219653] transition-colors flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4 transition-transform duration-300 hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {applications.length > 0 ? applications.map((app) => {
              const status = getStatusConfig(app.status);
              const logoUrl = getCompanyLogo(app);
              const companyName = app.job?.companyName || app.employer?.employerProfile?.companyName || 'Company';
              const companyInitials = getCompanyInitials(companyName);
              
              return (
                <div 
                  key={app._id} 
                  className="px-6 py-5 transition-all duration-300 ease-out hover:bg-gray-50/80 group cursor-pointer active:bg-gray-100"
                  onClick={handleRecentApplicationClick}
                >
                  <div className="flex items-start gap-4">
                    
                    {/* COMPANY LOGO */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs transition-all duration-300 group-hover:shadow-sm group-hover:border-gray-300">
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={companyName} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallbackDiv = document.createElement('div');
                              fallbackDiv.className = "w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200";
                              fallbackDiv.innerHTML = `<span class="font-bold text-lg text-gray-700">${companyInitials}</span>`;
                              e.target.parentElement.appendChild(fallbackDiv);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 transition-all duration-300 group-hover:from-gray-200 group-hover:to-gray-300">
                            <span className="font-bold text-lg text-gray-700 transition-all duration-300 group-hover:text-gray-900">
                              {companyInitials}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 text-base leading-snug mb-1 line-clamp-1 transition-all duration-300 group-hover:text-gray-800">
                            {app.job?.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-1 transition-all duration-300 group-hover:text-gray-700">
                            {companyName}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border} transition-all duration-300 group-hover:shadow-sm`}>
                            <FontAwesomeIcon icon={status.icon} className="w-3 h-3 mr-1.5" />
                            {status.label}
                          </span>
                        </div>
                      </div>
                      
                      {/* JOB DETAILS */}
                      <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                        {app.job?.location && (
                          <div className="flex items-center gap-2 text-gray-600 transition-all duration-300 group-hover:text-gray-700">
                            <div className="w-4 h-4 flex items-center justify-center text-gray-400 transition-all duration-300 group-hover:text-gray-500">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3.5 h-3.5" />
                            </div>
                            <span className="leading-none">{app.job.location}</span>
                          </div>
                        )}
                        
                        {(app.job?.salaryMin || app.job?.salaryMax) && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#27AE60] leading-none ml-1 transition-all duration-300 group-hover:text-[#219653]">
                              {formatSalary(app.job.salaryMin, app.job.salaryMax)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* FOOTER */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 transition-all duration-300 group-hover:text-gray-600">
                          <svg className="w-4 h-4 text-gray-400 transition-all duration-300 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Applied {formatDate(app.appliedAt)}</span>
                        </div>
                        
                        {app.interviewDate && (
                          <div className="flex items-center gap-2 text-[#2D9CDB] font-medium transition-all duration-300 group-hover:text-[#2a8bc9]">
                            <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Interview {formatDate(app.interviewDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* CHEVRON INDICATOR */}
                    <div className="flex-shrink-0 transition-all duration-500 ease-out opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ml-2">
                      <svg className="w-5 h-5 text-gray-300 transition-all duration-300 group-hover:text-[#27AE60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="px-8 py-12 text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                  <svg className="w-8 h-8 text-gray-400 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-2">No applications yet</h4>
                <p className="text-gray-500 mb-7 max-w-sm mx-auto">Start applying to jobs to see them here</p>
                <button
                  onClick={() => navigate('/jobseeker/job-search')}
                  className="inline-flex items-center gap-2 bg-[#27AE60] hover:bg-[#219653] text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Jobs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* NOTIFICATIONS */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-50 rounded-lg transition-all duration-300 hover:bg-green-100">
                  <svg className="w-4 h-4 text-green-600 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="text-xs text-gray-500">
                      {notifications.filter(n => !n.isRead).length} unread
                    </span>
                  )}
                </div>
              </div>
              
              <Link 
                to="/jobseeker/notifications" 
                className="text-sm font-medium text-[#27AE60] hover:text-[#219653] transition-colors flex items-center gap-1"
              >
                View all
                <svg className="w-4 h-4 transition-transform duration-300 hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {notifications.length > 0 ? notifications.slice(0, 3).map((notif) => (
                <div 
                  key={notif._id} 
                  className={`px-5 py-4 transition-all duration-300 ease-out hover:bg-gray-50 cursor-pointer ${
                    !notif.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    
                    {/* NOTIFICATION ICON */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105 ${
                      !notif.isRead ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                      {(() => {
                        switch(notif.type) {
                          case 'job_match':
                            return (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            );
                          case 'application_update':
                            return (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            );
                          case 'new_message':
                            return (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                            );
                          case 'interview':
                            return (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            );
                          default:
                            return (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                            );
                        }
                      })()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-gray-900 text-sm leading-snug transition-all duration-300 hover:text-gray-800">
                          {notif.title}
                        </h4>
                        {/* BLUE DOT */}
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1 transition-all duration-300"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2 transition-all duration-300">
                        {notif.message}
                      </p>
                      
                      {/* METADATA */}
                      {notif.metadata && (
                        <div className="mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {notif.metadata.jobTitle && (
                              <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded transition-all duration-300 hover:bg-gray-200">
                                {notif.metadata.jobTitle}
                              </span>
                            )}
                            
                            {notif.metadata.companyName && (
                              <span className="text-xs text-gray-600 transition-all duration-300">
                                at {notif.metadata.companyName}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* TIME AND STATUS */}
                      <div className="flex items-center justify-between">
                        {notif.createdAt && (
                          <div className="text-xs text-gray-500 transition-all duration-300">
                            {formatDate(notif.createdAt)}
                          </div>
                        )}
                        
                        {/* CLICK HINT */}
                        <div className="text-xs text-[#27AE60] font-medium transition-all duration-300 hover:text-[#219653] flex items-center gap-1">
                          View
                          <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="px-5 py-8 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm text-gray-500">No new notifications</p>
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 transition-all duration-300 hover:shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Find Jobs', icon: faSearch, color: 'bg-blue-500', action: () => navigate('/jobseeker/job-search') },
                { label: 'My Profile', icon: faUserCircle, color: 'bg-green-500', action: () => navigate('/jobseeker/my-profile') },
                { label: 'Applications', icon: faFileAlt, color: 'bg-yellow-500', action: () => navigate('/jobseeker/my-applications') },
                { label: 'Resume', icon: faFileAlt, color: 'bg-purple-500', action: () => navigate('/jobseeker/resume-builder') }
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-gray-50 hover:bg-gray-100 p-4 rounded-xl flex flex-col items-center border border-gray-200 transition-all duration-300 ease-out hover:scale-105 hover:shadow-sm active:scale-95"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 transition-all duration-300 hover:scale-110`}>
                    <FontAwesomeIcon icon={action.icon} className="text-white text-lg transition-all duration-300" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm transition-all duration-300">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-6">
            <h3 className="font-bold text-lg mb-2">Ready for your next opportunity?</h3>
            <p className="text-green-100">Browse personalized job recommendations</p>
          </div>
          <button
            onClick={() => navigate('/jobseeker/job-search')}
            className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95"
          >
            <FontAwesomeIcon icon={faSearch} className="mr-2 transition-transform duration-300 group-hover:rotate-12" />
            Browse Jobs
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;