import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const JobSeekerNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // ✅ Performance-safe scroll tracking
  const lastScrollYRef = useRef(0);

  // ✅ A11y focus management
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const location = useLocation();

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // ✅ Hide/show navbar on scroll (no re-bind per scroll)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const last = lastScrollYRef.current;

      if (currentScrollY < last) {
        setIsNavbarVisible(true);
      } else if (currentScrollY > last && currentScrollY > 100) {
        if (!isMobileMenuOpen) setIsNavbarVisible(false);
      }

      if (currentScrollY < 10) setIsNavbarVisible(true);

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  // ✅ Lock body scroll when drawer open (mobile)
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isMobileMenuOpen]);

  // ✅ Escape close + focus trap
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    // Focus close button on open
    closeButtonRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMobileMenu();
        return;
      }

      if (e.key !== 'Tab') return;

      const root = drawerRef.current;
      if (!root) return;

      const focusable = root.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  // ✅ Return focus to menu button after close
  useEffect(() => {
    if (isMobileMenuOpen) return;
    menuButtonRef.current?.focus?.();
  }, [isMobileMenuOpen]);

  // ✅ Helper: active path check (for mobile highlight like your example)
  const isActive = (path) => location.pathname === path;

  // ✅ Shared classes (compact “card spacing” style)
  const mobileItemBase =
    'group flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500';
  const mobileItemActive = 'bg-green-50 text-green-700';
  const mobileItemInactive = 'text-gray-800 hover:bg-gray-100 hover:text-green-700';

  return (
    <>
      {/* Navbar */}
      <nav
        className={`bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
          isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                ref={menuButtonRef}
                type="button"
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                onClick={openMobileMenu}
                aria-label="Open main menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-drawer"
              >
                <span className="sr-only">Open main menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
                <Link to="/" className="flex items-center">
                  <img
                    src="/images/agapay.png"
                    alt="AGAPAY - Find Your Dream Job"
                    className="h-10 w-auto"
                    width="160"
                    height="40"
                    loading="eager"
                  />
                  <span className="sr-only">AGAPAY</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-6">
                {/* ✅ CHANGE: Browse Jobs scrolls to Latest Job Posts */}
                <Link
                  to="/#latest-jobs"
                  className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors duration-200"
                >
                 Explore Jobs
                </Link>

                {/* ✅ CHANGE: Success Stories scrolls to Success Stories section */}
                <Link
                  to="/#success-stories"
                  className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors duration-200"
                >
                  Success Stories
                </Link>
              </div>
            </div>

            {/* Desktop Right */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link
                to="/employer"
                className="text-base font-medium text-gray-600 hover:text-green-700 transition-colors duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                For Employers
              </Link>

              <div className="w-px h-6 bg-gray-300" />

              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-base font-medium text-gray-700 hover:text-green-700 transition-colors duration-200">
                  Job Seeker Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-semibold rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Find Jobs Free
                </Link>
              </div>
            </div>

            {/* Mobile quick login icon */}
            <div className="md:hidden flex items-center">
              <Link
                to="/login"
                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                aria-label="Job seeker login"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ MOBILE SIDEBAR DRAWER (spacing/card style like your example) */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 motion-reduce:transition-none ${
            isMobileMenuOpen ? 'opacity-40' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          id="mobile-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          className={`
            absolute inset-y-0 left-0
            h-full bg-white shadow-xl overflow-y-auto
            transition-transform duration-300 ease-in-out
            motion-reduce:transition-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}

            /* ✅ drawer width like the example */
           w-[240px] sm:w-[320px]

          `}
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-200 flex items-center justify-between">
            <img src="/images/agapay.png" alt="AGAPAY Job Portal" className="h-8 w-auto" />
            <button
              ref={closeButtonRef}
              type="button"
              className="h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100
                         focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ✅ Links (compact “card spacing”) */}
          <div className="p-3">
            {/* Group 1 */}
            <div className="space-y-1">
              {/* ✅ CHANGE: Browse Jobs scrolls to Latest Job Posts */}
              <Link
                to="/#latest-jobs"
                onClick={closeMobileMenu}
                className={`${mobileItemBase} ${isActive('/jobs') ? mobileItemActive : mobileItemInactive}`}
              >
                <svg
                  className={`h-5 w-5 ${isActive('/jobs') ? 'text-green-700' : 'text-gray-500 group-hover:text-green-700'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explore Jobs
              </Link>

              {/* ✅ CHANGE: Success Stories scrolls to Success Stories section */}
              <Link
                to="/#success-stories"
                onClick={closeMobileMenu}
                className={`${mobileItemBase} ${location.hash === '#success-stories' ? mobileItemActive : mobileItemInactive}`}
              >
                <svg
                  className={`h-5 w-5 ${
                    location.hash === '#success-stories' ? 'text-green-700' : 'text-gray-500 group-hover:text-green-700'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Success Stories
              </Link>
            </div>

            <div className="my-3 h-px bg-gray-200" />

            {/* Group 2 */}
            <div className="space-y-1">
              <Link
                to="/employer"
                onClick={closeMobileMenu}
                className={`${mobileItemBase} ${isActive('/employer') ? mobileItemActive : mobileItemInactive}`}
              >
                <svg
                  className={`h-5 w-5 ${isActive('/employer') ? 'text-green-700' : 'text-gray-500 group-hover:text-green-700'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Employer Portal
              </Link>
            </div>

            <div className="my-3 h-px bg-gray-200" />

            {/* CTA buttons */}
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5
                           text-[15px] font-semibold text-gray-800 shadow-sm
                           hover:bg-gray-50 hover:border-green-500
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Job Seeker Login
              </Link>

              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5
                           text-[15px] font-semibold text-white shadow-sm
                           hover:bg-green-700
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Find Jobs Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobSeekerNavbar;
