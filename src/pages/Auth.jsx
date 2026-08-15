import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import styles from './Auth.module.css';

export default function Auth() {
  const { login, register, error, clearError } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); clearError(); setLoading(true);
    try { mode === 'login' ? await login(email, password) : await register(email, password, name); } catch { /* error handled by store */ }
    setLoading(false);
  };

  const switchMode = () => { setMode(mode === 'login' ? 'register' : 'login'); clearError(); };

  return (
    <div className={styles.page}>
      <div className={styles.orbs}><div className={styles.orb1} /><div className={styles.orb2} /></div>
      <div className={styles.card}>
        <div className={styles.logoRow}><div className={styles.logoIcon}>T</div><span className={styles.logoText}>TaskFlow</span></div>
        <h1 className={styles.heading}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className={styles.sub}>{mode === 'login' ? 'Sign in to continue to your workspace' : 'Sign up to start managing your tasks'}</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'register' && <input className="input" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />}
          <input className="input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="text" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className={styles.switch}>{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button className={styles.switchBtn} onClick={switchMode}>{mode === 'login' ? 'Sign up' : 'Sign in'}</button></p>
      </div>
    </div>
  );
}
