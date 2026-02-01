const Message = require('../models/Message');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// ✅ IDINAGDAG: Import notification controller
const notificationController = require('./notificationController');

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/messages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs and documents are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// ✅ DAGDAG: Function para icheck kung eligible mag-message (QA RULES)
const checkMessagingEligibility = async (senderId, receiverId, jobId = null) => {
  try {
    // Maghanap ng application record
    const query = {
      $or: [
        { jobseeker: senderId, employer: receiverId },
        { jobseeker: receiverId, employer: senderId }
      ]
    };
    
    // Kung may jobId, isama sa query
    if (jobId) {
      query.job = jobId;
    }
    
    const application = await Application.findOne(query);
    
    // Kung walang application, hindi pwede mag-message
    if (!application) {
      return { 
        eligible: false, 
        reason: 'No application found between users' 
      };
    }
    
    // ✅ QA RULE: Shortlisted or Accepted lang pwede
    if (application.status === 'shortlisted' || application.status === 'accepted') {
      return { 
        eligible: true, 
        application 
      };
    }
    
    // Kung pending or rejected
    return { 
      eligible: false, 
      reason: `Messaging is available only after you are shortlisted or accepted. Current status: ${application.status}`,
      application 
    };
  } catch (error) {
    console.error('Error checking messaging eligibility:', error);
    return { eligible: false, reason: 'Server error' };
  }
};

// ✅ SIMPLIFIED SEND MESSAGE FUNCTION (WITH QA VALIDATION)
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType, interviewDetails, jobId, applicationId } = req.body;

    // ✅ DAGDAG: Check messaging eligibility bago mag-send
    const eligibility = await checkMessagingEligibility(req.user._id, receiverId, jobId);
    
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        message: eligibility.reason || 'Messaging is not allowed for this application status'
      });
    }

    // Validate required fields
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Generate conversation ID
    const participants = [req.user._id.toString(), receiverId].sort();
    const conversationId = participants.join('_');

    // Create message object
    const messageData = {
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      content: content || '',
      messageType: messageType || 'text',
      interviewDetails: interviewDetails || {},
      job: jobId || null,
      application: applicationId || null
    };

    // If there's a file upload
    if (req.file) {
      console.log('File uploaded:', req.file);

      // Determine file type
      let fileType = 'other';
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExt)) {
        fileType = 'image';
      } else if (fileExt === '.pdf') {
        fileType = 'pdf';
      } else if (['.doc', '.docx', '.txt'].includes(fileExt)) {
        fileType = 'document';
      }

      // Add file data to message
      messageData.messageType = 'file';
      messageData.content = content || `Sent a ${fileType} file: ${req.file.originalname}`;
      messageData.file = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType: fileType,
        fileUrl: `/uploads/messages/${req.file.filename}`,
        fileSize: req.file.size
      };
    }

    // Create and save message
    const message = new Message(messageData);
    await message.save();

    // Populate sender details
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName profileImage role')
      .populate('receiver', 'fullName profileImage role');

    // ✅ FIX: use FINAL message type (messageData.messageType), not req.body messageType
    const finalMessageType = messageData.messageType;

    // ✅ IDINAGDAG: Create notification for receiver (exclude interview + notification)
    if (finalMessageType !== 'interview' && finalMessageType !== 'notification') {
      await notificationController.createMessageNotification(
        req.user._id,
        receiverId,
        message
      );
    }

    // ✅ (optional) if someone sends interview via /send route (not typical), support it
    if (finalMessageType === 'interview' && messageData.interviewDetails) {
      await notificationController.createInterviewNotification(
        receiverId,
        messageData.interviewDetails
      );
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);

    // Delete uploaded file if error occurred
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// ✅ UPLOAD FILE
exports.uploadFile = (req, res) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    try {
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let fileType = 'other';

      if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExt)) {
        fileType = 'image';
      } else if (fileExt === '.pdf') {
        fileType = 'pdf';
      } else if (['.doc', '.docx', '.txt'].includes(fileExt)) {
        fileType = 'document';
      }

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileType: fileType,
          fileUrl: `/uploads/messages/${req.file.filename}`,
          fileSize: req.file.size
        }
      });
    } catch (error) {
      console.error('Error processing file upload:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: 'Error processing file upload'
      });
    }
  });
};

// ✅ GET FILE
exports.getFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/messages', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting file'
    });
  }
};

// ✅ GET CONVERSATIONS LIST
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get distinct conversations where user is either sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'senderDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.receiver',
          foreignField: '_id',
          as: 'receiverDetails'
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: [
              { $eq: [{ $arrayElemAt: ["$senderDetails._id", 0] }, userId] },
              { $arrayElemAt: ["$receiverDetails", 0] },
              { $arrayElemAt: ["$senderDetails", 0] }
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          otherUser: {
            _id: "$otherUser._id",
            fullName: "$otherUser.fullName",
            profileImage: "$otherUser.profileImage",
            role: "$otherUser.role",

            // ✅ KEEP OLD FIELD (para di masira existing frontend usage)
            companyName: "$otherUser.employerProfile.companyName",

            // ✅ FIX: include employerProfile with companyLogo
            employerProfile: {
              companyName: "$otherUser.employerProfile.companyName",
              companyLogo: "$otherUser.employerProfile.companyLogo"
            },

            // ✅ OPTIONAL: add top-level companyLogo too (extra safe for frontend)
            companyLogo: "$otherUser.employerProfile.companyLogo"
          },
          lastMessageTime: "$lastMessage.createdAt"
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
};

