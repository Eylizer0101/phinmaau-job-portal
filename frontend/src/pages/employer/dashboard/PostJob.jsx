import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerLayout from '../../../layouts/EmployerLayout';
import api from '../../services/api';

const Alert = ({ type, children }) => {
  const isError = type === 'error';
  const styles = isError
    ? 'border-red-200 bg-red-50 text-red-900'
    : 'border-green-200 bg-green-50 text-green-900';

  return (
    <div
      className={`mb-5 rounded-xl border p-4 text-sm font-medium ${styles}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  );
};

const Field = ({ id, label, required, hint, error, children }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const childWithA11y =
    React.isValidElement(children)
      ? React.cloneElement(children, {
          'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
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

// ✅ NEW: normalize legacy experience levels to AU-focused values
const normalizeExperienceLevel = (level) => {
  const v = String(level || '').trim();

  // new allowed
  if (v === 'Internship' || v === 'Entry Level' || v === 'Junior') return v;

  // legacy mapping
  if (v === 'Mid Level') return 'Junior';
  if (v === 'Senior Level') return 'Junior';
  if (v === 'Executive') return 'Junior';

  // fallback
  return 'Entry Level';
};

// ✅ NEW: normalize category for preview/payload
const normalizeCategory = (industry) => {
  const v = String(industry || '').trim();
  if (!v) return 'Others';
  if (v === 'Other') return 'Others';
  if (v === 'Others') return 'Others';
  return v;
};

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});

  // ✅ GET COMPANY PROFILE DEFAULTS (for preview + payload fallback)
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const companyLocationFromProfile =
    String(storedUser?.employerProfile?.companyAddress || '').trim() || 'Company location';

  // ✅ FIX: use employer industry, fallback to Others
  const companyCategoryDefault = normalizeCategory(storedUser?.employerProfile?.industry);

  // ✅ NEW: verification gate (draft allowed, publish blocked)
  const verificationStatus =
    storedUser?.employerProfile?.verificationDocs?.overallStatus || 'unverified';
  const isEmployerVerified = verificationStatus === 'verified' || storedUser?.isVerified === true;

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
  });

  const jobTypes = ['Full-time', 'Part-time', 'Contract'];
  const workModes = ['On-site', 'Remote', 'Hybrid'];
  const salaryTypes = ['Monthly', 'Yearly', 'Hourly', 'Project-based'];
  const experienceLevels = ['Internship', 'Entry Level', 'Junior'];

  const minDeadlineISO = useMemo(() => addDaysLocalISO(1), []);

  const markTouched = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'experienceLevel') {
      setFormData(prev => ({ ...prev, [name]: normalizeExperienceLevel(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    setError('');
    setSuccess('');
  };

  const salaryValid = useMemo(() => {
    if (!formData.salaryMin || !formData.salaryMax) return true;
    const min = Number(formData.salaryMin);
    const max = Number(formData.salaryMax);
    if (Number.isNaN(min) || Number.isNaN(max)) return true;
    return min <= max;
  }, [formData.salaryMin, formData.salaryMax]);

  const isDeadlineValid = useMemo(() => {
    if (!formData.applicationDeadline) return false;
    return formData.applicationDeadline >= minDeadlineISO;
  }, [formData.applicationDeadline, minDeadlineISO]);

  const skillsAll = useMemo(() => {
    return (formData.skillsRequired || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [formData.skillsRequired]);

  const skills = useMemo(() => skillsAll.slice(0, 10), [skillsAll]);
  const skillsCountValid = useMemo(() => skillsAll.length <= 10, [skillsAll.length]);

  const salaryRangeText = useMemo(() => {
    const min = formData.salaryMin ? Number(formData.salaryMin).toLocaleString() : '';
    const max = formData.salaryMax ? Number(formData.salaryMax).toLocaleString() : '';
    const unit = (formData.salaryType || '').toLowerCase();
    if (!min && !max) return 'Salary not specified';
    if (min && !max) return `₱${min} / ${unit}`;
    if (!min && max) return `Up to ₱${max} / ${unit}`;
    return `₱${min} – ₱${max} / ${unit}`;
  }, [formData.salaryMin, formData.salaryMax, formData.salaryType]);

  const requiredOk = useMemo(() => {
    return (
      formData.title.trim() &&
      formData.description.trim().length >= 80 &&
      formData.requirements.trim().length >= 40 &&
      isDeadlineValid &&
      salaryValid &&
      skillsCountValid
    );
  }, [formData, isDeadlineValid, salaryValid, skillsCountValid]);

  const fieldErrors = useMemo(() => {
    const errors = {};

    if ((touched.title || submitted) && !formData.title.trim()) {
      errors.title = 'Job title is required.';
    }

    if ((touched.description || submitted) && formData.description.trim().length > 0 && formData.description.trim().length < 80) {
      errors.description = 'Job description must be at least 80 characters.';
    }
    if ((touched.description || submitted) && submitted && !formData.description.trim()) {
      errors.description = 'Job description is required.';
    }

    if ((touched.requirements || submitted) && formData.requirements.trim().length > 0 && formData.requirements.trim().length < 40) {
      errors.requirements = 'Requirements must be at least 40 characters.';
    }
    if ((touched.requirements || submitted) && submitted && !formData.requirements.trim()) {
      errors.requirements = 'Job requirements are required.';
    }

    if ((touched.salaryMin || touched.salaryMax || submitted) && !salaryValid) {
      errors.salary = 'Minimum salary must be ≤ maximum salary.';
    }

    if ((touched.applicationDeadline || submitted) && submitted && !formData.applicationDeadline) {
      errors.applicationDeadline = 'Application deadline is required.';
    } else if ((touched.applicationDeadline || submitted) && formData.applicationDeadline && !isDeadlineValid) {
      errors.applicationDeadline = 'Application deadline must be in the future.';
    }

    if ((touched.skillsRequired || submitted) && !skillsCountValid) {
      errors.skillsRequired = `Please limit skills to 10. You entered ${skillsAll.length}.`;
    }

    return errors;
  }, [formData, touched, submitted, salaryValid, isDeadlineValid, skillsCountValid, skillsAll.length]);

  const validateForPublish = () => {
    if (!formData.title.trim()) return 'Job title is required';
    if (!formData.description.trim()) return 'Job description is required';
    if (formData.description.trim().length < 80) return 'Job description must be at least 80 characters';
    if (!formData.requirements.trim()) return 'Job requirements are required';
    if (formData.requirements.trim().length < 40) return 'Requirements must be at least 40 characters';
    if (!formData.applicationDeadline) return 'Application deadline is required';
    if (!isDeadlineValid) return 'Application deadline must be in the future';
    if (!salaryValid) return 'Minimum salary cannot be greater than maximum salary';
    if (!skillsCountValid) return 'Skills must be 10 or fewer';

    const exp = normalizeExperienceLevel(formData.experienceLevel);
    if (!['Internship', 'Entry Level', 'Junior'].includes(exp)) return 'Invalid experience level';

    // ✅ optional guard: require industry to exist
    const employerIndustry = normalizeCategory(storedUser?.employerProfile?.industry);
    if (!employerIndustry) return 'Please set your company industry first.';

    return '';
  };

  const postJob = async ({ isDraft }) => {
    const normalizedSkillsString = skills.join(', ');
    const normalizedExperienceLevel = normalizeExperienceLevel(formData.experienceLevel);

    // ✅ send category as fallback (backend still auto-fills from employerProfile)
    const payload = {
      ...formData,
      experienceLevel: normalizedExperienceLevel,
      skillsRequired: normalizedSkillsString,
      skills: skills,
      status: isDraft ? 'draft' : 'published',
      category: companyCategoryDefault,
    };

    return api.post('/jobs', payload);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setError('');
    setSuccess('');
    try {
      await postJob({ isDraft: true });
      setSuccess('Draft saved!');
      setTimeout(() => setSuccess(''), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
    setError('');
    setSuccess('');

    // ✅ NEW: front gate (backend also enforces)
    if (!isEmployerVerified) {
      setError('Your company is not verified yet. You can save drafts, but you can\'t publish until verified.');
      setLoading(false);
      return;
    }

    const msg = validateForPublish();

    if (msg) {
      setError('Please fix the highlighted fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await postJob({ isDraft: false });
      if (response.data?.success) {
        setSuccess('Job posted successfully!');
        setTimeout(() => navigate('/employer/dashboard'), 1200);
      } else {
        setError(response.data?.message || 'Failed to post job');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/employer/login'), 1200);
      } else if (err.response?.status === 403) {
        if (err.response?.data?.code === 'EMPLOYER_NOT_VERIFIED') {
          setError(err.response?.data?.message || 'Your company is not verified yet.');
        } else {
          setError('Only employers can post jobs.');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to post job. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const descLen = formData.description.trim().length;
  const reqLen = formData.requirements.trim().length;

  const showDescCounterRed = (touched.description || submitted) && descLen > 0 && descLen < 80;
  const showReqCounterRed = (touched.requirements || submitted) && reqLen > 0 && reqLen < 40;

  const stickyStyle = {
    paddingLeft: 'var(--employer-sidebar-width, 0px)',
  };

  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gray-50 -mt-2" >
      <div className="mx-auto max-w-7xl px-1 py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Post a Job</h1>
              <p className="text-gray-600">Create a job post that attracts the right candidates.</p>

              {/* ✅ NEW: verification banner */}
              {!isEmployerVerified && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Verification required to publish
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Status: <span className="font-bold">{verificationStatus}</span>. You can save drafts anytime, but publishing is disabled until verified.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/employer/company-profile')}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                  >
                    Go to Company Profile
                  </button>
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <span className={`h-2 w-2 rounded-full ${requiredOk ? 'bg-green-600' : 'bg-gray-300'}`} />
              <span className="text-sm font-semibold text-gray-800">
                {requiredOk ? 'Ready to publish' : 'Complete required fields'}
              </span>
            </div>
          </div>

          {error && <Alert type="error">{error}</Alert>}
          {success && <Alert type="success">{success}</Alert>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
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
                          hint='Example: "Junior Web Developer"'
                          error={fieldErrors.title}
                        >
                          <input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            onBlur={() => markTouched('title')}
                            aria-invalid={!!fieldErrors.title}
                            className={`w-full rounded-xl border px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 ${
                              fieldErrors.title ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Junior Web Developer"
                            required
                          />
                        </Field>
                      </div>

                      <Field id="jobType" label="Job Type" required>
                        <select
                          id="jobType"
                          name="jobType"
                          value={formData.jobType}
                          onChange={handleChange}
                          onBlur={() => markTouched('jobType')}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600"
                        >
                          {jobTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </Field>

                      <Field
                        id="experienceLevel"
                        label="Experience Level"
                      >
                        <select
                          id="experienceLevel"
                          name="experienceLevel"
                          value={formData.experienceLevel}
                          onChange={handleChange}
                          onBlur={() => markTouched('experienceLevel')}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600"
                        >
                          {experienceLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
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
                            id="salaryMin"
                            type="number"
                            name="salaryMin"
                            value={formData.salaryMin}
                            onChange={handleChange}
                            onBlur={() => markTouched('salaryMin')}
                            className={`w-full rounded-xl border px-4 py-3 pl-8 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 ${
                              fieldErrors.salary ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Min"
                            min="0"
                          />
                        </div>
                      </Field>

                      <Field id="salaryMax" label="Maximum Salary">
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500">₱</span>
                          <input
                            id="salaryMax"
                            type="number"
                            name="salaryMax"
                            value={formData.salaryMax}
                            onChange={handleChange}
                            onBlur={() => markTouched('salaryMax')}
                            className={`w-full rounded-xl border px-4 py-3 pl-8 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 ${
                              fieldErrors.salary ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Max"
                            min="0"
                          />
                        </div>
                      </Field>

                      <Field id="salaryType" label="Salary Type">
                        <select
                          id="salaryType"
                          name="salaryType"
                          value={formData.salaryType}
                          onChange={handleChange}
                          onBlur={() => markTouched('salaryType')}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600"
                        >
                          {salaryTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {fieldErrors.salary && (
                      <p className="text-sm text-red-600">{fieldErrors.salary}</p>
                    )}

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
                      hint="Recommended: 150–300 words (min 80 characters). Include responsibilities, tools, and expectations."
                      error={fieldErrors.description}
                    >
                      <div>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          onBlur={() => markTouched('description')}
                          rows={7}
                          aria-invalid={!!fieldErrors.description}
                          className={`w-full rounded-xl border px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 ${
                            fieldErrors.description ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Write the role overview and day-to-day responsibilities..."
                          required
                        />
                        <div className="flex justify-end">
                          <span className={`text-xs ${showDescCounterRed ? 'text-red-600' : 'text-gray-500'}`}>
                            {descLen} / min 80
                          </span>
                        </div>
                      </div>
                    </Field>

                    <Field
                      id="requirements"
                      label="Requirements & Qualifications"
                      required
                      hint="Separate must-have and nice-to-have for clarity."
                      error={fieldErrors.requirements}
                    >
                      <div>
                        <textarea
                          id="requirements"
                          name="requirements"
                          value={formData.requirements}
                          onChange={handleChange}
                          onBlur={() => markTouched('requirements')}
                          rows={6}
                          aria-invalid={!!fieldErrors.requirements}
                          className={`w-full rounded-xl border px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 ${
                            fieldErrors.requirements ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Must-have: ...  | Nice-to-have: ..."
                          required
                        />
                        <div className="flex justify-end">
                          <span className={`text-xs ${showReqCounterRed ? 'text-red-600' : 'text-gray-500'}`}>
                            {reqLen} / min 40
                          </span>
                        </div>
                      </div>
                    </Field>

                    <Field
                      id="skillsRequired"
                      label="Skills (comma-separated)"
                      hint="Example: React, Tailwind, Node.js, Communication (max 10)"
                      error={fieldErrors.skillsRequired}
                    >
                      <input
                        id="skillsRequired"
                        name="skillsRequired"
                        value={formData.skillsRequired}
                        onChange={handleChange}
                        onBlur={() => markTouched('skillsRequired')}
                        aria-invalid={!!fieldErrors.skillsRequired}
                        className={`w-full rounded-xl border px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 ${
                          fieldErrors.skillsRequired ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., React, Tailwind"
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
                      <Field id="workMode" label="Work Mode" required>
                        <select
                          id="workMode"
                          name="workMode"
                          value={formData.workMode}
                          onChange={handleChange}
                          onBlur={() => markTouched('workMode')}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600"
                        >
                          {workModes.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </Field>

                      <Field id="vacancies" label="Vacancies" required>
                        <input
                          id="vacancies"
                          type="number"
                          name="vacancies"
                          value={formData.vacancies}
                          onChange={handleChange}
                          onBlur={() => markTouched('vacancies')}
                          min="1"
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600"
                          required
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <Field
                          id="applicationDeadline"
                          label="Application Deadline"
                          required
                          hint="Recommended: 7–14 days to get enough applicants."
                          error={fieldErrors.applicationDeadline}
                        >
                          <input
                            id="applicationDeadline"
                            type="date"
                            name="applicationDeadline"
                            value={formData.applicationDeadline}
                            onChange={handleChange}
                            onBlur={() => markTouched('applicationDeadline')}
                            min={minDeadlineISO}
                            aria-invalid={!!fieldErrors.applicationDeadline}
                            className={`w-full rounded-xl border px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:border-green-600 ${
                              fieldErrors.applicationDeadline ? 'border-red-300' : 'border-gray-300'
                            }`}
                            required
                          />
                        </Field>
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

                  <div className="p-5">
                    <div className="text-lg font-bold text-gray-900">
                      {formData.title.trim() || 'Job Title'}
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      {companyCategoryDefault} • {companyLocationFromProfile}
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      {formData.jobType} • {formData.workMode}
                    </div>

                    <div className="mt-3 inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                      {salaryRangeText}
                    </div>

                    <div className="mt-4 text-sm leading-6 text-gray-700">
                      {(formData.description.trim() || 'Your description will appear here.').slice(0, 160)}
                      {(formData.description.trim().length || 0) > 160 ? '…' : ''}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        {normalizeExperienceLevel(formData.experienceLevel)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        {Number(formData.vacancies) === 1 ? '1 vacancy' : `${formData.vacancies} vacancies`}
                      </span>
                    </div>
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

            <div className="fixed bottom-0 right-0 left-0 lg:left-72 border-t border-gray-200 bg-white/95 backdrop-blur z-40" style={stickyStyle}>
              <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-600">
                  {requiredOk ? (
                    <span className="font-semibold text-green-700">Ready to publish.</span>
                  ) : (
                    <span>Complete required fields to publish.</span>
                  )}
                  {!isEmployerVerified && (
                    <span className="ml-2 font-semibold text-amber-700">Verification required to publish.</span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/employer/dashboard')}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                  >
                    {savingDraft ? 'Saving…' : 'Save Draft'}
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !requiredOk || !isEmployerVerified}
                    title={!isEmployerVerified ? 'Verify your company to publish.' : ''}
                    className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                  >
                    {loading ? 'Publishing…' : isEmployerVerified ? 'Publish Job' : 'Verify to publish'}
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </EmployerLayout>
  );
};

export default PostJob;