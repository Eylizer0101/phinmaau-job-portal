// backend/controllers/adminController.js
const User = require('../models/User');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended', 'pending', 'deleted'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update lastLogin if activating
    if (status === 'active') {
      user.lastLogin = Date.now();
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Quick actions (verify/unverify, etc.)
exports.quickAction = async (req, res) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    switch (action) {
      case 'verify':
        user.isVerified = true;
        break;
      case 'unverify':
        user.isVerified = false;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${action}ed successfully`,
      user: {
        _id: user._id,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Error performing quick action:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Soft delete: mark as deleted and change email to avoid conflicts
    user.status = 'deleted';
    user.deletedAt = new Date();
    user.email = `${user.email}_deleted_${Date.now()}`;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Bulk actions (optional)
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { userIds, status } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user IDs'
      });
    }
    
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { status } }
    );
    
    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} user(s) to ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ==========================
// ✅ EMPLOYER VERIFICATION (NEW)
// ==========================

// Helper: check required docs
const hasRequiredEmployerDocs = (emp) => {
  const docs = emp?.employerProfile?.verificationDocs || {};
  const dti = docs?.dtiSec?.url;
  const gov = docs?.govId?.url;
  return !!(dti && gov);
};

// GET list of employers for verification
exports.getEmployersForVerification = async (req, res) => {
  try {
    const status = (req.query.status || '').toLowerCase(); // optional filter

    const query = { role: 'employer', status: { $ne: 'deleted' } };

    if (status && ['unverified', 'pending', 'verified', 'rejected'].includes(status)) {
      query['employerProfile.verificationDocs.overallStatus'] = status;
    }

    const employers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    const mapped = employers.map((u) => {
      const overallStatus = u?.employerProfile?.verificationDocs?.overallStatus || 'unverified';
      return {
        _id: u._id,
        email: u.email,
        fullName: u.fullName,
        createdAt: u.createdAt,
        employerProfile: u.employerProfile,
        overallStatus,
        docsComplete: hasRequiredEmployerDocs(u),
      };
    });

    res.status(200).json({
      success: true,
      employers: mapped,
    });
  } catch (error) {
    console.error('Error fetching employers for verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// GET employer verification details by id
exports.getEmployerVerificationById = async (req, res) => {
  try {
    const employer = await User.findById(req.params.id).select('-password');

    if (!employer || employer.role !== 'employer') {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    res.status(200).json({
      success: true,
      employer: {
        ...employer.toObject(),
        docsComplete: hasRequiredEmployerDocs(employer),
      }
    });
  } catch (error) {
    console.error('Error fetching employer verification details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// UPDATE employer verification status (approve / reject / pending)
exports.updateEmployerVerificationStatus = async (req, res) => {
  try {
    const { overallStatus, remarks } = req.body;

    const valid = ['unverified', 'pending', 'verified', 'rejected'];
    if (!valid.includes(overallStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid overallStatus'
      });
    }

    const employer = await User.findById(req.params.id);
    if (!employer || employer.role !== 'employer') {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    // QA rule: cannot verify if required docs missing
    if (overallStatus === 'verified' && !hasRequiredEmployerDocs(employer)) {
      return res.status(400).json({
        success: false,
        message: 'Documents incomplete. DTI/SEC and Gov ID are required.'
      });
    }

    if (!employer.employerProfile) employer.employerProfile = {};
    if (!employer.employerProfile.verificationDocs) employer.employerProfile.verificationDocs = {};

    employer.employerProfile.verificationDocs.overallStatus = overallStatus;

    // save remarks in a simple field (no schema change needed)
    employer.employerProfile.verificationDocs.remarks = remarks || '';

    await employer.save();

    res.status(200).json({
      success: true,
      message: `Employer verification status updated to ${overallStatus}`,
      employer: {
        _id: employer._id,
        overallStatus: employer.employerProfile.verificationDocs.overallStatus,
        remarks: employer.employerProfile.verificationDocs.remarks || '',
      }
    });
  } catch (error) {
    console.error('Error updating employer verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
