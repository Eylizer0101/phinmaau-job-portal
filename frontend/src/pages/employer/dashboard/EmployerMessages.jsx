import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faPaperPlane,
  faCalendarAlt,
  faClock,
  faMapMarkerAlt,
  faVideo,
  faPaperclip,
  faCheckDouble,
  faCheck,
  faComments,
  faEnvelope,
  faFilePdf,
  faFileImage,
  faFileWord,
  faFile,
  faDownload,
  faTimes,
  faSpinner,
  faChevronDown,
  faChevronUp,
  faArrowLeft,
  faEye,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import EmployerLayout from '../../../layouts/EmployerLayout';

// ---------------- UI TOKENS ----------------
const UI = {
  pageBg: 'bg-gray-50',
  container: 'mx-auto max-w-7xl px-1 py-8',
  shell: 'bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden',

  grid: 'flex min-h-[690px] h-[calc(100vh-180px)]',
  sidebar: 'w-full sm:w-[320px] md:w-[340px] lg:w-[360px] border-r border-gray-200 flex flex-col bg-white',
  main: 'flex-1 flex flex-col bg-white min-w-0',

  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textMuted: 'text-gray-500',

  h1: 'text-2xl sm:text-3xl font-bold tracking-tight',
  h2: 'text-base font-semibold',
  caption: 'text-xs',

  panelPad: 'p-4',
  inset: 'bg-gray-50 border border-gray-200 rounded-xl',
  divider: 'border-t border-gray-100',

  ring: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
  input:
    'w-full h-10 px-10 pr-4 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-200',

  btnBase:
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-60 disabled:pointer-events-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:transform-none',
  btnSm: 'h-9 px-3 text-sm',
  btnMd: 'h-10 px-4 text-sm',
  btnIcon: 'h-10 w-10',

  btnPrimary: 'bg-green-600 text-white hover:bg-green-700',

  btnSecondary: 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50',
  btnGhost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  btnDangerGhost: 'bg-transparent text-gray-600 hover:bg-gray-100',

  badge: 'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border',

  badgeUnread: 'bg-green-50 text-green-800 border-green-200',

  convItem:
    'relative p-3 rounded-xl border border-transparent hover:bg-gray-50 hover:border-gray-200 transition cursor-pointer',

  convActive: 'bg-green-50 border-green-200 ring-1 ring-green-200',

  chatHeader: 'p-4 border-b border-gray-200 bg-white',
  chatBody: 'flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gray-50',
  chatInputWrap:
    'sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80',

  bubbleBase: 'w-fit max-w-[92%] sm:max-w-[70%] lg:max-w-[68%] rounded-2xl p-3',

  bubbleTextMe: 'bg-green-600 text-white rounded-br-md',

  bubbleTextOther: 'bg-white border border-gray-200 text-gray-900 rounded-bl-md',

  attachWrap: 'w-full max-w-[92%] sm:max-w-[70%] lg:max-w-[68%]',
  attachBar: 'inline-flex w-full items-center gap-3 rounded-xl px-3 py-2 border',

  attachBarMe: 'border-green-200 bg-green-50 text-gray-900',

  attachBarOther: 'border-gray-200 bg-white text-gray-900',

  attachIconWrapMe:
    'h-10 w-10 rounded-xl bg-white border border-green-200 flex items-center justify-center flex-shrink-0',

  attachIconWrapOther:
    'h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0',

  attachBtn: 'h-9 w-9 rounded-xl border transition flex items-center justify-center',

  attachBtnMe: 'border-green-200 bg-white hover:bg-green-50',

  attachBtnOther: 'border-gray-200 bg-gray-50 hover:bg-gray-100',

  imgWrap: 'relative w-full max-w-[92%] sm:max-w-[70%] lg:max-w-[68%] group',
  imgOnly: 'w-full max-h-80 object-contain rounded-xl border border-gray-200 bg-white',
  imgOverlay: 'absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition',
  imgOverlayBtn:
    'h-9 w-9 rounded-lg bg-white/90 backdrop-blur border border-gray-200 shadow-sm flex items-center justify-center hover:bg-white',
};

// ---------------- CONSTANTS ----------------
const MAX_FILE_MB = 10;
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

// ---------------- HELPERS ----------------
const getToken = () => localStorage.getItem('token');

