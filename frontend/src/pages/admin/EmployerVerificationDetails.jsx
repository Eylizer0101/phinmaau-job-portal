import React, { useEffect, useMemo, useRef, useState, useId } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ===================== UI TOKENS =====================
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2";

const inputBase =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 shadow-sm " +
  focusRing;

// ===================== CONSTANTS (QA RULES) =====================
const MIN_REJECT_REMARKS = 10;

// Allowed transitions (basic state machine)
const allowedTransitions = {
  unverified: ["pending", "verified", "rejected"],
  pending: ["verified", "rejected"],
  rejected: ["pending"], // re-review
  verified: [], // locked by default
};

const normalizeStatus = (s) => (s || "unverified").toLowerCase();
const canTransition = (from, to) => {
  const f = normalizeStatus(from);
  const t = normalizeStatus(to);
  return (allowedTransitions[f] || []).includes(t);
};

// ===================== UI SMALL COMPONENTS =====================
const Badge = ({ children, variant = "neutral", className }) => {
  const variants = {
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber-100 text-amber-900 border-amber-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      role="status"
    >
      {children}
    </span>
  );
};

// ✅ FIX: forwardRef so modal can focus Cancel button
const Button = React.forwardRef(function Button(
  { variant = "secondary", className, loading, children, ...props },
  ref
) {
  const variants = {
    secondary: "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
    primary:
      "bg-green-600 text-white hover:bg-green-700 " +
      "disabled:bg-gray-200 disabled:text-gray-600 disabled:hover:bg-gray-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 " +
      "disabled:bg-gray-200 disabled:text-gray-600 disabled:hover:bg-gray-200",
    neutral: "border border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100",
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
        "transition-colors disabled:cursor-not-allowed",
        focusRing,
        variants[variant],
        loading && "opacity-90 cursor-wait",
        className
      )}
      disabled={props.disabled || loading}
      aria-busy={loading ? "true" : "false"}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      <span className={cn(loading && "opacity-60")}>{children}</span>
    </button>
  );
});

const Alert = ({ type = "info", title, children }) => {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-green-200 bg-green-50 text-green-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info: "border-blue-200 bg-blue-50 text-blue-900",
  };

  return (
    <div
      className={cn("rounded-2xl border p-4 text-sm", styles[type])}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div>{children}</div>
    </div>
  );
};

const Card = ({ children, className, padding = true }) => (
  <div
    className={cn(
      "rounded-2xl border border-gray-200 bg-white shadow-sm",
      padding && "p-6",
      className
    )}
  >
    {children}
  </div>
);

// Focus trap + ESC + initial focus + close button
const Modal = ({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  initialFocusRef,
  disableBackdropClose = true,
}) => {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const prevActive = document.activeElement;

    const focusFirst = () => {
      const el =
        initialFocusRef?.current ||
        dialogRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      el?.focus?.();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
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

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(focusFirst, 0);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      prevActive?.focus?.();
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!disableBackdropClose) onClose?.();
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200"
        >
          <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id={titleId} className="text-base font-bold text-gray-900">
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
              className={cn(
                "rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                focusRing
              )}
              aria-label="Close dialog"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="p-5">{children}</div>

          <div className="p-5 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:justify-end">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
};

const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse rounded-xl bg-gray-100", className)} aria-hidden="true" />
);

// ===================== HELPERS =====================
const statusBadge = (status) => {
  const s = normalizeStatus(status);
  if (s === "verified") return <Badge variant="success">Verified</Badge>;
  if (s === "pending") return <Badge variant="warning">Pending</Badge>;
  if (s === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="neutral">Unverified</Badge>;
};

const toPublicUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/uploads")) return `http://localhost:5000${path}`; // ⚠️ Replace with signed URL in production
  return path;
};

const niceDateTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PH", { timeZone: "Asia/Manila" });
};

const getFileName = (url) => {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    return parts[parts.length - 1] || "document";
  } catch {
    const parts = String(url).split("/");
    return parts[parts.length - 1] || "document";
  }
};

const fileTypeLabel = (url) => {
  const name = getFileName(url).toLowerCase();
  if (name.endsWith(".pdf")) return "PDF";
  if (
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  )
    return "Image";
  return "File";
};

// ✅ FIX: DocRow was missing but used in JSX
const DocRow = ({
  title,
  required,
  uploadedAt,
  hasFile,
  fileMeta,
  onView,
  onDownload,
  disabled,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center rounded-2xl border border-gray-200 p-4">
      <div className="sm:col-span-6 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {title}{" "}
          <span className="text-xs font-semibold text-gray-500">
            ({required ? "Required" : "Optional"})
          </span>
        </p>
        <p className="text-xs text-gray-600">Uploaded: {uploadedAt}</p>
        {hasFile && (
          <p className="mt-1 text-xs text-gray-500 truncate" title={fileMeta}>
            {fileMeta}
          </p>
        )}
      </div>

      <div className="sm:col-span-3">
        {hasFile ? (
          <Badge variant="success">Submitted</Badge>
        ) : (
          <Badge variant={required ? "warning" : "neutral"}>
            {required ? "Missing" : "Not submitted"}
          </Badge>
        )}
      </div>

      <div className="sm:col-span-3 flex gap-2 justify-start sm:justify-end">
        <Button variant="secondary" disabled={!hasFile || disabled} onClick={onView}>
          View
        </Button>
        <Button variant="secondary" disabled={!hasFile || disabled} onClick={onDownload}>
          Download
        </Button>
      </div>
    </div>
  );
};

// ===================== PAGE =====================
const EmployerVerificationDetails = () => {
  const navigate = useNavigate();
  const { employerId } = useParams();

  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // "approve" | "reject" | "pending" | "save"
  const [employer, setEmployer] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [remarks, setRemarks] = useState("");

  const [confirm, setConfirm] = useState({ open: false, nextStatus: null });
  const [logoFailed, setLogoFailed] = useState(false);

  const cancelBtnRef = useRef(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await api.get(`/admin/employers/verification/${employerId}`);
      if (res.data?.success) {
        setEmployer(res.data.employer);
        const existingRemarks =
          res.data.employer?.employerProfile?.verificationDocs?.remarks || "";
        setRemarks(existingRemarks);
        setLogoFailed(false);
      } else {
        setEmployer(null);
        setError("Employer not found.");
      }
    } catch (e) {
      setEmployer(null);
      setError(e.response?.data?.message || "Failed to load employer details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employerId]);

  const company = employer?.employerProfile || {};
  const companyName = company.companyName || "No Company Name";
  const logoUrl = toPublicUrl(company.companyLogo);

  const docs = employer?.employerProfile?.verificationDocs || {};
  const overallStatus = docs?.overallStatus || "unverified";

  const docsComplete = useMemo(() => {
    return !!(docs?.dtiSec?.url && docs?.govId?.url);
  }, [docs?.dtiSec?.url, docs?.govId?.url]);

  const getSignedDocUrl = async (docKey) => {
    const res = await api.get(
      `/admin/employers/verification/${employerId}/docs/${docKey}/signed-url`
    );
    return res.data?.url || "";
  };

  const resolveDocUrl = async (docKey, rawUrl) => {
    try {
      const signed = await getSignedDocUrl(docKey);
      if (signed) return signed;
    } catch {
      // fallback
    }
    return toPublicUrl(rawUrl || "");
  };

  const validateBeforeUpdate = (newStatus) => {
    const target = normalizeStatus(newStatus);

    if (!canTransition(overallStatus, target)) {
      setError(`Invalid status change: ${normalizeStatus(overallStatus)} → ${target}`);
      return false;
    }

    if (target === "verified" && !docsComplete) {
      setError("Cannot approve. Documents are incomplete (DTI/SEC + Gov ID required).");
      return false;
    }

    if (target === "rejected" && (remarks || "").trim().length < MIN_REJECT_REMARKS) {
      setError(`Remarks required for rejection (min ${MIN_REJECT_REMARKS} characters).`);
      return false;
    }

    return true;
  };

  const updateStatus = async (newStatus, intent) => {
    try {
      setAction(intent);
      setError("");
      setSuccess("");

      if (!validateBeforeUpdate(newStatus)) return;

      const res = await api.put(`/admin/employers/verification/${employerId}/status`, {
        overallStatus: normalizeStatus(newStatus),
        remarks: (remarks || "").trim(),
      });

      if (res.data?.success) {
        setSuccess(res.data.message || "Updated successfully.");
        await fetchDetails();
      } else {
        setError("Failed to update verification.");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update verification.");
    } finally {
      setAction(null);
    }
  };

  const saveRemarksOnly = async () => {
    try {
      setAction("save");
      setError("");
      setSuccess("");

      const res = await api.put(`/admin/employers/verification/${employerId}/status`, {
        overallStatus: normalizeStatus(overallStatus),
        remarks: (remarks || "").trim(),
      });

      if (res.data?.success) {
        setSuccess(res.data.message || "Remarks saved.");
        await fetchDetails();
      } else {
        setError("Failed to save remarks.");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save remarks.");
    } finally {
      setAction(null);
    }
  };

  const openDoc = async (docKey, rawUrl) => {
    const url = await resolveDocUrl(docKey, rawUrl);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadDoc = async (docKey, rawUrl) => {
    const url = await resolveDocUrl(docKey, rawUrl);
    if (!url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName(url);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const docItems = [
    { key: "dtiSec", label: "DTI/SEC Registration", required: true, data: docs?.dtiSec },
    { key: "govId", label: "Government ID / Authorization Letter", required: true, data: docs?.govId },
    { key: "addressProof", label: "Proof of Address", required: false, data: docs?.addressProof },
  ];

  const rejectRemarksTooShort =
    (remarks || "").trim().length > 0 &&
    (remarks || "").trim().length < MIN_REJECT_REMARKS;

  const openConfirm = (nextStatus) => {
    setError("");
    setSuccess("");
    setConfirm({ open: true, nextStatus: normalizeStatus(nextStatus) });
  };

  const closeConfirm = () => setConfirm({ open: false, nextStatus: null });

  const isVerified = normalizeStatus(overallStatus) === "verified";

  return (
    <AdminLayout>
     <div className="mx-auto max-w-7xl px-1 py-8"aria-busy={loading ? "true" : "false"}>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Employer Verification Details
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Review company info and verification documents.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/admin/employer-verification")}>
              Back
            </Button>
            <Button variant="neutral" onClick={fetchDetails} disabled={loading} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-3 mb-5">
          {error && (
            <Alert type="error" title="Error">
              {error}
            </Alert>
          )}
          {success && (
            <Alert type="success" title="Success">
              {success}
            </Alert>
          )}
        </div>

        {/* Content */}
        <Card className="overflow-hidden" padding={false}>
          {loading ? (
            <div className="p-6 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-28 rounded-full" />
                    </div>
                  </div>
                  <div className="hidden sm:flex gap-2">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-20 rounded-xl" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5">
                  <Skeleton className="h-5 w-40" />
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </Card>
                <Card className="p-5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-4 h-28 w-full" />
                  <Skeleton className="mt-3 h-10 w-36 rounded-xl" />
                </Card>
              </div>
            </div>
          ) : !employer ? (
            <div className="py-16 text-center text-sm text-gray-600">
              <div className="font-semibold text-gray-900 mb-1">No data</div>
              <div>Employer record not found or has been removed.</div>
              <div className="mt-4">
                <Button variant="neutral" onClick={fetchDetails}>
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Company Header */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-16 w-16 rounded-2xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                      {logoUrl && !logoFailed ? (
                        <img
                          src={logoUrl}
                          alt="Company logo"
                          className="h-full w-full object-contain"
                          onError={() => setLogoFailed(true)}
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-500" aria-hidden="true">
                          {companyName?.trim()?.[0]?.toUpperCase() || "C"}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-gray-900 truncate">{companyName}</h2>
                      <p className="text-sm text-gray-600">{company.industry || "—"}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {statusBadge(overallStatus)}
                        <Badge variant={docsComplete ? "success" : "warning"}>
                          {docsComplete ? "Docs Complete" : "Docs Incomplete"}
                        </Badge>

                        {/* ✅ QA FIX: lock badge ONLY when verified */}
                        {isVerified && <Badge variant="neutral">Status locked</Badge>}
                      </div>

                      {!docsComplete && (
                        <p className="mt-2 text-xs text-amber-800">
                          Required: DTI/SEC + Gov ID. Approve becomes available once both are submitted.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ✅ QA FIX: Actions are state-based */}
                  <div className="flex flex-wrap gap-2">
                    {isVerified ? (
                      <>
                        <Button variant="primary" disabled title="Already verified">
                          Approved
                        </Button>
                        <span className="text-xs text-gray-500 self-center">
                          Status is locked (verified).
                        </span>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => openConfirm("verified")}
                          disabled={!docsComplete || action !== null || !canTransition(overallStatus, "verified")}
                          loading={action === "approve"}
                          title={
                            !canTransition(overallStatus, "verified")
                              ? "Invalid transition"
                              : !docsComplete
                              ? "Documents incomplete"
                              : "Approve employer"
                          }
                        >
                          Approve
                        </Button>

                        <Button
                          variant="danger"
                          onClick={() => openConfirm("rejected")}
                          disabled={action !== null || !canTransition(overallStatus, "rejected")}
                          loading={action === "reject"}
                          title={!canTransition(overallStatus, "rejected") ? "Invalid transition" : "Reject employer"}
                        >
                          Reject
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => updateStatus("pending", "pending")}
                          disabled={action !== null || !canTransition(overallStatus, "pending")}
                          loading={action === "pending"}
                          title={!canTransition(overallStatus, "pending") ? "Invalid transition" : "Set Pending"}
                        >
                          Set Pending
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {!docsComplete && (
                  <div className="mt-4">
                    <Alert type="warning" title="Documents incomplete">
                      You cannot approve unless <b>DTI/SEC</b> and <b>Gov ID</b> are uploaded.
                    </Alert>
                  </div>
                )}
              </div>

              {/* Company Info + Remarks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-3">Company Information</h3>

                  <dl className="space-y-3 text-sm text-gray-800">
                    {[
                      ["Company Email", company.companyEmail || employer.email || "—"],
                      ["Company Address", company.companyAddress || "—"],
                      ["Contact Person", company.contactPerson || "—"],
                      ["Phone", company.companyPhone || "—"],
                      ["Website", company.companyWebsite || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col sm:flex-row sm:gap-3">
                        <dt className="font-semibold text-gray-900 sm:w-40">{label}:</dt>
                        <dd className="min-w-0 text-gray-800 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>

                <Card className="p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-2">Admin Remarks</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Add short, actionable notes. <b>Required for rejection.</b> Saved with the verification record.
                  </p>

                  <label className="sr-only" htmlFor="admin-remarks">
                    Admin remarks
                  </label>
                  <textarea
                    id="admin-remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={5}
                    className={cn(inputBase)}
                    placeholder="Example: DTI document is unclear. Please upload a clear copy."
                  />

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Tip: Mention what’s missing/mismatched.</span>
                    <span>{remarks?.length || 0} chars</span>
                  </div>

                  {rejectRemarksTooShort && (
                    <p className="mt-2 text-xs text-amber-800">
                      For rejection, please provide at least {MIN_REJECT_REMARKS} characters.
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="neutral"
                      onClick={saveRemarksOnly}
                      disabled={action !== null}
                      loading={action === "save"}
                      title="Save remarks (does not change status)"
                    >
                      Save Remarks
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Documents */}
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-base font-bold text-gray-900">Verification Documents</h3>
                  <span className="text-xs text-gray-500">Admin-only access</span>
                </div>

                <div className="space-y-3">
                  {docItems.map((d) => {
                    const rawUrl = d.data?.url || "";
                    const has = !!rawUrl;
                    const pub = toPublicUrl(rawUrl || "");
                    const meta = has ? `Type: ${fileTypeLabel(pub)} • File: ${getFileName(pub)}` : "";

                    return (
                      <DocRow
                        key={d.key}
                        title={d.label}
                        required={d.required}
                        uploadedAt={niceDateTime(d.data?.uploadedAt)}
                        hasFile={has}
                        fileMeta={meta}
                        disabled={action !== null}
                        onView={() => openDoc(d.key, rawUrl)}
                        onDownload={() => downloadDoc(d.key, rawUrl)}
                      />
                    );
                  })}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Security QA rule: Do not show document links to students or employers. Use signed/auth URLs in production.
                </div>
              </Card>

              {/* Confirm Modal */}
              <Modal
                open={confirm.open}
                title={confirm.nextStatus === "verified" ? "Approve employer?" : "Reject employer?"}
                description="Please confirm this action. This will update the employer verification status."
                onClose={closeConfirm}
                initialFocusRef={cancelBtnRef}
                disableBackdropClose={true}
                footer={
                  <>
                    <Button variant="secondary" onClick={closeConfirm} disabled={action !== null} ref={cancelBtnRef}>
                      Cancel
                    </Button>

                    {confirm.nextStatus === "verified" ? (
                      <Button
                        variant="primary"
                        disabled={!docsComplete || action !== null || !canTransition(overallStatus, "verified")}
                        loading={action === "approve"}
                        onClick={() => {
                          closeConfirm();
                          updateStatus("verified", "approve");
                        }}
                      >
                        Confirm Approve
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        disabled={(remarks || "").trim().length < MIN_REJECT_REMARKS || action !== null || !canTransition(overallStatus, "rejected")}
                        loading={action === "reject"}
                        title={(remarks || "").trim().length < MIN_REJECT_REMARKS ? "Remarks required" : "Confirm rejection"}
                        onClick={() => {
                          closeConfirm();
                          updateStatus("rejected", "reject");
                        }}
                      >
                        Confirm Reject
                      </Button>
                    )}
                  </>
                }
              >
                {confirm.nextStatus === "verified" ? (
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      This will mark <b>{companyName}</b> as <b>Verified</b>.
                    </p>

                    <div className="rounded-xl border border-gray-200 p-3">
                      <p className="font-semibold text-gray-900 mb-2">Required documents check</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>DTI/SEC: {docs?.dtiSec?.url ? "Submitted" : "Missing"}</li>
                        <li>Gov ID: {docs?.govId?.url ? "Submitted" : "Missing"}</li>
                      </ul>
                    </div>

                    {!docsComplete && (
                      <Alert type="warning" title="Cannot approve">
                        Please upload the missing required documents first.
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      This will mark <b>{companyName}</b> as <b>Rejected</b>.
                    </p>

                    <Alert type="warning" title="Remarks required">
                      Provide a clear reason for rejection (min {MIN_REJECT_REMARKS} characters).
                    </Alert>

                    <p className="text-xs text-gray-500">
                      The remarks will be stored for audit and transparency.
                    </p>

                    {(remarks || "").trim().length < MIN_REJECT_REMARKS && (
                      <p className="text-xs text-amber-800">
                        Current remarks length: {(remarks || "").trim().length}. Please add more detail.
                      </p>
                    )}
                  </div>
                )}
              </Modal>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EmployerVerificationDetails;
