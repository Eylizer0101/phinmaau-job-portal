// controllers/applicationController.js
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
// ✅ IDINAGDAG: Import notification controller
const notificationController = require('./notificationController');

// APPLY FOR JOB
exports.applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    // Check if user is jobseeker
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ 
        message: 'Only jobseekers can apply for jobs' 
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if job is active
    if (!job.isActive || !job.isPublished) {
      return res.status(400).json({ message: 'This job is no longer accepting applications' });
    }

    // Check if deadline has passed
    if (new Date(job.applicationDeadline) < new Date()) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      jobseeker: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Check if jobseeker has resume
    const jobseeker = await User.findById(req.user._id);
    if (!jobseeker.jobSeekerProfile?.resumeUrl) {
      return res.status(400).json({ 
        message: 'Please upload your resume before applying' 
      });
    }

    // Create application
    const application = new Application({
      job: jobId,
      jobseeker: req.user._id,
      employer: job.employer,
      coverLetter: coverLetter || '',
      status: 'pending'
    });

    await application.save();

    // ✅ FIX: Update job applications + applicationCount safely
    job.applications.push(application._id);
    job.applicationCount = (job.applicationCount || 0) + 1;
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application
    });

  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while applying',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET JOBSEEKER'S APPLICATIONS
exports.getJobseekerApplications = async (req, res) => {
  try {
    // Check if user is jobseeker
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ 
        message: 'Only jobseekers can view applications' 
      });
    }

    const applications = await Application.find({ jobseeker: req.user._id })
      .populate({
        path: 'job',
        select: 'title companyName location jobType salaryMin salaryMax applicationDeadline companyLogo' // ✅ IDINAGDAG: companyLogo
      })
      .populate({
        path: 'jobseeker',
        // ✅ UPDATED: include profileImage
        select: 'fullName email profileImage jobSeekerProfile.skills jobSeekerProfile.resumeUrl jobSeekerProfile.experience jobSeekerProfile.education'
      })
      .populate({
        path: 'employer',
        select: 'fullName employerProfile.companyName employerProfile.companyLogo' // ✅ IDINAGDAG: employerProfile.companyLogo
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching applications'
    });
  }
};

// ✅ IDINAGDAG: ALIAS FUNCTION PARA SA MY APPLICATIONS ROUTE
exports.getMyApplications = async (req, res) => {
  try {
    // Check if user is jobseeker
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ 
        message: 'Only jobseekers can view applications' 
      });
    }

    const applications = await Application.find({ jobseeker: req.user._id })
      .populate({
        path: 'job',
        select: 'title companyName location jobType salaryMin salaryMax applicationDeadline companyLogo' // ✅ IDINAGDAG: companyLogo
      })
      .populate({
        path: 'jobseeker',
        // ✅ UPDATED: include profileImage
        select: 'fullName email profileImage jobSeekerProfile.skills jobSeekerProfile.resumeUrl jobSeekerProfile.experience jobSeekerProfile.education'
      })
      .populate({
        path: 'employer',
        select: 'fullName employerProfile.companyName employerProfile.companyLogo' // ✅ IDINAGDAG: employerProfile.companyLogo
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching applications'
    });
  }
};

// GET EMPLOYER'S APPLICATIONS (All applications for employer's jobs)
exports.getEmployerApplications = async (req, res) => {
  try {
    // Check if user is employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({ 
        message: 'Only employers can view job applications' 
      });
    }

    const applications = await Application.find({ employer: req.user._id })
      .populate({
        path: 'job',
        select: 'title companyName companyLogo' // ✅ IDINAGDAG: companyLogo
      })
      .populate({
        path: 'jobseeker',
        // ✅ UPDATED: include profileImage so Applicants page can show it
        select: 'fullName email profileImage jobSeekerProfile.skills jobSeekerProfile.resumeUrl jobSeekerProfile.experience jobSeekerProfile.education'
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });

  } catch (error) {
    console.error('Error fetching employer applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching applications'
    });
  }
};

