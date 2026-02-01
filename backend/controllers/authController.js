// BACKEND/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
    try {
        const { email, password, role = 'jobseeker', fullName, employerProfile, jobSeekerProfile } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({ 
                message: 'Please provide email, password, and full name' 
            });
        }

        // ✅ JOBSEEKER EXTRA VALIDATION (PHINMA AU GRADUATE FIELDS)
        if (role === 'jobseeker') {
            const studentId = jobSeekerProfile?.studentId;
            const course = jobSeekerProfile?.course;
            const graduationYear = jobSeekerProfile?.graduationYear;

            if (!studentId || !course || !graduationYear) {
                return res.status(400).json({
                    message: 'Student ID, Course, and Graduation Year are required'
                });
            }

            const trimmedFullName = String(fullName).trim();
            if (trimmedFullName.length < 6) {
                return res.status(400).json({
                    message: 'Full Name should have at least 6 characters'
                });
            }
            if (/[0-9]/.test(trimmedFullName)) {
                return res.status(400).json({
                    message: 'Full Name should not contain numbers'
                });
            }

            const studentIdRegex = /^\d{2}-\d{4}-\d{5,6}$/;
            if (!studentIdRegex.test(String(studentId).trim())) {
                return res.status(400).json({
                    message: 'Please use your PHINMA AU student ID'
                });
            }

            const emailLower = String(email).trim().toLowerCase();
            const emailDomainRegex = /@phinmaed\.com$/;
            if (!emailDomainRegex.test(emailLower)) {
                return res.status(400).json({
                    message: 'Use only your PHINMA AU email'
                });
            }

            if (String(password).length < 8) {
                return res.status(400).json({
                    message: 'Password must be at least 8 characters long'
                });
            }
            const specialCharRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])/;
            if (!specialCharRegex.test(String(password))) {
                return res.status(400).json({
                    message: 'Password must contain at least one special character'
                });
            }
        }

        // ✅ EMPLOYER EXTRA VALIDATION (QA FIELDS)
        if (role === 'employer') {
            const companyName = employerProfile?.companyName;
            const industry = employerProfile?.industry;
            const companyAddress = employerProfile?.companyAddress;

            if (!companyName || !industry || !companyAddress) {
                return res.status(400).json({
                    message: 'Company Name, Industry, and Company Location (City/Region) are required'
                });
            }
        }

        const existingUser = await User.findOne({ email: String(email).trim().toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                message: 'User already exists with this email' 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nameParts = String(fullName).trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;

        const userData = {
            email: String(email).trim().toLowerCase(),
            password: hashedPassword,
            role,
            fullName: String(fullName).trim(),
            firstName,
            lastName
        };

        if (role === 'jobseeker') {
            userData.jobSeekerProfile = {
                ...(userData.jobSeekerProfile || {}),
                studentId: String(jobSeekerProfile.studentId).trim(),
                course: String(jobSeekerProfile.course).trim(),
                graduationYear: String(jobSeekerProfile.graduationYear).trim()
            };
        }

        if (role === 'employer' && employerProfile) {
            userData.employerProfile = {
                companyName: employerProfile.companyName || fullName,
                contactPerson: employerProfile.contactPerson || fullName,
                companyPhone: employerProfile.companyPhone || '',
                industry: employerProfile.industry || '',
                companyAddress: employerProfile.companyAddress || '',
                companyWebsite: employerProfile.companyWebsite || '',
                companyEmail: employerProfile.companyEmail || '',
                companyFacebook: employerProfile.companyFacebook || '',
            };
        }

        const user = new User(userData);
        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this',
            { expiresIn: '7d' }
        );

        const responseData = {
            message: 'Account created successfully!',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                profileImage: user.profileImage
            }
        };

        if (user.role === 'employer' && user.employerProfile) {
            responseData.user.employerProfile = user.employerProfile;
        }

        if (user.role === 'jobseeker' && user.jobSeekerProfile) {
            responseData.user.jobSeekerProfile = user.jobSeekerProfile;
        }

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Server error. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Please provide email and password' 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid email or password' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                message: 'Invalid email or password' 
            });
        }

        if (role && user.role !== role) {
            return res.status(403).json({
                message: `Invalid account type for this login page.`
            });
        }

        if (!user.isActive) {
            return res.status(400).json({ 
                message: 'Account is deactivated. Please contact support.' 
            });
        }

        user.lastLogin = Date.now();
        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this',
            { expiresIn: '7d' }
        );

        const responseData = {
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                profileImage: user.profileImage,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };

        if (user.role === 'employer' && user.employerProfile) {
            responseData.user.employerProfile = user.employerProfile;
        }

        if (user.role === 'jobseeker' && user.jobSeekerProfile) {
            responseData.user.jobSeekerProfile = user.jobSeekerProfile;
        }

        res.json(responseData);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    delete updateData.email;
    delete updateData.password;
    delete updateData.role;

    if (updateData.jobSeekerProfile) {
      const user = await User.findById(userId);
      const existingProfile = user.jobSeekerProfile || {};
      updateData.jobSeekerProfile = { ...existingProfile, ...updateData.jobSeekerProfile };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating profile'
    });
  }
};

// UPLOAD RESUME
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file'
      });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    const fullResumeUrl = `http://localhost:5000${resumeUrl}`;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          'jobSeekerProfile.resumeUrl': fullResumeUrl 
        } 
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      resumeUrl: fullResumeUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error uploading resume'
    });
  }
};

