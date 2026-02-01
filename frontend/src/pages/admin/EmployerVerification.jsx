import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ======================= SIMPLE ICONS =======================
const Icon = ({ name, className = "h-5 w-5", ...props }) => {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 2,
    ...props,
  };

  const icons = {
    search: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    ),
    refresh: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 9A8 8 0 006.3 5.3L4 10M4 15a8 8 0 0013.7 3.7L20 14"
        />
      </>
    ),
    eye: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    x: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    lock: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />,
    moreVertical: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    ),
    info: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 12h1v4h1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </>
    ),
  };

  return (
    <svg {...common} aria-hidden="true">
      {icons[name] || null}
    </svg>
  );
};

// ======================= UI TOKENS =======================
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2";
const inputBase =
  "h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder-gray-500 " +
  "shadow-sm " +
  focusRing +
  " disabled:bg-gray-50 disabled:opacity-60";

const subtleText = "text-sm text-gray-700";
const helperText = "text-xs text-gray-500";

// ======================= BUTTON / ALERT / CARD / BADGE =======================
const Button = ({
  variant = "secondary",
  size = "md",
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  loading,
  title,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold " +
    focusRing +
    " disabled:cursor-not-allowed transition-all duration-200";

  const sizes = {
    xs: "px-2.5 py-1.5 text-xs rounded-lg",
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
  };

  const variants = {
    secondary:
      "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 shadow-sm " +
      "disabled:hover:bg-white disabled:shadow-none",

    // ✅ disabled primary is GRAY
    primary:
      "bg-green-600 text-white hover:bg-green-700 shadow-sm " +
      "disabled:bg-gray-200 disabled:text-gray-600 disabled:hover:bg-gray-200 disabled:shadow-none disabled:opacity-80",

    danger:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm " +
      "disabled:bg-red-200 disabled:text-red-800 disabled:hover:bg-red-200 disabled:shadow-none",
    warning:
      "bg-amber-500 text-white hover:bg-amber-600 shadow-sm " +
      "disabled:bg-amber-200 disabled:text-amber-900 disabled:hover:bg-amber-200 disabled:shadow-none",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100 disabled:hover:bg-transparent",
  };

  return (
    <button
      type="button"
      className={cn(base, sizes[size], variants[variant], className, loading && "opacity-70 cursor-wait")}
      disabled={disabled || loading}
      title={title}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
      ) : (
        leftIcon
      )}
      <span className={cn(loading && "opacity-0")}>{children}</span>
      {!loading && rightIcon}
    </button>
  );
};

const IconButton = ({ label, children, className, ...props }) => (
  <button
    type="button"
    className={cn(
      "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm",
      focusRing,
      className
    )}
    aria-label={label}
    {...props}
  >
    {children}
  </button>
);

const Alert = ({ type = "error", title, children, onClose, autoDismiss = 4500 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoDismiss) return;
    const t = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, autoDismiss);
    return () => clearTimeout(t);
  }, [autoDismiss, onClose]);

  if (!visible) return null;

  const styles = {
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-green-200 bg-green-50 text-green-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-blue-200 bg-blue-50 text-blue-900",
  };

  const icons = {
    error: <Icon name="x" className="h-5 w-5 text-red-500" />,
    success: <Icon name="check" className="h-5 w-5 text-green-500" />,
    warning: <Icon name="info" className="h-5 w-5 text-amber-600" />,
    info: <Icon name="info" className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div className={cn("mb-5 flex items-start gap-3 rounded-xl border p-4", styles[type])} role={type === "error" ? "alert" : "status"}>
      <div className="mt-0.5 shrink-0" aria-hidden="true">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className={cn("shrink-0 rounded-lg p-1 hover:bg-black/5", focusRing)}
          aria-label="Dismiss message"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const Card = ({ children, className, padding = true }) => (
  <div className={cn("rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/70", padding && "p-6", className)}>{children}</div>
);

const Badge = ({ children, variant = "neutral" }) => {
  const variants = {
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variants[variant])}>
      {children}
    </span>
  );
};

