const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    getEmployerJobs,
    updateJobStatus
} = require('../controllers/jobController');

// Public routes
router.get('/', getAllJobs);

// ✅ FIX: put this BEFORE "/:id" or else it becomes id="employer"
router.get('/employer/my-jobs', protect, authorize('employer'), getEmployerJobs);

// Job by id (public + used by employer edit)
router.get('/:id', getJobById);

// Protected routes
router.post('/', protect, authorize('employer'), createJob);
router.put('/:id', protect, authorize('employer'), updateJob);
router.delete('/:id', protect, authorize('employer'), deleteJob);
router.patch('/:id/status', protect, authorize('employer'), updateJobStatus);

module.exports = router;
