import { useState } from 'react';
import { Settings as SettingsIcon, Shield, Download, Upload, Trash2, Moon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { AuthService } from '../services/auth-service';
import { ExportService } from '../services/export-service';
import { toast } from '../components/UI/Toast';
import styles from './Settings.module.css';

export default function Settings() {
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setLoading(true);
    try {
      await AuthService.updateProfile(displayName);
      useAuthStore.setState({ user: AuthService.getCurrentUser() });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await AuthService.changePassword(oldPassword, newPassword);
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      ExportService.downloadExport();
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const result = ExportService.importUserData(evt.target.result);
      if (result.success) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.sections}>
        {/* Profile Card */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardHeader}>
            <SettingsIcon size={16} className={styles.icon} />
            <h2>Profile Details</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                name="email"
                className="input"
                type="email"
                autoComplete="email"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6 }}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="profile-name">Display Name</label>
              <input
                id="profile-name"
                name="name"
                className="input"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>Update Profile</button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardHeader}>
            <Shield size={16} className={styles.icon} />
            <h2>Security</h2>
          </div>
          <form onSubmit={handleChangePassword} className={styles.form}>
            {/* Hidden username field to help password managers identify the account */}
            <input
              type="text"
              name="username"
              value={user?.email || ''}
              autoComplete="username"
              style={{ display: 'none' }}
              readOnly
              tabIndex={-1}
            />
            <div className={styles.inputGroup}>
              <label htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                name="current-password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                name="new-password"
                className="input"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>Change Password</button>
          </form>
        </div>

        {/* Data Options */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardHeader}>
            <Download size={16} className={styles.icon} />
            <h2>Backup & Recovery</h2>
          </div>
          <div className={styles.actionBlock}>
            <p className={styles.blockDescription}>
              Export all your tasks, habits, stats, and tracked sessions to a JSON backup file.
            </p>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={14} /> Export Backup
            </button>
          </div>
          <div className={styles.actionBlock}>
            <p className={styles.blockDescription}>
              Restore settings and history from a previously exported TaskFlow JSON file.
            </p>
            <label className="btn btn-secondary" style={{ width: 'fit-content', cursor: 'pointer' }}>
              <Upload size={14} /> Import Backup
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div className={`glass ${styles.card}`}>
          <div className={styles.cardHeader}>
            <Moon size={16} className={styles.icon} />
            <h2>Appearance</h2>
          </div>
          <div className={styles.themeRow}>
            <span>Dark Theme</span>
            <div className={styles.themeBadge}>Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
