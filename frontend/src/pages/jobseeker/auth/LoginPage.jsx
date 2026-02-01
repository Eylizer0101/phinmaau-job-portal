import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from "../../../services/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [focused, setFocused] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  // ✅ Prefill email from register navigate state (optional)
  useEffect(() => {
    const prefillEmail = location?.state?.email;
    if (prefillEmail && typeof prefillEmail === 'string') {
      setFormData((prev) => ({ ...prev, email: prefillEmail }));
    }
  }, [location?.state]);

  const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const storeAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  // ✅ UPDATED: always redirect to Jobseeker LandingPage ("/")
  const handleBack = () => {
    navigate('/');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const runLogin = async ({ withRole }) => {
    const payload = {
      email: normalizeEmail(formData.email),
      password: formData.password,
      ...(withRole ? { role: 'jobseeker' } : {}),
    };
    return api.post('/auth/login', payload);
  };

  const validateBasic = () => {
    const next = { email: '', password: '' };
    const email = normalizeEmail(formData.email);

    if (!email) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Please enter a valid email address.';

    if (!formData.password) next.password = 'Password is required.';

    setFieldErrors(next);
    return !next.email && !next.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateBasic()) return;

    setLoading(true);

    try {
      // 1) Try jobseeker-only login
      const response = await runLogin({ withRole: true });

      const role = response.data?.user?.role;
      const token = response.data?.token;
      const user = response.data?.user;

      // ✅ enforce jobseeker only for this route
      if (role !== 'jobseeker') {
        clearAuth();
        setError('This account is not a jobseeker account.');
        return;
      }

      // ✅ only store after role validated
      storeAuth(token, user);
      navigate('/jobseeker/dashboard');
    } catch (err) {
      const status = err.response?.status;

      // 2) If blocked (e.g., admin), retry without role field
      if (status === 403) {
        try {
          const retry = await runLogin({ withRole: false });

          const role = retry.data?.user?.role;
          const token = retry.data?.token;
          const user = retry.data?.user;

          if (role === 'admin') {
            storeAuth(token, user);
            navigate('/admin/dashboard');
            return;
          }

          if (role !== 'jobseeker') {
            clearAuth();
            setError('This account is not a jobseeker account.');
            return;
          }

          storeAuth(token, user);
          navigate('/jobseeker/dashboard');
          return;
        } catch (retryErr) {
          clearAuth();
          setError(retryErr.response?.data?.message || 'Invalid email or password. Please try again.');
          return;
        } finally {
          setLoading(false);
        }
      }

      clearAuth();
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI Helpers (Aligned with UI rules + Register + 60/30/10) ----------
  const inputBase =
    'block w-full h-11 px-3 text-sm text-gray-900 border rounded-xl bg-white ' +
    'placeholder:text-gray-400 shadow-sm transition ' +
    'focus:outline-none  focus:border-emerald-700 ' +
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

  const labelBase = 'block text-sm font-semibold text-gray-800';
  const iconWrap = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none';

  const fieldClass = (hasError) =>
    `${inputBase} ${hasError ? 'border-red-400 focus:ring-red-100/80 focus:border-red-600' : 'border-gray-200'}`;

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

  const errorAlert = useMemo(() => {
    if (!error) return null;
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
          <p className="text-red-900 font-semibold text-sm">{error}</p>
        </div>
      </div>
    );
  }, [error]);

  return (
    // 60% base: neutrals / 30% secondary: borders/text / 10% accent: emerald
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-emerald-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
          {/* Left Side - Logo and Image */}
            <div className="lg:w-1/2 p-8 lg:p-12 bg-white relative">
              {/* Back Button - Gaya sa image, nasa gilid at pabilog */}
              <button
                type="button"
                onClick={handleBack}
                className="absolute left-4 top-4 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition shadow-sm"
              >
                {/* Arrow Icon - Gaya sa image */}
                <svg 
                  className="w-4 h-4 text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2.5" 
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              
              <div className="h-full flex flex-col justify-center">
                {/* Container para sa image at text - CENTERED */}
                <div className="flex flex-col items-center justify-center">
                  {/* Image - MAS MALIIT NA SPACING */}
                  <div 
                    className="w-full rounded-lg overflow-hidden flex items-center justify-center mb-4"
                    style={{ 
                      height: '120px',
                      backgroundImage: `url('/images/job-login1.png')`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundColor: 'transparent'
                    }}
                  />
                  
                  {/* Text Section - STYLE LIKE IN THE IMAGE */}
                  <div className="text-center w-full">
                    {/* Main Title - LIKE "CIT COPUS Login" */}
                    <h1 className="text-5xl font-bold text-black mb-3 tracking-tight">
                      AGAPAY
                    </h1>
                    
                    {/* Descriptive Text - LIKE subtitle sa image */}
                    <div className="w-4/5 mx-auto">
                      <p className="text-lg text-gray-700 leading-relaxed">
                        A Workforce Development–Career Management System for PHINMA AU Graduates
                      </p>
                    </div>
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
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">Welcome Users</h2>
                <p className="mt-1 text-sm text-gray-600">Log in to continue to your dashboard.</p>
              </div>

              {errorAlert}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={loading}>
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
                      onFocus={() => setFocused((p) => ({ ...p, email: true }))}
                      onBlur={() => setFocused((p) => ({ ...p, email: false }))}
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className={`${fieldClass(!!fieldErrors.email)} pl-10`}
                     
                      disabled={loading}
                      required
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={
                        fieldErrors.email ? 'email-error' : focused.email ? 'email-help' : undefined
                      }
                    />
                  </div>

                  {focused.email && !fieldErrors.email && helperText('email-help')}
                  {errorText('email-error', fieldErrors.email)}
                </div>

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
                      onFocus={() => setFocused((p) => ({ ...p, password: true }))}
                      onBlur={() => setFocused((p) => ({ ...p, password: false }))}
                      autoComplete="current-password"
                      className={`${fieldClass(!!fieldErrors.password)} pl-10 pr-20`}
                    
                      disabled={loading}
                      required
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={
                        fieldErrors.password ? 'password-error' : focused.password ? 'password-help' : undefined
                      }
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-200/70 focus:ring-offset-2 rounded-lg"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      disabled={loading}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {focused.password && !fieldErrors.password && helperText('password-help')}
                      {errorText('password-error', fieldErrors.password)}
                    </div>

                    <Link
                      to="/forgot-password"
                      className="mt-1 text-xs font-semibold text-green-600 hover:text-green-700  whitespace-nowrap"
                    >
                      Forgot password?
                    </Link>
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
                      Signing in...
                    </div>
                  ) : (
                    'Log in'
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-700">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="font-semibold text-green-600 hover:text-green-700 transition">
                    Register here
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

export default LoginPage;