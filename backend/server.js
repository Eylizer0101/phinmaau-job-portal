const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const applicationRoutes = require('./routes/applicationRoutes');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// ✅ CREATE ALL UPLOADS DIRECTORIES IF THEY DON'T EXIST
const createUploadsDirectories = () => {
  const directories = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/resumes'),
    path.join(__dirname, 'uploads/logos'),
    path.join(__dirname, 'uploads/profile-images'),
    path.join(__dirname, 'uploads/messages'),
    path.join(__dirname, 'uploads/notifications'),
    path.join(__dirname, 'uploads/verification') // ✅ NEW
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(` Created directory: ${dir}`);
    }
  });
};

createUploadsDirectories();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SERVE STATIC FILES FROM UPLOADS DIRECTORY
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phinma-jobportal', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log(' MongoDB connected successfully'))
.catch(err => {
    console.log(' MongoDB connection error:', err.message);
    console.log(' Make sure MongoDB is running: mongod');
});

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Phinma Job Portal API is running 🚀',
        version: '1.0.0',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me',
                updateProfile: 'PUT /api/auth/update-profile',
                uploadResume: 'POST /api/auth/upload-resume',
                updateCompanyProfile: 'PUT /api/auth/update-company-profile',
                getCompanyProfile: 'GET /api/auth/company-profile',
                uploadVerification: 'POST /api/auth/upload-verification/:docType' // ✅ NEW
            },
            admin: { // ✅ ADDED ADMIN ENDPOINTS
                getAllUsers: 'GET /api/admin/users',
                getUserById: 'GET /api/admin/users/:id',
                updateUserStatus: 'PUT /api/admin/users/:id/status',
                quickAction: 'PUT /api/admin/users/:id/quick-action',
                deleteUser: 'DELETE /api/admin/users/:id',
                bulkUpdateStatus: 'PUT /api/admin/users/bulk-status'
            },
            jobs: {
                getJobs: 'GET /api/jobs',
                createJob: 'POST /api/jobs',
                getJob: 'GET /api/jobs/:id',
                employerJobs: 'GET /api/jobs/employer/my-jobs'
            },
            applications: {
                apply: 'POST /api/applications/apply/:jobId',
                myApplications: 'GET /api/applications/my-applications',
                employerApplications: 'GET /api/applications/employer/all',
                jobApplications: 'GET /api/applications/job/:jobId',
                updateStatus: 'PUT /api/applications/:applicationId/status'
            },
            messages: {
                sendMessage: 'POST /api/messages/send',
                uploadFile: 'POST /api/messages/upload',
                getFile: 'GET /api/messages/file/:filename',
                conversations: 'GET /api/messages/conversations',
                conversation: 'GET /api/messages/conversation/:conversationId',
                unreadCount: 'GET /api/messages/unread-count',
                markAsRead: 'PUT /api/messages/mark-read/:conversationId',
                employerJobseekers: 'GET /api/messages/employer/jobseekers',
                jobseekerEmployers: 'GET /api/messages/jobseeker/employers',
                scheduleInterview: 'POST /api/messages/schedule-interview'
            },
            notifications: {
                getNotifications: 'GET /api/notifications',
                unreadCount: 'GET /api/notifications/unread-count',
                markAsRead: 'PUT /api/notifications/:id/read',
                markAllAsRead: 'PUT /api/notifications/mark-all-read',
                delete: 'DELETE /api/notifications/:id',
                clearAll: 'DELETE /api/notifications/clear-all'
            }
        },
        uploads: {
            resumes: 'http://localhost:5000/uploads/resumes/',
            logos: 'http://localhost:5000/uploads/logos/',
            profileImages: 'http://localhost:5000/uploads/profile-images/',
            messages: 'http://localhost:5000/uploads/messages/',
            notifications: 'http://localhost:5000/uploads/notifications/',
            verification: 'http://localhost:5000/uploads/verification/' // ✅ NEW
        }
    });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ✅ ADD ADMIN ROUTES
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check
app.get('/health', (req, res) => {
    const directories = {
        uploads: fs.existsSync(path.join(__dirname, 'uploads')),
        resumes: fs.existsSync(path.join(__dirname, 'uploads/resumes')),
        logos: fs.existsSync(path.join(__dirname, 'uploads/logos')),
        profileImages: fs.existsSync(path.join(__dirname, 'uploads/profile-images')),
        messages: fs.existsSync(path.join(__dirname, 'uploads/messages')),
        notifications: fs.existsSync(path.join(__dirname, 'uploads/notifications')),
        verification: fs.existsSync(path.join(__dirname, 'uploads/verification')) // ✅ NEW
    };
    
    res.json({ 
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        directories: directories
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Endpoint not found',
        requestedUrl: req.originalUrl
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(' Server Error:', err.stack);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            message: 'File too large. Maximum size is 10MB for resumes/docs, 5MB for images'
        });
    }
    
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
    console.log(` API: http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
    console.log(` Frontend: http://localhost:3000`);
    console.log(` Uploads available at: http://localhost:${PORT}/uploads/`);
    console.log(` Admin API: http://localhost:${PORT}/api/admin/users`); // ✅ ADDED
});