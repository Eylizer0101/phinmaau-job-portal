import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  faBriefcase,
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
import JobSeekerLayout from '../../../layouts/JobSeekerLayout';

// ✅ IMPORTANT: Import your API instance
import api from "../../services/api";// Adjust path if needed

const UI = {
  // Page
  pageBg: 'bg-gray-50',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 -mt-12',
  shell: 'bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden',

  // Layout
  grid: 'flex min-h-[640px] h-[calc(100vh-220px)]',
  sidebar: 'w-full sm:w-[320px] md:w-[340px] lg:w-[360px] border-r border-gray-200 flex flex-col bg-white',
  main: 'flex-1 flex flex-col bg-white min-w-0',

  // Text
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textMuted: 'text-gray-500',

  // Typography
  h1: 'text-2xl sm:text-3xl font-bold tracking-tight',
  h2: 'text-base font-semibold',
  caption: 'text-xs',

  // Surfaces
  panelPad: 'p-4',
  inset: 'bg-gray-50 border border-gray-200 rounded-xl',

  // Inputs / focus
  ring: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
  input:
    'w-full h-10 px-10 pr-4 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200',

  // Buttons
  btnBase:
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-60 disabled:pointer-events-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:transform-none',
  btnSm: 'h-9 px-3 text-sm',
  btnMd: 'h-10 px-4 text-sm',
  btnIcon: 'h-10 w-10',
  btnPrimary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  btnSecondary: 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50',
  btnGhost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  btnDangerGhost: 'bg-transparent text-gray-600 hover:bg-gray-100',

  // Badges
  badge: 'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border',
  badgeUnread: 'bg-emerald-50 text-emerald-800 border-emerald-200',

  // Conversation item
  convItem:
    'relative p-3 rounded-xl border border-transparent hover:bg-gray-50 hover:border-gray-200 transition cursor-pointer',
  convActive: 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200',

  // Chat
  chatHeader: 'p-4 border-b border-gray-200 bg-white',
  chatBody: 'flex-1 overflow-y-auto p-4 bg-gray-50 pb-36',
  chatInputWrap:
    'sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80',

  // Text bubbles only
  bubbleBase: 'w-fit max-w-[88%] sm:max-w-[62%] lg:max-w-[52%] rounded-2xl p-3',
  bubbleTextMe: 'bg-emerald-600 text-white rounded-br-md',
  bubbleTextOther: 'bg-white border border-gray-200 text-gray-900 rounded-bl-md',

  // Attachment wrapper (NO bubble / NO outer card)
  attachWrap: 'w-full max-w-[88%] sm:max-w-[62%] lg:max-w-[52%]',
  attachBar: 'inline-flex w-full items-center gap-3 rounded-xl px-3 py-2 border',
  attachBarMe: 'border-emerald-200 bg-emerald-50 text-gray-900',
  attachBarOther: 'border-gray-200 bg-white text-gray-900',

  attachIconWrapMe: 'h-10 w-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center flex-shrink-0',
  attachIconWrapOther: 'h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0',

  attachBtn: 'h-9 w-9 rounded-xl border transition flex items-center justify-center',
  attachBtnMe: 'border-emerald-200 bg-white hover:bg-emerald-50',
  attachBtnOther: 'border-gray-200 bg-gray-50 hover:bg-gray-100',

  // ✅ Minimal image attachment (overlay icons)
  imgWrap: 'relative w-full max-w-[88%] sm:max-w-[62%] lg:max-w-[52%] group',
  imgOnly: 'w-full max-h-80 object-contain rounded-xl border border-gray-200 bg-white',
  imgOverlay: 'absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition',
  imgOverlayBtn:
    'h-9 w-9 rounded-lg bg-white/90 backdrop-blur border border-gray-200 shadow-sm flex items-center justify-center hover:bg-white',

  divider: 'border-t border-gray-100',
};

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

