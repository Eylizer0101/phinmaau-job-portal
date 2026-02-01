import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

// ======================= ACCESSIBLE DROPDOWN COMPONENT =======================
const AccessibleDropdown = ({ 
  trigger, 
  children, 
  align = 'right',
  width = 'w-48'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Focus first item when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const firstFocusable = dropdownRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 0);
      }
    }
  }, [isOpen]);

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
          if (e.key === 'ArrowDown' && !isOpen) {
            setIsOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-block"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute ${alignClasses[align]} mt-1 ${width} z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 focus:outline-none`}
          role="menu"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              triggerRef.current?.focus();
            }
            if (e.key === 'Tab' && !e.shiftKey) {
              const focusableElements = dropdownRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
              if (e.target === focusableElements[focusableElements.length - 1]) {
                setIsOpen(false);
              }
            }
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ 
  children, 
  onClick, 
  icon, 
  variant = 'default',
  disabled = false 
}) => {
  const variants = {
    default: 'text-gray-700 hover:bg-gray-50',
    danger: 'text-red-600 hover:bg-red-50',
    warning: 'text-amber-600 hover:bg-amber-50',
    success: 'text-green-600 hover:bg-green-50'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm w-full text-left disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-gray-50 ${variants[variant]}`}
      role="menuitem"
      tabIndex={0}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

// ======================= ENHANCED UI COMPONENTS =======================
const Icon = ({ name, className = 'h-5 w-5', ...props }) => {
  const common = { 
    className, 
    fill: 'none', 
    stroke: 'currentColor', 
    viewBox: '0 0 24 24', 
    strokeWidth: 2,
    ...props 
  };
  
  const icons = {
    search: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />,
    refresh: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 9A8 8 0 006.3 5.3L4 10M4 15a8 8 0 0013.7 3.7L20 14" />
      </>
    ),
    eye: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    x: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    mail: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    lock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    download: <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    filter: <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    building: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    shield: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />,
    chevronUp: <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-2.5a4 4 0 11-8 0 4 4 0 018 0z" />,
    moreVertical: <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    export: <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  };

  return (
    <svg {...common} aria-hidden="true">
      {icons[name] || null}
    </svg>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Enhanced Button with better accessibility
const Button = ({ 
  variant = 'secondary', 
  size = 'md', 
  leftIcon, 
  rightIcon, 
  children, 
  className, 
  disabled, 
  loading, 
  fullWidth = false,
  ...props 
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200';
  
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs rounded-lg',
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-5 py-3 text-base rounded-xl',
  };

  const variants = {
    secondary: 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-green-600 shadow-sm',
    primary: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600 shadow-sm',
    neutral: 'border border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100 focus-visible:ring-green-600 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-sm',
    dangerSoft: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-600',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-600 shadow-sm',
    ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:ring-green-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600 shadow-sm',
  };

  return (
    <button
      type="button"
      className={cn(
        base, 
        sizes[size], 
        variants[variant], 
        fullWidth && 'w-full',
        loading && 'opacity-70 cursor-wait',
        className
      )}
      disabled={disabled || loading}
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
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && leftIcon}
      <span className={cn(loading && 'opacity-0', 'whitespace-nowrap')}>
        {children}
      </span>
      {!loading && rightIcon}
    </button>
  );
};

// Enhanced Alert with auto-dismiss
const Alert = ({ 
  type = 'error', 
  title, 
  children, 
  onClose, 
  autoDismiss = 5000 
}) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onClose]);

  if (!visible) return null;

  const styles = {
    error: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
  };

  const icons = {
    error: <Icon name="x" className="h-5 w-5 text-red-500" />,
    success: <Icon name="check" className="h-5 w-5 text-green-500" />,
    warning: <Icon name="lock" className="h-5 w-5 text-amber-500" />,
    info: <Icon name="info" className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div
      className={cn('mb-5 flex items-start gap-3 rounded-xl border p-4 animate-fadeIn', styles[type])}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="assertive"
    >
      <div className="mt-0.5 shrink-0" aria-hidden="true">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-semibold mb-1" id={`alert-title-${Date.now()}`}>
            {title}
          </div>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          className="shrink-0 rounded-lg p-1 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="Dismiss message"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const Card = ({ children, className, hover = false, padding = true }) => (
  <div 
    className={cn(
      'rounded-2xl border border-gray-200 bg-white shadow-sm',
      hover && 'hover:shadow-md transition-shadow duration-200',
      padding && 'p-6',
      className
    )}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = 'neutral', className, icon }) => {
  const variants = {
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      role="status"
    >
      {icon && <span className="w-3 h-3">{icon}</span>}
      {children}
    </span>
  );
};

// Enhanced Modal with focus trap
const Modal = ({ 
  open, 
  title, 
  description, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onClose, 
  danger = false, 
  size = 'md', 
  children,
  confirmDisabled = false
}) => {
  const modalRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => confirmRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      
      if (e.key === 'Escape') onClose?.();
      
      // Trap focus within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className={cn(
          'relative w-full rounded-2xl bg-white shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden animate-scaleIn',
          sizeClasses[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h3 id="modal-title" className="text-xl font-bold text-gray-900">
              {title}
            </h3>
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-gray-600">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            aria-label="Close modal"
          >
            <Icon name="x" className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-6">
          {children}
        </div>
        
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
          {cancelText && (
            <Button 
              variant="secondary" 
              size="md" 
              onClick={onClose}
              aria-label="Cancel action"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            disabled={confirmDisabled}
            ref={confirmRef}
            aria-label={confirmText}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Skeleton = ({ className, variant = 'text', count = 1 }) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  if (variant === 'circle') {
    return <div className={cn(baseClasses, 'rounded-full', className)} />;
  }
  
  if (variant === 'rect') {
    return <div className={cn(baseClasses, 'rounded-lg', className)} />;
  }
  
  if (count > 1) {
    return (
      <div className="space-y-2">
        {[...Array(count)].map((_, i) => (
          <div key={i} className={cn(baseClasses, 'h-4', className)} />
        ))}
      </div>
    );
  }
  
  return <div className={cn(baseClasses, 'h-4', className)} />;
};

// ======================= USER MANAGEMENT SPECIFIC =======================

// Status pills with better semantics
const getStatusPill = (status) => {
  const statusMap = {
    active: { variant: 'success', label: 'Active', icon: 'check', ariaLabel: 'Active user' },
    inactive: { variant: 'neutral', label: 'Inactive', icon: 'x', ariaLabel: 'Inactive user' },
    suspended: { variant: 'danger', label: 'Suspended', icon: 'lock', ariaLabel: 'Suspended user' },
    deleted: { variant: 'neutral', label: 'Deleted', icon: 'trash', ariaLabel: 'Deleted user' },
  };
  return statusMap[status] || { variant: 'neutral', label: 'Unknown', icon: 'x', ariaLabel: 'Unknown status' };
};

// Role pills with better semantics
const getRolePill = (role) => {
  const roleMap = {
    admin: { variant: 'danger', label: 'Admin', icon: 'shield', ariaLabel: 'Administrator role' },
    employer: { variant: 'info', label: 'Employer', icon: 'building', ariaLabel: 'Employer role' },
    jobseeker: { variant: 'purple', label: 'Jobseeker', icon: 'user', ariaLabel: 'Student role' },
  };
  return roleMap[role] || { variant: 'neutral', label: 'Unknown', icon: 'user', ariaLabel: 'Unknown role' };
};

// Enhanced date formatting with localization
const formatDate = (dateString, options = {}) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  
  const defaultOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    timeZone: 'Asia/Manila'
  };
  
  return d.toLocaleDateString('en-PH', { ...defaultOptions, ...options });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Never';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  
  const now = new Date();
  const diffMs = now - d;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateString, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Enhanced debounce hook with cancel capability
const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebounced(value);
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return [debounced, cancel];
};

// Enhanced Avatar with better fallback
const Avatar = React.memo(({ img, name, size = 40, className }) => {
  const [imageError, setImageError] = useState(false);
  const initial = (name?.trim()?.[0] || 'U').toUpperCase();
  
  const roleColor = (name) => {
    if (!name) return 'bg-gray-100 text-gray-600';
    if (name.toLowerCase().includes('admin')) return 'bg-red-100 text-red-800';
    if (name.toLowerCase().includes('employer')) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const boxStyle = { 
    height: `${size}px`, 
    width: `${size}px`,
    fontSize: `${Math.max(12, size * 0.4)}px`
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0',
        roleColor(name),
        className
      )}
      style={boxStyle}
      aria-label={`${name}'s profile picture`}
    >
      {img && !imageError ? (
        <img
          src={img}
          alt={`${name}'s profile`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-bold" aria-hidden="true">{initial}</span>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

// ======================= MAIN USER MANAGEMENT PAGE =======================
const UserManagement = () => {
  const navigate = useNavigate();
  
  // State management with loading states per user
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    jobseekers: 0,
    employers: 0,
    admins: 0,
    active: 0,
    unverified: 0,
  });
  
  // Filters
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  
  // Modal states
  const [actionTarget, setActionTarget] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Loading states per user action
  const [userActionLoading, setUserActionLoading] = useState({});
  
  const [debouncedQuery, cancelQuery] = useDebouncedValue(query, 300);
  
  // Clear messages
  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);
  
  // Fetch users with error boundary
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      clearMessages();
      
      const params = {
        page: currentPage,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        verified: verifiedFilter !== 'all' ? (verifiedFilter === 'verified') : undefined,
        search: debouncedQuery || undefined,
        sort
      };
      
      const response = await api.get('/admin/users', { params });
      
      if (response.data?.success) {
        const formattedUsers = response.data.users.map(user => ({
          key: user._id,
          id: user._id,
          email: user.email,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No Name',
          role: user.role,
          status: user.status || 'active',
          isVerified: user.isVerified || false,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          studentId: user.jobSeekerProfile?.studentId,
          companyName: user.employerProfile?.companyName,
        }));
        
        setUsers(formattedUsers);
        setTotalUsers(response.data.total || formattedUsers.length);
        
        // Calculate stats
        const total = formattedUsers.length;
        const jobseekers = formattedUsers.filter(u => u.role === 'jobseeker').length;
        const employers = formattedUsers.filter(u => u.role === 'employer').length;
        const admins = formattedUsers.filter(u => u.role === 'admin').length;
        const active = formattedUsers.filter(u => u.status === 'active').length;
        const unverified = formattedUsers.filter(u => !u.isVerified).length;
        
        setStats({ total, jobseekers, employers, admins, active, unverified });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users. Please try again.');
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, roleFilter, verifiedFilter, debouncedQuery, sort, clearMessages]);
  
  // Fetch users on filter changes
  useEffect(() => {
    fetchUsers();
    // Cancel any pending debounce on unmount
    return () => cancelQuery();
  }, [fetchUsers, cancelQuery]);
  
  // Handle status update with individual loading
  const handleStatusUpdate = async (userId, newStatus) => {
    setUserActionLoading(prev => ({ ...prev, [userId]: true }));
    clearMessages();
    
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { 
        status: newStatus,
        reason: `Status changed to ${newStatus} by admin`
      });
      
      if (response.data?.success) {
        setSuccess(`User status updated to ${newStatus}`);
        fetchUsers();
      } else {
        setError('Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setUserActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedRowKeys.length === 0) {
      setError('Please select users first');
      return;
    }
    
    if (action === 'delete') {
      setActionTarget({
        type: 'bulk',
        count: selectedRowKeys.length,
        action: 'delete'
      });
      return;
    }
    
    try {
      setLoading(true);
      clearMessages();
      
      let status;
      if (action === 'activate') status = 'active';
      else if (action === 'deactivate') status = 'inactive';
      else if (action === 'suspend') status = 'suspended';
      
      if (status) {
        const response = await api.put('/admin/users/bulk-status', {
          userIds: selectedRowKeys,
          status
        });
        
        if (response.data?.success) {
          setSuccess(`Updated ${response.data.modifiedCount} user(s) to ${status}`);
          setSelectedRowKeys([]);
          fetchUsers();
        } else {
          setError('Failed to update users');
        }
      }
    } catch (err) {
      console.error('Error in bulk action:', err);
      setError(err.response?.data?.message || 'Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    setUserActionLoading(prev => ({ ...prev, [userId]: true }));
    clearMessages();
    
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      
      if (response.data?.success) {
        setSuccess('User deleted successfully');
        fetchUsers();
        setActionTarget(null);
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setUserActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Calculate status stats
  const statusStats = useMemo(() => {
    return [
      { key: 'all', label: 'All Users', count: stats.total, color: 'gray' },
      { key: 'active', label: 'Active', count: stats.active, color: 'green' },
      { key: 'inactive', label: 'Inactive', count: users.filter(u => u.status === 'inactive').length, color: 'gray' },
      { key: 'suspended', label: 'Suspended', count: users.filter(u => u.status === 'suspended').length, color: 'red' },
      { key: 'unverified', label: 'Unverified', count: stats.unverified, color: 'amber' },
    ];
  }, [users, stats]);
  
  // Filtered users with memoization
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply verified filter
    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(user => 
        verifiedFilter === 'verified' ? user.isVerified : !user.isVerified
      );
    }
    
    // Apply search
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(q) ||
        user.name?.toLowerCase().includes(q) ||
        user.companyName?.toLowerCase().includes(q) ||
        user.studentId?.toLowerCase().includes(q)
      );
    }
    
    // Apply sort
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'last_login': return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
        default: return 0;
      }
    });
  }, [users, statusFilter, roleFilter, verifiedFilter, debouncedQuery, sort]);
  
  // Handle row selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowKeys(filteredUsers.map(user => user.key));
    } else {
      setSelectedRowKeys([]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setVerifiedFilter('all');
    setSort('newest');
    setSelectedRowKeys([]);
    setCurrentPage(1);
    cancelQuery();
  };
  
  // Navigate to user details
  const handleViewDetails = (userId) => {
    navigate(`/admin/users/${userId}`);
  };
  
  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Verified', 'Last Login', 'Created At'];
    const csvData = filteredUsers.map(user => [
      user.name,
      user.email,
      user.role,
      user.status,
      user.isVerified ? 'Yes' : 'No',
      formatDateTime(user.lastLogin),
      formatDate(user.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.setAttribute('aria-label', 'Download users as CSV');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccess('Export completed successfully');
  };

  // Input and select base classes
  const inputBase = 'w-full rounded-xl border border-gray-300 pl-11 pr-10 py-3 text-gray-900 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:bg-gray-50 disabled:opacity-60 transition-colors duration-200';
  const selectBase = 'w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:bg-gray-50 disabled:opacity-60 transition-colors duration-200';

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl px-1 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Manage jobseeker and employer accounts in the system
                {stats.total > 0 && (
                  <span className="ml-2 text-gray-500">
                    ({stats.total} total users)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Icon name="refresh" className="h-4 w-4" />}
                onClick={fetchUsers}
                loading={loading}
                disabled={loading}
                aria-label="Refresh users list"
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Icon name="export" className="h-4 w-4" />}
                onClick={exportToCSV}
                disabled={loading || filteredUsers.length === 0}
                aria-label="Export users to CSV"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
        
        {/* Error/Success Alerts */}
        {error && (
          <Alert 
            type="error" 
            title="Error" 
            onClose={() => setError('')}
            autoDismiss={5000}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            type="success" 
            title="Success" 
            onClose={() => setSuccess('')}
            autoDismiss={3500}
          >
            {success}
          </Alert>
        )}
        
        {/* Status Tabs */}
        <div className="mb-6" role="tablist" aria-label="User status tabs">
          <div className="flex flex-wrap items-center gap-2">
            {statusStats.map((tab) => {
              const active = statusFilter === tab.key;
              
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium sm:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-all duration-200',
                    active
                      ? 'border-green-200 bg-green-50 text-green-800 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                  )}
                  aria-pressed={active}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`tabpanel-${tab.key}`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'inline-flex min-w-[1.5rem] sm:min-w-[2rem] justify-center rounded-full px-1.5 sm:px-2 py-0.5 text-xs font-bold transition-colors',
                        active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                      )}
                      aria-label={`${tab.count} users`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Main Content Card */}
        <Card className="overflow-hidden" padding={false}>
          {/* Filters Bar */}
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">User List</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{filteredUsers.length}</span> of{' '}
                    <span className="font-semibold">{totalUsers}</span> users
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Icon name="filter" className="h-4 w-4" />}
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                  >
                    {showFilters ? 'Hide' : 'Filters'}
                  </Button>
                </div>
              </div>
              
              {/* Main Search & Filters */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                {/* Search */}
                <div className="lg:col-span-5">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-3.5 text-gray-400">
                      <Icon name="search" className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <label htmlFor="userSearch" className="sr-only">
                      Search users
                    </label>
                    <input
                      id="userSearch"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className={inputBase}
                      placeholder="Search by name, email, company, Phinma ID..."
                      disabled={loading}
                      autoComplete="off"
                      aria-label="Search users"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-3.5 rounded-lg p-1 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                        aria-label="Clear search"
                      >
                        <Icon name="x" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Role Filter */}
                <div className="lg:col-span-2">
                  <label htmlFor="roleFilter" className="sr-only">
                    Filter by role
                  </label>
                  <select
                    id="roleFilter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className={selectBase}
                    disabled={loading}
                    aria-label="Filter by role"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="employer">Employer</option>
                    <option value="jobseeker">Jobseeker</option>
                  </select>
                </div>
                
                {/* Status Filter */}
                <div className="lg:col-span-2">
                  <label htmlFor="statusFilter" className="sr-only">
                    Filter by status
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={selectBase}
                    disabled={loading}
                    aria-label="Filter by status"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                
                {/* Sort */}
                <div className="lg:col-span-2">
                  <label htmlFor="sortFilter" className="sr-only">
                    Sort users
                  </label>
                  <select
                    id="sortFilter"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className={selectBase}
                    disabled={loading}
                    aria-label="Sort users"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name_asc">A to Z</option>
                    <option value="name_desc">Z to A</option>
                    <option value="last_login">Last Login</option>
                  </select>
                </div>
                
                {/* Clear Button */}
                <div className="lg:col-span-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={clearFilters}
                    disabled={loading}
                    aria-label="Clear all filters"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Additional Filters */}
              {showFilters && (
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3 pt-4 border-t border-gray-200">
                  <div>
                    <label htmlFor="verifiedFilter" className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Status
                    </label>
                    <select
                      id="verifiedFilter"
                      value={verifiedFilter}
                      onChange={(e) => setVerifiedFilter(e.target.value)}
                      className={selectBase}
                      disabled={loading}
                      aria-label="Filter by verification status"
                    >
                      <option value="all">All Verification</option>
                      <option value="verified">Verified Only</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 mb-2">
                      Items per page
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className={selectBase}
                      disabled={loading}
                      aria-label="Items per page"
                    >
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setShowFilters(false)}
                      aria-label="Apply filters"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Users Table/Cards */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-16 sm:py-20 text-center" role="status" aria-live="polite">
                <div 
                  className="mx-auto inline-block h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-3 border-gray-300 border-t-green-600" 
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm text-gray-600">Loading users...</p>
                <p className="mt-1 text-xs text-gray-500">Please wait while we fetch the data</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 sm:py-16 text-center">
                <div 
                  className="mx-auto mb-4 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gray-100 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Icon name="user" className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No users found</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {query || statusFilter !== 'all' || roleFilter !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'No users registered yet'}
                </p>
                {(query || statusFilter !== 'all' || roleFilter !== 'all') && (
                  <div className="mt-6">
                    <Button 
                      variant="primary" 
                      onClick={clearFilters}
                      aria-label="Clear all filters"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Selection Bar */}
                {selectedRowKeys.length > 0 && (
                  <div 
                    className="mb-4 rounded-xl bg-green-50 p-4 border border-green-200"
                    role="region"
                    aria-label="Bulk actions"
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white"
                          aria-hidden="true"
                        >
                          {selectedRowKeys.length}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-800">
                            {selectedRowKeys.length} user{selectedRowKeys.length > 1 ? 's' : ''} selected
                          </p>
                          <p className="text-xs text-green-700">
                            Choose an action below
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          leftIcon={<Icon name="check" className="h-4 w-4" />}
                          onClick={() => handleBulkAction('activate')}
                          loading={loading}
                          disabled={loading}
                          aria-label="Activate selected users"
                        >
                          Activate
                        </Button>
                        <Button
                          variant="neutral"
                          size="sm"
                          leftIcon={<Icon name="x" className="h-4 w-4" />}
                          onClick={() => handleBulkAction('deactivate')}
                          loading={loading}
                          disabled={loading}
                          aria-label="Deactivate selected users"
                        >
                          Deactivate
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          leftIcon={<Icon name="lock" className="h-4 w-4" />}
                          onClick={() => handleBulkAction('suspend')}
                          loading={loading}
                          disabled={loading}
                          aria-label="Suspend selected users"
                        >
                          Suspend
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<Icon name="trash" className="h-4 w-4" />}
                          onClick={() => handleBulkAction('delete')}
                          loading={loading}
                          disabled={loading}
                          aria-label="Delete selected users"
                        >
                          Delete
                        </Button>
                        <button
                          type="button"
                          onClick={() => setSelectedRowKeys([])}
                          className="text-sm text-gray-600 hover:text-gray-900 px-3"
                          aria-label="Clear selection"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Desktop Table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="w-12 px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={filteredUsers.length > 0 && selectedRowKeys.length === filteredUsers.length}
                            onChange={handleSelectAll}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                            aria-label={selectedRowKeys.length === filteredUsers.length ? 'Deselect all users' : 'Select all users'}
                          />
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredUsers.map((user) => {
                        const statusInfo = getStatusPill(user.status);
                        const roleInfo = getRolePill(user.role);
                        const isLoading = userActionLoading[user.key];
                        
                        return (
                          <tr 
                            key={user.key} 
                            className="hover:bg-gray-50 transition-colors duration-150"
                            aria-label={`User: ${user.name}, ${user.email}`}
                          >
                            {/* Checkbox */}
                            <td className="px-4 sm:px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedRowKeys.includes(user.key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRowKeys([...selectedRowKeys, user.key]);
                                  } else {
                                    setSelectedRowKeys(selectedRowKeys.filter(key => key !== user.key));
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                                aria-label={`Select ${user.name}`}
                                disabled={isLoading}
                              />
                            </td>
                            
                            {/* User Info */}
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  img={user.profileImage}
                                  name={user.name}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate font-medium text-gray-900">{user.name}</p>
                                    {user.isVerified && (
                                      <Badge 
                                        variant="success" 
                                        className="!py-0"
                                        icon={<Icon name="check" className="h-3 w-3" />}
                                        aria-label="Verified user"
                                      />
                                    )}
                                  </div>
                                  <p className="truncate text-sm text-gray-600">{user.email}</p>
                                  <div className="mt-1">
                                    {user.role === 'jobseeker' && user.studentId && (
                                      <p className="text-xs text-gray-500">
                                        Phinma AU ID: {user.studentId}
                                      </p>
                                    )}
                                    {user.role === 'employer' && user.companyName && (
                                      <p className="text-xs text-gray-500">
                                     Company Name: <span className="font-medium">{user.companyName}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Role */}
                            <td className="px-4 sm:px-6 py-4">
                              <Badge 
                                variant={roleInfo.variant}
                                icon={<Icon name={roleInfo.icon} className="h-3 w-3" />}
                                aria-label={roleInfo.ariaLabel}
                              >
                                {roleInfo.label}
                              </Badge>
                            </td>
                            
                            {/* Status */}
                            <td className="px-4 sm:px-6 py-4">
                              <Badge 
                                variant={statusInfo.variant}
                                icon={<Icon name={statusInfo.icon} className="h-3 w-3" />}
                                aria-label={statusInfo.ariaLabel}
                              >
                                {statusInfo.label}
                              </Badge>
                              <div className="mt-1 text-xs text-gray-500">
                                {user.isVerified ? 'Verified' : 'Not verified'}
                              </div>
                            </td>
                            
                            {/* Created Date */}
                            <td className="px-4 sm:px-6 py-4">
                              <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                            </td>
                            
                            {/* Last Login */}
                            <td className="px-4 sm:px-6 py-4">
                              <div className="text-sm text-gray-900">{formatDateTime(user.lastLogin)}</div>
                              {user.lastLogin && (
                                <div className="text-xs text-gray-500">
                                  {new Date(user.lastLogin).toLocaleDateString('en-PH', { weekday: 'short' })}
                                </div>
                              )}
                            </td>
                            
                            {/* Actions */}
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-2">
                                {/* View Details Button */}
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  leftIcon={<Icon name="eye" className="h-3.5 w-3.5" />}
                                  onClick={() => handleViewDetails(user.key)}
                                  disabled={isLoading}
                                  aria-label={`View details for ${user.name}`}
                                >
                                  <span className="sr-only">View</span>
                                </Button>
                                
                                {/* Actions Dropdown */}
                                <AccessibleDropdown
                                  trigger={
                                    <Button
                                      variant="secondary"
                                      size="xs"
                                      rightIcon={<Icon name="chevronDown" className="h-3.5 w-3.5" />}
                                      disabled={isLoading}
                                      aria-label={`More actions for ${user.name}`}
                                    >
                                      <span className="sr-only">Actions</span>
                                      <Icon name="moreVertical" className="h-3.5 w-3.5" />
                                    </Button>
                                  }
                                  align="right"
                                  width="w-48"
                                >
                                  <DropdownItem
                                    onClick={() => handleStatusUpdate(user.key, 'active')}
                                    icon={<Icon name="check" className="h-4 w-4 text-green-600" />}
                                    variant="success"
                                    disabled={user.status === 'active' || isLoading}
                                  >
                                    Activate
                                  </DropdownItem>
                                  <DropdownItem
                                    onClick={() => handleStatusUpdate(user.key, 'inactive')}
                                    icon={<Icon name="x" className="h-4 w-4 text-gray-600" />}
                                    disabled={user.status === 'inactive' || isLoading}
                                  >
                                    Deactivate
                                  </DropdownItem>
                                  <DropdownItem
                                    onClick={() => handleStatusUpdate(user.key, 'suspended')}
                                    icon={<Icon name="lock" className="h-4 w-4 text-amber-600" />}
                                    variant="warning"
                                    disabled={user.status === 'suspended' || isLoading}
                                  >
                                    Suspend
                                  </DropdownItem>
                                  <div className="border-t border-gray-200 my-1" role="separator" />
                                  <DropdownItem
                                    onClick={() => {
                                      setActionTarget({
                                        type: 'single',
                                        user,
                                        action: 'delete'
                                      });
                                    }}
                                    icon={<Icon name="trash" className="h-4 w-4" />}
                                    variant="danger"
                                    disabled={isLoading}
                                  >
                                    Delete User
                                  </DropdownItem>
                                </AccessibleDropdown>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Cards */}
                <div className="space-y-3 md:hidden">
                  {filteredUsers.map((user) => {
                    const statusInfo = getStatusPill(user.status);
                    const roleInfo = getRolePill(user.role);
                    const isLoading = userActionLoading[user.key];
                    
                    return (
                      <Card key={user.key} hover padding={false}>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar
                                img={user.profileImage}
                                name={user.name}
                                size={44}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-semibold text-gray-900">{user.name}</p>
                                  {user.isVerified && (
                                    <Badge 
                                      variant="success" 
                                      className="!py-0"
                                      icon={<Icon name="check" className="h-3 w-3" />}
                                    />
                                  )}
                                </div>
                                <p className="truncate text-sm text-gray-600">{user.email}</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <Badge 
                                    variant={roleInfo.variant} 
                                    className="text-xs"
                                    icon={<Icon name={roleInfo.icon} className="h-3 w-3" />}
                                  >
                                    {roleInfo.label}
                                  </Badge>
                                  <Badge 
                                    variant={statusInfo.variant} 
                                    className="text-xs"
                                    icon={<Icon name={statusInfo.icon} className="h-3 w-3" />}
                                  >
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedRowKeys.includes(user.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRowKeys([...selectedRowKeys, user.key]);
                                } else {
                                  setSelectedRowKeys(selectedRowKeys.filter(key => key !== user.key));
                                }
                              }}
                              className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-600 mt-1"
                              disabled={isLoading}
                              aria-label={`Select ${user.name}`}
                            />
                          </div>
                          
                          <div className="mt-3 rounded-xl bg-gray-50 p-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500">Created</p>
                                <p className="font-medium text-gray-800">{formatDate(user.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Last Activity</p>
                                <p className="font-medium text-gray-800">{formatDateTime(user.lastLogin)}</p>
                              </div>
                              {user.role === 'jobseeker' && user.studentId && (
                                <div className="col-span-2">
                                  <p className="text-gray-500">Phinma AU ID</p>
                                  <p className="font-medium text-gray-800">
                                    {user.studentId}
                                  </p>
                                </div>
                              )}
                              {user.role === 'employer' && user.companyName && (
                                <div className="col-span-2">
                                  <p className="text-gray-500">Company</p>
                                  <p className="font-medium text-gray-800">{user.companyName}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1"
                              leftIcon={<Icon name="eye" className="h-4 w-4" />}
                              onClick={() => handleViewDetails(user.key)}
                              disabled={isLoading}
                              aria-label={`View details for ${user.name}`}
                            >
                              View
                            </Button>
                            <Button
                              variant="neutral"
                              size="sm"
                              className="flex-1"
                              leftIcon={<Icon name="check" className="h-4 w-4" />}
                              onClick={() => handleStatusUpdate(user.key, 'active')}
                              loading={isLoading}
                              disabled={isLoading || user.status === 'active'}
                              aria-label={`Activate ${user.name}`}
                            >
                              Activate
                            </Button>
                            <Button
                              variant="neutral"
                              size="sm"
                              className="flex-1"
                              leftIcon={<Icon name="x" className="h-4 w-4" />}
                              onClick={() => handleStatusUpdate(user.key, 'inactive')}
                              loading={isLoading}
                              disabled={isLoading || user.status === 'inactive'}
                              aria-label={`Deactivate ${user.name}`}
                            >
                              Deactivate
                            </Button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              variant="warning"
                              size="sm"
                              className="flex-1"
                              leftIcon={<Icon name="lock" className="h-4 w-4" />}
                              onClick={() => handleStatusUpdate(user.key, 'suspended')}
                              loading={isLoading}
                              disabled={isLoading || user.status === 'suspended'}
                              aria-label={`Suspend ${user.name}`}
                            >
                              Suspend
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="flex-1"
                              leftIcon={<Icon name="trash" className="h-4 w-4" />}
                              onClick={() => {
                                setActionTarget({
                                  type: 'single',
                                  user,
                                  action: 'delete'
                                });
                              }}
                              disabled={isLoading}
                              aria-label={`Delete ${user.name}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Pagination */}
                {filteredUsers.length > 0 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Page <span className="font-semibold">{currentPage}</span> of{' '}
                      <span className="font-semibold">{Math.ceil(totalUsers / pageSize)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Icon name="chevronUp" className="h-4 w-4 rotate-90" />}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || loading}
                        aria-label="Previous page"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
                        {[...Array(Math.min(5, Math.ceil(totalUsers / pageSize))).keys()].map(i => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                'h-8 w-8 rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600',
                                currentPage === pageNum
                                  ? 'bg-green-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                              )}
                              aria-label={`Page ${pageNum}`}
                              aria-current={currentPage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        rightIcon={<Icon name="chevronDown" className="h-4 w-4 rotate-90" />}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage >= Math.ceil(totalUsers / pageSize) || loading}
                        aria-label="Next page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        open={!!actionTarget}
        title={
          actionTarget?.type === 'bulk'
            ? `Delete ${actionTarget.count} users?`
            : `Delete user ${actionTarget?.user?.name}?`
        }
        description={
          actionTarget?.type === 'bulk'
            ? `This will permanently delete ${actionTarget.count} selected users. This action cannot be undone.`
            : "This will mark the user as deleted (soft delete). The user's email will be modified to prevent re-registration."
        }
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
        size="md"
        onClose={() => setActionTarget(null)}
        onConfirm={() => {
          if (actionTarget?.type === 'bulk') {
            // Implement bulk delete
            handleBulkAction('delete');
          } else if (actionTarget?.type === 'single') {
            handleDeleteUser(actionTarget.user.key);
          }
          setActionTarget(null);
        }}
        confirmDisabled={userActionLoading[actionTarget?.user?.key] || loading}
      >
        <div className="space-y-4">
          <Alert type="warning" title="Warning">
            This action cannot be undone. Deleted users will be marked as deleted but can be restored within 30 days.
          </Alert>
          {actionTarget?.type === 'single' && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  img={actionTarget.user.profileImage}
                  name={actionTarget.user.name}
                />
                <div>
                  <p className="font-medium text-gray-900">{actionTarget.user.name}</p>
                  <p className="text-sm text-gray-600">{actionTarget.user.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={getRolePill(actionTarget.user.role).variant}>
                      {getRolePill(actionTarget.user.role).label}
                    </Badge>
                    <Badge variant={getStatusPill(actionTarget.user.status).variant}>
                      {getStatusPill(actionTarget.user.status).label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default UserManagement;