import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JobSeekerLayout from '../../../layouts/JobSeekerLayout';
import debounce from 'lodash/debounce';

// ✅ FontAwesome icons via react-icons
import {
  FaCheckCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaRegFileAlt // ✅ ADDED: for Profile Strength icon (better quality)
} from 'react-icons/fa';

// ====================
// YOUR COLOR PALETTE
// ====================
const COLORS = {
  primary: '#27AE60',       // Your green
  background: '#F9FAFB',    // Changed to light gray for subtle background
  textPrimary: '#000000',   // Black
  textSecondary: '#4B5563', // Gray for secondary text
  textTertiary: '#9CA3AF',  // Lighter gray for icons
  card: '#FFFFFF',          // White cards only
  success: '#27AE60',       // Green for success
  warning: '#F59E0B',       // Yellow for warning
  error: '#EF4444',         // Red for error
};

// ====================
// DESIGN SYSTEM
// ====================
const DESIGN_SYSTEM = {
  colors: {
    primary: {
      50: '#E8F5E9',
      100: '#C8E6C9',
      200: '#A5D6A7',
      300: '#81C784',
      400: '#66BB6A',
      500: COLORS.primary, // #27AE60
      600: '#43A047',
      700: '#388E3C',
      800: '#2E7D32',
      900: '#1B5E20',
    },
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    white: '#FFFFFF',
    black: COLORS.textPrimary,
  },

  typography: {
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-2xl font-semibold tracking-tight',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
    body: 'text-base font-normal',
    small: 'text-sm font-normal',
    caption: 'text-xs font-normal',
  },

  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
  },

  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
};

// ====================
// REUSABLE UI COMPONENTS
// ====================

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center';

  const variants = {
    primary: `bg-${COLORS.primary} text-white hover:opacity-90 focus:ring-${COLORS.primary}`,
    secondary: `bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300`,
    outline: `bg-transparent text-${COLORS.primary} border border-${COLORS.primary} hover:bg-green-50 focus:ring-${COLORS.primary}`,
    success: `bg-${COLORS.primary} text-white hover:opacity-90 focus:ring-${COLORS.primary}`,
    ghost: `text-gray-700 hover:bg-gray-100 focus:ring-gray-300`,
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2.5 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      style={{
        backgroundColor: variant === 'primary' || variant === 'success' ? COLORS.primary :
          variant === 'secondary' ? '#FFFFFF' : 'transparent',
        borderColor: variant === 'secondary' ? '#D1D5DB' :
          variant === 'outline' ? COLORS.primary : 'transparent',
        color: variant === 'primary' || variant === 'success' ? '#FFFFFF' :
          variant === 'outline' ? COLORS.primary : COLORS.textSecondary
      }}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <Spinner size="small" />
          <span className="ml-2">Loading...</span>
        </span>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      )}
    </button>
  );
};

const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
          style={{ color: COLORS.textSecondary }}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`
          w-full px-3.5 py-2.5 border rounded-lg
          text-gray-900 bg-white
          border-${error ? 'red-300' : 'gray-300'}
          focus:outline-none focus:ring-2 focus:ring-${COLORS.primary} focus:border-transparent
          transition-all duration-200
          placeholder:text-gray-400
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          ${className}
        `}
        style={{
          borderColor: error ? '#FCA5A5' : '#D1D5DB',
          color: COLORS.textPrimary
        }}
        {...props}
      />

      {(error || helperText) && (
        <p
          id={error ? `${inputId}-error` : `${inputId}-helper`}
          className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// ✅ UPDATED ALERT: FontAwesome icon + remove green vertical bar
const Alert = ({
  type = 'info',
  title,
  message,
  children,
  onClose
}) => {
  const alertConfig = {
    info: {
      bg: '#EFF6FF',
      text: '#1E40AF',
      icon: <FaInfoCircle className="text-blue-600 text-xl" />,
    },
    success: {
      bg: '#ECFDF5',
      text: '#065F46',
      icon: <FaCheckCircle className="text-green-600 text-xl" />,
    },
    warning: {
      bg: '#FEF3C7',
      text: '#92400E',
      icon: <FaExclamationTriangle className="text-yellow-600 text-xl" />,
    },
    error: {
      bg: '#FEE2E2',
      text: '#991B1B',
      icon: <FaTimesCircle className="text-red-600 text-xl" />,
    },
  };

  const config = alertConfig[type];

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className="flex items-start gap-3 p-4 rounded-lg mb-4"
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      <div className="mt-0.5">
        {config.icon}
      </div>

      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <p>{message || children}</p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-lg leading-none opacity-60 hover:opacity-100"
          aria-label="Close alert"
        >
          &times;
        </button>
      )}
    </div>
  );
};

