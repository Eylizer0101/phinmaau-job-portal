import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../../../services/api.js';

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2';

const LS_KEYS = {
  notif: 'settings_notif',
  privacy: 'settings_privacy',
};

const defaultNotif = {
  emailUpdates: true,
  smsUpdates: false,
  pushUpdates: true,
  marketing: false,
};

const defaultPrivacy = {
  profilePublic: true,
  showEmail: false,
  showLastLogin: true,
};

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? v : fallback;
  } catch {
    return fallback;
  }
}

function ToggleRow({ title, desc, value, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>

      <button
        type="button"
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          ${value ? 'bg-green-600' : 'bg-gray-200'}
          ${focusRing}
        `}
        onClick={() => !disabled && onChange(!value)}
        aria-pressed={value}
        aria-label={title}
        disabled={disabled}
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white shadow transition
            ${value ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = useMemo(
    () => [
      { key: 'account', label: 'Account' },
      { key: 'Change Password', label: 'Change Password' },
      { key: 'notifications', label: 'Notifications' },
      { key: 'privacy', label: 'Privacy' },
    ],
    []
  );

  // User info (read-only)
  const [userLoading, setUserLoading] = useState(false);
  const [me, setMe] = useState(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Notifications + Privacy settings (local)
  const [notif, setNotif] = useState(defaultNotif);
  const [privacy, setPrivacy] = useState(defaultPrivacy);
  const [localSaving, setLocalSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMe = useCallback(async () => {
    try {
      setUserLoading(true);
      const res = await api.get('/auth/me');
      if (res.data?.success) setMe(res.data.user);
    } catch (e) {
      console.error('Failed to fetch user:', e);
    } finally {
      setUserLoading(false);
    }
  }, []);

  // Load local settings once
  useEffect(() => {
    const n = safeParse(localStorage.getItem(LS_KEYS.notif), defaultNotif);
    const p = safeParse(localStorage.getItem(LS_KEYS.privacy), defaultPrivacy);
    setNotif(n);
    setPrivacy(p);
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return 'Please fill out all password fields.';
    }
    if (newPassword.length < 6) {
      return 'New password must be at least 6 characters long.';
    }
    if (newPassword !== confirmNewPassword) {
      return 'New password and confirm password do not match.';
    }
    if (newPassword === currentPassword) {
      return 'New password must be different from current password.';
    }
    return '';
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    clearAlerts();

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        setSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setError(res.data?.message || 'Failed to change password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  // Local save (notif/privacy) – looks “functional”
  const saveLocalSettings = async () => {
    clearAlerts();
    try {
      setLocalSaving(true);
      // mimic save delay (UX feel)
      await new Promise((r) => setTimeout(r, 350));

      localStorage.setItem(LS_KEYS.notif, JSON.stringify(notif));
      localStorage.setItem(LS_KEYS.privacy, JSON.stringify(privacy));

      setSuccess('Settings saved.');
    } catch (e) {
      setError('Failed to save settings.');
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 mt-9 ">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences and Change Password</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left nav */}
        <aside className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
            <div className="px-2 py-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Settings
              </p>
            </div>

            <div className="mt-2 space-y-1">
              {tabs.map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      clearAlerts();
                      setActiveTab(t.key);
                    }}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${focusRing}
                      ${active ? 'bg-green-50 text-green-800' : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content */}
        <section className="lg:col-span-9 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
              <p className="font-semibold">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700">
              <p className="font-semibold">Success</p>
              <p className="text-sm mt-1">{success}</p>
            </div>
          )}

          {/* ACCOUNT */}
          {activeTab === 'account' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                <p className="text-sm text-gray-500 mt-1">Basic details about your account</p>
              </div>

              <div className="p-6">
                {userLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {me?.fullName || '—'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {me?.email || '—'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500">Role</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {me?.role || '—'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500">Last Login</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {me?.lastLogin ? new Date(me.lastLogin).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Change Password */}
          {activeTab === 'Change Password' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your password and account Change Password
                </p>
              </div>

              <form className="p-6" onSubmit={handleChangePassword}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Current */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="mt-2 relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 ${focusRing}`}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 ${focusRing}`}
                      >
                        {showCurrent ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* New */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-2 relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 ${focusRing}`}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 ${focusRing}`}
                      >
                        {showNew ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Minimum 6 characters</p>
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="mt-2 relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 ${focusRing}`}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 ${focusRing}`}
                      >
                        {showConfirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      clearAlerts();
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className={`px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium ${focusRing}`}
                    disabled={saving}
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold ${focusRing} disabled:opacity-60`}
                    disabled={saving}
                  >
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  If you forgot your password, add a reset flow on the login page (email/OTP).
                </div>
              </form>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose which updates you want to receive
                </p>
              </div>

              <div className="p-6">
                <div className="divide-y divide-gray-100">
                  <ToggleRow
                    title="Email updates"
                    desc="Get important updates like application status and account alerts."
                    value={notif.emailUpdates}
                    onChange={(v) => setNotif((s) => ({ ...s, emailUpdates: v }))}
                  />
                  <ToggleRow
                    title="Push notifications"
                    desc="Receive notifications inside the app."
                    value={notif.pushUpdates}
                    onChange={(v) => setNotif((s) => ({ ...s, pushUpdates: v }))}
                  />
                  <ToggleRow
                    title="SMS updates"
                    desc="Get SMS for urgent account activity (if supported)."
                    value={notif.smsUpdates}
                    onChange={(v) => setNotif((s) => ({ ...s, smsUpdates: v }))}
                  />
                 
                </div>

                <div className="mt-6 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={saveLocalSettings}
                    className={`px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold ${focusRing} disabled:opacity-60`}
                    disabled={localSaving}
                  >
                    {localSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Note: currently saved locally. You can connect this to an API later.
                </p>
              </div>
            </div>
          )}

          {/* PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Control what information is visible to others
                </p>
              </div>

              <div className="p-6">
                <div className="divide-y divide-gray-100">
                  <ToggleRow
                    title="Public profile"
                    desc="Allow employers to view your profile when you apply."
                    value={privacy.profilePublic}
                    onChange={(v) => setPrivacy((s) => ({ ...s, profilePublic: v }))}
                  />
                  <ToggleRow
                    title="Show email"
                    desc="Display your email on your profile (not recommended)."
                    value={privacy.showEmail}
                    onChange={(v) => setPrivacy((s) => ({ ...s, showEmail: v }))}
                  />
                  <ToggleRow
                    title="Show last login"
                    desc="Allow the system to show your last login time in account info."
                    value={privacy.showLastLogin}
                    onChange={(v) => setPrivacy((s) => ({ ...s, showLastLogin: v }))}
                  />
                </div>

                <div className="mt-6 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={saveLocalSettings}
                    className={`px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold ${focusRing} disabled:opacity-60`}
                    disabled={localSaving}
                  >
                    {localSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Note: currently saved locally. Connect to backend anytime.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Settings;
