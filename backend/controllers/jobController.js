const Job = require('../models/Job');
const User = require('../models/User');
const notificationController = require('./notificationController');

const normalizeSkills = (skillsRequired) => {
  if (!skillsRequired) return [];
  if (Array.isArray(skillsRequired)) {
    return skillsRequired.map(s => String(s).trim()).filter(Boolean);
  }
  if (typeof skillsRequired === 'string') {
    return skillsRequired.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

const applyIfDefined = (obj, key, value) => {
  if (value !== undefined) obj[key] = value;
};

// ✅ NEW: normalize legacy experience levels to AU-focused values
const normalizeExperienceLevel = (level) => {
  const v = String(level || '').trim();

  if (v === 'Internship' || v === 'Entry Level' || v === 'Junior') return v;

  if (v === 'Mid Level') return 'Junior';
  if (v === 'Senior Level') return 'Junior';
  if (v === 'Executive') return 'Junior';

  return 'Entry Level';
};

// ✅ FIXED: normalize employer industry → job.category
// - blank -> Others
// - Other -> Others
// - Others -> Others
const normalizeCategory = (industry) => {
  const v = String(industry || '').trim();
  if (!v) return 'Others';
  if (v === 'Other') return 'Others';
  if (v === 'Others') return 'Others';
  return v;
};

// CREATE NEW JOB (supports draft)
exports.createJob = async (req, res) => {
  try {
    console.log('User creating job:', req.user);

    const {
      title,
      description,
      requirements,
      jobType,
      salaryMin,
      salaryMax,
      salaryType,
      workMode,
      applicationDeadline,
      vacancies,
      skillsRequired,
      experienceLevel,
      status,

      // ✅ OPTIONAL: allow frontend to send category, but backend will still prefer employerProfile.industry
      category
    } = req.body;

    if (req.user.role !== 'employer') {
      return res.status(403).json({
        message: 'Only employers can post jobs'
      });
    }

    const employer = await User.findById(req.user._id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    const isDraft = status === 'draft';

    // ✅ NEW: Draft allowed, Publish gated until employer is VERIFIED
    const employerVerificationStatus =
      employer?.employerProfile?.verificationDocs?.overallStatus || 'unverified';

    const isEmployerVerified = employerVerificationStatus === 'verified';

    if (!isEmployerVerified && !isDraft) {
      return res.status(403).json({
        success: false,
        code: 'EMPLOYER_NOT_VERIFIED',
        message: 'You can save jobs as draft, but you cannot publish until your company is verified by admin.',
        verificationStatus: employerVerificationStatus
      });
    }

    const skillsArray = normalizeSkills(skillsRequired);

    const companyLogo = employer.employerProfile?.companyLogo || '';

    // ✅ CHANGED: normalize experienceLevel
    const normalizedExperience = normalizeExperienceLevel(experienceLevel);

    // ✅ AUTO FILL: location from employer profile
    const companyLocation = String(employer.employerProfile?.companyAddress || '').trim() || 'Not specified';

    // ✅ AUTO FILL: category from employer profile (register page)
    // if employer profile industry missing, fallback to req.body.category then Others
    const categoryFromEmployer = normalizeCategory(employer.employerProfile?.industry);
    const categoryFromBody = normalizeCategory(category);
    const companyCategory = categoryFromEmployer || categoryFromBody || 'Others';

    const jobData = {
      employer: req.user._id,
      companyName: employer.employerProfile?.companyName || employer.fullName,
      companyLogo: companyLogo,
      status: isDraft ? 'draft' : 'published',
      isPublished: !isDraft,
      isActive: !isDraft,

      // ✅ REQUIRED FIELDS AUTO SET
      category: companyCategory,
      location: companyLocation
    };

    applyIfDefined(jobData, 'title', title);
    applyIfDefined(jobData, 'description', description);
    applyIfDefined(jobData, 'requirements', requirements);
    applyIfDefined(jobData, 'jobType', jobType);
    applyIfDefined(jobData, 'workMode', workMode);
    applyIfDefined(jobData, 'applicationDeadline', applicationDeadline);
    applyIfDefined(jobData, 'vacancies', vacancies);

    // ✅ CHANGED: always set normalized experience
    jobData.experienceLevel = normalizedExperience;

    if (salaryMin !== undefined && salaryMin !== '') jobData.salaryMin = salaryMin;
    if (salaryMax !== undefined && salaryMax !== '') jobData.salaryMax = salaryMax;
    if (salaryType) jobData.salaryType = salaryType;

    if (skillsArray.length > 0) jobData.skillsRequired = skillsArray;

    const job = new Job(jobData);
    await job.save();

    if (!isDraft) {
      await sendJobMatchNotifications(job);
    }

    res.status(201).json({
      success: true,
      message: isDraft ? 'Draft saved successfully!' : 'Job posted successfully!',
      job
    });

  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating job',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const sendJobMatchNotifications = async (job) => {
  try {
    console.log(`Starting job match notifications for job: ${job.title}`);

    if (!job.skillsRequired || job.skillsRequired.length === 0) {
      console.log('No skills required for this job, skipping notifications');
      return;
    }

    const jobseekers = await User.find({
      role: 'jobseeker',
      isActive: true,
      'jobSeekerProfile.skills': { $exists: true, $ne: [] }
    }).select('_id jobSeekerProfile.skills');

    console.log(`Found ${jobseekers.length} active jobseekers with skills`);

    let notificationCount = 0;
    const jobSkills = job.skillsRequired.map(skill => skill.toLowerCase().trim());

    for (const jobseeker of jobseekers) {
      const jobseekerSkills = jobseeker.jobSeekerProfile?.skills || [];

      if (jobseekerSkills.length === 0) continue;

      const jobseekerSkillsLower = jobseekerSkills.map(skill => skill.toLowerCase().trim());

      const hasMatch = jobseekerSkillsLower.some(jobseekerSkill => {
        return jobSkills.some(jobSkill => {
          return jobseekerSkill === jobSkill ||
            jobseekerSkill.includes(jobSkill) ||
            jobSkill.includes(jobseekerSkill);
        });
      });

      if (hasMatch) {
        try {
          await notificationController.createJobMatchNotification(jobseeker._id, job);
          notificationCount++;
          console.log(`Notification sent to jobseeker: ${jobseeker._id}`);
        } catch (notifError) {
          console.error(`Error sending notification to ${jobseeker._id}:`, notifError);
        }
      }
    }

    console.log(`✅ Job match notifications completed. Sent ${notificationCount} notifications for job: ${job.title}`);

  } catch (error) {
    console.error('Error in sendJobMatchNotifications:', error);
  }
};

// GET ALL JOBS (Public)
exports.getAllJobs = async (req, res) => {
  try {
    let query = { isPublished: true, isActive: true };

    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { companyName: { $regex: req.query.search, $options: 'i' } },
        { skillsRequired: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.jobType) query.jobType = req.query.jobType;

    // ✅ FIX: normalize query.category (Other -> Others)
    if (req.query.category) query.category = normalizeCategory(req.query.category);

    if (req.query.workMode) query.workMode = req.query.workMode;
    if (req.query.location) query.location = { $regex: req.query.location, $options: 'i' };

    if (req.query.experienceLevel) query.experienceLevel = req.query.experienceLevel;
    if (req.query.salaryType) query.salaryType = req.query.salaryType;

    const hasMin = req.query.minSalary !== undefined && req.query.minSalary !== '';
    const hasMax = req.query.maxSalary !== undefined && req.query.maxSalary !== '';

    if (hasMin || hasMax) {
      let min = hasMin ? Number(req.query.minSalary) : null;
      let max = hasMax ? Number(req.query.maxSalary) : null;

      if (min !== null && max !== null && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
        const temp = min;
        min = max;
        max = temp;
      }

      query.$and = query.$and || [];

      if (min !== null && !Number.isNaN(min)) {
        query.$and.push({
          $or: [
            { salaryMax: { $gte: min } },
            { salaryMax: { $exists: false } },
            { salaryMax: null }
          ]
        });
      }

      if (max !== null && !Number.isNaN(max)) {
        query.$and.push({
          $or: [
            { salaryMin: { $lte: max } },
            { salaryMin: { $exists: false } },
            { salaryMin: null }
          ]
        });
      }
    }

    const jobs = await Job.find(query)
      .populate({
        path: 'employer',
        select: 'fullName email employerProfile.companyLogo',
        transform: (doc) => {
          if (doc && doc.employerProfile) {
            return {
              _id: doc._id,
              fullName: doc.fullName,
              email: doc.email,
              companyLogo: doc.employerProfile.companyLogo
            };
          }
          return doc;
        }
      })
      .sort({ createdAt: -1 });

    const transformedJobs = jobs.map(job => {
      const jobObj = job.toObject();

      if (jobObj.companyLogo) return jobObj;

      if (jobObj.employer && jobObj.employer.companyLogo) {
        jobObj.companyLogo = jobObj.employer.companyLogo;
      }

      if (!jobObj.companyLogo) jobObj.companyLogo = '';

      return jobObj;
    });

    res.status(200).json({
      success: true,
      count: transformedJobs.length,
      jobs: transformedJobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs'
    });
  }
};

// GET JOB BY ID
exports.getJobById = async (req, res) => {
  try {
    console.log('Fetching job by ID:', req.params.id);

    const job = await Job.findById(req.params.id);

    if (!job) {
      console.log('Job not found:', req.params.id);
      return res.status(404).json({ message: 'Job not found' });
    }

    console.log('Job found:', job.title);

    let employerDetails = null;
    try {
      const employer = await User.findById(job.employer).select('employerProfile');
      if (employer && employer.employerProfile) {
        employerDetails = {
          companyLogo: employer.employerProfile.companyLogo || '',
          companyAddress: employer.employerProfile.companyAddress || '',
          industry: employer.employerProfile.industry || '',
          companyWebsite: employer.employerProfile.companyWebsite || ''
        };
      }
    } catch (employerError) {
      console.error('Error fetching employer details:', employerError);
    }

    const jobResponse = job.toObject();

    if (employerDetails) {
      if (!jobResponse.companyLogo && employerDetails.companyLogo) {
        jobResponse.companyLogo = employerDetails.companyLogo;
      }
      jobResponse.employerDetails = employerDetails;
    }

    res.status(200).json({
      success: true,
      job: jobResponse
    });
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job'
    });
  }
};

// GET EMPLOYER'S JOBS (includes drafts)
exports.getEmployerJobs = async (req, res) => {
  try {
    const employer = await User.findById(req.user._id);
    const employerLogo = employer?.employerProfile?.companyLogo || '';

    const jobs = await Job.find({ employer: req.user._id })
      .select(
        'title location jobType workMode category isActive isPublished status createdAt companyLogo companyName applicationCount applicationDeadline'
      )
      .sort({ createdAt: -1 });

    const jobsWithLogo = jobs.map(job => {
      const jobObj = job.toObject();

      if (!jobObj.companyLogo && employerLogo) {
        jobObj.companyLogo = employerLogo;
      }

      return jobObj;
    });

    res.status(200).json({
      success: true,
      count: jobsWithLogo.length,
      jobs: jobsWithLogo
    });
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your jobs'
    });
  }
};

