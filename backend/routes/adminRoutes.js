// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.isAdmin);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/quick-action', adminController.quickAction);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/bulk-status', adminController.bulkUpdateStatus);

// ✅ EMPLOYER VERIFICATION ROUTES (NEW)
router.get('/employers/verification', adminController.getEmployersForVerification);
router.get('/employers/verification/:id', adminController.getEmployerVerificationById);
router.put('/employers/verification/:id/status', adminController.updateEmployerVerificationStatus);

module.exports = router;
