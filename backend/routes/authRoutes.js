// BACKEND/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // ✅ USE UPDATED MIDDLEWARE

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', protect, authController.getCurrentUser);

router.put('/update-profile', protect, authController.updateProfile);

router.post('/upload-resume', 
  protect, 
  authorize('jobseeker'), 
  upload.uploadResume.single('resume'),
  authController.uploadResume
);

router.post(
  '/upload-profile-image',
  protect,
  authorize('jobseeker'),
  upload.uploadProfileImage.single('profileImage'),
  authController.uploadProfileImage
);

// COMPANY PROFILE
router.put('/update-company-profile', 
  protect, 
  authorize('employer'),
  upload.uploadLogo.single('companyLogo'),
  authController.updateCompanyProfile
);

router.get('/company-profile', 
  protect, 
  authorize('employer'),
  authController.getCompanyProfile
);

// ✅ NEW: EMPLOYER VERIFICATION UPLOAD
router.post(
  '/upload-verification/:docType',
  protect,
  authorize('employer'),
  upload.uploadVerification.single('file'),
  authController.uploadEmployerVerificationDoc
);

// SETTINGS
router.put('/change-password', protect, authController.changePassword);
router.put('/update-notifications', protect, authController.updateNotifications);
router.put('/update-user-profile', protect, authController.updateUserProfile);

module.exports = router;
