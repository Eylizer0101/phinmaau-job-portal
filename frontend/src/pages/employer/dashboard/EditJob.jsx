import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import EmployerLayout from '../../../layouts/EmployerLayout';

/* =======================
   UI helpers
======================= */
const Alert = ({ type, children, onClose }) => {
  const isError = type === 'error';
  const styles = isError
    ? 'border-red-200 bg-red-50 text-red-900'
    : 'border-green-200 bg-green-50 text-green-900';

  const ring = isError ? 'focus-visible:ring-red-600' : 'focus-visible:ring-green-600';

  return (
    <div
      className={`mb-5 flex items-start justify-between gap-4 rounded-xl border p-4 text-sm font-medium ${styles}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div className="min-w-0">{children}</div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 ${ring}`}
          aria-label="Dismiss message"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

const Field = ({ id, label, required, hint, error, children }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const childWithA11y =
    React.isValidElement(children)
      ? React.cloneElement(children, {
          id,
          'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': !!error,
        })
      : children;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-900">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      {childWithA11y}

      {hint && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

/* =======================
   Date helpers (local ISO)
======================= */
const getLocalISODate = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const addDaysLocalISO = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return getLocalISODate(d);
};

const stableStringify = (obj) => JSON.stringify(obj, Object.keys(obj).sort());

// ✅ normalize legacy experience levels to AU-focused values
const normalizeExperienceLevel = (level) => {
  const v = String(level || '').trim();

  if (v === 'Internship' || v === 'Entry Level' || v === 'Junior') return v;

  if (v === 'Mid Level') return 'Junior';
  if (v === 'Senior Level') return 'Junior';
  if (v === 'Executive') return 'Junior';

  return 'Entry Level';
};

// ✅ normalize category: Other -> Others, blank -> Others
const normalizeCategory = (industry) => {
  const v = String(industry || '').trim();
  if (!v) return 'Others';
  if (v === 'Other') return 'Others';
  if (v === 'Others') return 'Others';
  return v;
};

// normalize snapshot to match formData shape (strings)
const toFormSnapshot = (data) => ({
  title: data.title ?? '',
  description: data.description ?? '',
  requirements: data.requirements ?? '',
  jobType: data.jobType ?? 'Full-time',
  salaryMin: data.salaryMin === null || data.salaryMin === undefined ? '' : String(data.salaryMin),
  salaryMax: data.salaryMax === null || data.salaryMax === undefined ? '' : String(data.salaryMax),
  salaryType: data.salaryType ?? 'Monthly',
  workMode: data.workMode ?? 'On-site',
  applicationDeadline: data.applicationDeadline ?? '',
  vacancies: data.vacancies ? String(data.vacancies) : '1',
  skillsRequired: Array.isArray(data.skillsRequired)
    ? data.skillsRequired.join(', ')
    : data.skillsRequired ?? '',
  experienceLevel: normalizeExperienceLevel(data.experienceLevel ?? 'Entry Level'),
  isActive: data.isActive ?? true,
  isPublished: data.isPublished ?? true,
});

const EditJob = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [job, setJob] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);

  const initialFormRef = useRef(null);
  const hasLoadedInitialRef = useRef(false);

  // ✅ GET COMPANY PROFILE DEFAULTS (for preview only)
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  // ✅ NEW: verification gate (draft allowed, publish blocked)
  const verificationStatus = useMemo(() => {
    return storedUser?.employerProfile?.verificationDocs?.overallStatus || 'unverified';
  }, [storedUser]);

  const canPublish = useMemo(() => {
    // Support both new field + legacy field
    return verificationStatus === 'verified' || storedUser?.isVerified === true;
  }, [verificationStatus, storedUser]);

  const verificationBannerMessage = useMemo(() => {
    if (canPublish) return '';
    if (verificationStatus === 'pending')
      return 'Verification is pending. You can save drafts, but you cannot publish until approved by admin.';
    if (verificationStatus === 'rejected')
      return 'Verification was rejected. You can save drafts, but you cannot publish until you resubmit and get approved.';
    return 'Your company is not verified yet. You can save drafts, but you cannot publish until verified by admin.';
  }, [canPublish, verificationStatus]);

  // ✅ FIX: use job.location when available, else employer profile address
  const companyLocationFromProfile = useMemo(() => {
    const jobLoc = String(job?.location || '').trim();
    if (jobLoc) return jobLoc;
    return String(storedUser?.employerProfile?.companyAddress || '').trim() || 'Company location';
  }, [job?.location, storedUser]);

  // ✅ FIX: use job.category if available, else employer industry; normalize Other -> Others
  const companyCategoryDefault = useMemo(() => {
    const fromJob = normalizeCategory(job?.category);
    if (fromJob) return fromJob;
    return normalizeCategory(storedUser?.employerProfile?.industry);
  }, [job?.category, storedUser]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    jobType: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    salaryType: 'Monthly',
    workMode: 'On-site',
    applicationDeadline: '',
    vacancies: '1',
    skillsRequired: '',
    experienceLevel: 'Entry Level',
    isActive: true,
    isPublished: true,
  });

  const isBusy = savingDraft || publishing || savingChanges || deleting || togglingStatus;

  const inputBase =
    'w-full rounded-xl border px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed';

  const inputClass = (hasError) =>
    `${inputBase} ${
      hasError
        ? 'border-red-300 focus-visible:ring-red-600 focus-visible:border-red-600'
        : 'border-gray-300 focus-visible:ring-green-600 focus-visible:border-green-600'
    }`;

  const selectClass =
    'w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600 focus-visible:border-green-600 disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed';

  const markTouched = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'experienceLevel') {
      setFormData((prev) => ({ ...prev, [name]: normalizeExperienceLevel(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    setError('');
    setSuccess('');
  };

  const jobTypes = useMemo(() => ['Full-time', 'Part-time', 'Contract'], []);
  const workModes = useMemo(() => ['On-site', 'Remote', 'Hybrid'], []);
  const salaryTypes = useMemo(() => ['Monthly', 'Yearly', 'Hourly', 'Project-based'], []);

  const experienceLevels = useMemo(() => ['Internship', 'Entry Level', 'Junior'], []);

  const minDeadlineISO = useMemo(() => addDaysLocalISO(1), []);
  const todayISO = useMemo(() => getLocalISODate(new Date()), []);

  const skillsAll = useMemo(() => {
    return (formData.skillsRequired || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [formData.skillsRequired]);

  const skills = useMemo(() => skillsAll.slice(0, 10), [skillsAll]);
  const skillsCountValid = useMemo(() => skillsAll.length <= 10, [skillsAll.length]);

  const trimSkillsToLimit = useCallback(() => {
    const list = (formData.skillsRequired || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (list.length <= 10) return;
    setFormData((prev) => ({ ...prev, skillsRequired: list.slice(0, 10).join(', ') }));
  }, [formData.skillsRequired]);

  const salaryValid = useMemo(() => {
    if (!formData.salaryMin || !formData.salaryMax) return true;
    const min = Number(formData.salaryMin);
    const max = Number(formData.salaryMax);
    if (Number.isNaN(min) || Number.isNaN(max)) return true;
    return min <= max;
  }, [formData.salaryMin, formData.salaryMax]);

  const vacanciesValid = useMemo(() => {
    const v = Number(formData.vacancies);
    if (Number.isNaN(v)) return false;
    return v >= 1;
  }, [formData.vacancies]);

  const isDeadlineValid = useMemo(() => {
    if (!formData.applicationDeadline) return false;
    return formData.applicationDeadline >= minDeadlineISO;
  }, [formData.applicationDeadline, minDeadlineISO]);

  const derivedStatus = useMemo(() => {
    if (formData.isPublished === false) return 'Draft';
    if (!formData.applicationDeadline) return formData.isActive ? 'Open' : 'Closed';

    const expired = formData.applicationDeadline < minDeadlineISO;
    if (expired) return 'Expired';

    return formData.isActive ? 'Open' : 'Closed';
  }, [formData.isPublished, formData.isActive, formData.applicationDeadline, minDeadlineISO]);

  const statusPillClass = useMemo(() => {
    if (derivedStatus === 'Draft') return 'bg-gray-100 text-gray-800 border border-gray-200';
    if (derivedStatus === 'Open') return 'bg-green-50 text-green-800 border border-green-200';
    if (derivedStatus === 'Expired') return 'bg-amber-50 text-amber-800 border border-amber-200';
    return 'bg-red-50 text-red-800 border border-red-200';
  }, [derivedStatus]);

  const salaryRangeText = useMemo(() => {
    const min = formData.salaryMin ? Number(formData.salaryMin).toLocaleString() : '';
    const max = formData.salaryMax ? Number(formData.salaryMax).toLocaleString() : '';
    const unitRaw = (formData.salaryType || '').toLowerCase();
    const unit =
      unitRaw === 'yearly'
        ? 'per year'
        : unitRaw === 'monthly'
        ? 'per month'
        : unitRaw === 'hourly'
        ? 'per hour'
        : unitRaw
        ? `per ${unitRaw}`
        : '';

    if (!min && !max) return 'Salary not specified';
    if (min && !max) return `₱${min} ${unit}`;
    if (!min && max) return `Up to ₱${max} ${unit}`;
    return `₱${min} – ₱${max} ${unit}`;
  }, [formData.salaryMin, formData.salaryMax, formData.salaryType]);

  const requiredOk = useMemo(() => {
    return (
      formData.title.trim() &&
      formData.description.trim().length >= 80 &&
      formData.requirements.trim().length >= 40 &&
      vacanciesValid &&
      isDeadlineValid &&
      salaryValid &&
      skillsCountValid
    );
  }, [formData, isDeadlineValid, salaryValid, skillsCountValid, vacanciesValid]);

  const fieldErrors = useMemo(() => {
    const errors = {};

    if ((touched.title || submitted) && !formData.title.trim()) {
      errors.title = 'Job title is required.';
    }

    if ((touched.description || submitted) && !formData.description.trim()) {
      errors.description = 'Job description is required.';
    } else if (
      (touched.description || submitted) &&
      formData.description.trim().length > 0 &&
      formData.description.trim().length < 80
    ) {
      errors.description = 'Job description must be at least 80 characters.';
    }

    if ((touched.requirements || submitted) && !formData.requirements.trim()) {
      errors.requirements = 'Job requirements are required.';
    } else if (
      (touched.requirements || submitted) &&
      formData.requirements.trim().length > 0 &&
      formData.requirements.trim().length < 40
    ) {
      errors.requirements = 'Requirements must be at least 40 characters.';
    }

    if ((touched.vacancies || submitted) && !vacanciesValid) {
      errors.vacancies = 'Vacancies must be 1 or more.';
    }

    if ((touched.salaryMin || touched.salaryMax || submitted) && !salaryValid) {
      errors.salary = 'Minimum salary must be ≤ maximum salary.';
    }

    if ((touched.applicationDeadline || submitted) && !formData.applicationDeadline) {
      errors.applicationDeadline = 'Application deadline is required.';
    } else if (
      (touched.applicationDeadline || submitted) &&
      formData.applicationDeadline &&
      !isDeadlineValid
    ) {
      errors.applicationDeadline = 'Application deadline must be at least tomorrow.';
    }

    if ((touched.skillsRequired || submitted) && !skillsCountValid) {
      errors.skillsRequired = `Please limit skills to 10. You entered ${skillsAll.length}.`;
    }

    return errors;
  }, [
    formData,
    touched,
    submitted,
    salaryValid,
    isDeadlineValid,
    skillsCountValid,
    skillsAll.length,
    vacanciesValid,
  ]);

  const validateStrict = () => {
    if (!formData.title.trim()) return 'Job title is required';
    if (!formData.description.trim()) return 'Job description is required';
    if (formData.description.trim().length < 80) return 'Job description must be at least 80 characters';
    if (!formData.requirements.trim()) return 'Job requirements are required';
    if (formData.requirements.trim().length < 40) return 'Requirements must be at least 40 characters';
    if (!vacanciesValid) return 'Vacancies must be 1 or more';
    if (!formData.applicationDeadline) return 'Application deadline is required';
    if (!isDeadlineValid) return 'Application deadline must be at least tomorrow';
    if (!salaryValid) return 'Minimum salary cannot be greater than maximum salary';
    if (!skillsCountValid) return 'Skills must be 10 or fewer';

    const exp = normalizeExperienceLevel(formData.experienceLevel);
    if (!['Internship', 'Entry Level', 'Junior'].includes(exp)) return 'Invalid experience level';

    return '';
  };

  const focusFirstError = useCallback((errors) => {
    const order = [
      'title',
      'description',
      'requirements',
      'vacancies',
      'applicationDeadline',
      'skillsRequired',
      'salary',
    ];

    const firstKey = order.find((k) => errors?.[k]);
    if (!firstKey) return;

    const idMap = {
      title: 'title',
      description: 'description',
      requirements: 'requirements',
      vacancies: 'vacancies',
      applicationDeadline: 'applicationDeadline',
      skillsRequired: 'skillsRequired',
      salary: 'salaryMin',
    };

    const el = document.getElementById(idMap[firstKey]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.focus(), 150);
    }
  }, []);

  const buildPayload = ({ mode }) => {
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      requirements: formData.requirements.trim(),
      jobType: formData.jobType,
      salaryMin: formData.salaryMin === '' ? null : Number(formData.salaryMin),
      salaryMax: formData.salaryMax === '' ? null : Number(formData.salaryMax),
      salaryType: formData.salaryType,
      workMode: formData.workMode,
      applicationDeadline: formData.applicationDeadline || null,
      vacancies: formData.vacancies ? Number(formData.vacancies) : 1,
      experienceLevel: normalizeExperienceLevel(formData.experienceLevel),
      skillsRequired: skills.join(', '),
      skills: skills,

      // ✅ keep category normalized if you ever pass it
      category: companyCategoryDefault || normalizeCategory(storedUser?.employerProfile?.industry),
    };

    if (mode === 'draft') {
      payload.isPublished = false;
      payload.isActive = false;
    } else if (mode === 'publish') {
      payload.isPublished = true;
      payload.isActive = true;
    } else {
      payload.isPublished = formData.isPublished;
      payload.isActive = formData.isActive;
    }

    return payload;
  };

  const isDirty = useMemo(() => {
    if (!hasLoadedInitialRef.current || !initialFormRef.current) return false;
    return stableStringify(initialFormRef.current) !== stableStringify(formData);
  }, [formData]);

  const confirmLeaveIfDirty = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm('You have unsaved changes. Discard and leave this page?');
  }, [isDirty]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const onPopState = () => {
      if (!isDirty) return;
      const ok = window.confirm('You have unsaved changes. Discard and leave this page?');
      if (!ok) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isDirty]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        clearMessages();

        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data?.success) {
          setError('Job not found.');
          setJob(null);
          return;
        }

        const jobData = res.data.job;
        setJob(jobData);

        const nextForm = toFormSnapshot({
          ...jobData,
          applicationDeadline: jobData.applicationDeadline
            ? jobData.applicationDeadline.split('T')[0]
            : '',
          skillsRequired: Array.isArray(jobData.skillsRequired)
            ? jobData.skillsRequired.join(', ')
            : jobData.skillsRequired || '',
        });

        setFormData(nextForm);
        initialFormRef.current = nextForm;
        hasLoadedInitialRef.current = true;

        setSubmitted(false);
        setTouched({});
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/employer/login');
          return;
        }
        setError('Failed to load job details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const persist = async (payload) => {
    const token = localStorage.getItem('token');
    const res = await axios.put(`http://localhost:5000/api/jobs/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Failed to save.');
    }

    const updatedJob = res.data?.job;

    const snapshot = toFormSnapshot({
      ...formData,
      ...(updatedJob || {}),
      ...(payload || {}),
      applicationDeadline: updatedJob?.applicationDeadline
        ? String(updatedJob.applicationDeadline).split('T')[0]
        : payload?.applicationDeadline
        ? String(payload.applicationDeadline).split('T')[0]
        : formData.applicationDeadline,
      skillsRequired:
        updatedJob?.skillsRequired && Array.isArray(updatedJob.skillsRequired)
          ? updatedJob.skillsRequired.join(', ')
          : payload?.skillsRequired ?? formData.skillsRequired,
      salaryMin:
        updatedJob?.salaryMin !== undefined
          ? updatedJob.salaryMin === null
            ? ''
            : String(updatedJob.salaryMin)
          : payload?.salaryMin === null
          ? ''
          : payload?.salaryMin !== undefined
          ? String(payload.salaryMin)
          : formData.salaryMin,
      salaryMax:
        updatedJob?.salaryMax !== undefined
          ? updatedJob.salaryMax === null
            ? ''
            : String(updatedJob.salaryMax)
          : payload?.salaryMax === null
          ? ''
          : payload?.salaryMax !== undefined
          ? String(payload.salaryMax)
          : formData.salaryMax,
      vacancies:
        updatedJob?.vacancies !== undefined
          ? String(updatedJob.vacancies || 1)
          : payload?.vacancies !== undefined
          ? String(payload.vacancies || 1)
          : formData.vacancies,
      isPublished:
        updatedJob?.isPublished !== undefined
          ? updatedJob.isPublished
          : payload?.isPublished ?? formData.isPublished,
      isActive:
        updatedJob?.isActive !== undefined ? updatedJob.isActive : payload?.isActive ?? formData.isActive,
    });

    initialFormRef.current = snapshot;
    setFormData(snapshot);
    return res;
  };

  const handleSaveDraft = async () => {
    setSubmitted(true);
    clearMessages();

    if (!formData.title.trim()) {
      setError('Please add a job title before saving as draft.');
      focusFirstError({ title: 'required' });
      return;
    }

    setSavingDraft(true);
    try {
      const payload = buildPayload({ mode: 'draft' });
      await persist(payload);
      setSuccess('Draft saved.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setSubmitted(true);
    clearMessages();

    // ✅ NEW: publish gate (draft allowed)
    if (!canPublish) {
      setError(verificationBannerMessage || 'You cannot publish until verified.');
      return;
    }

    const msg = validateStrict();
    if (msg) {
      setError('Please fix the highlighted fields.');
      focusFirstError(fieldErrors);
      return;
    }

    setPublishing(true);
    try {
      const payload = buildPayload({ mode: 'publish' });
      await persist(payload);

      setSuccess('Job updated & published.');
      setTimeout(() => navigate('/employer/manage-jobs'), 900);
    } catch (err) {
      console.error(err);

      // ✅ NEW: show backend verification message if returned
      const serverCode = err.response?.data?.code;
      const serverMsg = err.response?.data?.message;
      if (err.response?.status === 403 && serverCode === 'EMPLOYER_NOT_VERIFIED') {
        setError(serverMsg || verificationBannerMessage || 'You cannot publish until verified.');
      } else {
        setError(err.message || 'Failed to publish job. Please try again.');
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveChanges = async () => {
    setSubmitted(true);
    clearMessages();

    const msg = validateStrict();
    if (msg) {
      setError('Please fix the highlighted fields.');
      focusFirstError(fieldErrors);
      return;
    }

    setSavingChanges(true);
    try {
      const payload = buildPayload({ mode: 'update' });
      await persist(payload);
      setSuccess('Changes saved.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleStatusToggle = async () => {
    clearMessages();

    if (formData.isPublished === false) {
      setError('Draft job cannot be opened/closed. Publish it first.');
      return;
    }
    if (derivedStatus === 'Expired') {
      setError('This job is expired. Update the deadline first.');
      return;
    }

    setTogglingStatus(true);
    try {
      const token = localStorage.getItem('token');
      const newActive = !formData.isActive;

      const res = await axios.put(
        `http://localhost:5000/api/jobs/${id}`,
        { isActive: newActive },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (!res.data?.success) {
        setError(res.data?.message || 'Failed to update status.');
        return;
      }

      const snapshot = toFormSnapshot({
        ...formData,
        isActive: newActive,
      });
      initialFormRef.current = snapshot;
      setFormData(snapshot);

      setSuccess(`Job ${newActive ? 'opened' : 'closed'}.`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    clearMessages();

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Job deleted.');
      setTimeout(() => navigate('/employer/manage-jobs'), 700);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete job.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    if (!showDeleteModal) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = setTimeout(() => cancelBtnRef.current?.focus(), 0);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDeleteModal(false);
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
      document.body.style.overflow = prevOverflow;
    };
  }, [showDeleteModal]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const descLen = formData.description.trim().length;
  const reqLen = formData.requirements.trim().length;

  const showDescCounterRed =
    (touched.description || submitted) && descLen > 0 && descLen < 80;
  const showReqCounterRed =
    (touched.requirements || submitted) && reqLen > 0 && reqLen < 40;

  const isDraft = formData.isPublished === false;
  const isExpired = derivedStatus === 'Expired';
  const primaryActionLabel = isDraft ? 'Publish Job' : 'Save changes';
  const primaryActionHandler = isDraft ? handlePublish : handleSaveChanges;

  const statusButtonLabel = useMemo(() => {
    if (togglingStatus) return 'Updating…';
    if (isDraft) return 'Publish first';
    if (isExpired) return 'Update deadline';
    return formData.isActive ? 'Close' : 'Open';
  }, [togglingStatus, isDraft, isExpired, formData.isActive]);

  if (loading) {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-600" />
              <p className="mt-4 text-sm text-gray-600">Loading job details...</p>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  if (!job && error) {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <div className="mt-6">
                <Link
                  to="/employer/manage-jobs"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
                >
                  Back to Manage Jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-1 py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmLeaveIfDirty()) return;
                    navigate('/employer/manage-jobs');
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </button>

                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass}`}>
                  {derivedStatus}
                </span>

                {isDirty && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                    Unsaved changes
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900">Edit Job Post</h1>
              <p className="text-gray-600">Update details and preview what jobseekers will see.</p>

              {/* ✅ NEW: verification banner (only matters when draft and trying to publish, but helpful always) */}
              {!canPublish && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">Verification required to publish</p>
                  <p className="mt-1 text-sm text-amber-800">
                    Status: <span className="font-bold">{verificationStatus}</span>. {verificationBannerMessage}
                  </p>
                </div>
              )}
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-5">
                  <h2 className="text-lg font-bold text-gray-900">Job information</h2>
                  <p className="text-sm text-gray-500">Keep it clear and specific.</p>
                </div>

                <div className="px-6 py-6 space-y-10">
                  <section className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-gray-900">Basics</h3>
                      <span className="text-xs text-gray-500">Fields with * are required</span>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Field
                          id="title"
                          label="Job Title"
                          required
                          hint='Example: "Frontend Developer"'
                          error={fieldErrors.title}
                        >
                          <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            onBlur={() => markTouched('title')}
                            className={inputClass(!!fieldErrors.title)}
                            placeholder="e.g., Frontend Developer"
                            required
                            disabled={isBusy}
                          />
                        </Field>
                      </div>

                      <Field id="jobType" label="Job Type" required>
                        <select
                          name="jobType"
                          value={formData.jobType}
                          onChange={handleChange}
                          onBlur={() => markTouched('jobType')}
                          className={selectClass}
                          disabled={isBusy}
                        >
                          {jobTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field id="experienceLevel" label="Experience Level">
                        <select
                          name="experienceLevel"
                          value={formData.experienceLevel}
                          onChange={handleChange}
                          onBlur={() => markTouched('experienceLevel')}
                          className={selectClass}
                          disabled={isBusy}
                        >
                          {experienceLevels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field id="workMode" label="Work Mode" required>
                        <select
                          name="workMode"
                          value={formData.workMode}
                          onChange={handleChange}
                          onBlur={() => markTouched('workMode')}
                          className={selectClass}
                          disabled={isBusy}
                        >
                          {workModes.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3 className="text-base font-bold text-gray-900">Compensation (optional)</h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      <Field id="salaryMin" label="Minimum Salary">
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500">₱</span>
                          <input
                            type="number"
                            name="salaryMin"
                            value={formData.salaryMin}
                            onChange={handleChange}
                            onBlur={() => markTouched('salaryMin')}
                            className={`${inputClass(!!fieldErrors.salary)} pl-8`}
                            placeholder="Min"
                            min="0"
                            disabled={isBusy}
                          />
                        </div>
                      </Field>

                      <Field id="salaryMax" label="Maximum Salary">
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500">₱</span>
                          <input
                            type="number"
                            name="salaryMax"
                            value={formData.salaryMax}
                            onChange={handleChange}
                            onBlur={() => markTouched('salaryMax')}
                            className={`${inputClass(!!fieldErrors.salary)} pl-8`}
                            placeholder="Max"
                            min="0"
                            disabled={isBusy}
                          />
                        </div>
                      </Field>

                      <Field id="salaryType" label="Salary Type">
                        <select
                          name="salaryType"
                          value={formData.salaryType}
                          onChange={handleChange}
                          onBlur={() => markTouched('salaryType')}
                          className={selectClass}
                          disabled={isBusy}
                        >
                          {salaryTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {fieldErrors.salary && <p className="text-sm text-red-600">{fieldErrors.salary}</p>}

                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                      Tip: Adding a salary range usually increases applications.
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3 className="text-base font-bold text-gray-900">Description</h3>

                    <Field
                      id="description"
                      label="Job Description"
                      required
                      hint="Recommended: 150–300 words (min 80 characters)."
                      error={fieldErrors.description}
                    >
                      <div>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          onBlur={() => markTouched('description')}
                          rows={7}
                          className={inputClass(!!fieldErrors.description)}
                          placeholder="Write the role overview and day-to-day responsibilities..."
                          required
                          disabled={isBusy}
                        />
                        <div className="flex justify-end">
                          <span
                            className={`text-xs ${
                              showDescCounterRed ? 'text-red-600 font-semibold' : 'text-gray-500'
                            }`}
                          >
                            {descLen} / min 80
                          </span>
                        </div>
                      </div>
                    </Field>

                    <Field
                      id="requirements"
                      label="Requirements & Qualifications"
                      required
                      hint="Separate must-have and nice-to-have."
                      error={fieldErrors.requirements}
                    >
                      <div>
                        <textarea
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleChange}
                          onBlur={() => markTouched('requirements')}
                          rows={6}
                          className={inputClass(!!fieldErrors.requirements)}
                          placeholder="Must-have: ...  | Nice-to-have: ..."
                          required
                          disabled={isBusy}
                        />
                        <div className="flex justify-end">
                          <span
                            className={`text-xs ${
                              showReqCounterRed ? 'text-red-600 font-semibold' : 'text-gray-500'
                            }`}
                          >
                            {reqLen} / min 40
                          </span>
                        </div>
                      </div>
                    </Field>

                    <Field
                      id="skillsRequired"
                      label="Skills (comma-separated)"
                      hint="Example: React, Tailwind, Node.js (max 10)"
                      error={fieldErrors.skillsRequired}
                    >
                      <input
                        name="skillsRequired"
                        value={formData.skillsRequired}
                        onChange={handleChange}
                        onBlur={() => {
                          markTouched('skillsRequired');
                          trimSkillsToLimit();
                        }}
                        className={inputClass(!!fieldErrors.skillsRequired)}
                        placeholder="e.g., React, Tailwind"
                        disabled={isBusy}
                      />
                    </Field>

                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s, idx) => (
                          <span
                            key={`${s}-${idx}`}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-5">
                    <h3 className="text-base font-bold text-gray-900">Application</h3>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <Field id="vacancies" label="Vacancies" required error={fieldErrors.vacancies}>
                        <input
                          type="number"
                          name="vacancies"
                          value={formData.vacancies}
                          onChange={handleChange}
                          onBlur={() => markTouched('vacancies')}
                          min="1"
                          className={inputClass(!!fieldErrors.vacancies)}
                          required
                          disabled={isBusy}
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <Field
                          id="applicationDeadline"
                          label="Application Deadline"
                          required
                          hint="Recommended: 7–14 days."
                          error={fieldErrors.applicationDeadline}
                        >
                          <input
                            type="date"
                            name="applicationDeadline"
                            value={formData.applicationDeadline}
                            onChange={handleChange}
                            onBlur={() => markTouched('applicationDeadline')}
                            min={minDeadlineISO}
                            className={inputClass(!!fieldErrors.applicationDeadline)}
                            required
                            disabled={isBusy}
                          />
                        </Field>

                        {isExpired && (
                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            This job is expired. Update the deadline to reopen.
                          </p>
                        )}

                        {formData.applicationDeadline === todayISO && (
                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            Deadline cannot be today. Please select at least tomorrow.
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-6 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900">Preview</h3>
                      <span className="text-xs text-gray-500">Jobseeker view</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="text-lg font-bold text-gray-900">
                      {formData.title.trim() || 'Job Title'}
                    </div>

                    <div className="text-sm text-gray-600">
                      {companyCategoryDefault} • {companyLocationFromProfile}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        {formData.jobType}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        {formData.workMode}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass}`}>
                        {derivedStatus}
                      </span>
                    </div>

                    <div className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                      {salaryRangeText}
                    </div>

                    <div className="text-sm leading-6 text-gray-700">
                      {(formData.description.trim() || 'Your description will appear here.').slice(0, 160)}
                      {(formData.description.trim().length || 0) > 160 ? '…' : ''}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        {normalizeExperienceLevel(formData.experienceLevel)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        {Number(formData.vacancies) === 1 ? '1 vacancy' : `${formData.vacancies} vacancies`}
                      </span>
                    </div>

                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {skills.slice(0, 6).map((s, idx) => (
                          <span
                            key={`${s}-${idx}`}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800"
                          >
                            {s}
                          </span>
                        ))}
                        {skillsAll.length > 6 && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                            +{skillsAll.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
                  <p className="text-sm font-bold text-gray-900">Controls</p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">Job status</p>
                      <p className="text-xs text-gray-500">
                        {isDraft
                          ? 'Draft jobs cannot be opened/closed.'
                          : isExpired
                          ? 'Expired jobs need a new deadline.'
                          : 'Open jobs are visible to applicants.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleStatusToggle}
                      disabled={togglingStatus || isDraft || isExpired}
                      title={
                        isDraft
                          ? 'Publish the job to enable status control.'
                          : isExpired
                          ? 'Update deadline to reopen.'
                          : ''
                      }
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
                    >
                      {statusButtonLabel}
                    </button>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <div>
                    <p className="text-sm font-semibold text-gray-900">Danger zone</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Delete permanently removes the job and related data.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isBusy}
                      className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                    >
                      Delete job
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                  <p className="text-sm font-bold text-gray-900 mb-2">Quick tips</p>
                  <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                    <li>Add salary range for more applicants</li>
                    <li>Include 3+ skills for better matching</li>
                    <li>Separate must-have vs nice-to-have</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] border-t border-gray-200 bg-white/95 backdrop-blur z-40">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-600">
                {requiredOk ? (
                  <span className="font-semibold text-green-700">
                    All required fields complete. You can {isDraft ? 'publish' : 'save changes'}.
                  </span>
                ) : (
                  <span>Complete required fields to publish/save.</span>
                )}
                {isDraft && !canPublish && (
                  <span className="ml-2 font-semibold text-amber-700">
                    Verification required to publish.
                  </span>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmLeaveIfDirty()) return;
                    navigate('/employer/manage-jobs');
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft || publishing || savingChanges || deleting}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
                >
                  {savingDraft ? 'Saving…' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={primaryActionHandler}
                  disabled={
                    publishing ||
                    savingDraft ||
                    savingChanges ||
                    deleting ||
                    !requiredOk ||
                    (isDraft ? false : !isDirty) ||
                    (isDraft && !canPublish) // ✅ NEW: disable publish when not verified
                  }
                  title={isDraft && !canPublish ? 'Verify your company to publish.' : ''}
                  className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
                >
                  {publishing || savingChanges ? 'Saving…' : isDraft && !canPublish ? 'Verify to publish' : primaryActionLabel}
                </button>
              </div>
            </div>
          </div>

          {showDeleteModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setShowDeleteModal(false);
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
                <div className="h-2 w-full bg-red-600" />
                <div className="p-6">
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 id="delete-title" className="text-lg font-bold text-gray-900">
                        Delete Job Post
                      </h3>
                      <p id="delete-desc" className="mt-1 text-sm text-gray-600">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="font-semibold text-red-900">“{formData.title?.trim() || 'Untitled Draft'}”</p>
                    <p className="mt-1 text-sm text-red-800">
                      All applications and related data will be permanently deleted.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      ref={cancelBtnRef}
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deleting}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                    >
                      {deleting ? 'Deleting…' : 'Delete Job'}
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-gray-500">
                    Tip: Press <span className="font-semibold">Esc</span> to close.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployerLayout>
  );
};

export default EditJob;