// ✅ GET MESSAGES FOR A CONVERSATION
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is part of the conversation
    const participants = conversationId.split('_');
    if (!participants.includes(userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this conversation'
      });
    }

    // Get messages
    const messages = await Message.find({ conversationId })
      .populate('sender', 'fullName profileImage role')
      .populate('receiver', 'fullName profileImage role')
      .populate('job', 'title companyName')
      .populate('application')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: Date.now() }
      }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// ✅ GET UNREAD MESSAGE COUNT
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count'
    });
  }
};

// ✅ MARK MESSAGES AS READ
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: Date.now() }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
};

// ✅ GET JOBSEEKERS FOR EMPLOYER (Only jobseekers who have applied to employer's jobs)
exports.getJobseekersForEmployer = async (req, res) => {
  try {
    const employerId = req.user._id;

    // Get jobseekers who have applied to employer's jobs
    const jobseekers = await Application.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      {
        $unwind: '$jobDetails'
      },
      {
        $match: {
          'jobDetails.employer': employerId
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'jobseeker',
          foreignField: '_id',
          as: 'jobseekerDetails'
        }
      },
      {
        $unwind: '$jobseekerDetails'
      },
      {
        $group: {
          _id: '$jobseeker',
          jobseeker: { $first: '$jobseekerDetails' },
          jobsApplied: { $addToSet: '$jobDetails.title' },
          lastApplicationDate: { $max: '$appliedAt' }
        }
      },
      {
        $project: {
          _id: 1,
          'jobseeker._id': 1,
          'jobseeker.fullName': 1,
          'jobseeker.profileImage': 1,
          'jobseeker.email': 1,
          'jobseeker.jobSeekerProfile.skills': 1,
          jobsApplied: 1,
          lastApplicationDate: 1
        }
      },
      {
        $sort: { lastApplicationDate: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: jobseekers.length,
      data: jobseekers
    });

  } catch (error) {
    console.error('Error fetching jobseekers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobseekers'
    });
  }
};

// ✅ GET EMPLOYERS FOR JOBSEEKER (Only employers whose jobs jobseeker has applied to)
exports.getEmployersForJobseeker = async (req, res) => {
  try {
    const jobseekerId = req.user._id;

    // Get employers whose jobs jobseeker has applied to
    const employers = await Application.aggregate([
      {
        $match: { jobseeker: jobseekerId }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'job',
          foreignField: '_id',
          as: 'jobDetails'
        }
      },
      {
        $unwind: '$jobDetails'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'jobDetails.employer',
          foreignField: '_id',
          as: 'employerDetails'
        }
      },
      {
        $unwind: '$employerDetails'
      },
      {
        $group: {
          _id: '$employerDetails._id',
          employer: { $first: '$employerDetails' },
          jobsApplied: { $addToSet: '$jobDetails.title' },
          lastApplicationDate: { $max: '$appliedAt' }
        }
      },
      {
        $project: {
          _id: 1,
          'employer._id': 1,
          'employer.fullName': 1,
          'employer.profileImage': 1,
          'employer.email': 1,
          'employer.employerProfile.companyName': 1,
          'employer.employerProfile.companyLogo': 1,
          jobsApplied: 1,
          lastApplicationDate: 1
        }
      },
      {
        $sort: { lastApplicationDate: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: employers.length,
      data: employers
    });

  } catch (error) {
    console.error('Error fetching employers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employers'
    });
  }
};

// ✅ SCHEDULE INTERVIEW
exports.scheduleInterview = async (req, res) => {
  try {
    const { receiverId, jobId, applicationId, interviewDetails } = req.body;

    if (!receiverId || !interviewDetails) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and interview details are required'
      });
    }

    // ✅ DAGDAG: Check messaging eligibility bago mag-schedule ng interview
    const eligibility = await checkMessagingEligibility(req.user._id, receiverId, jobId);
    
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        message: eligibility.reason || 'Cannot schedule interview. Applicant must be shortlisted or accepted first.'
      });
    }

    const participants = [req.user._id.toString(), receiverId].sort();
    const conversationId = participants.join('_');

    const message = new Message({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      content: `Interview Scheduled: ${interviewDetails.date} at ${interviewDetails.time}`,
      messageType: 'interview',
      interviewDetails,
      job: jobId || null,
      application: applicationId || null
    });

    await message.save();

    // ✅ IDINAGDAG: Create interview notification
    await notificationController.createInterviewNotification(
      receiverId,
      interviewDetails
    );

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName profileImage role')
      .populate('receiver', 'fullName profileImage role')
      .populate('job', 'title companyName');

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling interview'
    });
  }
};

// ✅ NEW: GET INTERVIEWS COUNT (NEXT N DAYS) — used by dashboard
exports.getInterviewsCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const days = Number(req.query.days || 7);
    const safeDays = Number.isFinite(days) && days > 0 ? days : 7;

    const now = new Date();
    const end = new Date(now.getTime() + safeDays * 24 * 60 * 60 * 1000);

    const count = await Message.countDocuments({
      messageType: 'interview',
      $or: [{ sender: userId }, { receiver: userId }],
      'interviewDetails.date': { $gte: now, $lte: end }
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching interviews count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interviews count'
    });
  }
};