// ======================= ACCESSIBLE DROPDOWN =======================
const AccessibleDropdown = ({ trigger, children, align = "right", width = "w-56" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("keydown", handleEsc);

      setTimeout(() => {
        const first = dropdownRef.current?.querySelector('[role="menuitem"]');
        first?.focus?.();
      }, 0);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 transform -translate-x-1/2",
  };

  return (
    <div className="relative inline-block">
      <span ref={triggerRef} className="inline-block">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="inline-flex"
        >
          {trigger}
        </button>
      </span>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1",
            alignClasses[align],
            width
          )}
          role="menu"
        >
          {typeof children === "function" ? children({ close: () => setIsOpen(false) }) : children}
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ children, onClick, variant = "default", disabled = false }) => {
  const variants = {
    default: "text-gray-700 hover:bg-gray-50 focus:bg-gray-50",
    danger: "text-red-600 hover:bg-red-50 focus:bg-red-50",
    warning: "text-amber-700 hover:bg-amber-50 focus:bg-amber-50",
    success: "text-green-700 hover:bg-green-50 focus:bg-green-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed outline-none",
        variants[variant]
      )}
      role="menuitem"
    >
      {children}
    </button>
  );
};

// ======================= MODAL =======================
const Modal = ({ open, title, description, children, onClose, size = "md" }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const prevActive = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKey);

    setTimeout(() => {
      const focusable = panelRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus?.();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      prevActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  const trapFocus = (e) => {
    if (e.key !== "Tab") return;
    const focusables = panelRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const titleId = "dialog-title";
  const descId = "dialog-desc";

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          onKeyDown={trapFocus}
          className={cn("w-full rounded-2xl bg-white shadow-xl border border-gray-200", sizes[size])}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
        >
          <div className="p-5 sm:p-6 border-b border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 id={titleId} className="text-lg font-bold text-gray-900">
                  {title}
                </h3>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-gray-600">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={cn("rounded-lg p-1 hover:bg-gray-100", focusRing)}
                aria-label="Close dialog"
              >
                <Icon name="x" className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

const FieldLabel = ({ children, htmlFor, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-900">
    {children} {required && <span className="text-red-600">*</span>}
  </label>
);

// ======================= HELPERS =======================
const formatDate = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" });
};

const statusBadge = (status) => {
  const s = (status || "unverified").toLowerCase();
  if (s === "verified") return <Badge variant="success">Verified</Badge>;
  if (s === "pending") return <Badge variant="warning">Pending</Badge>;
  if (s === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="neutral">Unverified</Badge>;
};

const docsBadge = (docsComplete) =>
  docsComplete ? <Badge variant="success">Complete</Badge> : <Badge variant="warning">Incomplete</Badge>;

const REJECT_REASONS = [
  { value: "", label: "Select a reason" },
  { value: "incomplete_documents", label: "Incomplete documents" },
  { value: "mismatched_information", label: "Mismatch between info and documents" },
  { value: "invalid_or_fake_documents", label: "Invalid / suspected fake documents" },
  { value: "duplicate_employer", label: "Duplicate employer / already exists" },
  { value: "other", label: "Other" },
];

// ======================= PAGE =======================
const EmployerVerification = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [queryDraft, setQueryDraft] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState({}); // per employer

  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectTouched, setRejectTouched] = useState(false);

  const clearMsgs = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(queryDraft), 200);
    return () => clearTimeout(t);
  }, [queryDraft]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      clearMsgs();

      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get("/admin/employers/verification", { params });
      if (res.data?.success) setItems(res.data.employers || []);
      else setItems([]);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load employer list.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, clearMsgs]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onUpdate = async (id, newStatus, remarks = "") => {
    setActionLoading((p) => ({ ...p, [id]: true }));
    clearMsgs();
    try {
      const res = await api.put(`/admin/employers/verification/${id}/status`, {
        overallStatus: newStatus,
        remarks,
      });

      if (res.data?.success) {
        setSuccess(res.data.message || "Updated successfully.");
        setApproveTarget(null);
        setRejectTarget(null);
        setRejectReason("");
        setRejectNotes("");
        setRejectTouched(false);
        fetchList();
      } else {
        setError("Failed to update.");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update verification.");
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((emp) => {
      const p = emp.employerProfile || {};
      const companyName = (p.companyName || "").toLowerCase();
      const industry = (p.industry || "").toLowerCase();

      const allowEmailSearch = true;
      const email = (p.companyEmail || emp.email || "").toLowerCase();

      return companyName.includes(q) || industry.includes(q) || (allowEmailSearch && email.includes(q));
    });
  }, [items, query]);

  const count = filtered.length;

  const rejectError =
    !rejectReason
      ? "Please select a rejection reason."
      : rejectReason === "other" && rejectNotes.trim().length < 5
      ? "Please add notes (at least 5 characters)."
      : "";

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-1 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employer Verification</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Review and approve employer accounts before they can post jobs{" "}
                <span className="ml-2 text-gray-500">({count} employers)</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Icon name="refresh" className="h-4 w-4" />}
                onClick={fetchList}
                loading={loading}
                disabled={loading}
                aria-label="Refresh employer list"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert type="error" title="Error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" title="Success" onClose={() => setSuccess("")} autoDismiss={3000}>
            {success}
          </Alert>
        )}

        {/* Filters + Search */}
        <Card className="mb-6" padding={false}>
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Employer List</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Approve is available only when documents are complete. Reject requires a reason (audit-ready).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                {/* Search */}
                <div className="lg:col-span-8">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Icon name="search" className="h-5 w-5" />
                    </span>

                    <input
                      value={queryDraft}
                      onChange={(e) => setQueryDraft(e.target.value)}
                      className={cn(inputBase, "pl-11 pr-10")}
                      placeholder="Search company, industry…"
                      disabled={loading}
                      aria-label="Search employers"
                    />

                    {queryDraft && (
                      <button
                        type="button"
                        onClick={() => setQueryDraft("")}
                        className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 hover:bg-gray-100",
                          focusRing
                        )}
                        aria-label="Clear search"
                        disabled={loading}
                      >
                        <Icon name="x" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="lg:col-span-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={inputBase}
                    disabled={loading}
                    aria-label="Filter by status"
                  >
                    <option value="all">All</option>
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Reset */}
                <div className="lg:col-span-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full h-11"
                    onClick={() => {
                      setQueryDraft("");
                      setQuery("");
                      setStatusFilter("all");
                    }}
                    disabled={loading}
                    aria-label="Reset filters"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Table + Mobile */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-16 text-center" role="status" aria-live="polite">
                <div className="mx-auto inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-green-600" />
                <p className="mt-4 text-sm text-gray-600">Loading employers...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center">
                <h3 className="text-lg font-semibold text-gray-900">No employers found</h3>
                <p className="mt-2 text-sm text-gray-600">Try changing filters or search.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200" role="table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Industry
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Registered
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Docs
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filtered.map((emp) => {
                        const p = emp.employerProfile || {};
                        const companyName = p.companyName || "No Company Name";
                        const industry = p.industry || "—";
                        const status = (emp.overallStatus || "unverified").toLowerCase();
                        const docsComplete = !!emp.docsComplete;
                        const isActing = !!actionLoading[emp._id];

                        const isVerified = status === "verified"; // ✅ QA rule
                        const emailValue = p.companyEmail || emp.email || "";

                        return (
                          <tr
                            key={emp._id}
                            className="hover:bg-gray-50 transition-colors focus-within:bg-gray-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                                  <span className="text-sm font-bold text-gray-700">
                                    {(companyName || "?").trim().slice(0, 1).toUpperCase()}
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 truncate" title={companyName}>
                                    {companyName}
                                  </div>

                                  <div className="mt-0.5 text-xs text-gray-500 truncate" title={p.contactPerson || ""}>
                                    Contact: {p.contactPerson || "—"}
                                  </div>

                                  <div className="mt-0.5 text-xs text-gray-500 truncate" title={emailValue}>
                                    Email: {emailValue || "—"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className={cn(subtleText, "truncate")} title={industry}>
                                {industry}
                              </div>
                            </td>

                            <td className={cn("px-6 py-4", subtleText)}>{formatDate(emp.createdAt)}</td>

                            <td className="px-6 py-4 text-center">{statusBadge(status)}</td>

                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                {docsBadge(docsComplete)}
                                {!docsComplete && (
                                  <div className="mt-1 text-xs text-amber-700 text-center">
                                    DTI/SEC + Gov ID required
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end items-center gap-2">
                                <IconButton
                                  label={`View details for ${companyName}`}
                                  onClick={() => navigate(`/admin/employer-verification/${emp._id}`)}
                                  disabled={isActing}
                                  title="View"
                                >
                                  <Icon name="eye" className="h-4 w-4" />
                                </IconButton>

                                <AccessibleDropdown
                                  trigger={
                                    <IconButton
                                      label={`More actions for ${companyName}`}
                                      disabled={isActing}
                                      title="More actions"
                                    >
                                      <Icon name="moreVertical" className="h-4 w-4" />
                                    </IconButton>
                                  }
                                >
                                  {({ close }) => (
                                    <>
                                      <DropdownItem
                                        onClick={() => {
                                          close();
                                          onUpdate(emp._id, "pending", "Set to pending by admin");
                                        }}
                                        variant="warning"
                                        disabled={isActing || isVerified}
                                      >
                                        <Icon name="lock" className="h-4 w-4 text-amber-600" />
                                        Set Pending
                                      </DropdownItem>

                                      <div className="border-t border-gray-200 my-1" role="separator" />

                                      <DropdownItem
                                        onClick={() => {
                                          close();
                                          setRejectTarget({ id: emp._id, companyName });
                                          setRejectReason("");
                                          setRejectNotes("");
                                          setRejectTouched(false);
                                        }}
                                        variant="danger"
                                        disabled={isActing || isVerified}
                                      >
                                        <Icon name="x" className="h-4 w-4 text-red-600" />
                                        Reject…
                                      </DropdownItem>
                                    </>
                                  )}
                                </AccessibleDropdown>

                                {/* ✅ QA FIX: If VERIFIED, do NOT show Approve button */}
                                {!isVerified ? (
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    loading={isActing}
                                    disabled={!docsComplete || isActing}
                                    onClick={() => setApproveTarget({ id: emp._id, companyName })}
                                    aria-label={`Approve ${companyName}`}
                                    title={!docsComplete ? "Documents incomplete" : "Approve employer"}
                                  >
                                    Approve
                                  </Button>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    disabled
                                    title="Already verified"
                                  >
                                    Approved
                                  </Button>
                                )}
                              </div>

                              {!docsComplete && !isVerified && (
                                <div className="mt-2 text-right text-xs text-gray-500">
                                  Approve disabled: missing required docs
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <p className={cn("mt-3", helperText)}>
                    Note: Please handle employer emails responsibly. Use for verification purposes only.
                  </p>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-3 md:hidden mt-3">
                  {filtered.map((emp) => {
                    const p = emp.employerProfile || {};
                    const companyName = p.companyName || "No Company Name";
                    const industry = p.industry || "—";
                    const status = (emp.overallStatus || "unverified").toLowerCase();
                    const docsComplete = !!emp.docsComplete;
                    const isActing = !!actionLoading[emp._id];

                    const isVerified = status === "verified";
                    const emailValue = p.companyEmail || emp.email || "";

                    return (
                      <Card key={emp._id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                                <span className="text-sm font-bold text-gray-700">
                                  {(companyName || "?").trim().slice(0, 1).toUpperCase()}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate" title={companyName}>
                                  {companyName}
                                </div>
                                <div className="mt-0.5 text-sm text-gray-600 truncate" title={industry}>
                                  {industry}
                                </div>

                                <div className="mt-1 text-xs text-gray-500 truncate" title={p.contactPerson || ""}>
                                  Contact: {p.contactPerson || "—"}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500 truncate" title={emailValue}>
                                  Email: {emailValue || "—"}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {statusBadge(status)}
                              {docsBadge(docsComplete)}
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/admin/employer-verification/${emp._id}`)}
                            disabled={isActing}
                          >
                            View
                          </Button>
                        </div>

                        {!docsComplete && !isVerified && (
                          <div className="mt-2 text-xs text-amber-700">
                            Cannot approve: DTI/SEC + Gov ID required
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          {!isVerified ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="flex-1"
                                onClick={() => setApproveTarget({ id: emp._id, companyName })}
                                disabled={!docsComplete || isActing}
                                loading={isActing}
                                title={!docsComplete ? "Documents incomplete" : "Approve employer"}
                              >
                                Approve
                              </Button>

                              <Button
                                variant="danger"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setRejectTarget({ id: emp._id, companyName });
                                  setRejectReason("");
                                  setRejectNotes("");
                                  setRejectTouched(false);
                                }}
                                disabled={isActing}
                              >
                                Reject…
                              </Button>
                            </>
                          ) : (
                            <Button variant="primary" size="sm" className="flex-1" disabled title="Already verified">
                              Approved
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* APPROVE CONFIRM MODAL */}
      <Modal
        open={!!approveTarget}
        title="Approve employer?"
        description={approveTarget ? `This will mark "${approveTarget.companyName}" as Verified so they can post jobs.` : ""}
        onClose={() => setApproveTarget(null)}
      >
        <div className={subtleText}>Please confirm you have reviewed the employer details and documents.</div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" size="md" onClick={() => setApproveTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (!approveTarget) return;
              onUpdate(approveTarget.id, "verified", "Approved (verified) by admin");
            }}
          >
            Confirm Approve
          </Button>
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        open={!!rejectTarget}
        title="Reject employer"
        description={
          rejectTarget ? `Provide a reason for rejecting "${rejectTarget.companyName}". This will be recorded in audit logs.` : ""
        }
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
          setRejectNotes("");
          setRejectTouched(false);
        }}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="rejectReason" required>
              Rejection reason
            </FieldLabel>
            <select
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              onBlur={() => setRejectTouched(true)}
              className={cn(inputBase, "mt-2")}
            >
              {REJECT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="rejectNotes" required={rejectReason === "other"}>
              Notes {rejectReason === "other" ? "(required)" : "(optional)"}
            </FieldLabel>
            <textarea
              id="rejectNotes"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              onBlur={() => setRejectTouched(true)}
              rows={4}
              className={cn(
                "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 shadow-sm",
                focusRing
              )}
              placeholder="Add short details (e.g., which document is missing or mismatch found)…"
            />
            <p className={cn("mt-1", helperText)}>Tip: Keep it specific and actionable.</p>
          </div>

          {rejectTouched && rejectError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {rejectError}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
                setRejectNotes("");
                setRejectTouched(false);
              }}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              size="md"
              disabled={!!rejectError || !rejectTarget}
              onClick={() => {
                setRejectTouched(true);
                if (!rejectTarget || rejectError) return;

                const reasonLabel = REJECT_REASONS.find((r) => r.value === rejectReason)?.label || "Rejected";
                const remarks = rejectNotes.trim()
                  ? `Rejected by admin — ${reasonLabel}. Notes: ${rejectNotes.trim()}`
                  : `Rejected by admin — ${reasonLabel}.`;

                onUpdate(rejectTarget.id, "rejected", remarks);
              }}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default EmployerVerification;
