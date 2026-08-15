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
              <label>Email Address</label>
              <input className="input" type="email" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className={styles.inputGroup}>
              <label>Display Name</label>
              <input className="input" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
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
            <div className={styles.inputGroup}>
              <label>Current Password</label>
              <input className="input" type="text" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
              <label>New Password</label>
              <input className="input" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Confirm New Password</label>
              <input className="input" type="text" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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
