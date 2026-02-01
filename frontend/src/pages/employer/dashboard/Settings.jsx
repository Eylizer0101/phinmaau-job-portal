// src/pages/employer/dashboard/Settings.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faUser,
  faBell,
  faShieldAlt,
  faSave,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faTimes,
  faKey,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import EmployerLayout from '../../../layouts/EmployerLayout';
import api from "../../services/api";

/** ---------- Small UI helpers ---------- */
const cx = (...classes) => classes.filter(Boolean).join(' ');

const FocusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2';

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    </div>
    <div className="px-6 pb-6">{children}</div>
  </div>
);

const Alert = ({ type = 'success', children }) => {
  const styles =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-red-50 border-red-200 text-red-800';

  const icon = type === 'success' ? faCheckCircle : faTimes;

  return (
    <div className={cx('border px-4 py-3 rounded-xl mb-6', styles)} role="status" aria-live="polite">
      <div className="flex items-start gap-2">
        <FontAwesomeIcon icon={icon} className="mt-0.5" aria-hidden="true" />
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, icon, required, helper, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {icon && <FontAwesomeIcon icon={icon} className="mr-2" aria-hidden="true" />}
      {label} {required ? <span className="text-red-600">*</span> : null}
    </label>
    {children}
    {helper ? <p className="text-xs text-gray-500 mt-1">{helper}</p> : null}
    {error ? <p className="text-sm text-red-600 mt-1">{error}</p> : null}
  </div>
);

const PrimaryButton = ({ children, loading, disabled, onClick, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={cx(
      'px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:hover:bg-green-600 flex items-center gap-2',
      FocusRing
    )}
  >
    {loading ? (
      <>
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        <span>Saving...</span>
      </>
    ) : (
      children
    )}
  </button>
);

const GhostButton = ({ children, onClick, className, type = 'button', disabled = false }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    aria-disabled={disabled}
    className={cx(
      'px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:hover:bg-gray-100 disabled:cursor-not-allowed',
      FocusRing,
      className
    )}
  >
    {children}
  </button>
);

const Settings = () => {
  const [activeSection, setActiveSection] = useState('account');

  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });

  const defaultNotifications = useMemo(
    () => ({
      emailNotifications: true,
      jobAlerts: true,
      applicationUpdates: true,
      marketingEmails: false
    }),
    []
  );

  const [notificationData, setNotificationData] = useState(defaultNotifications);

  // snapshots for "dirty" state
  const [initialUserData, setInitialUserData] = useState(null);
  const [initialNotifications, setInitialNotifications] = useState(null);

  const fullName = useMemo(() => {
    const f = (userData.firstName || '').trim();
    const l = (userData.lastName || '').trim();
    return [f, l].filter(Boolean).join(' ');
  }, [userData.firstName, userData.lastName]);

  const [accountData, setAccountData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState({
    account: false,
    password: false,
    notifications: false
  });

  // errors / success by section
  const [errors, setErrors] = useState({
    general: '',
    account: '',
    password: {},
    notifications: ''
  });

  const [success, setSuccess] = useState({
    account: '',
    password: '',
    notifications: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Security display data (optional)
  const [securityInfo, setSecurityInfo] = useState({
    lastLoginAt: null,
    lastLoginIp: null,
    accountCreatedAt: null,
    lastProfileUpdateAt: null,
    passwordLastChangedAt: null
  });

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line
  }, []);

  const clearSectionMessages = (sectionKey) => {
    setSuccess((prev) => ({ ...prev, [sectionKey]: '' }));
    setErrors((prev) => ({
      ...prev,
      [sectionKey]: sectionKey === 'password' ? {} : ''
    }));
  };

  const validateAccount = () => {
    const f = (userData.firstName || '').trim();
    const l = (userData.lastName || '').trim();
    if (!f) return 'First name is required.';
    if (!l) return 'Last name is required.';
    return '';
  };

  const validatePassword = () => {
    const e = {};
    if (!accountData.currentPassword) e.currentPassword = 'Current password is required.';
    if (!accountData.newPassword) e.newPassword = 'New password is required.';
    else if (accountData.newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters.';

    if (!accountData.confirmPassword) e.confirmPassword = 'Confirm password is required.';
    else if (accountData.newPassword !== accountData.confirmPassword) e.confirmPassword = 'Passwords do not match.';

    if (
      accountData.currentPassword &&
      accountData.newPassword &&
      accountData.currentPassword === accountData.newPassword
    ) {
      e.newPassword = 'New password must be different from current password.';
    }

    return e;
  };

  const isAccountDirty = useMemo(() => {
    if (!initialUserData) return false;
    return (
      (userData.firstName || '').trim() !== (initialUserData.firstName || '').trim() ||
      (userData.lastName || '').trim() !== (initialUserData.lastName || '').trim()
    );
  }, [userData, initialUserData]);

  const isNotifDirty = useMemo(() => {
    // if backend doesn't provide initial, allow save
    if (!initialNotifications) return true;
    return Object.keys(defaultNotifications).some(
      (k) => notificationData[k] !== initialNotifications[k]
    );
  }, [notificationData, initialNotifications, defaultNotifications]);

  const fetchUserData = async () => {
    try {
      setErrors((prev) => ({ ...prev, general: '' }));
      const token = localStorage.getItem('token');
      if (!token) {
        setErrors((prev) => ({ ...prev, general: 'Session expired. Please log in again.' }));
        return;
      }

      const response = await api.get('/auth/me');

      if (response.data.success) {
        const user = response.data.user;

        const nextUserData = {
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        };
        setUserData(nextUserData);
        setInitialUserData(nextUserData);

        // notification prefs
        const mergedNotif = {
          ...defaultNotifications,
          ...(user.notifications || {})
        };
        setNotificationData(mergedNotif);
        setInitialNotifications(mergedNotif);

        // security info
        setSecurityInfo({
          lastLoginAt: user.lastLoginAt || null,
          lastLoginIp: user.lastLoginIp || null,
          accountCreatedAt: user.createdAt || null,
          lastProfileUpdateAt: user.updatedAt || null,
          passwordLastChangedAt: user.passwordChangedAt || null
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (err.response?.status === 401) {
        setErrors((prev) => ({ ...prev, general: 'Session expired. Please log in again.' }));
        return;
      }
      setErrors((prev) => ({ ...prev, general: 'Error loading user data.' }));
    }
  };

  const handleAccountChange = (e) => {
    clearSectionMessages('account');
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    clearSectionMessages('password');
    const { name, value } = e.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (name) => {
    clearSectionMessages('notifications');
    setNotificationData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const saveAccountInfo = async () => {
    const msg = validateAccount();
    if (msg) {
      setErrors((prev) => ({ ...prev, account: msg }));
      return;
    }

    if (!isAccountDirty) return;

    setSaving((prev) => ({ ...prev, account: true }));
    setErrors((prev) => ({ ...prev, account: '' }));
    setSuccess((prev) => ({ ...prev, account: '' }));

    try {
      const payload = {
        firstName: (userData.firstName || '').trim(),
        lastName: (userData.lastName || '').trim(),
        fullName
      };

      const response = await api.put('/auth/update-profile', payload);

      if (response.data.success) {
        setSuccess((prev) => ({ ...prev, account: 'Account information updated.' }));

        // refresh snapshots so Save disables
        const nextUserData = {
          ...userData,
          firstName: (userData.firstName || '').trim(),
          lastName: (userData.lastName || '').trim()
        };
        setInitialUserData({
          email: nextUserData.email,
          firstName: nextUserData.firstName,
          lastName: nextUserData.lastName
        });

        // optional: update local user cache
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        stored.fullName = fullName;
        stored.firstName = nextUserData.firstName;
        stored.lastName = nextUserData.lastName;
        localStorage.setItem('user', JSON.stringify(stored));
      }
    } catch (err) {
      console.error('Error updating account:', err);
      setErrors((prev) => ({ ...prev, account: err.response?.data?.message || 'Error updating account.' }));
    } finally {
      setSaving((prev) => ({ ...prev, account: false }));
    }
  };

  const changePassword = async () => {
    const passwordErrors = validatePassword();
    if (Object.keys(passwordErrors).length > 0) {
      setErrors((prev) => ({ ...prev, password: passwordErrors }));
      return;
    }

    setSaving((prev) => ({ ...prev, password: true }));
    setErrors((prev) => ({ ...prev, password: {} }));
    setSuccess((prev) => ({ ...prev, password: '' }));

    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: accountData.currentPassword,
        newPassword: accountData.newPassword
      });

      if (response.data.success) {
        setSuccess((prev) => ({ ...prev, password: 'Password changed successfully.' }));
        setAccountData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setErrors((prev) => ({
        ...prev,
        password: { general: err.response?.data?.message || 'Error changing password.' }
      }));
    } finally {
      setSaving((prev) => ({ ...prev, password: false }));
    }
  };

  const saveNotificationPreferences = async () => {
    if (!isNotifDirty) return;

    setSaving((prev) => ({ ...prev, notifications: true }));
    setErrors((prev) => ({ ...prev, notifications: '' }));
    setSuccess((prev) => ({ ...prev, notifications: '' }));

    try {
      const response = await api.put('/auth/update-notifications', notificationData);

      if (response.data.success) {
        setSuccess((prev) => ({ ...prev, notifications: 'Notification preferences updated.' }));
        // refresh snapshot
        setInitialNotifications({ ...notificationData });
      }
    } catch (err) {
      console.error('Error updating notifications:', err);
      setErrors((prev) => ({
        ...prev,
        notifications: err.response?.data?.message || 'Error updating preferences.'
      }));
    } finally {
      setSaving((prev) => ({ ...prev, notifications: false }));
    }
  };

  const formatDate = (d) => {
    if (!d) return 'Not available';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return 'Not available';
    return dt.toLocaleString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // a11y: basic per-field invalid state from account error string
  const firstNameInvalid = errors.account?.toLowerCase().includes('first name');
  const lastNameInvalid = errors.account?.toLowerCase().includes('last name');

  return (
    <EmployerLayout>
      <div className="mx-auto max-w-7xl px-1 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left mini nav */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
              <nav className="space-y-2" aria-label="Settings sections">
                {[
                  { key: 'account', label: 'Account Information', icon: faUser },
                  { key: 'password', label: 'Change Password', icon: faLock },
                  { key: 'notifications', label: 'Notifications', icon: faBell },
                  { key: 'security', label: 'Security', icon: faShieldAlt }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.key);
                    }}
                    className={cx(
                      'flex items-center w-full px-4 py-3 rounded-xl text-left transition-colors border',
                      FocusRing,
                      activeSection === item.key
                        ? 'bg-green-50 text-green-800 border-green-100'
                        : 'text-gray-700 hover:bg-gray-50 border-transparent'
                    )}
                    aria-current={activeSection === item.key ? 'page' : undefined}
                  >
                    <FontAwesomeIcon icon={item.icon} className="mr-3 w-5 h-5" aria-hidden="true" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right content */}
          <div className="lg:col-span-3">
            {/* Global only (load/session errors) */}
            {errors.general && <Alert type="error">{errors.general}</Alert>}

            {/* ACCOUNT */}
            {activeSection === 'account' && (
              <SectionCard title="Account Information">
                {/* Section messages */}
                {success.account && <Alert type="success">{success.account}</Alert>}
                {errors.account && <Alert type="error">{errors.account}</Alert>}

                <div className="space-y-6 max-w-3xl">
                  <Field label="Full Name" icon={faUser} helper="Auto-generated from first and last name.">
                    <input
                      type="text"
                      value={fullName}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                    />
                  </Field>

                  <Field label="Email Address" icon={faEnvelope} helper="Email cannot be changed.">
                    <input
                      type="email"
                      value={userData.email}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                    />
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="First Name" required>
                      <input
                        type="text"
                        name="firstName"
                        value={userData.firstName}
                        onChange={handleAccountChange}
                        className={cx(
                          'w-full px-4 py-2 border rounded-xl',
                          firstNameInvalid ? 'border-red-400' : 'border-gray-300',
                          'focus:border-green-600 focus:ring-2 focus:ring-green-600',
                          FocusRing
                        )}
                        aria-invalid={Boolean(firstNameInvalid)}
                        required
                        autoComplete="given-name"
                      />
                    </Field>

                    <Field label="Last Name" required>
                      <input
                        type="text"
                        name="lastName"
                        value={userData.lastName}
                        onChange={handleAccountChange}
                        className={cx(
                          'w-full px-4 py-2 border rounded-xl',
                          lastNameInvalid ? 'border-red-400' : 'border-gray-300',
                          'focus:border-green-600 focus:ring-2 focus:ring-green-600',
                          FocusRing
                        )}
                        aria-invalid={Boolean(lastNameInvalid)}
                        required
                        autoComplete="family-name"
                      />
                    </Field>
                  </div>

                  {/* Dirty hint */}
                  {isAccountDirty && <p className="text-xs text-gray-500">You have unsaved changes.</p>}

                  {/* Action bar */}
                  <div className="pt-4 flex justify-end">
                    <PrimaryButton
                      onClick={saveAccountInfo}
                      loading={saving.account}
                      disabled={!isAccountDirty}
                    >
                      <FontAwesomeIcon icon={faSave} aria-hidden="true" />
                      <span>Save Changes</span>
                    </PrimaryButton>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* PASSWORD */}
            {activeSection === 'password' && (
              <SectionCard title="Change Password">
                {/* Section messages */}
                {success.password && <Alert type="success">{success.password}</Alert>}
                {errors.password?.general && <Alert type="error">{errors.password.general}</Alert>}

                <div className="space-y-6 max-w-3xl">
                  <Field
                    label="Current Password"
                    icon={faKey}
                    required
                    error={errors.password?.currentPassword}
                  >
                    <div className="relative">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={accountData.currentPassword}
                        onChange={handlePasswordChange}
                        className={cx(
                          'w-full px-4 py-2 border border-gray-300 rounded-xl pr-12',
                          'focus:border-green-600 focus:ring-2 focus:ring-green-600',
                          FocusRing
                        )}
                        required
                        autoComplete="current-password"
                        aria-invalid={Boolean(errors.password?.currentPassword)}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className={cx(
                          'absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 rounded-lg px-2 py-1',
                          FocusRing
                        )}
                        aria-label={showPassword.current ? 'Hide current password' : 'Show current password'}
                        aria-pressed={showPassword.current}
                      >
                        <FontAwesomeIcon icon={showPassword.current ? faEyeSlash : faEye} aria-hidden="true" />
                      </button>
                    </div>
                  </Field>

                  <Field
                    label="New Password"
                    icon={faLock}
                    required
                    helper="At least 8 characters. Must be different from current password."
                    error={errors.password?.newPassword}
                  >
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        name="newPassword"
                        value={accountData.newPassword}
                        onChange={handlePasswordChange}
                        className={cx(
                          'w-full px-4 py-2 border border-gray-300 rounded-xl pr-12',
                          'focus:border-green-600 focus:ring-2 focus:ring-green-600',
                          FocusRing
                        )}
                        required
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.password?.newPassword)}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className={cx(
                          'absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 rounded-lg px-2 py-1',
                          FocusRing
                        )}
                        aria-label={showPassword.new ? 'Hide new password' : 'Show new password'}
                        aria-pressed={showPassword.new}
                      >
                        <FontAwesomeIcon icon={showPassword.new ? faEyeSlash : faEye} aria-hidden="true" />
                      </button>
                    </div>
                  </Field>

                  <Field
                    label="Confirm New Password"
                    icon={faLock}
                    required
                    error={errors.password?.confirmPassword}
                  >
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={accountData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={cx(
                          'w-full px-4 py-2 border border-gray-300 rounded-xl pr-12',
                          'focus:border-green-600 focus:ring-2 focus:ring-green-600',
                          FocusRing
                        )}
                        required
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.password?.confirmPassword)}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className={cx(
                          'absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 rounded-lg px-2 py-1',
                          FocusRing
                        )}
                        aria-label={showPassword.confirm ? 'Hide confirm password' : 'Show confirm password'}
                        aria-pressed={showPassword.confirm}
                      >
                        <FontAwesomeIcon icon={showPassword.confirm ? faEyeSlash : faEye} aria-hidden="true" />
                      </button>
                    </div>
                  </Field>

                  <div className="pt-4 flex justify-end">
                    <PrimaryButton onClick={changePassword} loading={saving.password}>
                      <FontAwesomeIcon icon={faKey} aria-hidden="true" />
                      <span>Change Password</span>
                    </PrimaryButton>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === 'notifications' && (
              <SectionCard title="Notification Preferences">
                {/* Section messages */}
                {success.notifications && <Alert type="success">{success.notifications}</Alert>}
                {errors.notifications && <Alert type="error">{errors.notifications}</Alert>}

                <div className="space-y-2 max-w-3xl">
                  {[
                    {
                      key: 'emailNotifications',
                      title: 'Email Notifications',
                      desc: 'Receive email updates about your account'
                    },
                    {
                      key: 'jobAlerts',
                      title: 'Job Alerts',
                      desc: 'Get notified about new applications'
                    },
                    {
                      key: 'applicationUpdates',
                      title: 'Application Updates',
                      desc: 'Updates on submitted applications'
                    },
                    {
                      key: 'marketingEmails',
                      title: 'Marketing Emails',
                      desc: 'Promotions, offers, and newsletters'
                    }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div className="pr-6">
                        <h3 className="font-medium text-gray-800">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>

                      {/* Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(notificationData[item.key])}
                          onChange={() => handleNotificationChange(item.key)}
                          className="sr-only peer"
                          aria-label={item.title}
                        />
                        <div
                          className={cx(
                            'relative w-11 h-6 bg-gray-200 rounded-full',
                            "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
                            'after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all',
                            'peer-checked:bg-green-600 peer-checked:after:translate-x-full',
                            'peer-focus-visible:ring-2 peer-focus-visible:ring-green-600 peer-focus-visible:ring-offset-2'
                          )}
                        />
                      </label>
                    </div>
                  ))}

                  {isNotifDirty && <p className="text-xs text-gray-500 mt-4">You have unsaved changes.</p>}

                  <div className="pt-6 flex justify-end">
                    <PrimaryButton
                      onClick={saveNotificationPreferences}
                      loading={saving.notifications}
                      disabled={!isNotifDirty}
                    >
                      <FontAwesomeIcon icon={faSave} aria-hidden="true" />
                      <span>Save Preferences</span>
                    </PrimaryButton>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* SECURITY */}
            {activeSection === 'security' && (
              <SectionCard title="Security Settings">
                <div className="space-y-4 max-w-3xl">
                  <div className="border border-gray-100 rounded-2xl p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Recent Login Activity</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Last login: <span className="text-gray-800">{formatDate(securityInfo.lastLoginAt)}</span>
                      </p>
                      <p>
                        IP Address: <span className="text-gray-800">{securityInfo.lastLoginIp || 'Not available'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Account Activity</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Account Created</span>
                        <span className="text-gray-800">{formatDate(securityInfo.accountCreatedAt)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Last Profile Update</span>
                        <span className="text-gray-800">{formatDate(securityInfo.lastProfileUpdateAt)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Password Last Changed</span>
                        <span className="text-gray-800">{formatDate(securityInfo.passwordLastChangedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Active Sessions</h3>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-800">Current Session</p>
                        <p className="text-gray-600">Chrome • Windows • Current</p>
                      </div>
                      <button
                        type="button"
                        disabled
                        className={cx('text-red-600/50 text-sm cursor-not-allowed', FocusRing)}
                        aria-disabled="true"
                        title="Coming soon"
                      >
                        Logout Other Sessions (Coming soon)
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 mb-3">Add an extra layer of security to your account.</p>
                    <GhostButton disabled>Enable 2FA (Coming soon)</GhostButton>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
};

export default Settings;