// UPDATE JOB (supports publish draft)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const employer = await User.findById(req.user._id);
    const currentLogo = employer?.employerProfile?.companyLogo || '';

    const wasDraft = job.isPublished === false;

    if (req.body.skillsRequired !== undefined) {
      job.skillsRequired = normalizeSkills(req.body.skillsRequired);
    }

    // ✅ NEW: block publishing if employer is not VERIFIED
    const employerVerificationStatus =
      employer?.employerProfile?.verificationDocs?.overallStatus || 'unverified';
    const isEmployerVerified = employerVerificationStatus === 'verified';
    const wantsToPublish = req.body.status === 'published';

    if (wantsToPublish && !isEmployerVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMPLOYER_NOT_VERIFIED',
        message: 'You cannot publish jobs until your company is verified by admin.',
        verificationStatus: employerVerificationStatus
      });
    }

    if (req.body.status) {
      if (req.body.status === 'draft') {
        job.status = 'draft';
        job.isPublished = false;
        job.isActive = false;
      } else if (req.body.status === 'published') {
        job.status = 'published';
        job.isPublished = true;
        if (req.body.isActive === undefined) job.isActive = true;
      }
    }

    Object.keys(req.body).forEach(key => {
      if (key === 'companyLogo') return;
      if (key === 'skillsRequired') return;
      if (key === 'status') return;

      if (key === 'experienceLevel') {
        job.experienceLevel = normalizeExperienceLevel(req.body.experienceLevel);
        return;
      }

      if (key === 'category') {
        job.category = normalizeCategory(req.body.category);
        return;
      }

      job[key] = req.body[key];
    });

    if (currentLogo && currentLogo !== job.companyLogo) {
      job.companyLogo = currentLogo;
    }

    if (employer?.employerProfile?.companyName && employer.employerProfile.companyName !== job.companyName) {
      job.companyName = employer.employerProfile.companyName;
    }

    await job.save();

    const nowPublished = job.isPublished === true;
    if (wasDraft && nowPublished) {
      await sendJobMatchNotifications(job);
    }

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job'
    });
  }
};

// DELETE JOB
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting job'
    });
  }
};

// UPDATE JOB STATUS
exports.updateJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update job status' });
    }

    job.isActive = req.body.isActive;

    await job.save();

    res.status(200).json({
      success: true,
      message: `Job ${req.body.isActive ? 'activated' : 'closed'} successfully`,
      job
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job status'
    });
  }
};
