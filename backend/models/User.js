// BACKEND/models/User.js
const mongoose = require('mongoose');

const verificationDocSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    status: {
      type: String,
      enum: ['not_submitted', 'submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
    },
    uploadedAt: { type: Date, default: null },
  },
  { _id: false }
);

const employerVerificationSchema = new mongoose.Schema(
  {
    dtiSec: { type: verificationDocSchema, default: () => ({}) },
    govId: { type: verificationDocSchema, default: () => ({}) },
    addressProof: { type: verificationDocSchema, default: () => ({}) },
    overallStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },

    // ✅ ADDED: remarks field so it will persist in MongoDB
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['jobseeker', 'employer', 'admin'],
    required: true,
    default: 'jobseeker'
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // ✅ ADDED FOR USER MANAGEMENT
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending', 'deleted'],
    default: 'active'
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date
  },

  // Job seeker specific fields
  jobSeekerProfile: {
    studentId: { type: String, default: '', trim: true },
    course: { type: String, default: '', trim: true },
    graduationYear: { type: String, default: '', trim: true },

    skills: { type: [String], default: [] },
    resumeUrl: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    education: { type: String, default: '' },
    experience: { type: String, default: '' },
    headline: { type: String, default: '' },
    location: { type: String, default: '' },
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },

  // Employer specific fields
  employerProfile: {
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    companyWebsite: { type: String, default: '' },

    // ✅ NEW
    companyEmail: { type: String, default: '' },
    companyFacebook: { type: String, default: '' },

    industry: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    profileVisible: { type: Boolean, default: true },

    // ✅ NEW
    verificationDocs: { type: employerVerificationSchema, default: () => ({}) }
  },

  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    jobAlerts: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
