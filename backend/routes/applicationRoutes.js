// routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  applyForJob,
  getJobseekerApplications,
  getEmployerApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationDetails,
  getMyApplications,
  checkIfApplied,
  getJobseekerStatus // ✅ DAGDAG: Import the new function
} = require('../controllers/applicationController');

// Jobseeker routes
router.post('/apply/:jobId', protect, authorize('jobseeker'), applyForJob);
router.get('/my-applications', protect, authorize('jobseeker'), getMyApplications);
router.get('/jobseeker/all', protect, authorize('jobseeker'), getJobseekerApplications);
router.get('/job/:jobId/check', protect, authorize('jobseeker'), checkIfApplied);

// Employer routes
router.get('/employer/all', protect, authorize('employer'), getEmployerApplications);
router.get('/job/:jobId', protect, authorize('employer'), getJobApplications);
router.put('/:applicationId/status', protect, authorize('employer'), updateApplicationStatus);
// ✅ DAGDAG: Route para sa jobseeker status - IMPORTANT FOR MESSAGING FEATURE
router.get('/jobseeker/:jobseekerId/status', protect, authorize('employer'), getJobseekerStatus);

// Shared route
router.get('/:applicationId', protect, getApplicationDetails);

module.exports = router;