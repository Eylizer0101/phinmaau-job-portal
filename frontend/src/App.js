import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Job Seeker Pages
import LandingPage from './pages/jobseeker/landing/LandingPage';
import LoginPage from './pages/jobseeker/auth/LoginPage';
import RegisterPage from './pages/jobseeker/auth/RegisterPage';
import JobSeekerDashboard from './pages/jobseeker/dashboard/JobSeekerDashboard';
import JobSearch from './pages/jobseeker/dashboard/JobSearch';
import MyProfile from './pages/jobseeker/dashboard/MyProfile';
import JobDetails from './pages/jobseeker/dashboard/JobDetails';
import JobseekerMessages from './pages/jobseeker/dashboard/JobseekerMessages';
import MyApplications from './pages/jobseeker/dashboard/MyApplications';
import NotificationsPage from './pages/jobseeker/dashboard/NotificationsPage';

// ✅ JOBSEEKER SETTINGS (IDINAGDAG)
import JobSeekerSettings from './pages/jobseeker/dashboard/Settings';

// Import Employer Pages
import EmployerLandingPage from './pages/employer/landing/EmployerLandingPage';
import EmployerLoginPage from './pages/employer/auth/EmployerLoginPage';
import EmployerRegisterPage from './pages/employer/auth/EmployerRegisterPage';
import EmployerDashboard from './pages/employer/dashboard/EmployerDashboard';
import PostJob from './pages/employer/dashboard/PostJob';
import ManageJobs from './pages/employer/dashboard/ManageJobs';
import EditJob from './pages/employer/dashboard/EditJob';
import Applicants from './pages/employer/dashboard/Applicants';
import ApplicationDetails from './pages/employer/dashboard/ApplicationDetails';
import CompanyProfile from './pages/employer/dashboard/CompanyProfile';
import EmployerMessages from './pages/employer/dashboard/EmployerMessages';

// ✅ EMPLOYER SETTINGS (RENAME para walang conflict)
import EmployerSettings from './pages/employer/dashboard/Settings';

// Import Layouts
import JobSeekerLayout from './layouts/JobSeekerLayout';

// ✅ ADMIN (NEW)
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';  // ✅ ADDED: Import User Management
import UserManagementDetails from './pages/admin/UserManagementDetails';

// ✅ NEW: Employer Verification Pages
import EmployerVerification from './pages/admin/EmployerVerification';
import EmployerVerificationDetails from './pages/admin/EmployerVerificationDetails';

// Import CSS
import './index.css';

// ✅ Helper: safe get user
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

// ✅ Route guard component
const RequireRole = ({ role, redirectTo, children }) => {
  const token = localStorage.getItem('token');
  const user = getStoredUser();

  if (!token || !user) return <Navigate to={redirectTo} replace />;
  if (user.role !== role) return <Navigate to={redirectTo} replace />;

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Job Seeker Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Job Seeker Routes with Layout + Protection */}
        <Route
          path="/jobseeker/dashboard"
          element={
            <RequireRole role="jobseeker" redirectTo="/login">
              <JobSeekerLayout>
                <JobSeekerDashboard />
              </JobSeekerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/jobseeker/job-search"
          element={
            <RequireRole role="jobseeker" redirectTo="/login">
              <JobSeekerLayout>
                <JobSearch />
              </JobSeekerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/jobseeker/my-profile"
          element={
            <RequireRole role="jobseeker" redirectTo="/login">
              <JobSeekerLayout>
                <MyProfile />
              </JobSeekerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/jobseeker/my-applications"
          element={
            <RequireRole role="jobseeker" redirectTo="/login">
              <JobSeekerLayout>
                <MyApplications />
              </JobSeekerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/jobseeker/job-details/:id"
          element={
            <RequireRole role="jobseeker" redirectTo="/login">
              <JobSeekerLayout>
                <JobDetails />
              </JobSeekerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/jobseeker/messages"
          element={
            <RequireRole role="jobseeker" redirectTo="/login">
              <JobSeekerLayout>
                <JobseekerMessages />
              </JobSeekerLayout>
            </RequireRole>
          }
        />
        <Route
          path="/jobseeker/notifications"
          element={
            <RequireRole role="jobseeker" redirectTo="/login">
              <JobSeekerLayout>
                <NotificationsPage />
              </JobSeekerLayout>
            </RequireRole>
          }
        />

        {/* ✅ JOBSEEKER SETTINGS ROUTE (IDINAGDAG) */}
        <Route
          path="/jobseeker/settings"
          element={
            <RequireRole role="jobseeker" redirectTo="/login">
              <JobSeekerLayout>
                <JobSeekerSettings />
              </JobSeekerLayout>
            </RequireRole>
          }
        />

        {/* Employer Routes */}
        <Route path="/employer" element={<EmployerLandingPage />} />
        <Route path="/employer/login" element={<EmployerLoginPage />} />
        <Route path="/employer/register" element={<EmployerRegisterPage />} />

        {/* ✅ Employer Routes with Protection ONLY */}
        <Route
          path="/employer/dashboard"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <EmployerDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/employer/post-job"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <PostJob />
            </RequireRole>
          }
        />
        <Route
          path="/employer/manage-jobs"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <ManageJobs />
            </RequireRole>
          }
        />
        <Route
          path="/employer/edit-job/:id"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <EditJob />
            </RequireRole>
          }
        />
        <Route
          path="/employer/applicants"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <Applicants />
            </RequireRole>
          }
        />
        <Route
          path="/employer/applicants/job/:jobId"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <Applicants />
            </RequireRole>
          }
        />
        <Route
          path="/employer/application/:applicationId"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <ApplicationDetails />
            </RequireRole>
          }
        />
        <Route
          path="/employer/company-profile"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <CompanyProfile />
            </RequireRole>
          }
        />
        <Route
          path="/employer/messages"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <EmployerMessages />
            </RequireRole>
          }
        />

        {/* ✅ EMPLOYER SETTINGS ROUTE */}
        <Route
          path="/employer/settings"
          element={
            <RequireRole role="employer" redirectTo="/employer/login">
              <EmployerSettings />
            </RequireRole>
          }
        />

        {/* ✅ ADMIN ROUTES (NEW) */}
        <Route
          path="/admin"
          element={
            <RequireRole role="admin" redirectTo="/login">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </RequireRole>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RequireRole role="admin" redirectTo="/login">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </RequireRole>
          }
        />

        {/* ✅ USER MANAGEMENT ROUTE (NEW) */}
        <Route
          path="/admin/users"
          element={
            <RequireRole role="admin" redirectTo="/login">
              <UserManagement />
            </RequireRole>
          }
        />

        <Route path="/admin/users/:userId" element={<UserManagementDetails />} />

        {/* ✅ NEW: EMPLOYER VERIFICATION ROUTES */}
        <Route
          path="/admin/employer-verification"
          element={
            <RequireRole role="admin" redirectTo="/login">
              <EmployerVerification />
            </RequireRole>
          }
        />
        <Route
          path="/admin/employer-verification/:employerId"
          element={
            <RequireRole role="admin" redirectTo="/login">
              <EmployerVerificationDetails />
            </RequireRole>
          }
        />

        {/* Redirects */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