const JobseekerMessages = () => {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [employers, setEmployers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [convSearch, setConvSearch] = useState('');
  const [empSearch, setEmpSearch] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [isEmployersOpen, setIsEmployersOpen] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  const [logoError, setLogoError] = useState({});

  // ✅ DAGDAG: State para sa error message kapag nag-try mag-send na hindi pa shortlisted
  const [showMessagingRule, setShowMessagingRule] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  const employersRef = useRef(null);

  // ---------- Helpers ----------
  const getUserId = useCallback(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    try {
      const user = JSON.parse(userData);
      return user.id || user._id || null;
    } catch {
      return null;
    }
  }, []);

  const currentUserId = useMemo(() => getUserId(), [getUserId]);
  const getToken = () => localStorage.getItem('token');

  // ✅ FIXED: Remove hardcoded localhost
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    // Return relative URL - browser will handle the base
    return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  };

  // ✅ FIXED: Remove hardcoded localhost
  const getCompanyLogoUrl = (logoPath) => {
    if (!logoPath || logoPath === '') return null;
    if (logoPath.startsWith('http')) return logoPath;
    // Return relative URL - browser will handle the base
    return logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
  };

  const getEmployerKey = (employerData) => {
    return (
      employerData?._id ||
      employerData?.employerId ||
      employerData?.id ||
      employerData?.employerProfile?.companyName ||
      employerData?.companyName ||
      employerData?.fullName ||
      'unknown'
    );
  };

  const renderCompanyLogo = (employerData, size = 'h-10 w-10', textSize = 'text-sm') => {
    const companyName =
      employerData?.employerProfile?.companyName ||
      employerData?.companyName ||
      employerData?.fullName ||
      'Company';

    const logoPath =
      employerData?.employerProfile?.companyLogo ||
      employerData?.companyLogo ||
      employerData?.logo;

    const logoUrl = getCompanyLogoUrl(logoPath);
    const initial = companyName?.trim()?.charAt(0)?.toUpperCase() || 'C';
    const key = getEmployerKey(employerData);

    const showImage = !!logoUrl && !logoError[key];

    if (showImage) {
      return (
        <div className={`${size} rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0`}>
          <img
            src={logoUrl}
            alt={companyName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setLogoError((prev) => ({ ...prev, [key]: true }))}
          />
        </div>
      );
    }

    return (
      <div
        className={`${size} rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0`}
        aria-label={`${companyName} logo`}
      >
        <span className={`text-emerald-700 font-bold ${textSize}`}>{initial}</span>
      </div>
    );
  };

  const openFile = (fileData) => {
    const url = getFileUrl(fileData?.fileUrl);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = (fileData) => {
    const url = getFileUrl(fileData?.fileUrl);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
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

  const isNearBottom = () => {
    const el = chatBodyRef.current;
    if (!el) return true;
    const threshold = 160;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // ---------- API ----------
  const fetchConversations = useCallback(async () => {
    try {
      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.get('/messages/conversations');

      if (response.data?.success) setConversations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  const fetchEmployers = useCallback(async () => {
    try {
      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.get('/messages/jobseeker/employers');

      if (response.data?.success) setEmployers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employers:', error);
    }
  }, []);

  const fetchMessages = useCallback(
    async (conversationId) => {
      try {
        // ✅ FIXED: Use api instance instead of hardcoded localhost
        const response = await api.get(`/messages/conversation/${conversationId}`);

        if (response.data?.success) {
          setMessages(response.data.data || []);
          setTimeout(() => scrollToBottom(false), 0);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    },
    [scrollToBottom]
  );

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchEmployers()]);
      setLoading(false);
    };
    boot();
  }, [fetchConversations, fetchEmployers]);

  useEffect(() => {
    if (selectedConversation?._id) fetchMessages(selectedConversation._id);
  }, [selectedConversation?._id, fetchMessages]);

  useEffect(() => {
    if (isNearBottom()) scrollToBottom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ✅ DAGDAG: Auto-hide ang messaging rule after 5 seconds
  useEffect(() => {
    if (showMessagingRule) {
      const timer = setTimeout(() => {
        setShowMessagingRule(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showMessagingRule]);

  // ---------- Derived ----------
  const filteredConversations = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((conv) => {
      const company =
        conv.otherUser?.employerProfile?.companyName?.toLowerCase() ||
        conv.otherUser?.companyName?.toLowerCase() ||
        '';
      const name = conv.otherUser?.fullName?.toLowerCase() || '';
      const last = conv.lastMessage?.content?.toLowerCase() || '';
      return company.includes(q) || name.includes(q) || last.includes(q);
    });
  }, [conversations, convSearch]);

  const filteredEmployers = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return employers;

    return employers.filter((emp) => {
      const company = emp.employer?.employerProfile?.companyName?.toLowerCase() || '';
      const name = emp.employer?.fullName?.toLowerCase() || '';
      return company.includes(q) || name.includes(q);
    });
  }, [employers, empSearch]);

  const selectedHeaderTitle = useMemo(() => {
    if (!selectedConversation) return '';
    return (
      selectedConversation.otherUser?.employerProfile?.companyName ||
      selectedConversation.otherUser?.companyName ||
      selectedConversation.otherUser?.fullName ||
      'Unknown Employer'
    );
  }, [selectedConversation]);

  const selectedHeaderSub = useMemo(() => {
    if (!selectedConversation) return '';
    return selectedConversation.otherUser?.fullName || 'Employer';
  }, [selectedConversation]);

  const selectedJobsApplied = useMemo(() => {
    if (!selectedConversation) return 0;
    const id = selectedConversation.otherUser?._id;
    const found = employers.find((e) => e.employer?._id === id);
    return found?.jobsApplied?.length || 0;
  }, [selectedConversation, employers]);

  // ---------- Actions ----------
  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setShowSidebar(false);
  };

  const handleSelectEmployer = (employer) => {
    const currentId = currentUserId;
    if (!currentId) {
      alert('Please login again');
      navigate('/login');
      return;
    }

    const participants = [currentId, employer._id].sort();
    const conversationId = participants.join('_');

    const existingConv = conversations.find((conv) => conv._id === conversationId);

    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      setSelectedConversation({
        _id: conversationId,
        otherUser: employer,
        lastMessage: null,
        unreadCount: 0,
      });
      setMessages([]);
    }

    setShowSidebar(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_FILE_MB}MB.`);
      e.target.value = '';
      return;
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      alert('Only images, PDFs, DOC/DOCX, and TXT are allowed.');
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

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;

    try {
      setSending(true);
      const receiverId = selectedConversation.otherUser?._id;

      if (!receiverId) {
        alert('Receiver not found.');
        return;
      }

      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      formData.append('receiverId', receiverId);
      formData.append('content', newMessage || '');

      // ✅ FIXED: Use api instance instead of hardcoded localhost
      const response = await api.post('/messages/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.success) {
        setMessages((prev) => [...prev, response.data.data]);
        setNewMessage('');
        removeSelectedFile();
        fetchConversations();
        setTimeout(() => scrollToBottom(true), 0);
      }
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      
      // ✅ DAGDAG: Kapag 403 error (not shortlisted/accepted), show messaging rule
      if (error.response?.status === 403) {
        setShowMessagingRule(true);
      } else {
        alert('Failed to send message: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setSending(false);
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <JobSeekerLayout>
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
      </JobSeekerLayout>
    );
  }

  return (
    <JobSeekerLayout>
      <div className={UI.pageBg}>
        <div className={UI.container}>
          <div className="relative rounded-2xl bg-gradient-to-r from-[#0e4739] via-[#17785b] to-green-600 p-6 sm:p-8 text-white shadow-sm overflow-hidden mb-6">
            {/* 💡 SOFT GLOW LIGHT */}
            <div className="pointer-events-none absolute inset-0 z-0">
              <div
                className="
                  absolute
                  w-[70px] sm:w-[110px]
                  h-[70px] sm:h-[110px]
                  rounded-full
                  blur-[28px] sm:blur-[38px]
                  bottom-[-55px] sm:bottom-[-70px]
                  right-[-40px]
                  opacity-60
                "
                style={{
                  background:
                    'radial-gradient(circle, rgba(110,231,183,0.25) 0%, rgba(110,231,183,0.12) 45%, transparent 75%)'
                }}
              />
            </div>

            {/* 🖼️ WATERMARK IMAGE */}
            <img
              src="/images/messages.png"
              alt=""
              className="
                pointer-events-none
                absolute
                right-[18px] sm:right-[28px]
                top-1/2
                -translate-y-1/2
                w-28 h-28 sm:w-33 sm:h-33
                object-contain
                opacity-50
                mix-blend-soft-light
                saturate-120
                z-0
              "
              style={{
                WebkitMaskImage:
                  'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 80%)',
                maskImage:
                  'radial-gradient(circle at 35% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 80%)'
              }}
            />

            {/* CONTENT */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className={`${UI.h1} text-white`}>Messages</h1>
                <p className="text-sm sm:text-base text-white/90 mt-1">
                  Communicate with employers about interviews and job opportunities
                </p>
              </div>
            </div>
          </div>
          
          <div className={UI.shell}>
            <div className={UI.grid}>
              {/* SIDEBAR */}
              <div
                className={[UI.sidebar, showSidebar ? 'block' : 'hidden', 'sm:block'].join(' ')}
                aria-label="Conversations sidebar"
              >
                {/* Sidebar top */}
                <div className={`${UI.panelPad} ${UI.divider}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`${UI.h2} ${UI.textPrimary}`}>Conversations</p>

                    <button
                      type="button"
                      onClick={() => setShowSidebar(false)}
                      className={`sm:hidden ${UI.btnBase} ${UI.btnIcon} ${UI.btnGhost} ${UI.ring}`}
                      aria-label="Close sidebar"
                    >
                      <FontAwesomeIcon icon={faTimes} />
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
                      <FontAwesomeIcon icon={faComments} className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className={`font-semibold ${UI.textPrimary}`}>No conversations</p>
                      <p className={`text-sm ${UI.textMuted} mt-1`}>Select an employer below to start.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredConversations.map((conv) => {
                        const active = selectedConversation?._id === conv._id;
                        const title =
                          conv.otherUser?.employerProfile?.companyName ||
                          conv.otherUser?.companyName ||
                          conv.otherUser?.fullName ||
                          'Unknown Employer';
                        const sub = conv.otherUser?.fullName || '';
                        const time = formatTime(conv.lastMessageTime || conv.lastMessage?.createdAt);
                        const last = conv.lastMessage?.content || 'No messages yet';

                        return (
                          <button
                            key={conv._id}
                            type="button"
                            onClick={() => handleSelectConversation(conv)}
                            className={['w-full text-left', UI.convItem, active ? UI.convActive : '', UI.ring].join(' ')}
                            aria-current={active ? 'page' : undefined}
                          >
                            {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-emerald-600" />}

                            <div className="flex items-start gap-3">
                              {renderCompanyLogo(conv.otherUser, 'h-10 w-10', 'text-sm')}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className={`font-semibold ${UI.textPrimary} truncate`} title={title}>
                                      {title}
                                    </p>
                                    {sub && (
                                      <p className={`text-xs ${UI.textMuted} truncate`} title={sub}>
                                        {sub}
                                      </p>
                                    )}
                                  </div>

                                  <span className={`text-xs ${UI.textMuted} flex-shrink-0`}>{time}</span>
                                </div>

                                <p className={`text-sm ${UI.textSecondary} truncate mt-1`} title={last}>
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

                {/* Employers */}
                <div className="border-t border-gray-200" ref={employersRef}>
                  <button
                    type="button"
                    onClick={() => setIsEmployersOpen((v) => !v)}
                    className={`w-full ${UI.panelPad} flex items-center justify-between ${UI.btnBase} ${UI.btnGhost} ${UI.ring}`}
                    aria-expanded={isEmployersOpen}
                  >
                    <span className={`${UI.h2} ${UI.textPrimary}`}>Your Employers</span>
                    <FontAwesomeIcon icon={isEmployersOpen ? faChevronUp : faChevronDown} />
                  </button>

                  {isEmployersOpen && (
                    <div className="px-4 pb-4">
                      <div className="relative mb-3">
                        <FontAwesomeIcon
                          icon={faSearch}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          aria-hidden="true"
                        />
                        <input
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          className={`${UI.input} ${UI.ring}`}
                          placeholder="Search employers…"
                          aria-label="Search employers"
                        />
                      </div>

                      <div className="space-y-2 max-h-44 overflow-y-auto">
                        {filteredEmployers.length > 0 ? (
                          filteredEmployers.map((emp) => {
                            const id = emp.employer?._id;
                            const company =
                              emp.employer?.employerProfile?.companyName || emp.employer?.fullName || 'Unknown';
                            const count = emp.jobsApplied?.length || 0;

                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => handleSelectEmployer(emp.employer)}
                                className={`w-full text-left p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition ${UI.ring}`}
                              >
                                <div className="flex items-center gap-3">
                                  {renderCompanyLogo(emp.employer, 'h-9 w-9', 'text-xs')}

                                  <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold ${UI.textPrimary} truncate`} title={company}>
                                      {company}
                                    </p>
                                    <p className={`text-xs ${UI.textMuted}`}>
                                      {count} job{count !== 1 ? 's' : ''} applied
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <p className={`text-sm ${UI.textMuted} text-center py-2`}>No employers available</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* MAIN */}
              <div className={[UI.main, showSidebar ? 'hidden sm:flex' : 'flex'].join(' ')}>

                {selectedConversation ? (
                  <>
                    {/* ✅ DAGDAG: Messaging Rules - LUMABAS LANG KAPAG NAG-TRY MAG-SEND NA HINDI PA QUALIFIED */}
                    {showMessagingRule && (
                      <div className="px-4 pt-3 bg-amber-50 border-b border-amber-200 animate-fadeIn">
                        <div className="flex items-center gap-2 text-sm text-amber-800">
                          <FontAwesomeIcon icon={faInfoCircle} className="text-amber-600" />
                          <span className="font-semibold">Messaging Rules:</span>
                          <span>You can only message employers after you are <span className="font-bold">Shortlisted</span> or <span className="font-bold">Accepted</span>.</span>
                        </div>
                        <p className="text-xs text-amber-700 mt-1 ml-6">
                          Check your application status in <Link to="/jobseeker/my-applications" className="font-semibold underline hover:text-amber-900">My Applications</Link>.
                        </p>
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
                            <FontAwesomeIcon icon={faArrowLeft} />
                          </button>

                          {renderCompanyLogo(selectedConversation.otherUser, 'h-10 w-10', 'text-sm')}

                          <div className="min-w-0">
                            <p className={`font-bold ${UI.textPrimary} truncate`} title={selectedHeaderTitle}>
                              {selectedHeaderTitle}
                            </p>
                            <p className={`text-sm ${UI.textSecondary} truncate`} title={selectedHeaderSub}>
                              {selectedHeaderSub}
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                          <FontAwesomeIcon icon={faBriefcase} className="text-gray-400" />
                          <span>{selectedJobsApplied} jobs applied</span>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div ref={chatBodyRef} className={UI.chatBody} role="log" aria-live="polite" aria-relevant="additions">
                      {messages.length === 0 ? (
                        <div className="text-center py-14">
                          <FontAwesomeIcon icon={faEnvelope} className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                          <p className={`font-semibold ${UI.textPrimary}`}>No messages yet</p>
                          <p className={`text-sm ${UI.textMuted} mt-1`}>Start the conversation.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg) => {
                            const me = msg.sender?._id === currentUserId;
                            const hasFile = msg.messageType === 'file' && msg.file;
                            const isInterview = msg.messageType === 'interview';

                            const bubbleClass = `${UI.bubbleBase} ${me ? UI.bubbleTextMe : UI.bubbleTextOther}`;

                            return (
                              <div key={msg._id} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
                                {/* FILE: minimal UI */}
                                {hasFile ? (
                                  <div className={UI.attachWrap}>
                                    {(() => {
                                      const f = msg.file;
                                      const fType = normalizeFileType(f.fileType, f.originalName);

                                      if (fType === 'image') {
                                        return (
                                          <>
                                            <div className={UI.imgWrap}>
                                              <img
                                                src={getFileUrl(f.fileUrl)}
                                                alt={f.originalName}
                                                className={UI.imgOnly}
                                                loading="lazy"
                                              />

                                              <div className={UI.imgOverlay}>
                                                <button
                                                  type="button"
                                                  onClick={() => openFile(f)}
                                                  className={UI.imgOverlayBtn}
                                                  aria-label="View image"
                                                  title="View"
                                                >
                                                  <FontAwesomeIcon icon={faEye} />
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() => downloadFile(f)}
                                                  className={UI.imgOverlayBtn}
                                                  aria-label="Download image"
                                                  title="Download"
                                                >
                                                  <FontAwesomeIcon icon={faDownload} />
                                                </button>
                                              </div>
                                            </div>

                                            {msg.content &&
                                              msg.content !== `Sent a ${msg.file.fileType} file: ${msg.file.originalName}` && (
                                                <p className="mt-2 text-sm text-gray-800 break-words">{msg.content}</p>
                                              )}

                                            <div className="flex items-center justify-between gap-3 mt-2">
                                              <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>

                                              {me && (
                                                <FontAwesomeIcon
                                                  icon={msg.isRead ? faCheckDouble : faCheck}
                                                  className="text-xs text-emerald-700/80"
                                                  aria-label={msg.isRead ? 'Read' : 'Sent'}
                                                />
                                              )}
                                            </div>
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
                                              <FontAwesomeIcon icon={icon} className="text-gray-700" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <p className="text-sm font-semibold truncate" title={f.originalName}>
                                                {f.originalName}
                                              </p>
                                              <p className="text-xs text-gray-500">{formatFileSize(f.fileSize)}</p>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => openFile(f)}
                                              className={btnClass}
                                              title="View"
                                              aria-label="View"
                                            >
                                              <FontAwesomeIcon icon={faEye} className="text-gray-800" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => downloadFile(f)}
                                              className={btnClass}
                                              title="Download"
                                              aria-label="Download"
                                            >
                                              <FontAwesomeIcon icon={faDownload} className="text-gray-800" />
                                            </button>
                                          </div>

                                          {msg.content &&
                                            msg.content !== `Sent a ${msg.file.fileType} file: ${msg.file.originalName}` && (
                                              <p className="mt-2 text-sm text-gray-800 break-words">{msg.content}</p>
                                            )}

                                          <div className="flex items-center justify-between gap-3 mt-2">
                                            <span className="text-xs text-gray-500">{formatTime(msg.createdAt)}</span>

                                            {me && (
                                              <FontAwesomeIcon
                                                icon={msg.isRead ? faCheckDouble : faCheck}
                                                className="text-xs text-emerald-700/80"
                                                aria-label={msg.isRead ? 'Read' : 'Sent'}
                                              />
                                            )}
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <div className={bubbleClass}>
                                    {isInterview ? (
                                      <div className="rounded-xl p-3 bg-amber-50 border border-amber-200">
                                        <div className="flex items-center gap-2 text-amber-900 font-semibold">
                                          <FontAwesomeIcon icon={faCalendarAlt} />
                                          <span>Interview Scheduled</span>
                                        </div>

                                        {msg.interviewDetails && (
                                          <div className="mt-2 space-y-1 text-sm text-amber-900/90">
                                            <div className="flex items-center gap-2">
                                              <FontAwesomeIcon icon={faCalendarAlt} className="w-3.5 h-3.5" />
                                              <span>
                                                Date: {new Date(msg.interviewDetails.date).toLocaleDateString('en-PH')}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
                                              <span>Time: {msg.interviewDetails.time}</span>
                                            </div>

                                            {msg.interviewDetails.location && (
                                              <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3.5 h-3.5" />
                                                <span className="break-words">Location: {msg.interviewDetails.location}</span>
                                              </div>
                                            )}

                                            {msg.interviewDetails.meetingLink && (
                                              <div className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faVideo} className="w-3.5 h-3.5" />
                                                <a
                                                  href={msg.interviewDetails.meetingLink}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-emerald-700 underline break-all"
                                                >
                                                  Join Meeting
                                                </a>
                                              </div>
                                            )}

                                            {msg.interviewDetails.notes && (
                                              <p className="mt-2 text-xs text-amber-900/80">{msg.interviewDetails.notes}</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className={`${me ? 'text-white' : 'text-gray-800'} text-sm break-words`}>
                                        {msg.content}
                                      </p>
                                    )}

                                    <div className="flex items-center justify-between gap-3 mt-2">
                                      <span className={`text-xs ${me ? 'text-white/80' : 'text-gray-500'}`}>
                                        {formatTime(msg.createdAt)}
                                      </span>

                                      {me && (
                                        <FontAwesomeIcon
                                          icon={msg.isRead ? faCheckDouble : faCheck}
                                          className={`text-xs ${msg.isRead ? 'text-white/90' : 'text-white/60'}`}
                                          aria-label={msg.isRead ? 'Read' : 'Sent'}
                                        />
                                      )}
                                    </div>
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
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Composer (sticky) */}
                    <div className={UI.chatInputWrap}>
                      <div className="p-4">
                        <div className="flex items-center gap-2 w-full overflow-x-hidden">
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
                            <FontAwesomeIcon icon={faPaperclip} />
                          </button>

                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.isComposing) return;
                              if (e.key === 'Enter') handleSendMessage();
                            }}
                            placeholder="Type a message…"
                            className={`flex-1 min-w-0 h-10 px-4 border border-gray-200 rounded-xl text-sm ${UI.ring} focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200`}
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
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                <span className="hidden sm:inline">Sending</span>
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faPaperPlane} />
                                <span className="hidden sm:inline">Send</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className={`mt-2 ${UI.caption} ${UI.textMuted}`}>
                          Supports: Images, PDF, DOC/DOCX, TXT • Max {MAX_FILE_MB}MB
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white">
                    <FontAwesomeIcon icon={faComments} className="w-16 h-16 text-gray-300 mb-4" />
                    <p className={`text-lg font-bold ${UI.textPrimary}`}>No conversation selected</p>
                    <p className={`mt-1 text-sm ${UI.textSecondary} text-center max-w-md`}>
                      Select a conversation from the list, or choose an employer to start a new chat.
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
                          setIsEmployersOpen(true);
                          setTimeout(() => employersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
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
        </div>
      </div>
    </JobSeekerLayout>
  );
};

export default JobseekerMessages;