// GET APPLICATIONS FOR SPECIFIC JOB
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if user is employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({ 
        message: 'Only employers can view job applications' 
      });
    }

    // Check if job belongs to employer
    const job = await Job.findOne({ 
      _id: jobId, 
      employer: req.user._id 
    });

    if (!job) {
      return res.status(404).json({ 
        message: 'Job not found or unauthorized' 
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate({
        path: 'jobseeker',
        select: 'fullName email jobSeekerProfile.skills jobSeekerProfile.resumeUrl jobSeekerProfile.experience jobSeekerProfile.education jobSeekerProfile.contactNumber profileImage'
      })
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });

  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching applications for this job'
    });
  }
};

// UPDATE APPLICATION STATUS
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    // Check if user is employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({ 
        message: 'Only employers can update application status' 
      });
    }

    // Check if application exists
    const application = await Application.findById(applicationId)
      .populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if employer owns the job
    if (application.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to update this application' 
      });
    }

    // Save old status for notification
    const oldStatus = application.status;

    // Update application
    application.status = status;
    application.reviewedAt = Date.now();
    if (notes) application.notes = notes;

    await application.save();

    // ✅ IDINAGDAG: Create notification for jobseeker
    if (oldStatus !== status) {
      await notificationController.createApplicationStatusNotification(
        application,
        oldStatus,
        status
      );
    }

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      application
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating application status'
    });
  }
};

// GET APPLICATION DETAILS
exports.getApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        // ✅ FIX: include workMode + experienceLevel so UI won't show N/A
        select: 'title companyName location jobType workMode experienceLevel requirements description companyLogo'
      })
      .populate({
        path: 'jobseeker',
        // ✅ UPDATED: include course + graduationYear
        select: 'fullName email jobSeekerProfile.course jobSeekerProfile.graduationYear jobSeekerProfile.skills jobSeekerProfile.resumeUrl jobSeekerProfile.experience jobSeekerProfile.education jobSeekerProfile.contactNumber profileImage'
      })
      .populate({
        path: 'employer',
        select: 'fullName employerProfile.companyName employerProfile.companyWebsite employerProfile.companyLogo' // ✅ IDINAGDAG: employerProfile.companyLogo
      });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission
    if (req.user.role === 'jobseeker') {
      if (application.jobseeker._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'Not authorized to view this application' 
        });
      }
    } else if (req.user.role === 'employer') {
      if (application.employer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'Not authorized to view this application' 
        });
      }
    }

    res.status(200).json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching application details'
    });
  }
};

// ✅ IDINAGDAG: CHECK IF APPLIED TO JOB FUNCTION
exports.checkIfApplied = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if user is jobseeker
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ 
        success: false,
        message: 'Only jobseekers can check application status' 
      });
    }

    const application = await Application.findOne({
      job: jobId,
      jobseeker: req.user._id
    }).populate({
      path: 'job',
      select: 'title companyName companyLogo' // ✅ IDINAGDAG: companyLogo
    });

    res.status(200).json({
      success: true,
      hasApplied: !!application,
      application: application || null
    });

  } catch (error) {
    console.error('Error checking application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error checking application status'
    });
  }
};
// ✅ DAGDAG: Get jobseeker application status for employer (FIXED VERSION)
exports.getJobseekerStatus = async (req, res) => {
  try {
    const { jobseekerId } = req.params;

    console.log('Getting status for jobseeker:', jobseekerId, 'Employer:', req.user._id);

    // Check if user is employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({ 
        success: false,
        message: 'Only employers can view jobseeker status' 
      });
    }

    // Find ALL applications where this jobseeker applied to employer's jobs
    const applications = await Application.find({
      jobseeker: jobseekerId,
      employer: req.user._id
    })
    .populate('job', 'title companyName')
    .sort({ appliedAt: -1 });

    console.log('Found applications:', applications.length);

    if (!applications || applications.length === 0) {
      return res.status(200).json({
        success: true,
        status: null,
        message: 'Jobseeker has not applied to any of your jobs',
        hasApplied: false
      });
    }

    // Get the latest application's status
    const latestApplication = applications[0];
    console.log('Latest application status:', latestApplication.status);

    res.status(200).json({
      success: true,
      status: latestApplication.status,
      hasApplied: true,
      applicationId: latestApplication._id,
      jobTitle: latestApplication.job?.title || 'Unknown Job',
      appliedAt: latestApplication.appliedAt
    });

  } catch (error) {
    console.error('Error fetching jobseeker status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching jobseeker status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};