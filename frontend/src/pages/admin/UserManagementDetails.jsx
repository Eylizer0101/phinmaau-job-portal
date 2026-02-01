import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../services/api";

/* ======================= HELPERS ======================= */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
  pending: "Pending",
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/* ======================= ICONS ======================= */
const Icon = ({ name, className = "h-5 w-5", ...props }) => {
  const common = { className, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", ...props };

  switch (name) {
    case "arrow-left":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "map-pin":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "academic-cap":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      );
    case "document-text":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 9A8 8 0 006.3 5.3L4 10M4 15a8 8 0 0013.7 3.7L20 14" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 100-20 10 10 0 000 20z" />
        </svg>
      );
    default:
      return null;
  }
};

/* ======================= UI COMPONENTS ======================= */
const Button = ({
  variant = "secondary",
  size = "md",
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  loading,
  type = "button",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200";

  // ✅ fixed: removed px-4.5 / px-5.5 (not default Tailwind)
  const sizes = {
    xs: "px-2.5 py-1.5 text-xs rounded-xl",
    sm: "px-3.5 py-2 text-sm rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-2xl",
    lg: "px-5 py-3 text-base rounded-2xl",
  };

  const variants = {
    secondary: "border border-emerald-100 bg-white text-slate-900 hover:bg-emerald-50/60 focus-visible:ring-emerald-600 shadow-sm",
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600 shadow-sm",
    neutral: "border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 focus-visible:ring-emerald-600 shadow-sm",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600 shadow-sm",
    warning: "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-600 shadow-sm",
    ghost: "bg-transparent text-slate-900 hover:bg-emerald-50/70 focus-visible:ring-emerald-600",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600 shadow-sm",
    info: "bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100/60 focus-visible:ring-emerald-600 shadow-sm",
  };

  return (
    <button
      type={type}
      className={cn(base, sizes[size], variants[variant], className, loading && "opacity-70 cursor-wait")}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
};

const Card = ({ children, className }) => (
  <div className={cn("rounded-3xl border border-emerald-100 bg-white shadow-[0_10px_30px_-20px_rgba(16,185,129,0.35)]", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = "neutral", className }) => {
  const variants = {
    neutral: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-100",
    warning: "bg-amber-50 text-amber-800 border-amber-100",
    danger: "bg-rose-50 text-rose-800 border-rose-100",
    info: "bg-emerald-50 text-emerald-800 border-emerald-100",
    purple: "bg-slate-100 text-slate-800 border-slate-200", // kept for compatibility
  };

  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)}>{children}</span>;
};

const Alert = ({ type = "error", title, children, onClose, className }) => {
  const styles =
    type === "error"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : type === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";

  const icon =
    type === "error" ? (
      <Icon name="x" className="h-5 w-5 text-rose-600" />
    ) : type === "success" ? (
      <Icon name="check" className="h-5 w-5 text-emerald-600" />
    ) : type === "warning" ? (
      <Icon name="lock" className="h-5 w-5 text-amber-600" />
    ) : (
      <Icon name="info" className="h-5 w-5 text-emerald-600" />
    );

  return (
    <div
      className={cn("mb-5 flex items-start gap-3 rounded-2xl border p-4", styles, className)}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-xl p-1 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
          aria-label="Dismiss message"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

/**
 * ✅ Improved Modal (QA/A11y)
 * - Focus trap
 * - ESC close
 * - Initial focus
 * - Restore focus to trigger
 * - Prevent scroll behind modal
 */
const Modal = ({ open, title, children, onClose, footer, initialFocusSelector, disableClose = false }) => {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleIdRef = useRef(`modal-title-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const panel = panelRef.current;
      if (!panel) return;

      let target = null;
      if (initialFocusSelector) target = panel.querySelector(initialFocusSelector);
      if (!target) target = panel.querySelector(FOCUSABLE_SELECTOR);
      if (target && typeof target.focus === "function") target.focus();
      else panel.focus();
    };

    const t = setTimeout(focusFirst, 0);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;

      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open, initialFocusSelector]);

  const handleKeyDown = (e) => {
    if (!open) return;

    if (e.key === "Escape") {
      if (disableClose) return;
      e.stopPropagation();
      onClose?.();
      return;
    }

    if (e.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusables = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || document.activeElement === panel) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleIdRef.current} onKeyDown={handleKeyDown}>
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
        onClick={() => {
          if (disableClose) return;
          onClose?.();
        }}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-3xl border border-emerald-100 bg-white shadow-[0_20px_60px_-30px_rgba(16,185,129,0.45)] focus:outline-none"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100">
          <h3 id={titleIdRef.current} className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={() => {
              if (disableClose) return;
              onClose?.();
            }}
            className="rounded-2xl p-2 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
            aria-label="Close modal"
          >
            <Icon name="x" className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && <div className="px-6 py-4 border-t border-emerald-100">{footer}</div>}
      </div>
    </div>
  );
};

/* ======================= PAGE ======================= */
const EMPLOYER_VERIFICATION_ROUTE = "/admin/employer-verification"; // update if iba route mo

const UserManagementDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Global messages (page-level)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Avatar reliability
  const [brokenAvatar, setBrokenAvatar] = useState(false);

  // Status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusModalError, setStatusModalError] = useState("");

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteModalError, setDeleteModalError] = useState("");

  // Shared action loading for mutations
  const [actionLoading, setActionLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";

    // ✅ consistent date + time across browsers
    return d.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return { variant: "success", label: "Active", icon: "check" };
      case "inactive":
        return { variant: "neutral", label: "Inactive", icon: "x" };
      case "suspended":
        return { variant: "danger", label: "Suspended", icon: "lock" };
      case "pending":
        return { variant: "warning", label: "Pending", icon: "clock" };
      default:
        return { variant: "neutral", label: "Unknown", icon: "info" };
    }
  };

  const getRoleBadge = (role) => {
    switch ((role || "").toLowerCase()) {
      case "admin":
        return { variant: "danger", label: "Admin", icon: "shield" };
      case "employer":
        return { variant: "info", label: "Employer", icon: "building" };
      case "jobseeker":
        return { variant: "purple", label: "Student", icon: "user" };
      default:
        return { variant: "neutral", label: "Unknown", icon: "user" };
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
    return `${API_BASE}${url}`;
  };

  const normalizeUser = (userData) => ({
    id: userData._id,
    email: userData.email,
    name: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "No Name",
    role: userData.role,
    status: userData.status || "active",
    isVerified: userData.isVerified || false,
    profileImage: userData.profileImage,
    createdAt: userData.createdAt,
    lastLogin: userData.lastLogin,
    phone: userData.phone,

    // Student
    studentId: userData.jobSeekerProfile?.studentId,
    course: userData.jobSeekerProfile?.course,
    graduationYear: userData.jobSeekerProfile?.graduationYear,
    skills: userData.jobSeekerProfile?.skills || [], // intentionally hidden in UI
    location: userData.jobSeekerProfile?.location,
    contactNumber: userData.jobSeekerProfile?.contactNumber,
    resume: userData.jobSeekerProfile?.resume,

    // Employer
    companyName: userData.employerProfile?.companyName,
    companyEmail: userData.employerProfile?.companyEmail,
    companyPhone: userData.employerProfile?.companyPhone,
    companyAddress: userData.employerProfile?.companyAddress,
    industry: userData.employerProfile?.industry,
    companyDescription: userData.employerProfile?.companyDescription,
    verificationDocs: userData.employerProfile?.verificationDocs || {},
    verificationStatus: userData.employerProfile?.verificationDocs?.overallStatus || "unverified",

    adminNotes: userData.adminNotes || "",

    // Stats
    applicationCount: userData.applicationCount || 0,
    jobPostCount: userData.jobPostCount || 0,
    loginCount: userData.loginCount || 0,
  });

  const fetchUserDetails = useCallback(
    async (opts = { silent: false }) => {
      try {
        if (opts.silent) setRefreshing(true);
        else setLoading(true);

        setError("");

        const response = await api.get(`/admin/users/${userId}`);
        if (response.data?.success) {
          setUser(normalizeUser(response.data.user));
        } else {
          setError("User not found or data format invalid.");
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError(err.response?.data?.message || "Failed to load user details. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (userId) fetchUserDetails();
  }, [userId, fetchUserDetails]);

  // ✅ auto-clear success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  // ✅ reset broken avatar when changing user
  useEffect(() => {
    setBrokenAvatar(false);
  }, [userId, user?.profileImage]);

  const statusInfo = useMemo(() => getStatusBadge(user?.status), [user?.status]);
  const roleInfo = useMemo(() => getRoleBadge(user?.role), [user?.role]);

  const employerVerificationBadge = useMemo(() => {
    if (!user || user.role !== "employer") return null;
    const v = (user.verificationStatus || "unverified").toLowerCase();
    if (v === "verified") return { variant: "success", label: "Verified" };
    if (v === "pending") return { variant: "warning", label: "Pending Review" };
    return { variant: "danger", label: "Unverified" };
  }, [user]);

  // ✅ verify toggle should only exist for jobseeker/student
  const showGenericVerifyToggle = useMemo(() => {
    if (!user) return false;
    return user.role === "jobseeker";
  }, [user]);

  const showVerifiedBadgeTop = useMemo(() => {
    if (!user) return false;
    return user.role === "jobseeker" && user.isVerified;
  }, [user]);

  const canDelete = useMemo(() => {
    if (!user) return false;
    return user.role !== "admin";
  }, [user]);

  const deleteReady = useMemo(() => deleteConfirmText.trim().toUpperCase() === "DELETE", [deleteConfirmText]);

  const Avatar = ({ img, name, size = 96 }) => {
    const initial = (name?.trim()?.[0] || "U").toUpperCase();
    const src = img ? getImageUrl(img) : "";

    const roleColor = () => {
      if (user?.role === "admin") return "bg-rose-50 text-rose-700";
      if (user?.role === "employer") return "bg-emerald-50 text-emerald-700";
      return "bg-emerald-50 text-emerald-700";
    };

    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-4 border-white shadow-[0_14px_30px_-18px_rgba(16,185,129,0.5)] overflow-hidden shrink-0",
          roleColor()
        )}
        style={{ height: `${size}px`, width: `${size}px`, fontSize: `${size * 0.4}px` }}
      >
        {src && !brokenAvatar ? (
          <img src={src} alt={`${name}'s profile`} className="h-full w-full object-cover" loading="lazy" onError={() => setBrokenAvatar(true)} />
        ) : (
          <span className="font-bold">{initial}</span>
        )}
      </div>
    );
  };

  const openStatusModal = (newStatus) => {
    setPendingStatus(newStatus);
    setStatusReason("");
    setStatusModalError("");
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    if (actionLoading) return;
    setStatusModalOpen(false);
    setPendingStatus(null);
    setStatusReason("");
    setStatusModalError("");
  };

  const handleConfirmStatusUpdate = async () => {
    if (!user || !pendingStatus) return;

    if (!statusReason.trim()) {
      setStatusModalError("Please provide a reason for this status change (audit trail).");
      return;
    }

    try {
      setActionLoading(true);
      setStatusModalError("");

      const response = await api.put(`/admin/users/${userId}/status`, {
        status: pendingStatus,
        reason: statusReason.trim(),
      });

      if (response.data?.success) {
        setSuccess(`User status updated to ${STATUS_LABELS[pendingStatus] || pendingStatus}`);
        closeStatusModal();
        await fetchUserDetails({ silent: true });
      } else {
        setStatusModalError("Failed to update user status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setStatusModalError(err.response?.data?.message || "Failed to update user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerificationToggle = async () => {
    if (!user || actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await api.put(`/admin/users/${userId}/verify`, {
        verified: !user.isVerified,
      });

      if (response.data?.success) {
        setSuccess(`Student verification ${!user.isVerified ? "enabled" : "disabled"}`);
        await fetchUserDetails({ silent: true });
      } else {
        setError("Failed to update verification status.");
      }
    } catch (err) {
      console.error("Error updating verification:", err);
      setError(err.response?.data?.message || "Failed to update verification status.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText("");
    setDeleteModalError("");
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (actionLoading) return;
    setDeleteModalOpen(false);
    setDeleteModalError("");
    setDeleteConfirmText("");
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!deleteReady) {
      setDeleteModalError('Type "DELETE" to confirm account deletion.');
      return;
    }

    try {
      setActionLoading(true);
      setDeleteModalError("");

      // TODO: Implement DELETE endpoint
      closeDeleteModal();
      setError("Delete API is not implemented yet. Add backend endpoint then replace this stub.");
    } catch (err) {
      console.error("Error deleting user:", err);
      setDeleteModalError(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  const verificationSummary = useMemo(() => {
    if (!user) return { label: "—", icon: "info", iconClass: "text-slate-400" };

    if (user.role === "employer") {
      const label = employerVerificationBadge?.label || "Unknown";
      const iconClass = employerVerificationBadge?.variant === "success" ? "text-emerald-600" : employerVerificationBadge?.variant === "warning" ? "text-amber-600" : "text-slate-500";
      return { label, icon: "shield", iconClass };
    }

    if (user.role === "jobseeker") {
      return user.isVerified
        ? { label: "Verified", icon: "check", iconClass: "text-emerald-600" }
        : { label: "Not Verified", icon: "x", iconClass: "text-slate-400" };
    }

    // ✅ Admin verification not applicable
    if (user.role === "admin") {
      return { label: "N/A", icon: "shield", iconClass: "text-slate-500" };
    }

    return { label: "Unknown", icon: "info", iconClass: "text-slate-400" };
  }, [user, employerVerificationBadge]);

  /* ======================= EARLY RETURNS ======================= */
  if (loading) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-7xl px-1 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/admin/users")}
              className="rounded-2xl p-2 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label="Back to users"
            >
              <Icon name="arrow-left" className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
          </div>

          <div className="py-16 text-center" role="status" aria-live="polite">
            <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
            <p className="mt-4 text-sm text-slate-600">Loading user details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !user) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/admin/users")}
              className="rounded-2xl p-2 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label="Back to users"
            >
              <Icon name="arrow-left" className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
          </div>

          <Alert type="error" title="Error">
            {error}
          </Alert>

          <div className="mt-6">
            <Button variant="secondary" leftIcon={<Icon name="arrow-left" className="h-4 w-4" />} onClick={() => navigate("/admin/users")}>
              Back to User Management
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/admin/users")}
              className="rounded-2xl p-2 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label="Back to users"
            >
              <Icon name="arrow-left" className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
          </div>

          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Icon name="user" className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">User Not Found</h3>
            <p className="mt-2 text-sm text-slate-600">The user you're looking for doesn't exist or has been removed.</p>
            <div className="mt-6">
              <Button variant="primary" leftIcon={<Icon name="arrow-left" className="h-4 w-4" />} onClick={() => navigate("/admin/users")}>
                Back to User Management
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ======================= MAIN UI ======================= */
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-1 py-8">
        {/* Subtle page background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/70 via-white to-white" />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/admin/users")}
              className="rounded-2xl p-2 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label="Back to users"
            >
              <Icon name="arrow-left" className="h-5 w-5 text-slate-600" />
            </button>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">User Details</h1>
              <p className="mt-1 text-sm text-slate-600">Account management view (access control + profile summary)</p>
            </div>

            <Button
              variant="ghost"
              size="md"
              leftIcon={<Icon name="refresh" className="h-4 w-4" />}
              onClick={() => fetchUserDetails({ silent: true })}
              disabled={refreshing}
              loading={refreshing}
            >
              Refresh
            </Button>
          </div>

          {error && (
            <Alert type="error" title="Error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" title="Success" onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Profile */}
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar img={user.profileImage} name={user.name} size={96} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={roleInfo.variant} className="text-sm">
                        <Icon name={roleInfo.icon} className="h-4 w-4 mr-1" />
                        {roleInfo.label}
                      </Badge>

                      <Badge variant={statusInfo.variant} className="text-sm">
                        <Icon name={statusInfo.icon} className="h-4 w-4 mr-1" />
                        {statusInfo.label}
                      </Badge>

                      {showVerifiedBadgeTop && (
                        <Badge variant="success" className="text-sm">
                          <Icon name="check" className="h-4 w-4 mr-1" />
                          Verified
                        </Badge>
                      )}

                      {user.role === "employer" && employerVerificationBadge && (
                        <Badge variant={employerVerificationBadge.variant} className="text-sm">
                          <Icon name="shield" className="h-4 w-4 mr-1" />
                          {employerVerificationBadge.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Icon name="mail" className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">Email:</span>
                      <span className="text-slate-900 break-all">{user.email}</span>
                    </div>

                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Icon name="phone" className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Phone:</span>
                        <span className="text-slate-900">{user.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Icon name="calendar" className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">Joined:</span>
                      <span className="text-slate-900">{formatDate(user.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Icon name="clock" className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">Last Login:</span>
                      <span className="text-slate-900">{user.lastLogin ? formatDate(user.lastLogin) : "Never logged in"}</span>
                    </div>
                  </div>

                  {/* Employer verification note */}
                  {user.role === "employer" && (
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Icon name="info" className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">Employer Verification is handled in a separate module</p>
                          <p className="mt-1 text-sm text-slate-700">
                            This page shows verification status as read-only. Use <span className="font-semibold">Employer Verification</span> to review documents and approve/reject.
                          </p>

                          {employerVerificationBadge?.label !== "Verified" && (
                            <p className="mt-2 text-sm text-slate-700">
                              <span className="font-semibold">Note:</span> Job posting should be restricted until verification is approved (DTI compliance).
                            </p>
                          )}

                          <div className="mt-3">
                            <Link
                              to={EMPLOYER_VERIFICATION_ROUTE}
                              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-xl px-2 py-1 -ml-2"
                            >
                              <Icon name="document-text" className="h-4 w-4" />
                              Open Employer Verification
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="my-6 border-t border-emerald-100" />

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={user.status === "active" ? "secondary" : "success"}
                    size="sm"
                    leftIcon={<Icon name="check" className="h-4 w-4" />}
                    onClick={() => openStatusModal("active")}
                    disabled={user.status === "active" || actionLoading}
                  >
                    Activate
                  </Button>

                  <Button
                    variant={user.status === "inactive" ? "secondary" : "neutral"}
                    size="sm"
                    leftIcon={<Icon name="x" className="h-4 w-4" />}
                    onClick={() => openStatusModal("inactive")}
                    disabled={user.status === "inactive" || actionLoading}
                  >
                    Deactivate
                  </Button>

                  <Button
                    variant={user.status === "suspended" ? "secondary" : "warning"}
                    size="sm"
                    leftIcon={<Icon name="lock" className="h-4 w-4" />}
                    onClick={() => openStatusModal("suspended")}
                    disabled={user.status === "suspended" || actionLoading}
                  >
                    Suspend
                  </Button>

                  {showGenericVerifyToggle && (
                    <Button
                      variant={user.isVerified ? "neutral" : "success"}
                      size="sm"
                      leftIcon={<Icon name={user.isVerified ? "x" : "check"} className="h-4 w-4" />}
                      onClick={handleVerificationToggle}
                      disabled={actionLoading}
                    >
                      {user.isVerified ? "Unverify" : "Verify"}
                    </Button>
                  )}

                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Icon name="trash" className="h-4 w-4" />}
                    onClick={openDeleteModal}
                    disabled={!canDelete || actionLoading}
                  >
                    Delete
                  </Button>
                </div>

                {/* ✅ Cleaner info note (not "QA rule:" internal text) */}
                <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                  <Icon name="info" className="h-4 w-4 mt-0.5 text-slate-400" />
                  <p>
                    These actions control <span className="font-semibold">account access</span> and are intended for audit-friendly administration.
                    {user.role === "employer" && <> Employer verification is managed separately.</>}
                  </p>
                </div>
              </div>

              <div className="my-6 border-t border-emerald-100" />

              {/* Role-specific details */}
              {user.role === "jobseeker" && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Icon name="academic-cap" className="h-5 w-5" />
                    Student Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.studentId && (
                      <div>
                        <p className="text-sm text-slate-600">Student ID</p>
                        <p className="font-medium text-slate-900">{user.studentId}</p>
                      </div>
                    )}
                    {user.course && (
                      <div>
                        <p className="text-sm text-slate-600">Course</p>
                        <p className="font-medium text-slate-900">{user.course}</p>
                      </div>
                    )}
                    {user.graduationYear && (
                      <div>
                        <p className="text-sm text-slate-600">Graduation Year</p>
                        <p className="font-medium text-slate-900">{user.graduationYear}</p>
                      </div>
                    )}
                    {user.location && (
                      <div>
                        <p className="text-sm text-slate-600">Location</p>
                        <p className="font-medium text-slate-900">{user.location}</p>
                      </div>
                    )}
                    {user.contactNumber && (
                      <div>
                        <p className="text-sm text-slate-600">Contact Number</p>
                        <p className="font-medium text-slate-900">{user.contactNumber}</p>
                      </div>
                    )}
                  </div>

                  {user.resume && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-600 mb-2">Resume</p>
                      <a
                        href={getImageUrl(user.resume)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-xl px-2 py-1 -ml-2"
                      >
                        <Icon name="document-text" className="h-4 w-4" />
                        View Resume
                      </a>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="text-sm text-slate-600">Applications Submitted</p>
                    <p className="font-medium text-slate-900">{user.applicationCount || 0}</p>
                  </div>
                </div>
              )}

              {user.role === "employer" && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Icon name="building" className="h-5 w-5" />
                    Company Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.companyName && (
                      <div>
                        <p className="text-sm text-slate-600">Company Name</p>
                        <p className="font-medium text-slate-900">{user.companyName}</p>
                      </div>
                    )}
                    {user.companyEmail && (
                      <div>
                        <p className="text-sm text-slate-600">Company Email</p>
                        <p className="font-medium text-slate-900 break-all">{user.companyEmail}</p>
                      </div>
                    )}
                    {user.companyPhone && (
                      <div>
                        <p className="text-sm text-slate-600">Company Phone</p>
                        <p className="font-medium text-slate-900">{user.companyPhone}</p>
                      </div>
                    )}
                    {user.industry && (
                      <div>
                        <p className="text-sm text-slate-600">Industry</p>
                        <p className="font-medium text-slate-900">{user.industry}</p>
                      </div>
                    )}
                    {user.companyAddress && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-slate-600">Company Address</p>
                        <p className="font-medium text-slate-900">{user.companyAddress}</p>
                      </div>
                    )}
                    {user.companyDescription && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-slate-600">Company Description</p>
                        <p className="font-medium text-slate-900">{user.companyDescription}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-slate-600">Jobs Posted</p>
                    <p className="font-medium text-slate-900">{user.jobPostCount || 0}</p>
                  </div>
                </div>
              )}

              {user.role === "admin" && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Icon name="shield" className="h-5 w-5" />
                    Administrator Account
                  </h3>
                  <p className="text-sm text-slate-700">This is an administrator account with full system access.</p>
                </div>
              )}

              {user.adminNotes && (
                <>
                  <div className="my-6 border-t border-emerald-100" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Admin Notes</h3>
                    <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{user.adminNotes}</p>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Account Status</p>
                    <p className="text-lg font-semibold text-slate-900">{statusInfo.label}</p>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>

                <div>
                  <p className="text-sm text-slate-600">{user.role === "employer" ? "DTI Verification" : "Verification Status"}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-lg font-semibold text-slate-900">{verificationSummary.label}</p>
                    <Icon name={verificationSummary.icon} className={cn("h-5 w-5", verificationSummary.iconClass)} />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Login Count</p>
                  <p className="text-lg font-semibold text-slate-900">{user.loginCount || 0}</p>
                </div>

                {user.role === "jobseeker" && (
                  <div>
                    <p className="text-sm text-slate-600">Applications Submitted</p>
                    <p className="text-lg font-semibold text-slate-900">{user.applicationCount || 0}</p>
                  </div>
                )}

                {user.role === "employer" && (
                  <div>
                    <p className="text-sm text-slate-600">Jobs Posted</p>
                    <p className="text-lg font-semibold text-slate-900">{user.jobPostCount || 0}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
                    <Icon name="calendar" className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Account Created</p>
                    <p className="text-xs text-slate-500">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                {user.lastLogin && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
                      <Icon name="clock" className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Last Login</p>
                      <p className="text-xs text-slate-500">{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
                    <Icon name="user" className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Account Role</p>
                    <p className="text-xs text-slate-500">{roleInfo.label}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Status Modal */}
        <Modal
          open={statusModalOpen}
          title={`Confirm status change to "${STATUS_LABELS[pendingStatus] || pendingStatus || ""}"`}
          onClose={closeStatusModal}
          disableClose={actionLoading}
          initialFocusSelector="#status-reason"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={closeStatusModal} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={pendingStatus === "suspended" ? "warning" : pendingStatus === "active" ? "success" : "neutral"}
                size="sm"
                onClick={handleConfirmStatusUpdate}
                loading={actionLoading}
              >
                Confirm
              </Button>
            </div>
          }
        >
          {/* ✅ modal-local errors */}
          {statusModalError && (
            <Alert type="error" title="Action Required" className="mb-4" onClose={() => setStatusModalError("")}>
              {statusModalError}
            </Alert>
          )}

          <div className="space-y-3">
            <p className="text-sm text-slate-700">Provide a reason for audit trail (security & compliance).</p>

            <div>
              <label htmlFor="status-reason" className="block text-sm font-semibold text-slate-900">
                Reason <span className="text-rose-600">*</span>
              </label>
              <p id="status-reason-help" className="mt-1 text-xs text-slate-500">
                Example: Suspended due to suspicious activity / Deactivated upon request / Activated after review.
              </p>

              <textarea
                id="status-reason"
                className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                rows={4}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                disabled={actionLoading}
                aria-describedby="status-reason-help"
              />
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          open={deleteModalOpen}
          title="Delete account (irreversible)"
          onClose={closeDeleteModal}
          disableClose={actionLoading}
          initialFocusSelector="#delete-confirm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={closeDeleteModal} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={actionLoading} disabled={!canDelete || !deleteReady}>
                Delete Permanently
              </Button>
            </div>
          }
        >
          {/* ✅ modal-local errors */}
          {deleteModalError && (
            <Alert type="error" title="Action Required" className="mb-4" onClose={() => setDeleteModalError("")}>
              {deleteModalError}
            </Alert>
          )}

          <div className="space-y-3">
            <Alert type="warning" title="Warning" className="mb-3">
              This action cannot be undone. To confirm, type <span className="font-semibold">DELETE</span> below.
            </Alert>

            <div>
              <label htmlFor="delete-confirm" className="block text-sm font-semibold text-slate-900">
                Confirm deletion
              </label>
              <p id="delete-help" className="mt-1 text-xs text-slate-500">
                Type <span className="font-semibold">DELETE</span> exactly to enable the delete button.
              </p>

              <input
                id="delete-confirm"
                className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-rose-600"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE"'
                disabled={actionLoading}
                aria-describedby="delete-help"
                autoComplete="off"
              />
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default UserManagementDetails;