const Spinner = ({ size = 'medium' }) => {
  const sizes = {
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-3',
    large: 'w-8 h-8 border-4',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizes[size]}`}
      style={{
        borderTopColor: 'transparent',
        borderRightColor: COLORS.primary,
        borderBottomColor: COLORS.primary,
        borderLeftColor: COLORS.primary,
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

// ====================
// MAIN PROFILE COMPONENT
// ====================

const MyProfile = () => {
  const navigate = useNavigate();

  // State Management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTab, setSavingTab] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('basic');
  const [profileStrength, setProfileStrength] = useState(0);
  const [resumeFile, setResumeFile] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [userData, setUserData] = useState(null);

  // ✅ ADDED: profile image upload state/refs (minimal change, fixed click-to-upload)
  const profileImageInputRef = useRef(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);

  // ✅ ADDED: AU Verification fields
  const [auData, setAuData] = useState({
    studentId: '',
    course: '',
    graduationYear: '',
    verificationStatus: 'Pending', // Pending | Verified | Rejected
  });

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    headline: '',
    location: '',
    education: '',
    experience: '',
    skills: [],
    linkedin: '',
    portfolio: '',
    resumeUrl: '',
  });

  const [skillsInput, setSkillsInput] = useState('');
  const autoSaveTimerRef = useRef(null);

  // ====================
  // HELPER FUNCTIONS
  // ====================

  const calculateProfileStrength = useCallback(() => {
    let score = 0;
    const maxScore = 100;

    if (formData.fullName.trim()) score += 20;
    if (formData.email.trim()) score += 20;
    if (formData.headline.trim()) score += 15;
    if (formData.experience.trim()) score += 15;
    if (formData.education.trim()) score += 10;
    if (Array.isArray(formData.skills) && formData.skills.length >= 3) score += 10;
    if (formData.resumeUrl) score += 10;
    if (formData.location.trim()) score += 5;
    if (formData.linkedin.trim() || formData.portfolio.trim()) score += 5;

    return Math.min(score, maxScore);
  }, [formData]);

  const getStrengthInfo = () => {
    if (profileStrength >= 80) {
      return { color: COLORS.primary, text: 'Strong', icon: '🌟' };
    }
    if (profileStrength >= 60) {
      return { color: '#F59E0B', text: 'Good', icon: '👍' };
    }
    if (profileStrength >= 40) {
      return { color: '#F59E0B', text: 'Basic', icon: '📝' };
    }
    return { color: '#EF4444', text: 'Weak', icon: '⚡' };
  };

  // ====================
  // ✅ PROFILE IMAGE UPLOAD (FIXED)
  // ====================

  const handleProfileImageClick = () => {
    if (profileImageUploading) return;
    profileImageInputRef.current?.click();
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // reset input value so same file can be selected again
    e.target.value = '';

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be less than 5MB.');
      return;
    }

    setError('');
    setSuccess('');
    setProfileImageUploading(true);

    try {
      const token = localStorage.getItem('token');

      // ✅ Upload to backend (adjust endpoint if your backend uses a different route)
      const imgForm = new FormData();
      imgForm.append('profileImage', file);

      const uploadResponse = await axios.post(
        'http://localhost:5000/api/auth/upload-profile-image',
        imgForm,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (uploadResponse.data?.success) {
        const updatedUser = uploadResponse.data.user || uploadResponse.data.updatedUser || null;
        const newProfileImage =
          uploadResponse.data.profileImage ||
          uploadResponse.data.profileImageUrl ||
          updatedUser?.profileImage;

        // update local UI
        setUserData(prev => ({
          ...(prev || {}),
          ...(updatedUser || {}),
          profileImage: newProfileImage || (updatedUser?.profileImage ?? prev?.profileImage)
        }));

        // update localStorage user if backend returns it
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        setLastSaved(new Date().toLocaleTimeString());
        setSuccess('Profile photo updated successfully!');
      } else {
        setError(uploadResponse.data?.message || 'Failed to upload profile photo. Please try again.');
      }
    } catch (err) {
      console.error('Profile image upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload profile photo. Please try again.');
    } finally {
      setProfileImageUploading(false);
    }
  };

  // ====================
  // AUTO-SAVE FUNCTIONALITY
  // ====================

  const debouncedAutoSave = useCallback(
    debounce(async (data, section) => {
      try {
        setSavingTab(section);
        const token = localStorage.getItem('token');

        let updateData = {};
        if (section === 'basic') {
          updateData = {
            fullName: data.fullName,
            jobSeekerProfile: {
              contactNumber: data.contactNumber,
              headline: data.headline,
              location: data.location,
              education: data.education,
            }
          };
        } else if (section === 'professional') {
          updateData = {
            jobSeekerProfile: {
              experience: data.experience,
              skills: data.skills,
              linkedin: data.linkedin,
              portfolio: data.portfolio,
            }
          };
        }

        if (Object.keys(updateData).length > 0) {
          await axios.put(
            'http://localhost:5000/api/auth/update-profile',
            updateData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          setLastSaved(new Date().toLocaleTimeString());
          setHasUnsavedChanges(false);
        }
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setSavingTab('');
      }
    }, 2000),
    []
  );

  // ====================
  // EVENT HANDLERS
  // ====================

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      debouncedAutoSave({ ...formData, [field]: value }, activeSection);
    }, 1000);
  };

  const handleSkillsChange = (value) => {
    setSkillsInput(value);

    const skillsArray = value.split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    const newSkills = [...new Set(skillsArray)];
    setFormData(prev => ({
      ...prev,
      skills: newSkills
    }));
    setHasUnsavedChanges(true);
  };

  const removeSkill = (index) => {
    const newSkills = formData.skills.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, skills: newSkills }));
    setSkillsInput(newSkills.join(', '));
    setHasUnsavedChanges(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, or DOCX file only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setResumeFile(file);
    setHasUnsavedChanges(true);
    setError('');
  };

  const saveCurrentSection = async () => {
    try {
      setSavingTab(activeSection);
      const token = localStorage.getItem('token');

      let updateData = {};

      if (activeSection === 'basic') {
        updateData = {
          fullName: formData.fullName,
          jobSeekerProfile: {
            contactNumber: formData.contactNumber,
            headline: formData.headline,
            location: formData.location,
            education: formData.education,
          }
        };
      } else if (activeSection === 'professional') {
        updateData = {
          jobSeekerProfile: {
            experience: formData.experience,
            skills: formData.skills,
            linkedin: formData.linkedin,
            portfolio: formData.portfolio,
          }
        };
      } else if (activeSection === 'resume' && resumeFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('resume', resumeFile);

        const uploadResponse = await axios.post(
          'http://localhost:5000/api/auth/upload-resume',
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (uploadResponse.data.success) {
          setFormData(prev => ({
            ...prev,
            resumeUrl: uploadResponse.data.resumeUrl
          }));
          setResumeFile(null);
          setHasUnsavedChanges(false);
          setLastSaved(new Date().toLocaleTimeString());
          setSuccess('Resume uploaded successfully!');
          return;
        }
      }

      const response = await axios.put(
        'http://localhost:5000/api/auth/update-profile',
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date().toLocaleTimeString());
        setSuccess(`Changes saved successfully!`);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSavingTab('');
    }
  };

  const handleSectionChange = async (newSection) => {
    if (hasUnsavedChanges) {
      const shouldSave = window.confirm('You have unsaved changes. Save before switching sections?');
      if (shouldSave) {
        await saveCurrentSection();
      }
    }
    setActiveSection(newSection);
  };

  const handleFinalSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      let finalResumeUrl = formData.resumeUrl;
      if (resumeFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('resume', resumeFile);

        const uploadResponse = await axios.post(
          'http://localhost:5000/api/auth/upload-resume',
          formDataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (uploadResponse.data.success) {
          finalResumeUrl = uploadResponse.data.resumeUrl;
        }
      }

      const updateData = {
        fullName: formData.fullName.trim(),
        jobSeekerProfile: {
          contactNumber: formData.contactNumber.trim(),
          headline: formData.headline.trim(),
          location: formData.location.trim(),
          education: formData.education.trim(),
          experience: formData.experience.trim(),
          skills: formData.skills,
          linkedin: formData.linkedin.trim(),
          portfolio: formData.portfolio.trim(),
          resumeUrl: finalResumeUrl,
        }
      };

      const response = await axios.put(
        'http://localhost:5000/api/auth/update-profile',
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setSuccess('Profile completed successfully!');
        setHasUnsavedChanges(false);
        setResumeFile(null);
        setTimeout(() => navigate('/jobseeker/dashboard'), 2000);
      }
    } catch (err) {
      console.error('Final save error:', err);
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ====================
  // EFFECTS
  // ====================

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          const user = response.data.user;
          const profile = user.jobSeekerProfile || {};

          const newFormData = {
            fullName: user.fullName || '',
            email: user.email || '',
            contactNumber: profile.contactNumber || '',
            headline: profile.headline || '',
            location: profile.location || '',
            education: profile.education || '',
            experience: profile.experience || '',
            skills: Array.isArray(profile.skills) ? profile.skills : [],
            linkedin: profile.linkedin || '',
            portfolio: profile.portfolio || '',
            resumeUrl: profile.resumeUrl || '',
          };

          // ✅ ADDED: AU fields (read-only)
          setAuData({
            studentId: profile.studentId || '',
            course: profile.course || '',
            graduationYear: profile.graduationYear || '',
            verificationStatus: profile.verificationStatus || 'Pending',
          });

          setFormData(newFormData);
          setUserData(user);
          setSkillsInput(newFormData.skills.join(', '));
          setLastSaved(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [navigate]);

  useEffect(() => {
    setProfileStrength(calculateProfileStrength());
  }, [formData, calculateProfileStrength]);

  // ====================
  // RENDER
  // ====================

  if (loading) {
    return (
      <JobSeekerLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-100 rounded-xl p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-gray-100 rounded-xl p-6 h-64"></div>
              </div>
            </div>
          </div>
        </div>
      </JobSeekerLayout>
    );
  }

  const strengthInfo = getStrengthInfo();

  // ✅ ADDED: verification badge ui config
  // ✅ CHANGED: hide badge when status is Pending
  const verificationUi = (() => {
    const status = (auData.verificationStatus || 'Pending').toLowerCase();
    if (status === 'verified') return { show: true, text: 'Verified', bg: 'bg-green-100', fg: 'text-green-800' };
    if (status === 'rejected') return { show: true, text: 'Rejected', bg: 'bg-red-100', fg: 'text-red-800' };
    return { show: false, text: 'Pending', bg: 'bg-yellow-100', fg: 'text-yellow-800' };
  })();

  return (
    <JobSeekerLayout>
      {/* REMOVED WHITE BACKGROUND - Clean look */}
      <div className="min-h-screen -mt-12">
        {/* HEADER SECTION */}
        <div className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            {/* ✅ HEADER CARD (same style as My Applications) */}
            <div
              className="
        relative
        rounded-2xl
        bg-gradient-to-r
        from-[#0e4739]
        via-[#17785b]
        to-green-600
        p-6 sm:p-8
        text-white
        shadow-sm
        overflow-hidden
      "
            >
              {/* 💡 SOFT GLOW LIGHT */}
              <div className="pointer-events-none absolute inset-0 z-0">
                <div
                  className="
            absolute
            w-[70px] sm:w-[110px]
            h-[70px] sm:h-[110px]
            rounded-full
            blur-[28px] sm:blur-[38px]
            bottom-[-55px] sm:bottom-[-70px]
            right-[-40px]
            opacity-60
          "
                  style={{
                    background:
                      'radial-gradient(circle, rgba(110,231,183,0.25) 0%, rgba(110,231,183,0.12) 45%, transparent 75%)'
                  }}
                />
              </div>

              {/* ✅ CONTENT */}
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* LEFT */}
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold">My Profile</h1>
                  <p className="text-sm sm:text-base text-white/90">
                    Complete your profile to attract better job opportunities
                  </p>
                </div>

                {/* ✅ WHITE PROFILE STRENGTH CARD (smaller, UI-safe) */}
                <div className="shrink-0">
                  <div className="bg-white rounded-xl border border-white/40 shadow-sm p-4 max-w-[360px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">
                        Profile Strength
                      </span>

                      <div className="flex items-center gap-2">
                        {/* ✅ CHANGED: emoji icon to high-quality vector icon */}
                        <FaRegFileAlt
                          className="text-base"
                          style={{ color: strengthInfo.color }}
                        />
                        <span
                          className="text-sm font-semibold"
                          style={{ color: strengthInfo.color }}
                        >
                          {strengthInfo.text}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${profileStrength}%`,
                          backgroundColor: strengthInfo.color
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{profileStrength}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>


              </div>
            </div>

          </div>
        </div>


        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Alert Messages */}
          {error && (
            <Alert
              type="error"
              title="Error"
              message={error}
              onClose={() => setError('')}
            />
          )}

          {success && (
            <Alert
              type="success"
              title="Success"
              message={success}
              onClose={() => setSuccess('')}
            />
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="text-center">
                    <div className="inline-block relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-white">
                        {userData?.profileImage ? (
                          <img src={userData.profileImage} alt={formData.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-green-100 text-green-600">
                            {formData.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* ✅ ADDED hidden file input for profile image */}
                      <input
                        ref={profileImageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={handleProfileImageClick}
                        disabled={profileImageUploading}
                        className="absolute bottom-4 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label="Upload profile photo"
                        title={profileImageUploading ? 'Uploading...' : 'Upload profile photo'}
                      >
                        {profileImageUploading ? (
                          <Spinner size="small" />
                        ) : (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mt-2">
                      {formData.fullName || 'Your Name'}
                    </h2>

                    {/* ✅ CHANGED: hide Pending badge */}
                    {verificationUi.show && (
                      <div className="mt-2 flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${verificationUi.bg} ${verificationUi.fg}`}>
                          {verificationUi.text}
                        </span>
                      </div>
                    )}

                    {formData.headline && (
                      <p className="mt-2 text-green-600">
                        {formData.headline}
                      </p>
                    )}

                    {formData.location && (
                      <div className="flex items-center justify-center mt-2 text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{formData.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89-4.26a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{formData.email}</span>
                    </div>

                    {formData.contactNumber && (
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{formData.contactNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Profile Overview
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Skills</span>
                    <div className="flex items-center">
                      <span className="font-bold text-gray-900 mr-2">
                        {formData.skills.length}
                      </span>
                      <div className={`w-16 h-2 rounded-full ${formData.skills.length >= 5 ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.min(formData.skills.length * 20, 100)}%`,
                            backgroundColor: formData.skills.length >= 5 ? COLORS.success : COLORS.warning
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Resume</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${formData.resumeUrl
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {formData.resumeUrl ? 'Uploaded' : 'Required'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Experience</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${formData.experience.trim()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {formData.experience.trim() ? 'Added' : 'Recommended'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Save Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Saved</span>
                    <span className="font-medium">{lastSaved || 'Never'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Unsaved Changes</span>
                    <span className={`font-medium ${hasUnsavedChanges ? 'text-amber-600' : 'text-green-600'}`}>
                      {hasUnsavedChanges ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={saveCurrentSection}
                      disabled={!hasUnsavedChanges || savingTab === activeSection}
                      loading={savingTab === activeSection}
                    >
                      Save Current Section
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Edit Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Form Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex overflow-x-auto">
                    {['basic', 'professional', 'resume'].map((section) => (
                      <button
                        key={section}
                        onClick={() => {
                          handleSectionChange(section);
                          document.getElementById(`${section}-section`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeSection === section
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        style={{
                          borderBottomColor: activeSection === section ? COLORS.primary : 'transparent',
                          color: activeSection === section ? COLORS.primary : COLORS.textSecondary
                        }}
                      >
                        {section === 'basic' && 'Basic Info'}
                        {section === 'professional' && 'Professional'}
                        {section === 'resume' && 'Resume'}
                      </button>
                    ))}
                  </nav>
                </div>

                <form onSubmit={handleFinalSave}>
                  <div className="p-6">
                    {/* Basic Information Section */}
                    {activeSection === 'basic' && (
                      <div id="basic-section" className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                        <p className="text-gray-600 mb-6">Tell us about yourself</p>

                        {/* ✅ ADDED: AU Graduate verification block (read-only) */}
                        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-sm font-semibold text-gray-900">AU Graduate Info</div>

                            {/* ✅ CHANGED: hide Pending badge */}
                            {verificationUi.show && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${verificationUi.bg} ${verificationUi.fg}`}>
                                {verificationUi.text}
                              </span>
                            )}
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mt-4">
                            <Input
                              label="Student ID"
                              value={auData.studentId}
                              disabled
                            />
                            <Input
                              label="Course"
                              value={auData.course}
                              disabled
                            />
                            <Input
                              label="Graduation Year"
                              value={auData.graduationYear}
                              disabled
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <Input
                            label="Full Name"
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            placeholder="Enter your full name"
                            required
                            disabled
                          />

                          <Input
                            label="Email Address"
                            value={formData.email}
                            disabled
                          />

                          <Input
                            label="Professional Headline"
                            value={formData.headline}
                            onChange={(e) => handleChange('headline', e.target.value)}
                            placeholder="e.g., React Developer"
                            helperText="What best describes your role"
                          />

                          <Input
                            label="Location"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="e.g., Manila, Philippines"
                          />

                          <Input
                            label="Contact Number"
                            type="tel"
                            value={formData.contactNumber}
                            onChange={(e) => handleChange('contactNumber', e.target.value)}
                            placeholder="+63 912 345 6789"
                          />

                          {/* ✅ REMOVED: Highest Education field */}
                        </div>
                      </div>
                    )}

                    {/* Professional Information Section - CLEANED */}
                    {activeSection === 'professional' && (
                      <div id="professional-section" className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Professional Information</h2>
                        <p className="text-gray-600 mb-6">Showcase your skills and experience</p>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Work Experience
                          </label>
                          <textarea
                            value={formData.experience}
                            onChange={(e) => handleChange('experience', e.target.value)}
                            rows="5"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            placeholder="• Developed web applications using React and Node.js...
• Led a team of developers...
• Improved performance by 40%..."
                            style={{
                              borderColor: '#D1D5DB',
                              color: COLORS.textPrimary
                            }}
                          />
                          <p className="text-sm text-gray-500 mt-2">Use bullet points and focus on achievements</p>
                        </div>

                        {/* Clean Skills Section - NO QUICK ADD */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Skills
                          </label>

                          {/* Simple Skills Input */}
                          <div className="mb-4">
                            <input
                              value={skillsInput}
                              onChange={(e) => handleSkillsChange(e.target.value)}
                              placeholder="e.g., JavaScript, React, Node.js, TypeScript, Communication"
                              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                              style={{
                                borderColor: '#D1D5DB',
                                color: COLORS.textPrimary
                              }}
                            />
                            <p className="text-sm text-gray-500 mt-2">Separate skills with commas</p>
                          </div>

                          {/* Skills Display - Clean */}
                          {formData.skills.length > 0 && (
                            <div className="mt-6">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium text-gray-900">
                                  Your Skills ({formData.skills.length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {formData.skills.map((skill, index) => (
                                  <div
                                    key={index}
                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium"
                                    style={{
                                      backgroundColor: `${COLORS.primary}15`,
                                      color: COLORS.primary,
                                      border: `1px solid ${COLORS.primary}30`
                                    }}
                                  >
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => removeSkill(index)}
                                      className="ml-2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                                      aria-label={`Remove ${skill}`}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <Input
                            label="Facebook Profile"
                            type="url"
                            value={formData.linkedin}
                            onChange={(e) => handleChange('linkedin', e.target.value)}
                            placeholder="https://facebook.com/in/yourname"
                          />

                          <Input
                            label="Portfolio Website"
                            type="url"
                            value={formData.portfolio}
                            onChange={(e) => handleChange('portfolio', e.target.value)}
                            placeholder="https://yourportfolio.com"
                          />
                        </div>
                      </div>
                    )}

                    {/* Resume Section */}
                    {activeSection === 'resume' && (
                      <div id="resume-section" className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Resume / CV</h2>
                        <p className="text-gray-600 mb-6">Upload your resume to increase job opportunities</p>

                        {/* Current Resume */}
                        {formData.resumeUrl && (
                          <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Resume Uploaded</p>
                                  <button
                                    type="button"
                                    onClick={() => window.open(formData.resumeUrl, '_blank')}
                                    className="text-sm text-green-600 hover:underline"
                                    style={{ color: COLORS.primary }}
                                  >
                                    View current resume
                                  </button>
                                </div>
                              </div>
                              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Uploaded
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Upload Area */}
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer bg-gray-50"
                          onClick={() => document.getElementById('file-upload').click()}
                          role="button"
                          tabIndex="0"
                          style={{
                            borderColor: '#D1D5DB'
                          }}
                        >
                          <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                          />

                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>

                          <div className="mb-2">
                            <span className="font-medium" style={{ color: COLORS.primary }}>Click to upload</span>
                            <span className="text-gray-600"> or drag and drop</span>
                          </div>

                          <p className="text-sm text-gray-500">
                            PDF, DOC, DOCX up to 5MB
                          </p>
                        </div>

                        {resumeFile && (
                          <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <svg className="w-8 h-8 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                  <p className="font-medium text-gray-900">New Resume Ready</p>
                                  <p className="text-sm text-gray-600">
                                    {resumeFile.name} • {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="text-sm font-medium text-yellow-700">
                                Ready to upload
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-8 border-t border-gray-200 mt-8">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* INALIS ANG BACK TO DASHBOARD BUTTON DITO */}

                        <div className="flex gap-3 ml-auto">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={saveCurrentSection}
                            disabled={!hasUnsavedChanges || savingTab === activeSection}
                            loading={savingTab === activeSection}
                          >
                            {savingTab === activeSection ? 'Saving...' : 'Save Section'}
                          </Button>

                          {activeSection === 'resume' ? (
                            <Button
                              type="submit"
                              loading={saving}
                              disabled={saving}
                            >
                              {saving ? 'Completing...' : 'Complete Profile'}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={async () => {
                                if (hasUnsavedChanges) {
                                  await saveCurrentSection();
                                }
                                const sections = ['basic', 'professional', 'resume'];
                                const currentIndex = sections.indexOf(activeSection);
                                handleSectionChange(sections[currentIndex + 1]);
                              }}
                            >
                              Next Section →
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </JobSeekerLayout>
  );
};

export default MyProfile;