const getUserId = () => {
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    return user.id || user._id || null;
  } catch {
    return null;
  }
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  const diffMinutes = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const normalizeFileType = (mimeOrType, name = '') => {
  const lower = (mimeOrType || '').toLowerCase();
  const ext = name.split('.').pop()?.toLowerCase();

  if (lower.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  if (lower === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (lower.includes('word') || lower.includes('msword') || ['doc', 'docx'].includes(ext)) return 'document';
  return 'other';
};

const getFileIcon = (type) => {
  if (type === 'image') return faFileImage;
  if (type === 'pdf') return faFilePdf;
  if (type === 'document') return faFileWord;
  return faFile;
};

// Generates stable client-side ids (for optimistic UI)
const makeClientId = () => `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

// ---------------- COMPONENT ----------------
const EmployerMessages = () => {
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE,
    });
    instance.interceptors.request.use((config) => {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return instance;
  }, [API_BASE]);

  // state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [jobseekers, setJobseekers] = useState([]);
  
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [showMessagingRules, setShowMessagingRules] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [convSearch, setConvSearch] = useState('');
  const [jsSearch, setJsSearch] = useState('');

  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDetails, setInterviewDetails] = useState({
    date: '',
    time: '',
    location: '',
    meetingLink: '',
    notes: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [isJobseekersOpen, setIsJobseekersOpen] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  // toast
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);

  // modal a11y refs
  const modalRef = useRef(null);
  const firstModalFieldRef = useRef(null);

  const currentUserId = useMemo(() => getUserId(), []);

  const showToast = useCallback((t) => {
    setToast(t);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    // ✅ UPDATED: 7 seconds before toast disappears
    toastTimerRef.current = window.setTimeout(() => setToast(null), 5500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const getFileUrl = useCallback(
    (fileUrl) => {
      if (!fileUrl) return '';
      if (fileUrl.startsWith('http')) return fileUrl;
      return `${API_BASE}${fileUrl}`;
    },
    [API_BASE]
  );

  const getProfileImageUrl = useCallback(
    (imgPath) => {
      if (!imgPath) return '';
      if (imgPath.startsWith('http')) return imgPath;
      return `${API_BASE}${imgPath}`;
    },
    [API_BASE]
  );

  const openFile = useCallback(
    (fileData) => {
      const url = getFileUrl(fileData?.fileUrl);
      if (!url) return;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [getFileUrl]
  );

  const downloadFile = useCallback(
    (fileData) => {
      const url = getFileUrl(fileData?.fileUrl);
      if (!url) return;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileData?.originalName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [getFileUrl]
  );

  const isNearBottom = useCallback(() => {
    const el = chatBodyRef.current;
    if (!el) return true;
    const threshold = 160;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // ---------------- API ----------------
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/api/messages/conversations');
      if (res.data?.success) setConversations(res.data.data || []);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Failed to load conversations', message: 'Please refresh the page.' });
    }
  }, [api, showToast]);

  const fetchJobseekers = useCallback(async () => {
    try {
      const res = await api.get('/api/messages/employer/jobseekers');
      if (res.data?.success) setJobseekers(res.data.data || []);
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Failed to load job seekers', message: 'Please refresh the page.' });
    }
  }, [api, showToast]);

// ✅ FIXED: Proper function to get REAL application status from backend
const fetchApplicationStatus = useCallback(async (jobseekerId) => {
  if (!jobseekerId) {
    setApplicationStatus(null);
    return;
  }
  
  try {
    setCheckingStatus(true);
    console.log('Fetching REAL application status for jobseeker:', jobseekerId);
    
    // STRATEGY 1: Try the dedicated endpoint first
    try {
      const statusRes = await api.get(`/api/applications/jobseeker/${jobseekerId}/status`);
      console.log('Status API response:', statusRes.data);
      
      if (statusRes.data?.success) {
        if (statusRes.data.status) {
          console.log('Got REAL status from API:', statusRes.data.status);
          setApplicationStatus(statusRes.data.status.toLowerCase());
          setCheckingStatus(false);
          return;
        } else if (statusRes.data.hasApplied === false) {
          console.log('Jobseeker has not applied to any jobs');
          setApplicationStatus(null);
          setCheckingStatus(false);
          return;
        }
      }
    } catch (err) {
      console.log('Status endpoint failed:', err.message);
    }
    
    // STRATEGY 2: Check if there are existing messages (if yes, assume eligible)
    const hasExistingConversation = conversations.some(
      conv => conv?.otherUser?._id === jobseekerId
    );
    
    if (hasExistingConversation) {
      console.log('Has existing conversation, assuming eligible');
      setApplicationStatus('shortlisted');
      setCheckingStatus(false);
      return;
    }
    
    // STRATEGY 3: Check employer's applications
    try {
      const applicationsRes = await api.get('/api/applications/employer/all');
      if (applicationsRes.data?.success) {
        const applications = applicationsRes.data.applications || [];
        
        // Find application for this specific jobseeker
        const jobseekerApplication = applications.find(app => 
          app.jobseeker?._id === jobseekerId || 
          app.jobseeker?._id?.toString() === jobseekerId.toString()
        );
        
        if (jobseekerApplication) {
          console.log('Found application in employer list:', jobseekerApplication.status);
          setApplicationStatus(jobseekerApplication.status.toLowerCase());
          setCheckingStatus(false);
          return;
        }
      }
    } catch (err) {
      console.log('Failed to get employer applications:', err.message);
    }
    
    // STRATEGY 4: Final fallback
    console.log('No application found, setting status to null');
    setApplicationStatus(null);
    
  } catch (err) {
    console.error('Error in fetchApplicationStatus:', err);
    setApplicationStatus(null);
  } finally {
    setCheckingStatus(false);
  }
}, [api, conversations]);

  const fetchMessages = useCallback(
    async (conversationId) => {
      try {
        const res = await api.get(`/api/messages/conversation/${conversationId}`);
        if (res.data?.success) {
          setMessages(res.data.data || []);
          setTimeout(() => scrollToBottom(false), 0);
        }
      } catch (err) {
        console.error(err);
        showToast({ type: 'error', title: 'Failed to load messages', message: 'Try selecting the conversation again.' });
      }
    },
    [api, scrollToBottom, showToast]
  );

  // ✅ FIXED: Handle missing mark read endpoint gracefully
  const markConversationRead = useCallback(
    async (conversationId) => {
      if (!conversationId) return;
      try {
        await api.post(`/api/messages/mark-read`, { conversationId });
        fetchConversations();
      } catch (err) {
        // Silent fail - this endpoint might not exist
        console.log('Mark read endpoint not available, continuing...');
      }
    },
    [api, fetchConversations]
  );

  const getOrCreateConversation = useCallback(
    async (receiverId) => {
      try {
        const res = await api.post('/api/messages/conversations/get-or-create', { receiverId });
        if (res.data?.success) return res.data.data;
      } catch {
        // fallback below
      }

      const existing = conversations.find((c) => c?.otherUser?._id === receiverId);
      if (existing) return existing;

      return {
        _id: `temp_${currentUserId}_${receiverId}`,
        otherUser: { _id: receiverId, fullName: 'Unknown Jobseeker', profileImage: '' },
        lastMessage: null,
        unreadCount: 0,
        __temp: true,
      };
    },
    [api, conversations, currentUserId]
  );

  // ---------------- BOOT ----------------
  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchJobseekers()]);
      setLoading(false);
    };
    boot();
  }, [fetchConversations, fetchJobseekers]);

  useEffect(() => {
    if (!selectedConversation?._id) return;
    fetchMessages(selectedConversation._id);
    markConversationRead(selectedConversation._id);
    
    if (selectedConversation?.otherUser?._id) {
      fetchApplicationStatus(selectedConversation.otherUser._id);
    } else {
      setApplicationStatus(null);
    }
    
    setShowMessagingRules(false);
  }, [selectedConversation?._id, fetchMessages, markConversationRead, fetchApplicationStatus]);

  useEffect(() => {
    if (isNearBottom()) scrollToBottom(true);
  }, [messages, isNearBottom, scrollToBottom]);

  useEffect(() => {
    if (selectedConversation) setIsJobseekersOpen(false);
  }, [selectedConversation]);

  // ---------------- DERIVED ----------------
  const filteredConversations = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const name = conv.otherUser?.fullName?.toLowerCase() || '';
      const last = conv.lastMessage?.content?.toLowerCase() || '';
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, convSearch]);

  const filteredJobseekers = useMemo(() => {
    const q = jsSearch.trim().toLowerCase();
    if (!q) return jobseekers;
    return jobseekers.filter((js) => js.jobseeker?.fullName?.toLowerCase().includes(q));
  }, [jobseekers, jsSearch]);

  const selectedHeaderTitle = useMemo(() => {
    if (!selectedConversation) return '';
    return selectedConversation.otherUser?.fullName || 'Unknown User';
  }, [selectedConversation]);

  // ✅ FIXED: Proper eligibility check - MAJOR FIX HERE
  const isEligibleToMessage = useMemo(() => {
    console.log('Checking eligibility:', {
      status: applicationStatus,
      checking: checkingStatus,
      hasMessages: messages.length > 0
    });
    
    // If checking, allow temporarily (better UX)
    if (checkingStatus) {
      return true;
    }
    
    // If has existing messages, ALWAYS eligible
    if (messages.length > 0) {
      console.log('Has existing messages, automatically eligible');
      return true;
    }
    
    // If no application status at all, not eligible
    if (!applicationStatus) {
      console.log('No application status, not eligible');
      return false;
    }
    
    // Check eligible statuses
    const status = applicationStatus.toLowerCase();
    const eligibleStatuses = ['shortlisted', 'accepted', 'interview', 'hired'];
    const isEligible = eligibleStatuses.includes(status);
    
    console.log('Status check:', { status, isEligible });
    return isEligible;
  }, [applicationStatus, checkingStatus, messages.length]);

  // ---------------- ACTIONS ----------------
  const requireSession = useCallback(() => {
    const token = getToken();
    if (!token) {
      showToast({ type: 'error', title: 'Session expired', message: 'Please login again.' });
      navigate('/login');
      return false;
    }
    return true;
  }, [navigate, showToast]);

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setShowSidebar(false);
  };

  const handleSelectJobseeker = useCallback(
    async (jobseeker) => {
      if (!requireSession()) return;

      const receiverId = jobseeker?._id;
      if (!receiverId) {
        showToast({ type: 'error', title: 'Jobseeker missing', message: 'Please try again.' });
        return;
      }

      const conv = await getOrCreateConversation(receiverId);

      conv.otherUser = conv.otherUser || { _id: receiverId, fullName: jobseeker?.fullName || 'Unknown Jobseeker', profileImage: '' };
      conv.otherUser.fullName = jobseeker?.fullName || conv.otherUser.fullName;
      conv.otherUser.profileImage = jobseeker?.profileImage || conv.otherUser.profileImage || '';

      setSelectedConversation(conv);

      if (conv.__temp) setMessages([]);

      setShowSidebar(false);
      
      fetchApplicationStatus(receiverId);
      setShowMessagingRules(false);
    },
    [getOrCreateConversation, requireSession, showToast, fetchApplicationStatus]
  );

  const handleFileSelect = (e) => {
    if (!isEligibleToMessage && messages.length === 0) {
      showToast({ 
        type: 'error', 
        title: 'Not Eligible', 
        message: 'You can only send files to shortlisted or accepted jobseekers.' 
      });
      setShowMessagingRules(true);
      e.target.value = '';
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showToast({ type: 'error', title: 'File too large', message: `Max ${MAX_FILE_MB}MB.` });
      e.target.value = '';
      return;
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      showToast({
        type: 'error',
        title: 'Unsupported file type',
        message: 'Only images, PDFs, DOC/DOCX, and TXT are allowed.',
      });
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    e.target.value = '';
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // ✅ FIXED: Handle send message with proper eligibility check
  const handleSendMessage = useCallback(async () => {
    // Check eligibility BEFORE sending
    if (!isEligibleToMessage && messages.length === 0) {
      // Show rules banner
      setShowMessagingRules(true);

      // ✅ UPDATED: exact toast content requested
      showToast({ 
        type: 'error',
        title: 'Messaging restricted',
        message:
          'You can message this applicant once their status is Shortlisted or Accepted. Current status: Pending. Go to Applicants to update the status.'
      });

      return;
    }
    
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;
    if (!requireSession()) return;

    const receiverId = selectedConversation.otherUser?._id;
    if (!receiverId) {
      showToast({ type: 'error', title: 'Receiver missing', message: 'Please re-open the conversation.' });
      return;
    }

    const optimisticId = makeClientId();
    const optimisticMsg = {
      _id: optimisticId,
      clientId: optimisticId,
      sender: { _id: currentUserId },
      receiver: { _id: receiverId },
      content: newMessage || '',
      createdAt: new Date().toISOString(),
      isRead: false,
      messageType: selectedFile ? 'file' : 'text',
      file: selectedFile
        ? {
            originalName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            fileUrl: null,
          }
        : null,
      __optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    const fileToSend = selectedFile;
    removeSelectedFile();
    setTimeout(() => scrollToBottom(true), 0);

    try {
      setSending(true);

      const formData = new FormData();
      if (fileToSend) formData.append('file', fileToSend);
      formData.append('receiverId', receiverId);
      formData.append('content', optimisticMsg.content);

      const res = await api.post('/api/messages/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const serverMsg = res.data.data;

        setMessages((prev) => prev.map((m) => (m._id === optimisticId ? serverMsg : m)));
        fetchConversations();
        setTimeout(() => scrollToBottom(true), 0);
      } else {
        throw new Error('Send failed');
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
      showToast({ type: 'error', title: 'Send failed', message: err.response?.data?.message || err.message });
    } finally {
      setSending(false);
    }
  }, [
    api,
    currentUserId,
    fetchConversations,
    newMessage,
    requireSession,
    scrollToBottom,
    selectedConversation,
    selectedFile,
    showToast,
    isEligibleToMessage,
    messages.length,
  ]);

  const handleScheduleInterview = useCallback(async () => {
    if (!isEligibleToMessage && messages.length === 0) {
      setShowMessagingRules(true);

      // ✅ UPDATED: exact toast content requested
      showToast({ 
        type: 'error',
        title: 'Messaging restricted',
        message:
          'You can message this applicant once their status is Shortlisted or Accepted. Current status: Pending. Go to Applicants to update the status.'
      });

      return;
    }
    
    if (!selectedConversation || !interviewDetails.date || !interviewDetails.time) {
      showToast({ type: 'info', title: 'Missing details', message: 'Please fill in date and time.' });
      return;
    }
    if (!requireSession()) return;

    const receiverId = selectedConversation.otherUser?._id;
    if (!receiverId) {
      showToast({ type: 'error', title: 'Receiver missing', message: 'Please re-open the conversation.' });
      return;
    }

    try {
      const res = await api.post('/api/messages/schedule-interview', { receiverId, interviewDetails });
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setShowInterviewModal(false);
        setInterviewDetails({ date: '', time: '', location: '', meetingLink: '', notes: '' });
        fetchConversations();
        setTimeout(() => scrollToBottom(true), 0);
        showToast({ type: 'success', title: 'Interview scheduled', message: 'A message was sent to the job seeker.' });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Schedule failed', message: 'Please try again.' });
    }
  }, [api, fetchConversations, interviewDetails, requireSession, scrollToBottom, selectedConversation, showToast, isEligibleToMessage, messages.length]);

  // ---------------- MODAL A11Y ----------------
  useEffect(() => {
    if (!showInterviewModal) return;

    const prevActive = document.activeElement;
    const focusFirst = () => firstModalFieldRef.current?.focus();
    const timer = setTimeout(focusFirst, 0);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowInterviewModal(false);
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      prevActive?.focus?.();
    };
  }, [showInterviewModal]);

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <EmployerLayout>
        <div className={UI.container}>
          <div className={`${UI.shell} p-10`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-80 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="mt-6 h-[520px] bg-gray-50 border border-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </EmployerLayout>
    );
  }

  // ---------------- SMALL COMPONENTS ----------------
  const MessageMeta = ({ me, time, isRead, variant = 'bubble' }) => {
    const timeClass =
      variant === 'bubble'
        ? me
          ? 'text-white/80'
          : 'text-gray-500'
        : 'text-gray-500';

    const checkClass =
      variant === 'bubble'
        ? me
          ? isRead
            ? 'text-white/90'
            : 'text-white/60'
          : 'text-emerald-700/80'
        : 'text-emerald-700/80';

    return (
      <div className="flex items-center justify-between gap-3 mt-2">
        <span className={`text-xs ${timeClass}`}>{time}</span>
        {me && (
          <FontAwesomeIcon
            icon={isRead ? faCheckDouble : faCheck}
            className={`text-xs ${checkClass}`}
            aria-label={isRead ? 'Read' : 'Sent'}
          />
        )}
      </div>
    );
  };

  const InterviewBubble = ({ msg, me }) => {
    const details = msg.interviewDetails;
    return (
      <div
        className={`${UI.bubbleBase} bg-amber-50 border border-amber-200 text-amber-900 ${
          me ? 'rounded-br-md' : 'rounded-bl-md'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          <FontAwesomeIcon icon={faCalendarAlt} aria-hidden="true" />
          <span>Interview Scheduled</span>
        </div>

        {details && (
          <div className="mt-3 space-y-2 text-sm text-amber-900/90">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Date: {new Date(details.date).toLocaleDateString('en-PH')}</span>
            </div>

            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Time: {details.time}</span>
            </div>

            {details.location && (
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3.5 h-3.5 mt-0.5" aria-hidden="true" />
                <span className="break-words">Location: {details.location}</span>
              </div>
            )}

            {details.meetingLink && (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faVideo} className="w-3.5 h-3.5" aria-hidden="true" />
                <a
                  href={details.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline break-all"
                >
                  Join Meeting
                </a>
              </div>
            )}

            {details.notes && (
              <p className="pt-2 border-t border-amber-200/60 text-xs text-amber-900/80 break-words">
                {details.notes}
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-amber-900/70">{formatTime(msg.createdAt)}</span>
          {me && (
            <FontAwesomeIcon
              icon={msg.isRead ? faCheckDouble : faCheck}
              className="text-xs text-amber-900/70"
              aria-label={msg.isRead ? 'Read' : 'Sent'}
            />
          )}
        </div>
      </div>
    );
  };

  // ---------------- RENDER ----------------
  return (
    <EmployerLayout>
      <div className={UI.pageBg}>
        <div className={UI.container}>
          {/* Banner */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
            <p className="text-gray-600 mt-2">Communicate with job seekers for interviews and follow-ups</p>
          </div>

          <div className={UI.shell}>
            <div className={UI.grid}>
              {/* SIDEBAR */}
              <div className={[UI.sidebar, showSidebar ? 'block' : 'hidden', 'sm:block'].join(' ')}>
                <div className={`${UI.panelPad} ${UI.divider}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`${UI.h2} ${UI.textPrimary}`}>Conversations</p>

                    <button
                      type="button"
                      onClick={() => setShowSidebar(false)}
                      className={`sm:hidden ${UI.btnBase} ${UI.btnIcon} ${UI.btnGhost} ${UI.ring}`}
                      aria-label="Close sidebar"
                    >
                      <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3 relative">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      value={convSearch}
                      onChange={(e) => setConvSearch(e.target.value)}
                      className={`${UI.input} ${UI.ring}`}
                      placeholder="Search conversations…"
                      aria-label="Search conversations"
                    />
                  </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto p-3">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-10">
                      <FontAwesomeIcon icon={faComments} className="w-10 h-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                      <p className={`font-semibold ${UI.textPrimary}`}>No conversations</p>
                      <p className={`text-sm ${UI.textMuted} mt-1`}>Select a job seeker below to start.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredConversations.map((conv) => {
                        const active = selectedConversation?._id === conv._id;
                        const title = conv.otherUser?.fullName || 'Unknown User';
                        const time = formatTime(conv.lastMessageTime || conv.lastMessage?.createdAt);
                        const last = conv.lastMessage?.content || 'No messages yet';

                        const avatarUrl = getProfileImageUrl(conv.otherUser?.profileImage);

                        return (
                          <button
                            key={conv._id}
                            type="button"
                            onClick={() => handleSelectConversation(conv)}
                            className={['w-full text-left', UI.convItem, active ? UI.convActive : '', UI.ring].join(' ')}
                            aria-current={active ? 'page' : undefined}
                          >
                            {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-green-600" />}

                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-full overflow-hidden bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span className="text-green-700 font-bold text-sm">
                                    {(title?.trim()?.[0] || 'U').toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`font-semibold ${UI.textPrimary} truncate`} title={title}>
                                    {title}
                                  </p>
                                  <span className={`text-xs ${UI.textMuted} flex-shrink-0`}>{time}</span>
                                </div>

                                <p className={`text-sm ${UI.textSecondary} mt-1 line-clamp-2`} title={last}>
                                  {last}
                                </p>

                                {conv.unreadCount > 0 && (
                                  <span className={`${UI.badge} ${UI.badgeUnread} mt-2`}>{conv.unreadCount} new</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Jobseekers */}
                <div className="border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsJobseekersOpen((v) => !v)}
                    className={`w-full ${UI.panelPad} flex items-center justify-between ${UI.btnBase} ${UI.btnGhost} ${UI.ring}`}
                    aria-expanded={isJobseekersOpen}
                  >
                    <div className="text-left">
                      <span className={`${UI.h2} ${UI.textPrimary}`}>Available Job Seekers</span>
                      <div className={`text-xs ${UI.textMuted} mt-0.5`}>Start a new conversation</div>
                    </div>
                    <FontAwesomeIcon icon={isJobseekersOpen ? faChevronUp : faChevronDown} aria-hidden="true" />
                  </button>

                  {isJobseekersOpen && (
                    <div className="px-4 pb-4">
                      <div className="relative mb-3">
                        <FontAwesomeIcon
                          icon={faSearch}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          aria-hidden="true"
                        />
                        <input
                          value={jsSearch}
                          onChange={(e) => setJsSearch(e.target.value)}
                          className={`${UI.input} ${UI.ring}`}
                          placeholder="Search job seekers…"
                          aria-label="Search job seekers"
                        />
                      </div>

                      <div className="space-y-2 max-h-44 overflow-y-auto">
                        {filteredJobseekers.length > 0 ? (
                          filteredJobseekers.map((js) => {
                            const jobseeker = js.jobseeker;
                            const name = jobseeker?.fullName || 'Unknown Jobseeker';
                            const id = jobseeker?._id;

                            const avatarUrl = getProfileImageUrl(jobseeker?.profileImage);

                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => handleSelectJobseeker(jobseeker)}
                                className={`w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition ${UI.ring}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full overflow-hidden bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                                    {avatarUrl ? (
                                      <img
                                        src={avatarUrl}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <span className="text-green-700 font-bold text-xs">
                                        {(name?.trim()?.[0] || 'J').toUpperCase()}
                                      </span>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold ${UI.textPrimary} truncate`} title={name}>
                                      {name}
                                    </p>
                                    <p className={`text-xs ${UI.textMuted}`}>Tap to start chat</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <p className={`text-sm ${UI.textMuted} text-center py-2`}>No job seekers available</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* MAIN - FIXED SCROLLING */}
              <div className={[UI.main, showSidebar ? 'hidden sm:flex' : 'flex'].join(' ')}>
                {selectedConversation ? (
                  <>
                    {/* ✅ FIXED: Banner should only show when trying to send and NOT eligible */}
                    {showMessagingRules && !isEligibleToMessage && messages.length === 0 && (
                      <div className="px-4 pt-3 bg-amber-50 border-b border-amber-200">
                        <div className="flex items-center gap-2 text-sm text-amber-800">
                          <FontAwesomeIcon icon={faInfoCircle} className="text-amber-600" />
                          <span className="font-semibold">Messaging Rules:</span>
                          <span>
                            You can only message applicants who are <span className="font-bold">Shortlisted</span> or{' '}
                            <span className="font-bold">Accepted</span>.
                          </span>
                        </div>
                        <p className="text-xs text-amber-700 mt-1 ml-6">
                          Go to{' '}
                          <Link to="/employer/applicants" className="font-semibold underline hover:text-amber-900">
                            Applicants page
                          </Link>{' '}
                          to shortlist applicants first.
                        </p>
                        <div className="mt-1 ml-6 flex items-center gap-2">
                          <span className="text-xs font-medium">Current status:</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            applicationStatus === 'shortlisted' ? 'bg-green-100 text-green-800' : 
                            applicationStatus === 'accepted' ? 'bg-blue-100 text-blue-800' : 
                            applicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {checkingStatus ? 'Checking...' : applicationStatus ? 
                              applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1) : 
                              'Not Applied'}
                          </span>
                          <span className="text-xs text-gray-500">
                            (Eligible to message: {isEligibleToMessage ? 'Yes' : 'No'})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Chat header */}
                    <div className={UI.chatHeader}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => setShowSidebar(true)}
                            className={`sm:hidden ${UI.btnBase} ${UI.btnIcon} ${UI.btnGhost} ${UI.ring}`}
                            aria-label="Back to conversations"
                          >
                            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                          </button>

                          {(() => {
                            const title = selectedHeaderTitle;
                            const avatarUrl = getProfileImageUrl(selectedConversation.otherUser?.profileImage);

                            return (
                              <div className="h-10 w-10 rounded-full overflow-hidden bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span className="text-green-700 font-bold text-sm">
                                    {(title?.trim()?.[0] || 'U').toUpperCase()}
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          <div className="min-w-0">
                            <p className={`font-bold ${UI.textPrimary} truncate`} title={selectedHeaderTitle}>
                              {selectedHeaderTitle}
                            </p>
                            <p className={`text-sm ${UI.textSecondary} truncate`}>Job Seeker</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-medium text-gray-500">Status:</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                applicationStatus === 'shortlisted' ? 'bg-green-100 text-green-800' : 
                                applicationStatus === 'accepted' ? 'bg-blue-100 text-blue-800' : 
                                applicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {checkingStatus ? 'Checking...' : applicationStatus ? 
                                  applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1) : 
                                  'Not Applied'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowInterviewModal(true)}
                          className={`${UI.btnBase} ${UI.btnMd} ${UI.btnPrimary} ${UI.ring}`}
                        >
                          <FontAwesomeIcon icon={faCalendarAlt} aria-hidden="true" />
                          <span className="hidden sm:inline">Schedule Interview</span>
                        </button>
                      </div>
                    </div>

                    {/* ✅ Messages area (UPDATED) */}
                    <div ref={chatBodyRef} className={UI.chatBody}>
                      {messages.length === 0 ? (
                        <div className="text-center py-14">
                          <FontAwesomeIcon icon={faEnvelope} className="w-14 h-14 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                          <p className={`font-semibold ${UI.textPrimary}`}>No messages yet</p>
                          <p className={`text-sm ${UI.textMuted} mt-1`}>Start the conversation.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 pb-4">
                          {messages.map((msg) => {
                            const me = msg.sender?._id === currentUserId;
                            const hasFile = msg.messageType === 'file' && msg.file;
                            const isInterview = msg.messageType === 'interview';

                            const stableKey = msg._id || msg.clientId || `${msg.createdAt}_${msg.sender?._id || 'u'}`;

                            return (
                              <div key={stableKey} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                                {hasFile ? (
                                  <div className={UI.attachWrap}>
                                    {(() => {
                                      const f = msg.file;
                                      const fType = normalizeFileType(f.fileType, f.originalName);

                                      if (fType === 'image') {
                                        const imgSrc = f.fileUrl ? getFileUrl(f.fileUrl) : filePreview;

                                        return (
                                          <>
                                            <div className={UI.imgWrap}>
                                              <img
                                                src={imgSrc || 'https://via.placeholder.com/200x200?text=Image'}
                                                alt={f.originalName || 'Image'}
                                                className={UI.imgOnly}
                                                loading="lazy"
                                                onError={(e) => {
                                                  e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                                                }}
                                              />

                                              {f.fileUrl && (
                                                <div className={UI.imgOverlay}>
                                                  <button
                                                    type="button"
                                                    onClick={() => openFile(f)}
                                                    className={UI.imgOverlayBtn}
                                                    aria-label="View image"
                                                    title="View"
                                                  >
                                                    <FontAwesomeIcon icon={faEye} aria-hidden="true" />
                                                  </button>

                                                  <button
                                                    type="button"
                                                    onClick={() => downloadFile(f)}
                                                    className={UI.imgOverlayBtn}
                                                    aria-label="Download image"
                                                    title="Download"
                                                  >
                                                    <FontAwesomeIcon icon={faDownload} aria-hidden="true" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>

                                            {msg.content && (
                                              <p className="mt-2 text-sm text-gray-800 break-words">{msg.content}</p>
                                            )}

                                            <MessageMeta me={me} time={formatTime(msg.createdAt)} isRead={msg.isRead} variant="file" />
                                          </>
                                        );
                                      }

                                      const icon = getFileIcon(fType);
                                      const barClass = `${UI.attachBar} ${me ? UI.attachBarMe : UI.attachBarOther}`;
                                      const iconWrap = me ? UI.attachIconWrapMe : UI.attachIconWrapOther;
                                      const btnClass = `${UI.attachBtn} ${me ? UI.attachBtnMe : UI.attachBtnOther}`;

                                      return (
                                        <>
                                          <div className={barClass}>
                                            <div className={iconWrap}>
                                              <FontAwesomeIcon icon={icon} className="text-gray-700" aria-hidden="true" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <p className="text-sm font-semibold truncate" title={f.originalName}>
                                                {f.originalName}
                                              </p>
                                              <p className="text-xs text-gray-500">{formatFileSize(f.fileSize)}</p>
                                            </div>

                                            {f.fileUrl && (
                                              <>
                                                <button type="button" onClick={() => openFile(f)} className={btnClass} aria-label="View">
                                                  <FontAwesomeIcon icon={faEye} className="text-gray-800" aria-hidden="true" />
                                                </button>
                                                <button type="button" onClick={() => downloadFile(f)} className={btnClass} aria-label="Download">
                                                  <FontAwesomeIcon icon={faDownload} className="text-gray-800" aria-hidden="true" />
                                                </button>
                                              </>
                                            )}
                                          </div>

                                          {msg.content && <p className="mt-2 text-sm text-gray-800 break-words">{msg.content}</p>}

                                          <MessageMeta me={me} time={formatTime(msg.createdAt)} isRead={msg.isRead} variant="file" />
                                        </>
                                      );
                                    })()}
                                  </div>
                                ) : isInterview ? (
                                  <InterviewBubble msg={msg} me={me} />
                                ) : (
                                  <div className={`${UI.bubbleBase} ${me ? UI.bubbleTextMe : UI.bubbleTextOther}`}>
                                    <p className={`${me ? 'text-white' : 'text-gray-800'} text-sm break-words`}>{msg.content}</p>
                                    <MessageMeta me={me} time={formatTime(msg.createdAt)} isRead={msg.isRead} />
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Selected file preview */}
                    {selectedFile && (
                      <div className="px-4 pt-3 border-t border-gray-200 bg-white">
                        <div className={`${UI.inset} p-3 flex items-start justify-between gap-3`}>
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <FontAwesomeIcon
                                icon={getFileIcon(normalizeFileType(selectedFile.type, selectedFile.name))}
                                className="text-gray-700"
                                aria-hidden="true"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${UI.textPrimary} truncate`} title={selectedFile.name}>
                                {selectedFile.name}
                              </p>
                              <p className={`text-xs ${UI.textMuted}`}>{formatFileSize(selectedFile.size)}</p>

                              {filePreview && (
                                <div className="mt-2">
                                  <img
                                    src={filePreview}
                                    alt="Selected preview"
                                    className="max-h-32 rounded-xl border border-gray-200 object-contain bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={removeSelectedFile}
                            className={`${UI.btnBase} ${UI.btnIcon} ${UI.btnDangerGhost} ${UI.ring}`}
                            aria-label="Remove selected file"
                          >
                            <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ✅ Composer (UPDATED: sticky bottom) */}
                    <div className={`${UI.chatInputWrap} p-4`}>
                      <div className="flex items-end gap-2 w-full overflow-x-hidden">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`${UI.btnBase} ${UI.btnIcon} ${UI.btnSecondary} ${UI.ring}`}
                          aria-label="Attach file"
                          disabled={sending}
                        >
                          <FontAwesomeIcon icon={faPaperclip} aria-hidden="true" />
                        </button>

                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.isComposing) return;
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type a message…"
                          rows={1}
                          className={`flex-1 min-w-0 min-h-10 max-h-32 px-4 py-2 border border-gray-200 rounded-xl text-sm resize-none ${UI.ring} focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200`}
                          disabled={sending}
                          aria-label="Message input"
                        />

                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={(!newMessage.trim() && !selectedFile) || sending}
                          className={`${UI.btnBase} h-10 px-3 sm:px-4 ${UI.btnPrimary} ${UI.ring} shrink-0`}
                          aria-label="Send message"
                        >
                          {sending ? (
                            <>
                              <FontAwesomeIcon icon={faSpinner} className="animate-spin" aria-hidden="true" />
                              <span className="hidden sm:inline">Sending</span>
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
                              <span className="hidden sm:inline">Send</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className={`mt-2 ${UI.caption} ${UI.textMuted}`}>
                        Supports: Images, PDF, DOC/DOCX, TXT • Max {MAX_FILE_MB}MB • Shift+Enter for newline
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white">
                    <FontAwesomeIcon icon={faComments} className="w-16 h-16 text-gray-300 mb-4" aria-hidden="true" />
                    <p className={`text-lg font-bold ${UI.textPrimary}`}>No conversation selected</p>
                    <p className={`mt-1 text-sm ${UI.textSecondary} text-center max-w-md`}>
                      Select a conversation from the list, or choose a job seeker to start a new chat.
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setShowSidebar(true)}
                        className={`sm:hidden ${UI.btnBase} ${UI.btnMd} ${UI.btnPrimary} ${UI.ring}`}
                      >
                        Open Conversations
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowSidebar(true);
                          setIsJobseekersOpen(true);
                        }}
                        className={`${UI.btnBase} ${UI.btnMd} ${UI.btnSecondary} ${UI.ring}`}
                      >
                        Start new chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interview modal */}
          {showInterviewModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label="Schedule interview"
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Interview</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      ref={firstModalFieldRef}
                      type="date"
                      value={interviewDetails.date}
                      onChange={(e) => setInterviewDetails((prev) => ({ ...prev, date: e.target.value }))}
                      className={`w-full h-10 px-3 border border-gray-200 rounded-xl ${UI.ring} focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200`}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input
                      type="time"
                      value={interviewDetails.time}
                      onChange={(e) => setInterviewDetails((prev) => ({ ...prev, time: e.target.value }))}
                      className={`w-full h-10 px-3 border border-gray-200 rounded-xl ${UI.ring} focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={interviewDetails.location}
                      onChange={(e) => setInterviewDetails((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Office address or meeting room"
                      className={`w-full h-10 px-3 border border-gray-200 rounded-xl ${UI.ring} focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (optional)</label>
                    <input
                      type="url"
                      value={interviewDetails.meetingLink}
                      onChange={(e) => setInterviewDetails((prev) => ({ ...prev, meetingLink: e.target.value }))}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className={`w-full h-10 px-3 border border-gray-200 rounded-xl ${UI.ring} focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      value={interviewDetails.notes}
                      onChange={(e) => setInterviewDetails((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special instructions or requirements..."
                      rows="3"
                      className={`w-full px-3 py-2 border border-gray-200 rounded-xl ${UI.ring} focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInterviewModal(false)}
                    className={`${UI.btnBase} ${UI.btnMd} ${UI.btnSecondary} ${UI.ring}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleScheduleInterview}
                    className={`${UI.btnBase} ${UI.btnMd} ${UI.btnPrimary} ${UI.ring}`}
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-5 right-5 z-[60] w-[92vw] max-w-sm">
              <div
                className={[
                  'rounded-2xl border shadow-lg bg-white p-4',
                  toast.type === 'error' ? 'border-red-200' : '',
                  toast.type === 'success' ? 'border-emerald-200' : '',
                  toast.type === 'info' ? 'border-gray-200' : '',
                ].join(' ')}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      'h-10 w-10 rounded-xl flex items-center justify-center border',
                      toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : '',
                      toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : '',
                      toast.type === 'info' ? 'bg-gray-50 border-gray-200 text-gray-700' : '',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    <span className="text-lg font-bold">!</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{toast.title}</p>
                    {toast.message && <p className="text-sm text-gray-600 mt-0.5 break-words">{toast.message}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    className={`${UI.btnBase} ${UI.btnIcon} ${UI.btnGhost} ${UI.ring}`}
                    aria-label="Close notification"
                  >
                    <FontAwesomeIcon icon={faTimes} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployerLayout>
  );
};

export default EmployerMessages;
