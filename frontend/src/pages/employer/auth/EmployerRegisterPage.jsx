// src/pages/employer/auth/EmployerRegisterPage.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../../services/api"; // ✅ CHANGED: Import api instead of axios

const INDUSTRIES = [
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
  'Others',
];

const EmployerRegisterPage = () => {
  const navigate = useNavigate();

  // ✅ REMOVED: API_URL variable since we'll use api.js

  const [formData, setFormData] = useState({
    contactPerson: '',
    email: '',
    password: '',
    confirmPassword: '', // ✅ added
    companyName: '',
    industry: '',
    companyLocation: '',
    agreeTerms: false,
  });

  const [focused, setFocused] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // ✅ added

  const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

  const setFieldFocus = (name, isFocused) => {
    setFocused((prev) => ({ ...prev, [name]: isFocused }));
  };

  const clearFieldError = (name) => {
    if (!fieldErrors?.[name]) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setServerError('');
    clearFieldError(name);
  };

  const validateBasic = () => {
    const next = {};
    const email = normalizeEmail(formData.email);

    if (!formData.contactPerson.trim()) next.contactPerson = 'Full name is required.';
    if (!email) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Please enter a valid email address.';

    if (!formData.companyName.trim()) next.companyName = 'Company name is required.';
    if (!formData.industry) next.industry = 'Please select an industry.';
    if (!formData.companyLocation.trim()) next.companyLocation = 'Company location is required.';

    if (!formData.password) next.password = 'Password is required.';
    else if (String(formData.password).length < 8) next.password = 'Password must be at least 8 characters.';

    // ✅ confirm password validation
    if (!formData.confirmPassword) next.confirmPassword = 'Confirm Password is required.';
    else if (formData.confirmPassword !== formData.password) next.confirmPassword = 'Passwords do not match.';

    if (!formData.agreeTerms) next.agreeTerms = 'You must agree to the Terms & Privacy Policy.';

    setFieldErrors(next);

    // focus first error
    const firstKey = Object.keys(next)[0];
    if (firstKey) {
      const el = document.getElementById(firstKey);
      if (el?.focus) el.focus();
    }

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerError('');

    const isValid = validateBasic();
    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: normalizeEmail(formData.email),
        password: formData.password, // ✅ send only password
        role: 'employer',
        fullName: formData.contactPerson.trim(),
        employerProfile: {
          companyName: formData.companyName.trim(),
          contactPerson: formData.contactPerson.trim(),
          industry: formData.industry,
          companyAddress: formData.companyLocation.trim(),
        },
      };

      // ✅ CHANGED: Use api instance instead of axios with localhost
      const response = await api.post('/auth/register', payload);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/employer/login', { state: { message: 'Employer account created. Please login.' } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/employer');

  // ---------- UI Helpers ----------
  const inputBase =
    'block w-full h-11 px-3 text-sm text-gray-900 border border-gray-200 rounded-xl bg-white ' +
    'placeholder:text-gray-400 shadow-sm transition ' +
    'focus:outline-none  focus:border-emerald-700 ' +
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

  const labelBase = 'block text-sm font-semibold text-gray-800';
  const iconWrap = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none';

  const fieldClass = (hasError) =>
    `${inputBase} ${hasError ? 'border-red-400 focus:ring-red-100/80 focus:border-red-600' : ''}`;

  const helperText = (id, text) => (
    <p id={id} className="text-[11px] text-gray-500 mt-1">
      {text}
    </p>
  );

  const errorText = (id, msg) =>
    msg ? (
      <p id={id} className="text-xs text-red-600 mt-1" role="alert" aria-live="polite">
        {msg}
      </p>
    ) : null;

  const serverAlert = useMemo(() => {
    if (!serverError) return null;
    return (
      <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl" role="alert" aria-live="assertive">
        <div className="flex items-start">
          <svg aria-hidden="true" className="w-4 h-4 text-red-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-red-900 font-semibold text-sm">{serverError}</p>
        </div>
      </div>
    );
  }, [serverError]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-emerald-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side */}
            <div className="lg:w-1/2 bg-gradient-to-br bg-white p-8 lg:p-12 relative">
              <button
                type="button"
                onClick={handleBack}
                className="absolute left-4 top-4 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition shadow-sm"
                aria-label="Go back"
                title="Go back"
              >
                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
                    <h1 className="text-3xl font-bold text-black mb-1 tracking-tight">Phinma Araullo</h1>
                    <h1 className="text-3xl font-bold text-black tracking-tight">University</h1>
                  </div>
                </div>

                <div className="w-20 h-1 bg-gray-300 rounded-full mb-8 mx-auto" />

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-700 text-center mb-2">Workforce Development Partner</h2>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
              <div className="w-px h-[85%] bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
            </div>

            {/* Right Side - Form */}
            <div className="lg:w-1/2 p-8 lg:p-10 bg-white">
              <div className="mx-auto w-full max-w-xl">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Employer Account</h2>
                </div>

                {serverAlert}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Contact Person */}
                    <div className="space-y-1">
                      <label htmlFor="contactPerson" className={labelBase}>
                        Contact Person 
                      </label>
                      <div className="relative">
                        <div className={iconWrap}>
                          <svg aria-hidden="true" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          id="contactPerson"
                          type="text"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          onFocus={() => setFieldFocus('contactPerson', true)}
                          onBlur={() => setFieldFocus('contactPerson', false)}
                          className={`${fieldClass(!!fieldErrors.contactPerson)} pl-10`}
                          
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.contactPerson}
                          aria-describedby={fieldErrors.contactPerson ? 'contactPerson-error' : undefined}
                        />
                      </div>
                      {errorText('contactPerson-error', fieldErrors.contactPerson)}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label htmlFor="email" className={labelBase}>
                        Email 
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
                          className={`${fieldClass(!!fieldErrors.email)} pl-10`}
                      
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.email}
                          aria-describedby={fieldErrors.email ? 'email-error' : focused.email ? 'email-help' : undefined}
                        />
                      </div>
                      {focused.email && !fieldErrors.email && helperText('email-help', 'Use a business email if possible.')}
                      {errorText('email-error', fieldErrors.email)}
                    </div>

                    {/* Company Name */}
                    <div className="space-y-1">
                      <label htmlFor="companyName" className={labelBase}>
                        Company Name 
                      </label>
                      <div className="relative">
                        <div className={iconWrap}>
                          <svg aria-hidden="true" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <input
                          id="companyName"
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className={`${fieldClass(!!fieldErrors.companyName)} pl-10`}
                    
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.companyName}
                          aria-describedby={fieldErrors.companyName ? 'companyName-error' : undefined}
                        />
                      </div>
                      {errorText('companyName-error', fieldErrors.companyName)}
                    </div>

                    {/* Industry */}
                    <div className="space-y-1">
                      <label htmlFor="industry" className={labelBase}>
                        Industry 
                      </label>
                      <div className="relative">
                        <select
                          id="industry"
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          className={`${fieldClass(!!fieldErrors.industry)} px-3`}
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.industry}
                          aria-describedby={fieldErrors.industry ? 'industry-error' : undefined}
                        >
                          <option value="">Select Industry</option>
                          {INDUSTRIES.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errorText('industry-error', fieldErrors.industry)}
                    </div>

                    {/* Company Location */}
                    <div className="space-y-1 lg:col-span-2">
                      <label htmlFor="companyLocation" className={labelBase}>
                        Company Location 
                      </label>
                      <div className="relative">
                        <div className={iconWrap}>
                          <svg aria-hidden="true" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 10c0 7-7.5 11-7.5 11S4.5 17 4.5 10a7.5 7.5 0 1115 0z" />
                          </svg>
                        </div>
                        <input
                          id="companyLocation"
                          type="text"
                          name="companyLocation"
                          value={formData.companyLocation}
                          onChange={handleChange}
                          className={`${fieldClass(!!fieldErrors.companyLocation)} pl-10`}
                    
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.companyLocation}
                          aria-describedby={fieldErrors.companyLocation ? 'companyLocation-error' : undefined}
                        />
                      </div>
                      {errorText('companyLocation-error', fieldErrors.companyLocation)}
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
                          className={`${fieldClass(!!fieldErrors.password)} pl-10 pr-20`}
                    
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.password}
                          aria-describedby={fieldErrors.password ? 'password-error' : 'password-help'}
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

                      {!fieldErrors.password && helperText('password-help')}
                      {errorText('password-error', fieldErrors.password)}
                    </div>

                    {/* ✅ Confirm Password */}
                    <div className="space-y-1">
                      <label htmlFor="confirmPassword" className={labelBase}>
                        Confirm Password 
                      </label>

                      <div className="relative">
                        <div className={iconWrap}>
                          <svg aria-hidden="true" className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>

                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`${fieldClass(!!fieldErrors.confirmPassword)} pl-10 pr-20`}
                    
                          required
                          disabled={loading}
                          aria-invalid={!!fieldErrors.confirmPassword}
                          aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                        />

                       
                      </div>

                      {errorText('confirmPassword-error', fieldErrors.confirmPassword)}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2">
                    <input
                      id="agreeTerms"
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-green-700 "
                      disabled={loading}
                      aria-invalid={!!fieldErrors.agreeTerms}
                      aria-describedby={fieldErrors.agreeTerms ? 'agreeTerms-error' : undefined}
                    />
                    <label htmlFor="agreeTerms" className="text-sm text-gray-700 leading-5 select-none">
                      I agree to the{' '}
                      <span className="font-semibold text-green-700">Terms</span> &amp;{' '}
                      <span className="font-semibold text-green-700">Privacy Policy</span>.
                    </label>
                  </div>
                  {errorText('agreeTerms-error', fieldErrors.agreeTerms)}

                  {/* CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl font-semibold text-sm text-white
                      bg-green-700 hover:bg-green-800
                      focus:outline-none focus:ring-4 focus:ring-emerald-200/70
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

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-700">
                    Already have an account?{' '}
                    <Link to="/employer/login" className="font-semibold text-green-700 hover:text-green-800 transition">
                      Login here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerRegisterPage;