import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../../services/api'; // ✅ CHANGED: Import api instead of axios
import EmployerLayout from '../../../layouts/EmployerLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faSave,
  faTimes,
  faUpload,
  faEye,
  faEyeSlash,
  faFileArrowUp,
  faFileLines,
  faTriangleExclamation,
  faCircleCheck,
  faClock,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';

const cx = (...s) => s.filter(Boolean).join(' ');

const WEBSITE_BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'file:']);
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const MIN_LOGO_DIM = 128;
const MIN_RATIO = 0.25;
const MAX_RATIO = 4;

const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOC_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

const DOC_TYPES = [
  { key: 'dtiSec', label: 'DTI / SEC Registration', hint: 'Upload your DTI (sole prop) or SEC (corporation) document.' },
  { key: 'govId', label: 'Contact Person Government ID', hint: 'Upload a valid government-issued ID.' },
  { key: 'addressProof', label: 'Address Proof', hint: 'Utility bill / lease contract / business address proof.' },
];

const INDUSTRY_OPTIONS = [
  'Accounting',
  'Advertising & Marketing',
  'Agriculture',
  'Architecture',
  'Automotive',
  'Banking & Finance',
  'Construction',
  'Education',
  'Energy & Utilities',
  'Engineering',
  'Food & Beverage',
  'Government',
  'Healthcare',
  'Hospitality & Tourism',
  'Human Resources',
  'Information Technology',
  'Legal',
  'Logistics & Supply Chain',
  'Manufacturing',
  'Media & Entertainment',
  'Real Estate',
  'Retail',
  'Security',
  'Telecommunications',
  'Transportation',
  'Others',
];

const normalizeUrl = (raw) => {
  const v = String(raw || '').trim();
  if (!v) return '';
  const withProto = /^(https?:\/\/)/i.test(v) ? v : `https://${v}`;

  try {
    const u = new URL(withProto);
    if (WEBSITE_BLOCKED_PROTOCOLS.has(u.protocol)) return '';
    return u.toString();
  } catch {
    return '';
  }
};

const formatUrlLabel = (raw) => {
  const n = normalizeUrl(raw);
  if (!n) return '';
  try {
    const u = new URL(n);
    const label = `${u.hostname}${u.pathname !== '/' ? u.pathname : ''}`;
    return label || n;
  } catch {
    return n;
  }
};

const isEqualShallow = (a, b) => {
  const ka = Object.keys(a || {});
  const kb = Object.keys(b || {});
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
};

const Field = ({ id, label, required, hint, showHint = true, error, disabled, children }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;

  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        id,
        'aria-describedby': cx(hintId, errId),
        'aria-invalid': Boolean(error),
        disabled,
      })
    : children;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>

      {child}

      {error ? (
        <p id={errId} className="text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : hint && showHint ? (
        <p id={hintId} className="text-xs text-slate-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

const ReadOnlyValue = ({ value, placeholder = '—' }) => {
  const text = String(value || '').trim();
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
      {text ? <span className="break-words">{text}</span> : <span className="text-slate-600">{placeholder}</span>}
    </div>
  );
};

const CompanyProfile = () => {
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyAddress: '',
    contactPerson: '',
    companyPhone: '',
    companyWebsite: '',
    companyEmail: '',
    companyFacebook: '',
    industry: '',
    profileVisible: true,
  });

  const [initialData, setInitialData] = useState(companyData);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});

  const [previewLogo, setPreviewLogo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [verification, setVerification] = useState({
    dtiSec: { url: '', status: 'not_submitted', reason: '' },
    govId: { url: '', status: 'not_submitted', reason: '' },
    addressProof: { url: '', status: 'not_submitted', reason: '' },
    overallStatus: 'not_submitted',
  });

  const [docUploading, setDocUploading] = useState({
    dtiSec: false,
    govId: false,
    addressProof: false,
  });

  // Local-only metadata for better UX (filename after upload)
  const [docMetaLocal, setDocMetaLocal] = useState({
    dtiSec: { fileName: '' },
    govId: { fileName: '' },
    addressProof: { fileName: '' },
  });

  const logoInputRef = useRef(null);
  const docInputRefs = useRef({
    dtiSec: null,
    govId: null,
    addressProof: null,
  });

  const location = useLocation(); // ✅ for reading #verification hash
  const verificationSectionRef = useRef(null); // ✅ ref to scroll to section

  // ---------------- Styles ----------------
  const card = 'rounded-2xl border border-slate-200/70 bg-white shadow-sm';
  const sectionCard = 'rounded-2xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-none';

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2';

  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ' +
    focusRing;

  const inputEdit = inputBase + ' focus-visible:border-green-600';
  const inputErr = 'border-red-300 focus-visible:border-red-600 focus-visible:ring-red-600';
  const textareaEdit = inputEdit + ' resize-none';

  const btnBase =
    'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold ' +
    focusRing +
    ' disabled:opacity-50 disabled:cursor-not-allowed';

  const btnPrimary = btnBase + ' bg-green-600 px-4 py-2.5 text-white hover:bg-green-700';
  const btnSecondary = btnBase + ' border border-slate-200 bg-white px-4 py-2.5 text-slate-900 hover:bg-slate-50';
  const btnGhost = btnBase + ' border border-slate-200 bg-white px-4 py-2.5 text-slate-900 hover:bg-slate-50';
  const btnSecondarySm =
    btnBase + ' border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 hover:bg-slate-50';

  const badge = (tone) =>
    cx(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
      tone === 'good'
        ? 'bg-green-50 text-green-800 ring-1 ring-inset ring-green-200'
        : tone === 'info'
        ? 'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200'
        : tone === 'warn'
        ? 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200'
        : tone === 'bad'
        ? 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200'
        : 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200'
    );

  const statusMeta = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') return { tone: 'good', icon: faCircleCheck, label: 'Approved' };
    if (s === 'rejected') return { tone: 'bad', icon: faTriangleExclamation, label: 'Rejected' };
    if (s === 'pending') return { tone: 'info', icon: faClock, label: 'Pending review' };
    if (s === 'submitted') return { tone: 'info', icon: faClock, label: 'Submitted' };
    return { tone: 'neutral', icon: faFileLines, label: 'Not submitted' };
  };

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const overallMeta = useMemo(() => statusMeta(verification?.overallStatus), [verification?.overallStatus]);

  // ---------------- QA LOCK RULES ----------------
  // Company Name: editable lang kapag not_submitted or rejected
  const canEditCompanyName = useMemo(() => {
    const s = String(verification?.overallStatus || '').toLowerCase();
    return s === 'not_submitted' || s === 'rejected';
  }, [verification?.overallStatus]);

  const companyNameLocked = editMode && !canEditCompanyName;

  // Company Email & Contact Person: not editable here (Settings page dapat)
  const companyEmailLocked = true;
  const contactPersonLocked = true;

  const requiredComplete = useMemo(() => Boolean(companyData.companyName?.trim()), [companyData.companyName]);

  const isDirty = useMemo(() => {
    if (logoFile) return true;
    return !isEqualShallow(companyData, initialData);
  }, [companyData, initialData, logoFile]);

  const logoFallback = useMemo(() => {
    const name = encodeURIComponent(companyData.companyName || 'Company');
    return `https://ui-avatars.com/api/?name=${name}&background=16A34A&color=fff&size=256`;
  }, [companyData.companyName]);

  // ---------------- Data fetch ----------------
  const fetchCompanyProfile = useCallback(async () => {
    try {
      setLoading(true);
      clearMessages();
      clearFieldErrors();

      // ✅ CHANGED: Use api instance instead of axios with localhost
      const response = await api.get('/auth/me');

      if (response.data?.success) {
        const user = response.data.user;
        const p = user?.employerProfile;

        const next = {
          companyName: p?.companyName || '',
          companyAddress: p?.companyAddress || '',
          contactPerson: p?.contactPerson || user?.fullName || '',
          companyPhone: p?.companyPhone || '',
          companyWebsite: p?.companyWebsite || '',
          companyEmail: p?.companyEmail || user?.email || '',
          companyFacebook: p?.companyFacebook || '',
          industry: p?.industry || '',
          profileVisible: p?.profileVisible !== false,
        };

        setCompanyData(next);
        setInitialData(next);
        setPreviewLogo(p?.companyLogo || null);
        setLogoFile(null);

        const v = p?.verificationDocs || {};
        const vv = {
          dtiSec: {
            url: v?.dtiSec?.url || '',
            status: v?.dtiSec?.status || 'not_submitted',
            reason: v?.dtiSec?.reason || '',
          },
          govId: {
            url: v?.govId?.url || '',
            status: v?.govId?.status || 'not_submitted',
            reason: v?.govId?.reason || '',
          },
          addressProof: {
            url: v?.addressProof?.url || '',
            status: v?.addressProof?.status || 'not_submitted',
            reason: v?.addressProof?.reason || '',
          },
          overallStatus: v?.overallStatus || 'not_submitted',
        };
        setVerification(vv);
      } else {
        setError('Could not load profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading company profile.');
    } finally {
      setLoading(false);
    }
  }, [clearFieldErrors, clearMessages]);

  useEffect(() => {
    fetchCompanyProfile();
  }, [fetchCompanyProfile]);

  useEffect(() => {
    return () => {
      if (previewLogo && typeof previewLogo === 'string' && previewLogo.startsWith('blob:')) {
        URL.revokeObjectURL(previewLogo);
      }
    };
  }, [previewLogo]);

  // ✅ NEW: scroll to Verification section when URL has #verification
  useEffect(() => {
    if (location.hash === '#verification' && !loading) {
      setTimeout(() => {
        if (verificationSectionRef.current) {
          verificationSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 200);
    }
  }, [location.hash, loading]);

  // ---------------- Helpers ----------------
  const focusFirstError = useCallback((firstKey) => {
    if (!firstKey) return;
    const el = document.querySelector(`[name="${firstKey}"]`) || document.getElementById(firstKey);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus?.();
  }, []);

  const setProfileVisible = useCallback(
    (visible) => {
      setCompanyData((p) => ({ ...p, profileVisible: visible }));
      setFieldErrors((prev) => ({ ...prev, profileVisible: undefined }));
      clearMessages();
    },
    [clearMessages]
  );

  // ---------------- Handlers ----------------
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      // Enforce locks
      if (name === 'companyEmail' && companyEmailLocked) return;
      if (name === 'contactPerson' && contactPersonLocked) return;
      if (name === 'companyName' && companyNameLocked) return;

      setCompanyData((prev) => ({
        ...prev,
        [name]: value,
      }));
      clearMessages();
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    [clearMessages, companyEmailLocked, contactPersonLocked, companyNameLocked]
  );

  const handleLogoChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      clearMessages();
      clearFieldErrors();

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      if (file.size > MAX_LOGO_SIZE_BYTES) {
        setError('Logo size should be less than 5MB.');
        return;
      }

      const blobUrl = URL.createObjectURL(file);

      try {
        const dims = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.onerror = reject;
          img.src = blobUrl;
        });

        const { w, h } = dims;

        if (w < MIN_LOGO_DIM || h < MIN_LOGO_DIM) {
          URL.revokeObjectURL(blobUrl);
          setError(`Logo is too small. Use at least ${MIN_LOGO_DIM}×${MIN_LOGO_DIM} px.`);
          return;
        }

        const ratio = w / h;
        if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
          URL.revokeObjectURL(blobUrl);
          setError('Logo aspect ratio is too extreme. Use a more square image.');
          return;
        }

        if (previewLogo && typeof previewLogo === 'string' && previewLogo.startsWith('blob:')) {
          URL.revokeObjectURL(previewLogo);
        }

        setLogoFile(file);
        setPreviewLogo(blobUrl);
      } catch {
        URL.revokeObjectURL(blobUrl);
        setError('Could not read the image. Please try another logo.');
      }
    },
    [clearFieldErrors, clearMessages, previewLogo]
  );

  const startEdit = useCallback(() => {
    clearMessages();
    clearFieldErrors();
    setEditMode(true);
  }, [clearFieldErrors, clearMessages]);

  const handleCancel = useCallback(
    async () => {
      clearMessages();
      clearFieldErrors();

      if (isDirty) {
        const ok = window.confirm('Discard unsaved changes?');
        if (!ok) return;
      }

      setEditMode(false);
      setLogoFile(null);
      await fetchCompanyProfile();
    },
    [clearFieldErrors, clearMessages, fetchCompanyProfile, isDirty]
  );

  const validateClient = useCallback(() => {
    const next = {};

    if (!companyData.companyName?.trim()) {
      next.companyName = 'Company name is required.';
    }

    if (companyData.companyPhone?.trim()) {
      const v = companyData.companyPhone.trim().replace(/\s+/g, '');
      const ok = /^09\d{9}$/.test(v) || /^\+63\d{10}$/.test(v);
      if (!ok) next.companyPhone = 'Use 09xxxxxxxxx or +63xxxxxxxxxx.';
    }

    if (companyData.companyWebsite?.trim()) {
      const normalized = normalizeUrl(companyData.companyWebsite);
      if (!normalized) next.companyWebsite = 'Enter a valid website URL.';
    }

    if (companyData.companyFacebook?.trim()) {
      const normalized = normalizeUrl(companyData.companyFacebook);
      if (!normalized) next.companyFacebook = 'Enter a valid Facebook Page URL.';
    }

    if (companyData.companyEmail?.trim()) {
      const email = String(companyData.companyEmail).trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!ok) next.companyEmail = 'Enter a valid email address.';
    }

    setFieldErrors(next);
    const firstKey = Object.keys(next)[0];
    return { ok: Object.keys(next).length === 0, firstKey, errors: next };
  }, [companyData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      clearMessages();
      clearFieldErrors();

      const v = validateClient();
      if (!v.ok) {
        setError('Please fix the highlighted fields.');
        focusFirstError(v.firstKey);
        return;
      }

      setSaving(true);

      try {
        const normalizedWebsite = companyData.companyWebsite?.trim()
          ? normalizeUrl(companyData.companyWebsite)
          : '';

        const normalizedFacebook = companyData.companyFacebook?.trim()
          ? normalizeUrl(companyData.companyFacebook)
          : '';

        const normalizedPhone = companyData.companyPhone?.trim()
          ? companyData.companyPhone.trim().replace(/\s+/g, '')
          : '';

        const fd = new FormData();

        Object.keys(companyData).forEach((key) => {
          let val = typeof companyData[key] === 'boolean' ? String(companyData[key]) : companyData[key];

          if (key === 'companyWebsite') val = normalizedWebsite;
          if (key === 'companyFacebook') val = normalizedFacebook;
          if (key === 'companyPhone') val = normalizedPhone;

          fd.append(key, val ?? '');
        });

        if (logoFile) fd.append('companyLogo', logoFile);

        // ✅ CHANGED: Use api instance instead of axios with localhost
        const response = await api.put('/auth/update-company-profile', fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data?.success) {
          setSuccess('Company profile updated.');
          setEditMode(false);
          setLogoFile(null);

          if (response.data.user?.employerProfile?.companyLogo) {
            setPreviewLogo(response.data.user.employerProfile.companyLogo);
          }

          await fetchCompanyProfile();
        } else {
          setError('Error updating company profile.');
        }
      } catch (err) {
        console.error(err);

        const apiErrors = err.response?.data?.errors;
        if (Array.isArray(apiErrors)) {
          const mapped = {};
          for (const it of apiErrors) {
            if (it?.field) mapped[it.field] = it.message || 'Invalid value.';
          }
          if (Object.keys(mapped).length) {
            setFieldErrors(mapped);
            setError('Please fix the highlighted fields.');
            focusFirstError(Object.keys(mapped)[0]);
            return;
          }
        }

        setError(err.response?.data?.message || 'Error updating company profile.');
      } finally {
        setSaving(false);
      }
    },
    [clearFieldErrors, clearMessages, companyData, fetchCompanyProfile, focusFirstError, logoFile, validateClient]
  );

  const onVisibilityKeyDown = useCallback(
    (e) => {
      if (!editMode || saving) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setProfileVisible(!companyData.profileVisible);
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
      }
    },
    [companyData.profileVisible, editMode, saving, setProfileVisible]
  );

  const validateDocFile = useCallback((file) => {
    if (!file) return { ok: false, message: 'No file selected.' };
    if (file.size > MAX_DOC_SIZE_BYTES) return { ok: false, message: 'File too large. Max 10MB.' };

    const ext = String(file.name || '').split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_DOC_EXT.includes(ext)) {
      return { ok: false, message: `Invalid file type. Allowed: ${ALLOWED_DOC_EXT.join(', ').toUpperCase()}` };
    }

    const mime = String(file.type || '').toLowerCase();
    const okMime =
      mime.includes('pdf') ||
      mime.includes('jpeg') ||
      mime.includes('jpg') ||
      mime.includes('png') ||
      mime.includes('webp') ||
      mime.startsWith('image/');
    if (!okMime) return { ok: false, message: 'Invalid file type.' };

    return { ok: true };
  }, []);

  const uploadVerificationDoc = useCallback(
    async (docType, file) => {
      clearMessages();

      const v = validateDocFile(file);
      if (!v.ok) {
        setError(v.message || 'Invalid file.');
        return;
      }

      try {
        setDocUploading((p) => ({ ...p, [docType]: true }));

        const fd = new FormData();
        fd.append('file', file);

        // ✅ CHANGED: Use api instance instead of axios with localhost
        const res = await api.post(`/auth/upload-verification/${docType}`, fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (res.data?.success) {
          const uploadedName = res.data?.fileName || file?.name || '';
          setDocMetaLocal((p) => ({ ...p, [docType]: { ...p[docType], fileName: uploadedName } }));

          setSuccess('Document uploaded. Status is now submitted for review.');
          await fetchCompanyProfile();
        } else {
          setError(res.data?.message || 'Upload failed.');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Upload failed.');
      } finally {
        setDocUploading((p) => ({ ...p, [docType]: false }));
      }
    },
    [clearMessages, fetchCompanyProfile, validateDocFile]
  );

  const handleDocPick = useCallback(
    (docType) => (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      uploadVerificationDoc(docType, file);
      e.target.value = '';
    },
    [uploadVerificationDoc]
  );

  const openDoc = useCallback((url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  if (loading) {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <div className={cx(card, 'p-10 text-center')}>
              <div role="status" aria-live="polite" className="inline-block">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-green-600" />
                <span className="sr-only">Loading company profile</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">Loading company profile…</p>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  const websiteHref = normalizeUrl(companyData.companyWebsite);
  const websiteLabel = formatUrlLabel(companyData.companyWebsite);

  const fbHref = normalizeUrl(companyData.companyFacebook);
  const fbLabel = formatUrlLabel(companyData.companyFacebook);

  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white -mt-2">
      <div className="mx-auto max-w-7xl px-1 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Company Profile</h1>
            <p className="mt-1 text-sm text-slate-600">Manage and update your company profile information</p>
          </div>

          {/* Outer card */}
          <div className={cx(card, 'relative overflow-hidden')}>
            {/* Saving overlay */}
            {saving ? (
              <div className="absolute inset-0 z-10 rounded-2xl bg-white/70 backdrop-blur-sm">
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-green-600" />
                    Saving changes…
                  </div>
                </div>
              </div>
            ) : null}

            {/* Top header row */}
            <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
                  <img
                    src={previewLogo || logoFallback}
                    alt="Company logo"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = logoFallback;
                    }}
                  />

                  {editMode ? (
                    <>
                      <button
                        type="button"
                        className={cx(
                          'absolute -bottom-2 -right-2 rounded-full border border-slate-200 bg-white p-2 shadow-sm',
                          focusRing
                        )}
                        onClick={() => logoInputRef.current?.click()}
                        aria-label="Upload company logo"
                        title="Upload logo"
                        disabled={saving}
                      >
                        <FontAwesomeIcon icon={faUpload} className="text-slate-700" />
                      </button>

                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        disabled={saving}
                      />
                    </>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xl font-bold text-slate-900">{companyData.companyName?.trim() || 'Your Company'}</p>

                    <span className={badge('neutral')}>
                      {companyData.profileVisible ? 'Visibility: Public' : 'Visibility: Private'}
                    </span>

                    <span className={badge(overallMeta.tone)}>
                      <FontAwesomeIcon icon={overallMeta.icon} />
                      Verification: {overallMeta.label}
                    </span>

                    {editMode ? <span className={badge('neutral')}>Editing</span> : null}

                    {editMode && isDirty ? (
                      <span className="text-[11px] font-semibold text-slate-600">Unsaved changes</span>
                    ) : null}
                  </div>

                  <p className="truncate text-sm text-slate-600">{companyData.industry?.trim() || 'Industry'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!editMode ? (
                  <button type="button" onClick={startEdit} className={btnPrimary}>
                    <FontAwesomeIcon icon={faEdit} />
                    Edit Profile
                  </button>
                ) : null}
              </div>
            </div>

            {/* Messages */}
            <div className="px-6 py-4">
              {error ? (
                <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div aria-live="polite" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900">
                  {success}
                </div>
              ) : null}
            </div>

            {/* Body */}
            <form id="company-form" onSubmit={handleSubmit} className={cx('px-6 pb-6', editMode ? 'pb-28' : null)}>
              <div className="grid gap-5 lg:grid-cols-12">
                {/* LEFT */}
                <div className="lg:col-span-8 space-y-6">
                  <section className={sectionCard}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>
                        <p className="mt-1 text-sm text-slate-600">Company details shown to job seekers.</p>
                      </div>

                      <p className="text-xs text-slate-600">
                        <span className="text-red-600">*</span> Required
                      </p>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      {/* Company Name (locked during submitted/pending/approved) */}
                      <div className="md:col-span-2">
                        <Field
                          id="companyName"
                          label="Company Name"
                          required
                          hint={
                            canEditCompanyName
                              ? 'Example: "AGAPAY"'
                              : 'Company name cannot be edited while verification is in progress or approved.'
                          }
                          showHint={true}
                          error={fieldErrors.companyName}
                          disabled={saving}
                        >
                          {editMode && canEditCompanyName ? (
                            <input
                              name="companyName"
                              value={companyData.companyName}
                              onChange={handleInputChange}
                              className={cx(inputEdit, fieldErrors.companyName ? inputErr : null)}
                              required
                              maxLength={80}
                              disabled={saving}
                            />
                          ) : (
                            <ReadOnlyValue value={companyData.companyName} placeholder="Your Company" />
                          )}
                        </Field>
                      </div>

                      {/* Industry (DROPDOWN like register page) */}
                      <Field
                        id="industry"
                        label="Industry"
                        hint="Select your company industry"
                        showHint={editMode}
                        error={fieldErrors.industry}
                        disabled={saving}
                      >
                        {editMode ? (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            </div>

                            <select
                              name="industry"
                              value={companyData.industry}
                              onChange={handleInputChange}
                              className={cx(
                                'block w-full pl-9 pr-8 py-3 text-sm text-slate-900 border border-slate-200 rounded-xl',
                                'focus:ring-2 focus:ring-green-600 focus:border-transparent appearance-none bg-white',
                                fieldErrors.industry ? 'border-red-300 focus:ring-red-600' : ''
                              )}
                              disabled={saving}
                            >
                              <option value="">Select Industry</option>
                              {INDUSTRY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <ReadOnlyValue value={companyData.industry} placeholder="Industry" />
                        )}
                      </Field>

                      {/* Contact Person (locked) */}
                      <Field
                        id="contactPerson"
                        label="Contact Person"
                        hint="This is linked to the account owner. Change in Settings if needed."
                        showHint={true}
                        error={fieldErrors.contactPerson}
                        disabled={true}
                      >
                        <ReadOnlyValue value={companyData.contactPerson} placeholder="—" />
                      </Field>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <Field
                          id="companyAddress"
                          label="Address (City/Region)"
                          hint="City / Region is enough."
                          showHint={editMode}
                          error={fieldErrors.companyAddress}
                          disabled={saving}
                        >
                          {editMode ? (
                            <textarea
                              name="companyAddress"
                              value={companyData.companyAddress}
                              onChange={handleInputChange}
                              rows={3}
                              className={cx(textareaEdit, fieldErrors.companyAddress ? inputErr : null)}
                              maxLength={200}
                              disabled={saving}
                            />
                          ) : (
                            <ReadOnlyValue value={companyData.companyAddress} placeholder="No address yet" />
                          )}
                        </Field>
                      </div>

                      {/* Company Email (locked) */}
                      <Field
                        id="companyEmail"
                        label="Company Email"
                        hint="For security, edit email in Settings."
                        showHint={true}
                        error={fieldErrors.companyEmail}
                        disabled={true}
                      >
                        <ReadOnlyValue value={companyData.companyEmail} placeholder="No email yet" />
                      </Field>

                      {/* Website */}
                      <Field
                        id="companyWebsite"
                        label="Website"
                        hint="Auto-add https:// if missing"
                        showHint={editMode}
                        error={fieldErrors.companyWebsite}
                        disabled={saving}
                      >
                        {editMode ? (
                          <input
                            type="url"
                            name="companyWebsite"
                            value={companyData.companyWebsite}
                            onChange={handleInputChange}
                            className={cx(inputEdit, fieldErrors.companyWebsite ? inputErr : null)}
                            placeholder="https://example.com"
                            maxLength={120}
                            disabled={saving}
                          />
                        ) : websiteHref ? (
                          <a
                            className={cx(
                              'block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm',
                              'text-green-700 underline underline-offset-2 hover:text-green-800',
                              focusRing
                            )}
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {websiteLabel}
                          </a>
                        ) : (
                          <div className="space-y-2">
                            <ReadOnlyValue value="" placeholder="No website yet" />
                            {!editMode ? (
                              <button type="button" onClick={startEdit} className={btnSecondarySm} aria-label="Edit profile to add website">
                                Edit to add website
                              </button>
                            ) : null}
                          </div>
                        )}
                      </Field>

                      {/* Facebook Page */}
                      <Field
                        id="companyFacebook"
                        label="Facebook Page Link"
                        hint="Use your official FB Page link (not personal profile)."
                        showHint={editMode}
                        error={fieldErrors.companyFacebook}
                        disabled={saving}
                      >
                        {editMode ? (
                          <input
                            type="url"
                            name="companyFacebook"
                            value={companyData.companyFacebook}
                            onChange={handleInputChange}
                            className={cx(inputEdit, fieldErrors.companyFacebook ? inputErr : null)}
                            placeholder="https://www.facebook.com/yourpage"
                            maxLength={180}
                            disabled={saving}
                          />
                        ) : fbHref ? (
                          <a
                            className={cx(
                              'block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm',
                              'text-green-700 underline underline-offset-2 hover:text-green-800',
                              focusRing
                            )}
                            href={fbHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {fbLabel}
                          </a>
                        ) : (
                          <div className="space-y-2">
                            <ReadOnlyValue value="" placeholder="No Facebook page yet" />
                            {!editMode ? (
                              <button type="button" onClick={startEdit} className={btnSecondarySm} aria-label="Edit profile to add Facebook page">
                                Edit to add Facebook page
                              </button>
                            ) : null}
                          </div>
                        )}
                      </Field>

                      {/* Phone */}
                      <Field
                        id="companyPhone"
                        label="Phone"
                        hint="Use 09xxxxxxxxx or +63xxxxxxxxxx"
                        showHint={editMode}
                        error={fieldErrors.companyPhone}
                        disabled={saving}
                      >
                        {editMode ? (
                          <input
                            type="tel"
                            inputMode="tel"
                            name="companyPhone"
                            value={companyData.companyPhone}
                            onChange={handleInputChange}
                            className={cx(inputEdit, fieldErrors.companyPhone ? inputErr : null)}
                            placeholder="09xxxxxxxxx"
                            maxLength={16}
                            disabled={saving}
                          />
                        ) : companyData.companyPhone?.trim() ? (
                          <ReadOnlyValue value={companyData.companyPhone} placeholder="—" />
                        ) : (
                          <div className="space-y-2">
                            <ReadOnlyValue value="" placeholder="No phone yet" />
                            {!editMode ? (
                              <button type="button" onClick={startEdit} className={btnSecondarySm} aria-label="Edit profile to add phone number">
                                Edit to add phone number
                              </button>
                            ) : null}
                          </div>
                        )}
                      </Field>
                    </div>
                  </section>

                  {/* Verification / Compliance */}
                  <section
                    ref={verificationSectionRef}
                    id="verification"
                    className={sectionCard}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Verification / Compliance</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Upload documents to reduce fake employers. Not shown to job seekers.
                        </p>
                      </div>
                      <span className={badge(overallMeta.tone)}>
                        <FontAwesomeIcon icon={overallMeta.icon} />
                        {overallMeta.label}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">How verification works</p>
                      <ul className="mt-1 list-disc pl-5 text-xs text-slate-600 space-y-1">
                        <li>
                          Upload documents → status becomes <span className="font-semibold">Submitted</span>.
                        </li>
                        <li>
                          Admin reviews → status becomes <span className="font-semibold">Approved</span> or{' '}
                          <span className="font-semibold">Rejected</span>.
                        </li>
                        <li>
                          Documents are <span className="font-semibold">not shown</span> to job seekers.
                        </li>
                      </ul>
                    </div>

                    <div className="mt-5 space-y-4">
                      {DOC_TYPES.map((d) => {
                        const item = verification?.[d.key] || { url: '', status: 'not_submitted', reason: '' };
                        const meta = statusMeta(item.status);
                        const isUp = !!docUploading?.[d.key];
                        const localFile = docMetaLocal?.[d.key]?.fileName;

                        return (
                          <div key={d.key} className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900">{d.label}</p>
                                  <span className={badge(meta.tone)}>
                                    <FontAwesomeIcon icon={meta.icon} />
                                    {meta.label}
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-600">{d.hint}</p>

                                {String(item.status).toLowerCase() === 'rejected' && item.reason ? (
                                  <p className="mt-2 text-xs font-semibold text-red-700">Rejected: {item.reason}</p>
                                ) : null}

                                {item.url ? (
                                  <button
                                    type="button"
                                    onClick={() => openDoc(item.url)}
                                    className={cx(
                                      'mt-2 inline-flex items-center gap-2 text-xs font-semibold text-green-700 underline underline-offset-2 hover:text-green-800',
                                      focusRing
                                    )}
                                  >
                                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                                    View uploaded file
                                  </button>
                                ) : (
                                  <p className="mt-2 text-xs text-slate-600">No file uploaded yet.</p>
                                )}

                                {(localFile || item.url) ? (
                                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                                    <FontAwesomeIcon icon={faFileLines} className="text-slate-500" />
                                    <span className="font-medium text-slate-700">File:</span>
                                    <span className="truncate">{localFile || 'Uploaded file'}</span>
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  ref={(el) => (docInputRefs.current[d.key] = el)}
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  onChange={handleDocPick(d.key)}
                                  disabled={isUp || saving}
                                />

                                <button
                                  type="button"
                                  onClick={() => docInputRefs.current[d.key]?.click()}
                                  className={btnGhost}
                                  disabled={isUp || saving}
                                  title={saving ? 'Please wait while saving' : 'Upload file'}
                                >
                                  {isUp ? (
                                    <>
                                      <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-slate-900" />
                                      Uploading…
                                    </>
                                  ) : (
                                    <>
                                      <FontAwesomeIcon icon={faFileArrowUp} />
                                      {item.url ? 'Re-upload' : 'Upload'}
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 text-[11px] text-slate-600">Allowed: PDF / JPG / PNG / WEBP • Max 10MB</div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* RIGHT */}
                <div className={cx('lg:col-span-4 space-y-6 lg:self-start', !editMode ? 'lg:sticky lg:top-8' : null)}>
                  {/* Completeness card */}
                  <section className={sectionCard}>
                    <h2 className="text-lg font-bold text-slate-900">Profile completeness</h2>
                    <p className="mt-1 text-sm text-slate-600">Complete these to look more trustworthy.</p>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Company name</span>
                        <span className={badge(companyData.companyName?.trim() ? 'good' : 'warn')}>
                          {companyData.companyName?.trim() ? 'Done' : 'Required'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Company email</span>
                        <span className={badge(companyData.companyEmail?.trim() ? 'neutral' : 'warn')}>
                          {companyData.companyEmail?.trim() ? 'Added' : 'Missing'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">Verification docs</span>
                        <span className={badge(overallMeta.tone)}>{overallMeta.label}</span>
                      </div>
                    </div>

                    {!editMode ? (
                      <button type="button" onClick={startEdit} className={cx(btnSecondary, 'mt-4 w-full')}>
                        <FontAwesomeIcon icon={faEdit} />
                        Complete profile
                      </button>
                    ) : null}
                  </section>

                  {/* Profile Visibility */}
                  <section className={sectionCard}>
                    <h2 className="text-lg font-bold text-slate-900">Profile Visibility</h2>
                    <p className="mt-1 text-sm text-slate-600">Control if job seekers can see your company profile.</p>

                    <div className="mt-4 flex items-start gap-3">
                      <FontAwesomeIcon
                        icon={companyData.profileVisible ? faEye : faEyeSlash}
                        className={cx('mt-0.5', companyData.profileVisible ? 'text-slate-900' : 'text-slate-600')}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{companyData.profileVisible ? 'Public' : 'Private'}</p>
                        <p className="text-xs text-slate-600">{companyData.profileVisible ? 'Visible to job seekers.' : 'Hidden from job seekers.'}</p>
                      </div>
                    </div>

                    {editMode ? (
                      <div className="mt-4" role="radiogroup" aria-label="Profile visibility" onKeyDown={onVisibilityKeyDown}>
                        <div className="grid grid-cols-2 rounded-xl border border-slate-200/70 bg-white p-1">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={companyData.profileVisible === true}
                            tabIndex={companyData.profileVisible ? 0 : -1}
                            onClick={() => setProfileVisible(true)}
                            className={cx(
                              'rounded-lg px-3 py-2 text-sm font-semibold',
                              companyData.profileVisible ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50',
                              focusRing
                            )}
                            disabled={saving}
                          >
                            Public
                          </button>

                          <button
                            type="button"
                            role="radio"
                            aria-checked={companyData.profileVisible === false}
                            tabIndex={!companyData.profileVisible ? 0 : -1}
                            onClick={() => setProfileVisible(false)}
                            className={cx(
                              'rounded-lg px-3 py-2 text-sm font-semibold',
                              !companyData.profileVisible ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50',
                              focusRing
                            )}
                            disabled={saving}
                          >
                            Private
                          </button>
                        </div>

                        <p className="mt-2 text-xs text-slate-600">Tip: use left/right arrow keys to toggle.</p>
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>

              {/* Sticky bottom action bar */}
              {editMode ? (
                <div className="sticky bottom-0 mt-6 -mx-6 border-t border-slate-200/70 bg-white/80 px-6 py-4 backdrop-blur">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-slate-700">{isDirty ? 'You have unsaved changes.' : 'No changes yet.'}</p>

                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={handleCancel} className={btnSecondary} disabled={saving}>
                        <FontAwesomeIcon icon={faTimes} />
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className={btnPrimary}
                        disabled={saving || !requiredComplete || !isDirty}
                        aria-disabled={saving || !requiredComplete || !isDirty}
                        title={!requiredComplete ? 'Company name is required' : !isDirty ? 'No changes to save' : undefined}
                      >
                        {saving ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white" />
                            Saving…
                          </span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSave} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
};

export default CompanyProfile;