// UPLOAD PROFILE IMAGE
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const imageUrl = `/uploads/profile-images/${req.file.filename}`;
    const fullImageUrl = `http://localhost:5000${imageUrl}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profileImage: fullImageUrl } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: fullImageUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading profile image'
    });
  }
};

// GET CURRENT USER
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    const userResponse = {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    if (user.notificationPreferences) {
      userResponse.notificationPreferences = user.notificationPreferences;
    }

    if (user.role === 'jobseeker' && user.jobSeekerProfile) {
      userResponse.jobSeekerProfile = user.jobSeekerProfile;
    }

    if (user.role === 'employer' && user.employerProfile) {
      userResponse.employerProfile = user.employerProfile;
    }

    res.status(200).json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// UPDATE COMPANY PROFILE
exports.updateCompanyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (req.user.role !== 'employer') {
      return res.status(403).json({ 
        success: false,
        message: 'Only employers can update company profile' 
      });
    }

    const updateData = req.body;
    
    const currentUser = await User.findById(userId);
    const currentProfile = currentUser.employerProfile || {};
    
    const employerProfileUpdate = {
      companyName: updateData.companyName || currentProfile.companyName || '',
      companyAddress: updateData.companyAddress || currentProfile.companyAddress || '',
      contactPerson: updateData.contactPerson || currentProfile.contactPerson || '',
      companyPhone: updateData.companyPhone || currentProfile.companyPhone || '',
      companyWebsite: updateData.companyWebsite || currentProfile.companyWebsite || '',
      industry: updateData.industry || currentProfile.industry || '',

      // ✅ NEW
      companyEmail: updateData.companyEmail || currentProfile.companyEmail || '',
      companyFacebook: updateData.companyFacebook || currentProfile.companyFacebook || '',

      profileVisible: updateData.profileVisible === 'true' || 
                     updateData.profileVisible === true || 
                     (currentProfile.profileVisible !== false)
    };

    // Preserve existing logo if not updating
    if (currentProfile.companyLogo) {
      employerProfileUpdate.companyLogo = currentProfile.companyLogo;
    }

    // Preserve verification docs always
    if (currentProfile.verificationDocs) {
      employerProfileUpdate.verificationDocs = currentProfile.verificationDocs;
    }

    if (req.file) {
      const logoUrl = `/uploads/logos/${req.file.filename}`;
      const fullLogoUrl = `http://localhost:5000${logoUrl}`;
      employerProfileUpdate.companyLogo = fullLogoUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          'employerProfile': employerProfileUpdate 
        } 
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating company profile'
    });
  }
};

// ✅ NEW: UPLOAD EMPLOYER VERIFICATION DOC
exports.uploadEmployerVerificationDoc = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role !== 'employer') {
      return res.status(403).json({
        success: false,
        message: 'Only employers can upload verification documents'
      });
    }

    const docType = String(req.params.docType || '').trim();
    const allowed = ['dtiSec', 'govId', 'addressProof'];

    if (!allowed.includes(docType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const docUrl = `/uploads/verification/${req.file.filename}`;
    const fullDocUrl = `http://localhost:5000${docUrl}`;

    const user = await User.findById(userId);
    const currentProfile = user.employerProfile || {};
    const currentDocs = currentProfile.verificationDocs || {};

    // update doc
    const now = new Date();
    currentDocs[docType] = {
      url: fullDocUrl,
      status: 'pending',
      uploadedAt: now
    };

    // overallStatus: pending when any doc pending/submitted
    const statuses = [
      currentDocs?.dtiSec?.status,
      currentDocs?.govId?.status,
      currentDocs?.addressProof?.status
    ].map(s => String(s || 'not_submitted'));

    const anyPending = statuses.some(s => ['pending', 'submitted'].includes(s));
    const allApproved = statuses.every(s => s === 'approved');
    const anyRejected = statuses.some(s => s === 'rejected');

    currentDocs.overallStatus = allApproved ? 'verified' : anyRejected ? 'rejected' : anyPending ? 'pending' : 'unverified';

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'employerProfile.verificationDocs': currentDocs
        }
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Verification document uploaded successfully',
      docType,
      url: fullDocUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading verification document:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading verification document'
    });
  }
};

// GET COMPANY PROFILE
exports.getCompanyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (req.user.role !== 'employer') {
      return res.status(403).json({ 
        success: false,
        message: 'Only employers can view company profile' 
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      companyProfile: user.employerProfile || {},
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching company profile'
    });
  }
};

// CHANGE PASSWORD FUNCTION
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// UPDATE NOTIFICATION PREFERENCES FUNCTION
exports.updateNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationData = req.body;

    const notificationPreferences = {
      emailNotifications: notificationData.emailNotifications !== false,
      jobAlerts: notificationData.jobAlerts !== false,
      applicationUpdates: notificationData.applicationUpdates !== false,
      marketingEmails: notificationData.marketingEmails === true,
      newsletter: notificationData.newsletter !== false
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          notificationPreferences: notificationPreferences
        }
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      notificationPreferences: updatedUser.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification preferences'
    });
  }
};

// UPDATE USER PROFILE FUNCTION
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    delete updateData.email;
    delete updateData.password;
    delete updateData.role;

    if (updateData.firstName || updateData.lastName) {
      const firstName = updateData.firstName || req.user.firstName;
      const lastName = updateData.lastName || req.user.lastName;
      updateData.fullName = `${firstName} ${lastName}`.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};
