import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const EmployerLandingNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // ✅ Performance-safe scroll tracking (no re-bind)
  const lastScrollYRef = useRef(0);

  // ✅ A11y focus management
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // ✅ Hide/show navbar on scroll (optimized)
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

  // ✅ Body scroll lock (mobile drawer)
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

  // ✅ Compact “card spacing” item styles (like your example)
  const itemBase =
    'group flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium text-gray-800 ' +
    'hover:bg-gray-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600';

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
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                onClick={openMobileMenu}
                aria-label="Open main menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="employer-mobile-drawer"
              >
                <span className="sr-only">Open main menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
                <Link to="/employer" className="flex items-center">
                  <img
                    src="/images/agapay.png"
                    alt="AGAPAY - Hire Top Talent"
                    className="h-10 w-auto"
                    width="160"
                    height="40"
                    loading="eager"
                  />
                  <span className="sr-only">AGAPAY Employer</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-6">
                <Link
                  to="/employer#how-it-works"
                  className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors duration-200"
                >
                  How It Works
                </Link>
                <Link
                  to="/employer#testimonials"
                  className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors duration-200"
                >
                  Success Stories
                </Link>
              </div>
            </div>

            {/* Desktop Right */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link to="/" className="text-base font-medium text-gray-600 hover:text-green-700 transition-colors duration-200">
                Job Seeker Site
              </Link>

              <div className="w-px h-6 bg-gray-300" />

              <div className="flex items-center space-x-4">
                <Link
                  to="/employer/login"
                  className="text-base font-medium text-gray-700 hover:text-green-700 transition-colors duration-200"
                >
                  Employer Login
                </Link>
                <Link
                  to="/employer/register"
                  className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-semibold rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-colors duration-200"
                >
                  Start Hiring
                </Link>
              </div>
            </div>

            {/* Mobile quick login icon */}
            <div className="md:hidden flex items-center">
              <Link
                to="/employer/login"
                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
                aria-label="Employer login"
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

      {/* ✅ MOBILE SIDEBAR DRAWER (fixed width like your blue-line example) */}
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
          id="employer-mobile-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Employer menu"
          className={`
            absolute inset-y-0 left-0
            h-full bg-white shadow-xl overflow-y-auto
            transition-transform duration-300 ease-in-out
            motion-reduce:transition-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}

            /* ✅ fixed drawer width */
            w-[300px] sm:w-[320px]
          `}
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-200 flex items-center justify-between">
            <img src="/images/agapay.png" alt="AGAPAY Employer" className="h-8 w-auto" />
            <button
              ref={closeButtonRef}
              type="button"
              className="h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100
                         focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-600"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Links (compact spacing like your example) */}
          <div className="p-3">
            <div className="space-y-1">
              <Link to="/employer#how-it-works" className={itemBase} onClick={closeMobileMenu}>
                <svg className="h-5 w-5 text-gray-500 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                How It Works
              </Link>

              <Link to="/employer#testimonials" className={itemBase} onClick={closeMobileMenu}>
                <svg className="h-5 w-5 text-gray-500 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10" />
                </svg>
                Success Stories
              </Link>
            </div>

            <div className="my-3 h-px bg-gray-200" />

            <div className="space-y-1">
              <Link to="/" className={itemBase} onClick={closeMobileMenu}>
                <svg className="h-5 w-5 text-gray-500 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Job Seeker Site
              </Link>
            </div>

            <div className="my-3 h-px bg-gray-200" />

            <div className="space-y-2">
              <Link
                to="/employer/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5
                           text-[15px] font-semibold text-gray-800 shadow-sm
                           hover:bg-gray-50 hover:border-green-600
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                onClick={closeMobileMenu}
              >
                Employer Login
              </Link>

              <Link
                to="/employer/register"
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5
                           text-[15px] font-semibold text-white shadow-sm
                           hover:bg-green-700
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                onClick={closeMobileMenu}
              >
                Start Hiring
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployerLandingNavbar;
