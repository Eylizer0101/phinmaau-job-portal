import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding,
  faUsers,
  faShieldAlt,
  faCheckCircle,
  faGraduationCap,
  faUniversity,
  faCertificate,
  faRocket,
  faDatabase,
  faUserCheck,
  faHistory,
  faIndustry,
  faSearch,
  faFilter,
  faBullseye,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';
import EmployerNavbar from '../../../components/shared/EmployerNavbar';

const EmployerLandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Modal states (guest gating)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // ✅ If you want to redirect to a specific route after auth, store it here
  const [pendingRedirect, setPendingRedirect] = useState('/employer/register');

  // ✅ check if logged in
  const isGuest = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !token || !user;
  };

  // ✅ open modal (modern popup)
  const openAuthModal = (target = '/employer/register') => {
    setPendingRedirect(target);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    if (isRedirecting) return;
    setShowAuthModal(false);
  };

  const handleRedirect = (to) => {
    if (isRedirecting) return;

    setIsRedirecting(true);

    window.clearTimeout(handleRedirect._t);
    handleRedirect._t = window.setTimeout(() => {
      setShowAuthModal(false);
      navigate(to);
      // reset if user comes back quickly
      window.setTimeout(() => setIsRedirecting(false), 300);
    }, 900);
  };

  // ✅ Generic gate handler for any CTA
  const gateOrGo = (e, to) => {
    // prevent normal navigation
    if (e?.preventDefault) e.preventDefault();

    // if already logged in, go directly
    if (!isGuest()) {
      navigate(to);
      return;
    }

    // guest -> open modal
    openAuthModal(to);
  };

  // Scroll to section when URL has hash
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  const features = [
    {
      icon: faShieldAlt,
      title: "DTI-Verified Companies",
      description: "All employers undergo DTI compliance verification for secure recruitment"
    },
    {
      icon: faBullseye,
      title: "Targeted Araullo Graduates",
      description: "Access qualified graduates from Araullo University"
    },
    {
      icon: faDatabase,
      title: "Data-Driven Recruitment",
      description: "Track, extract, and analyze hiring data with advanced analytics"
    },
    {
      icon: faUserCheck,
      title: "Verified Graduates",
      description: "Araullo University graduates verified through academic credentials"
    }
  ];

  const hiringSteps = [
    { 
      step: "1", 
      title: "DTI Verification", 
      description: "Complete DTI registration and document verification process" 
    },
    { 
      step: "2", 
      title: "Graduate Search", 
      description: "Search and filter Araullo University graduates by course and skills" 
    },
    { 
      step: "3", 
      title: "Post Jobs", 
      description: "Create and publish job opportunities for qualified graduates" 
    },
    { 
      step: "4", 
      title: "Track & Hire", 
      description: "Monitor applications and connect with qualified candidates" 
    }
  ];

  const graduateSources = [
    "College Graduates",
    "Undergraduate Alumni", 
    "Bachelor's Degree Holders",
    "Araullo University Alumni",
    "Professional Course Graduates",
    "Continuing Education Completers"
  ];

  const stats = [
    { number: '100+', label: 'Verified Companies' },
    { number: '5K+', label: 'Araullo Graduate Profiles' },
    { number: '30+', label: 'Academic Programs' },
    { number: '95%', label: 'Verification Rate' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <EmployerNavbar />

      {/* ✅ AUTH MODAL (Modern Popup) */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Authentication Required"
          onMouseDown={(e) => {
            // click outside to close
            if (e.target === e.currentTarget) closeAuthModal();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Modal Card */}
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200 p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <span className="text-green-700 font-extrabold text-xl">!</span>
              </div>
            </div>

            <h3 className="text-center text-2xl font-bold text-gray-900 mb-2">
              Create an Account
            </h3>
            <p className="text-center text-gray-600 mb-6">
              Please register first to continue as an employer.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleRedirect('/employer/register')}
                disabled={isRedirecting}
                className={[
                  "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors",
                  isRedirecting ? "opacity-70 cursor-not-allowed" : ""
                ].join(" ")}
              >
                {isRedirecting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Redirecting...
                  </span>
                ) : (
                  "Go to Register"
                )}
              </button>

              <button
                onClick={closeAuthModal}
                disabled={isRedirecting}
                className={[
                  "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors",
                  isRedirecting ? "opacity-70 cursor-not-allowed" : ""
                ].join(" ")}
              >
                Cancel
              </button>
            </div>

            <div className="mt-5 text-center text-xs text-gray-500">
              Tip: Only verified companies can post jobs and access the graduate database safely.
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 mb-8">
              <FontAwesomeIcon icon={faShieldAlt} className="text-green-700 mr-2" />
              <span className="text-sm font-medium text-green-900">DTI-COMPLIANT RECRUITMENT</span>
            </div>
            
           <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Hire <span className="text-green-700">Verified Graduates</span><br />
              from Araullo University
            </h1>
            
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              A secure, DTI-compliant platform connecting employers with verified graduates from Araullo University.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                to="/employer/register"
                onClick={(e) => gateOrGo(e, '/employer/register')}
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors text-base"
              >
                <FontAwesomeIcon icon={faRocket} className="mr-2" />
                Start Hiring Free
              </Link>
              
              <Link 
                to="/employer/login"
                onClick={(e) => gateOrGo(e, '/employer/login')}
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors text-base"
              >
                <FontAwesomeIcon icon={faBuilding} className="mr-2" />
                Company Login
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="p-4">
                  <div className="text-3xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-base text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Platform</h2>
            <p className="text-lg text-gray-600">Designed for secure and efficient graduate recruitment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-50 mb-4">
                  <FontAwesomeIcon icon={feature.icon} className="text-green-700 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-12 scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Get started with our DTI-compliant hiring platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hiringSteps.map((step, index) => (
              <div key={index} className="flex flex-col h-full">
                <div className="relative z-10">
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-green-600 text-white shadow-md">
                    {step.step}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-100 flex-1 flex flex-col pt-10 h-full">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex-shrink-0">
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed flex-grow">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="testimonials" className="px-4 py-12 scroll-mt-20  bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-lg text-gray-600">Hear from companies hiring Araullo graduates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faBuilding} className="text-green-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">TechSolutions Inc.</h4>
                  <p className="text-sm text-gray-600">IT Company</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Found 5 qualified software engineers from Araullo University in just 2 weeks. The DTI verification gave us confidence in the platform."
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faIndustry} className="text-green-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Manufacturing Corp</h4>
                  <p className="text-sm text-gray-600">Manufacturing</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "The Araullo graduate database helped us find engineering graduates with the specific skills we needed. Highly recommended!"
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faUsers} className="text-green-700" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">StartupXYZ</h4>
                  <p className="text-sm text-gray-600">Startup</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "As a startup, we needed reliable candidates quickly. Accessing Araullo University graduates helped us build a quality team."
              </p>
            </div>
          </div>
        </div>
      </section>

    

   {/* Admin Features */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Admin Control</h2>
            <p className="text-lg text-gray-600">Track and manage all platform activities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Data Extraction Card */}
            <div className="bg-white p-6 rounded-lg flex flex-col h-full">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-50 mb-4">
                <FontAwesomeIcon icon={faDatabase} className="text-green-700 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Extraction</h3>
              <p className="text-base text-gray-600 mb-3 leading-relaxed flex-grow">
                Extract comprehensive data on companies, graduates, and applications for reporting and analysis.
              </p>
              <ul className="text-base text-gray-600 space-y-1">
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Company analytics
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Graduate statistics
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Hiring metrics
                </li>
              </ul>
            </div>

            {/* Application Tracking Card */}
            <div className="bg-white p-6 rounded-lg flex flex-col h-full">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-50 mb-4">
                <FontAwesomeIcon icon={faHistory} className="text-green-700 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Application Tracking</h3>
              <p className="text-base text-gray-600 mb-3 leading-relaxed flex-grow">
                Monitor application status, progress, and history for every candidate and company.
              </p>
              <ul className="text-base text-gray-600 space-y-1">
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Real-time updates
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Application history
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Progress monitoring
                </li>
              </ul>
            </div>

            {/* Industry Partnerships Card */}
            <div className="bg-white p-6 rounded-lg flex flex-col h-full">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-50 mb-4">
                <FontAwesomeIcon icon={faIndustry} className="text-green-700 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Industry Partnerships</h3>
              <p className="text-base text-gray-600 mb-3 leading-relaxed flex-grow">
                Manage partnerships with various industries and track their hiring activities.
              </p>
              <ul className="text-base text-gray-600 space-y-1">
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Industry analytics
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Partner tracking
                </li>
                <li className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-2" />
                  Compliance monitoring
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

       {/* Final CTA */}
      <section className="px-4 py-12 bg-green-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Hire University Talent?
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Join companies using our DTI-compliant platform
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/employer/register"
                onClick={(e) => gateOrGo(e, '/employer/register')}
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold bg-gray-900 hover:bg-gray-800 text-white text-base"
              >
                <FontAwesomeIcon icon={faCertificate} className="mr-2" />
                Start DTI Verification
              </Link>
              
              <Link 
                to="/employer/login"
                onClick={(e) => gateOrGo(e, '/employer/login')}
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-base"
              >
                <FontAwesomeIcon icon={faBuilding} className="mr-2" />
                Company Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-600">
                  <FontAwesomeIcon icon={faBuilding} className="text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold">AGAPAY</div>
                  <div className="text-base text-green-200">Employer Platform</div>
                </div>
              </div>
              <p className="text-base text-gray-400 leading-relaxed">
                DTI-compliant Araullo University graduate recruitment platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">For Employers</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/employer/login"
                    onClick={(e) => gateOrGo(e, '/employer/login')}
                    className="text-base text-gray-400 hover:text-green-300"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/employer/register"
                    onClick={(e) => gateOrGo(e, '/employer/register')}
                    className="text-base text-gray-400 hover:text-green-300"
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <Link
                    to="/employer/dti"
                    onClick={(e) => gateOrGo(e, '/employer/register')}
                    className="text-base text-gray-400 hover:text-green-300"
                  >
                    DTI Verification
                  </Link>
                </li>
                <li>
                  <Link
                    to="/employer/search"
                    onClick={(e) => gateOrGo(e, '/employer/register')}
                    className="text-base text-gray-400 hover:text-green-300"
                  >
                    Graduate Search
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-base text-gray-400">+63 2 8888 9999</li>
                <li className="text-base text-gray-400">employers@agapay.com</li>
                <li className="text-base text-gray-400">DTI Compliance Office</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Araullo Graduates</h4>
              <p className="text-base text-gray-400 mb-2">
                Looking for Araullo University graduate profiles?
              </p>
              <Link 
                to="/employer/search"
                onClick={(e) => gateOrGo(e, '/employer/register')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm bg-green-600 hover:bg-green-700 text-white"
              >
                <FontAwesomeIcon icon={faUsers} />
                Browse Graduate Database
              </Link>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-base text-gray-400">
              © 2024 AGAPAY. All rights reserved.
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <Link to="/privacy" className="text-base text-gray-400 hover:text-green-300">Privacy</Link>
              <Link to="/terms" className="text-base text-gray-400 hover:text-green-300">Terms</Link>
              <Link to="/compliance" className="text-base text-gray-400 hover:text-green-300">DTI Compliance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmployerLandingPage;
