import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../../services/api";// ✅ Import the API instance
import * as Yup from 'yup';

/**
 * RegisterPage (Improved UI + QA + 60/30/10 Color Rule)
 * ✅ 60% Base: whites/soft grays (background/surfaces)
 * ✅ 30% Secondary: gray text/borders/dividers
 * ✅ 10% Accent: emerald for primary CTA + key highlights only
 *
 * Contrast fix:
 * ✅ Primary button uses emerald-700 (better contrast with white text)
 * ✅ Hover uses emerald-800
 */

const TERMS_URL = '/terms';
const PRIVACY_URL = '/privacy';

const COURSE_GROUPS = [
  {
    label: 'Business & Management',
    options: [
      'BS Accountancy',
      'BS Business Administration',
      'BS Business Administration (Marketing Management)',
      'BS Business Administration (Banking and Microfinance)',
      'BS Business Administration (Financial Management)',
      'BS Business Administration (Human Resource Management)',
      'BS Entrepreneurship',
      'BS Hospitality Management',
      'BS Tourism Management',
    ],
  },
  {
    label: 'Engineering & Tech',
    options: [
      'BS Civil Engineering',
      'BS Electrical Engineering',
      'BS Information Technology',
      'BS Information Technology (Business Informatics)',
      'BS Information Technology (System Development)',
    ],
  },
  {
    label: 'Health & Science',
    options: ['BS Nursing', 'BS Pharmacy', 'BS Medical Laboratory Science', 'BS Psychology'],
  },
  {
    label: 'Education & Arts',
    options: [
      'BSED (Bachelor of Secondary Education)',
      'BSED (Science)',
      'BSED (Mathematics)',
      'BSED (English)',
      'BSED (Filipino)',
      'BA Political Science',
      'BA English Language',
    ],
  },
  { label: 'Public Safety', options: ['BS Criminology'] },
];

const SignupSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .min(6, 'Full Name should have at least 6 characters')
    .matches(/^[^0-9]*$/, 'Full Name should not contain numbers')
    .required('Full Name is required'),

  studentId: Yup.string()
    .trim()
    .matches(/^\d{2}-\d{4}-\d{5,6}$/, 'Student ID format should be like 01-2021-04321')
    .required('Student ID is required'),

  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .matches(/@phinmaed\.com$/i, 'Use only your PHINMA AU email (@phinmaed.com)')
    .required('Email is required'),

  course: Yup.string().required('Course is required'),
  graduationYear: Yup.string().required('Graduation Year is required'),

  password: Yup.string()
    .min(8, 'Password must be at least 8 characters long')
    .matches(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain at least one special character')
    .required('Password is required'),

  confirmPassword: Yup.string()
    .required('Confirm Password is required')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),

  acceptedTerms: Yup.boolean()
    .oneOf([true], 'You must accept the Terms and Privacy Policy')
    .required('You must accept the Terms and Privacy Policy'),
});

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    email: '',
    course: '',
    graduationYear: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });

  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ REMOVED: The problematic getApiUrl() function
  // ✅ We'll use the api instance directly

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= 1990; y--) years.push(String(y));
    return years;
  }, [currentYear]);

  const setFieldFocus = (name, isFocused) => {
    setFocused((prev) => ({ ...prev, [name]: isFocused }));
  };

  const clearFieldError = (name) => {
    if (!errors?.[name]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // ✅ Student ID formatter: digits only -> 01-2021-04321
  const formatStudentId = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 12);
    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 6);
    const p3 = digits.slice(6);

    let out = p1;
    if (p2) out += `-${p2}`;
    if (p3) out += `-${p3}`;
    return out;
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    let nextValue = type === 'checkbox' ? checked : value;

    if (name === 'studentId' && type !== 'checkbox') {
      nextValue = formatStudentId(nextValue);
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    setServerError('');
    clearFieldError(name);
  };

  const focusFieldById = (id) => {
    const el = document.getElementById(id);
    if (el?.focus) el.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});

    // Validate first (avoid loading flash)
    try {
      await SignupSchema.validate(formData, { abortEarly: false });
    } catch (err) {
      if (err?.name === 'ValidationError') {
        const fieldErrors = {};
        if (Array.isArray(err.inner)) {
          err.inner.forEach((v) => {
            if (v?.path && !fieldErrors[v.path]) fieldErrors[v.path] = v.message;
          });
        }

        setErrors(fieldErrors);

        const firstKey = Object.keys(fieldErrors)[0];
        if (firstKey) focusFieldById(firstKey);
        return;
      }

      setServerError('Please check your inputs.');
      return;
    }

    // Submit using api instance
    setLoading(true);

    try {
      const submitData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'jobseeker',
        fullName: formData.fullName.trim(),
        jobSeekerProfile: {
          studentId: formData.studentId.trim(),
          course: formData.course,
          graduationYear: formData.graduationYear,
        },
      };

      // ✅ FIXED: Use api instance instead of axios with hardcoded URL
      await api.post('/auth/register', submitData);

      // Register -> Login flow (no token stored here)
      navigate('/login', {
        state: {
          message: 'Account created successfully! Please login.',
          email: formData.email.trim().toLowerCase(),
        },
      });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  // ---------- UI helpers ----------
  // 60% base: whites/grays, 30% secondary: borders/text, 10% accent: emerald
  const inputBase =
    'block w-full h-11 px-3 text-sm text-gray-900 border border-gray-200 rounded-xl bg-white ' +
    'placeholder:text-gray-400 shadow-sm transition ' +
    'focus:outline-none  focus:border-emerald-700 ' +
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

  const selectBase =
    'block w-full h-11 px-3 pr-10 text-sm text-gray-900 border border-gray-200 rounded-xl bg-white ' +
    'shadow-sm transition appearance-none ' +
    'focus:outline-none  focus:border-emerald-700 ' +
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

  const labelBase = 'block text-sm font-semibold text-gray-800';
  const iconWrap = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none';

  const helperText = (id, text) => (
    <p id={id} className="text-[11px] text-gray-500 mt-1">
      {text}
    </p>
  );

  const errorText = (id, msg) =>
    msg ? (
      <p id={id} className="text-xs text-red-600 mt-1" role="alert" aria-live="assertive">
        {msg}
      </p>
    ) : null;

  const fieldClass = (hasError) =>
    `${inputBase} ${hasError ? 'border-red-400 focus:ring-red-100/80 focus:border-red-600' : ''}`;

  const selectClass = (hasError) =>
    `${selectBase} ${hasError ? 'border-red-400 focus:ring-red-100/80 focus:border-red-600' : ''}`;

  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  return (
    // Base (60%): gray/white background + subtle accent tint (10%) at the bottom
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-emerald-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side */}
            <div className="lg:w-1/2 bg-gradient-to-br bg-white  p-8 lg:p-12 relative">
              <button
                type="button"
                onClick={handleBack}
                className="absolute left-4 top-4 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition shadow-sm"
              >
                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="h-full flex flex-col justify-center">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-lg mb-4 border-4 border-white">
                    <img src="/images/phinma-logo.png" alt="PHINMA Logo" className="w-25 h-25 object-contain" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-black mb-0 tracking-tight">Phinma Araullo</h1>
                    <h1 className="text-3xl font-bold text-black tracking-tight">University</h1>
                  </div>
                </div>

                <div className="w-20 h-1 bg-gray-300 rounded-full mb-8 mx-auto"></div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-700 text-center mb-2">Find your dream Job</h2>
                  <div className="text-center mb-6">
                    <span className="inline-block px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      For Alumni & Graduate Students
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
              <div className="w-px h-[85%] bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
            </div>

            {/* Right Side - Form */}
            <div className="lg:w-1/2 p-8 lg:p-10 bg-white">
              <div className="text-center mb-5">
                <h2 className="text-2xl font-extrabold text-gray-900">Create Account</h2>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl" role="alert" aria-live="assertive">
                  <div className="flex items-start">
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 text-red-600 mr-2 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-red-900 font-semibold text-sm">{serverError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={loading}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label htmlFor="fullName" className={labelBase}>
                      Full Name
                    </label>
                    <div className="relative">
                      <div className={iconWrap}>
                        <svg aria-hidden="true" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        onFocus={() => setFieldFocus('fullName', true)}
                        onBlur={() => setFieldFocus('fullName', false)}
                        autoComplete="name"
                        autoCapitalize="words"
                        aria-invalid={!!errors.fullName}
                        aria-describedby={describedBy(errors.fullName ? 'fullName-error' : null)}
                        className={`${fieldClass(!!errors.fullName)} pl-10`}
                        disabled={loading}
                        required
                        maxLength={80}
                      />
                    </div>
                    {errorText('fullName-error', errors.fullName)}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label htmlFor="email" className={labelBase}>
                      Email Address
                    </label>
                    <div className="relative">
                      <div className={iconWrap}>
                        <svg aria-hidden="true" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFieldFocus('email', true)}
                        onBlur={() => setFieldFocus('email', false)}
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-invalid={!!errors.email}
                        aria-describedby={describedBy(errors.email ? 'email-error' : null, focused.email && !errors.email ? 'email-help' : null)}
                        className={`${fieldClass(!!errors.email)} pl-10`}
                        disabled={loading}
                        required
                        maxLength={80}
                      />
                    </div>
                    {focused.email && !errors.email && helperText('email-help', 'Use your @phinmaed.com email.')}
                    {errorText('email-error', errors.email)}
                  </div>

                  {/* Student Number */}
                  <div className="space-y-1">
                    <label htmlFor="studentId" className={labelBase}>
                      Student Number
                    </label>
                    <div className="relative">
                      <div className={iconWrap}>
                        <svg aria-hidden="true" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 2.21-1.79 4-4 4S4 13.21 4 11s1.79-4 4-4 4 1.79 4 4zm8 0h-6m6 6H4" />
                        </svg>
                      </div>
                      <input
                        id="studentId"
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleChange}
                        onFocus={() => setFieldFocus('studentId', true)}
                        onBlur={() => setFieldFocus('studentId', false)}
                        inputMode="numeric"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        aria-invalid={!!errors.studentId}
                        aria-describedby={describedBy(errors.studentId ? 'studentId-error' : null, focused.studentId && !errors.studentId ? 'studentId-help' : null)}
                        className={`${fieldClass(!!errors.studentId)} pl-10`}
                        disabled={loading}
                        required
                        maxLength={14}
                      />
                    </div>
                    {focused.studentId && !errors.studentId && helperText('studentId-help', 'Digits only. Auto-format: 01-2021-04321')}
                    {errorText('studentId-error', errors.studentId)}
                  </div>

                  {/* Graduation Year */}
                  <div className="space-y-1">
                    <label htmlFor="graduationYear" className={labelBase}>
                      Graduation Year
                    </label>

                    <div className="relative">
                      <select
                        id="graduationYear"
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleChange}
                        aria-invalid={!!errors.graduationYear}
                        aria-describedby={describedBy(errors.graduationYear ? 'graduationYear-error' : null)}
                        className={selectClass(!!errors.graduationYear)}
                        disabled={loading}
                        required
                      >
                        <option value="">Select Graduation Year</option>
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>

                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg aria-hidden="true" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    {errorText('graduationYear-error', errors.graduationYear)}
                  </div>

                  {/* Course (full width on desktop) */}
                  <div className="space-y-1 lg:col-span-2">
                    <label htmlFor="course" className={labelBase}>
                      Course
                    </label>

                    <div className="relative">
                      <select
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        aria-invalid={!!errors.course}
                        aria-describedby={describedBy(errors.course ? 'course-error' : null)}
                        className={selectClass(!!errors.course)}
                        disabled={loading}
                        required
                      >
                        <option value="">Select Course</option>
                        {COURSE_GROUPS.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.options.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg aria-hidden="true" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    {errorText('course-error', errors.course)}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label htmlFor="password" className={labelBase}>
                      Password
                    </label>
                    <div className="relative">
                      <div className={iconWrap}>
                        <svg aria-hidden="true" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>

                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFieldFocus('password', true)}
                        onBlur={() => setFieldFocus('password', false)}
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        aria-describedby={describedBy(errors.password ? 'password-error' : null, focused.password && !errors.password ? 'password-help' : null)}
                        className={`${fieldClass(!!errors.password)} pl-10 pr-20`}
                        disabled={loading}
                        required
                        maxLength={128}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-gray-700 hover:text-gray-900 focus:outline-none "
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        disabled={loading}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {focused.password && !errors.password && helperText('password-help', 'At least 8 characters and include 1 special character.')}
                    {errorText('password-error', errors.password)}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className={labelBase}>
                      Confirm Password
                    </label>

                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFieldFocus('confirmPassword', true)}
                      onBlur={() => setFieldFocus('confirmPassword', false)}
                      autoComplete="new-password"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={describedBy(
                        errors.confirmPassword ? 'confirmPassword-error' : null,
                        focused.confirmPassword && !errors.confirmPassword ? 'confirmPassword-help' : null
                      )}
                      className={fieldClass(!!errors.confirmPassword)}
                      disabled={loading}
                      required
                      maxLength={128}
                    />

                    {focused.confirmPassword && !errors.confirmPassword && helperText('confirmPassword-help', 'Make sure it matches your password.')}
                    {errorText('confirmPassword-error', errors.confirmPassword)}
                  </div>

                  {/* Terms checkbox (full width) */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start gap-3">
                      <input
                        id="acceptedTerms"
                        name="acceptedTerms"
                        type="checkbox"
                        checked={formData.acceptedTerms}
                        onChange={handleChange}
                        aria-invalid={!!errors.acceptedTerms}
                        aria-describedby={describedBy(errors.acceptedTerms ? 'acceptedTerms-error' : null)}
                        disabled={loading}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-700 "
                        required
                      />
                      <label htmlFor="acceptedTerms" className="text-xs text-gray-600 leading-5">
                        I agree to the{' '}
                        <a href={TERMS_URL} className="font-semibold text-green-600 hover:text-green-700 " target="_blank" rel="noreferrer">
                          Terms
                        </a>{' '}
                        and{' '}
                        <a href={PRIVACY_URL} className="font-semibold text-green-600 hover:text-green-700 " target="_blank" rel="noreferrer">
                          Privacy Policy
                        </a>
                        .
                      </label>
                    </div>
                    {errorText('acceptedTerms-error', errors.acceptedTerms)}
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-semibold text-sm text-white
                    bg-green-600 hover:bg-green-700
                    focus:outline-none 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        aria-hidden="true"
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating Account...
                    </div>
                  ) : (
                    'Register'
                  )}
                </button>
              </form>

              <div className="text-center mt-5">
                <p className="text-sm text-gray-700">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-green-600 hover:text-green-700 transition">
                    Login here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;