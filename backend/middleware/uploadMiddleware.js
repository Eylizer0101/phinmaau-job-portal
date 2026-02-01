const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ CREATE ALL NECESSARY DIRECTORIES
const createDirectories = () => {
  const directories = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/resumes'),
    path.join(__dirname, '../uploads/logos'),
    path.join(__dirname, '../uploads/profile-images'),
    path.join(__dirname, '../uploads/verification') // ✅ NEW
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(` Created directory: ${dir}`);
    }
  });
};

createDirectories();

// ✅ STORAGE FOR RESUMES
const resumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/resumes'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = req.user._id + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// ✅ STORAGE FOR LOGOS
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/logos'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = req.user._id + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// ✅ STORAGE FOR PROFILE IMAGES
const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/profile-images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = req.user._id + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// ✅ STORAGE FOR VERIFICATION DOCS (DTI/SEC, ID, Address Proof)
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/verification'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = req.user._id + '-verify-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

// ✅ FILE FILTER FOR RESUMES
const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF and Word documents are allowed for resumes'), false);
};

// ✅ FILE FILTER FOR IMAGES
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files (JPG, JPEG, PNG, GIF, WEBP) are allowed'), false);
};

// ✅ FILE FILTER FOR VERIFICATION DOCS (PDF + images)
const verificationFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF or image files (JPG, PNG, WEBP) are allowed'), false);
};

// ✅ CREATE UPLOAD MIDDLEWARES
const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadVerification = multer({
  storage: verificationStorage,
  fileFilter: verificationFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = {
  uploadResume,
  uploadLogo,
  uploadProfileImage,
  uploadVerification,

  // Default export for backward compatibility
  single: uploadResume.single.bind(uploadResume),
  array: uploadResume.array.bind(uploadResume),
  fields: uploadResume.fields.bind(uploadResume)
};
