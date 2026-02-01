const Notification = require('../models/Notification');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Message = require('../models/Message');

// Get all notifications for user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const notifications = await Notification.find({
            user: userId,
            isArchived: false
        })
        .sort({ createdAt: -1 })
        .limit(50);
        
        const unreadCount = await Notification.countDocuments({
            user: userId,
            isRead: false,
            isArchived: false
        });
        
        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userId },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification'
        });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notifications'
        });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        const notification = await Notification.findOneAndDelete({
            _id: id,
            user: userId
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification'
        });
    }
};

// Clear all notifications
exports.clearAll = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await Notification.updateMany(
            { user: userId },
            { isArchived: true }
        );
        
        res.json({
            success: true,
            message: 'All notifications cleared'
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing notifications'
        });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const count = await Notification.countDocuments({
            user: userId,
            isRead: false,
            isArchived: false
        });
        
        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notification count'
        });
    }
};

// HELPER FUNCTIONS - To be called from other controllers

// Sa loob ng notificationController.js, palitan ang createJobMatchNotification function:

// Create job match notification (IMPROVED MATCHING LOGIC)
exports.createJobMatchNotification = async (jobseekerId, job) => {
  try {
    const user = await User.findById(jobseekerId);
    if (!user || !user.jobSeekerProfile || !user.jobSeekerProfile.skills) return;
    
    const jobseekerSkills = user.jobSeekerProfile.skills.map(skill => skill.toLowerCase().trim());
    const jobSkills = (job.skillsRequired || []).map(skill => skill.toLowerCase().trim());
    
    // Calculate matching skills (case-insensitive and partial matching)
    const matchingSkills = [];
    
    for (const jobseekerSkill of jobseekerSkills) {
      for (const jobSkill of jobSkills) {
        // Check for exact match or partial match
        if (jobseekerSkill === jobSkill || 
            jobseekerSkill.includes(jobSkill) || 
            jobSkill.includes(jobseekerSkill)) {
          matchingSkills.push(jobseekerSkill);
          break; // Move to next jobseeker skill
        }
      }
    }
    
    // Only send notification if there's at least one matching skill
    if (matchingSkills.length === 0) {
      console.log(`No skill match for jobseeker ${jobseekerId} and job ${job.title}`);
      return;
    }
    
    // Check if similar notification already exists in last 24 hours
    const existingNotification = await Notification.findOne({
      user: jobseekerId,
      type: 'job_match',
      'metadata.jobId': job._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (existingNotification) {
      console.log(`Duplicate notification prevented for jobseeker ${jobseekerId} and job ${job.title}`);
      return;
    }
    
    // Create personalized message based on matching skills
    let message;
    if (matchingSkills.length > 2) {
      message = `A new job "${job.title}" at ${job.companyName} matches ${matchingSkills.length} of your skills.`;
    } else if (matchingSkills.length > 1) {
      message = `A new job "${job.title}" at ${job.companyName} matches your skills: ${matchingSkills.join(', ')}.`;
    } else {
      message = `A new job "${job.title}" at ${job.companyName} matches your skill: ${matchingSkills[0]}.`;
    }
    
    const notification = new Notification({
      user: jobseekerId,
      type: 'job_match',
      title: 'New Job Match!',
      message: message,
      relatedId: job._id,
      relatedModel: 'Job',
      link: `/jobseeker/job-details/${job._id}`,
      metadata: {
        jobId: job._id,
        companyName: job.companyName,
        jobTitle: job.title,
        matchingSkills: matchingSkills,
        matchCount: matchingSkills.length
      }
    });
    
    await notification.save();
    console.log(`✅ Notification created for jobseeker ${jobseekerId} - Job: ${job.title}`);
    return notification;
    
  } catch (error) {
    console.error('Error creating job match notification:', error);
  }
};

// Create application status update notification
exports.createApplicationStatusNotification = async (application, oldStatus, newStatus) => {
    try {
        const statusMessages = {
            'shortlisted': 'Your application has been shortlisted!',
            'accepted': 'Congratulations! Your application has been accepted!',
            'rejected': 'Your application status has been updated.'
        };
        
        const message = statusMessages[newStatus] || `Your application status changed to ${newStatus}`;
        
        const notification = new Notification({
            user: application.jobseeker,
            type: 'application_update',
            title: 'Application Update',
            message: `${message} for "${application.job?.title || 'the job'}" at ${application.job?.companyName || 'the company'}.`,
            relatedId: application._id,
            relatedModel: 'Application',
            link: `/jobseeker/my-applications`,
            metadata: {
                applicationId: application._id,
                jobId: application.job,
                oldStatus,
                newStatus
            }
        });
        
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating application status notification:', error);
    }
};

// Create new message notification
exports.createMessageNotification = async (senderId, receiverId, message) => {
    try {
        const sender = await User.findById(senderId);
        if (!sender) return;
        
        // Check if there's already an unread notification for this conversation
        const existingNotification = await Notification.findOne({
            user: receiverId,
            type: 'new_message',
            'metadata.senderId': senderId,
            isRead: false,
            createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // 10 minutes
        });
        
        if (existingNotification) {
            // Update existing notification with new message preview
            existingNotification.message = `New message from ${sender.fullName || sender.companyName || 'User'}: ${message.content.substring(0, 50)}...`;
            existingNotification.metadata.lastMessage = message.content;
            await existingNotification.save();
            return existingNotification;
        }
        
        const notification = new Notification({
            user: receiverId,
            type: 'new_message',
            title: 'New Message',
            message: `New message from ${sender.fullName || sender.companyName || 'User'}: ${message.content.substring(0, 50)}...`,
            relatedId: message._id,
            relatedModel: 'Message',
            link: `/jobseeker/messages?conversation=${message.conversationId}`,
            metadata: {
                senderId: sender._id,
                senderName: sender.fullName || sender.companyName,
                conversationId: message.conversationId,
                lastMessage: message.content
            }
        });
        
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating message notification:', error);
    }
};

// Create interview scheduled notification
exports.createInterviewNotification = async (jobseekerId, interviewDetails) => {
    try {
        const notification = new Notification({
            user: jobseekerId,
            type: 'interview',
            title: 'Interview Scheduled!',
            message: `An interview has been scheduled for ${interviewDetails.date} at ${interviewDetails.time}. Location: ${interviewDetails.location || 'Online'}`,
            link: `/jobseeker/messages`,
            metadata: {
                interviewDate: interviewDetails.date,
                interviewTime: interviewDetails.time,
                location: interviewDetails.location,
                meetingLink: interviewDetails.meetingLink
            }
        });
        
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating interview notification:', error);
    }
};