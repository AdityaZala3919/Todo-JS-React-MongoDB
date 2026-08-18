import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import styles from './Auth.module.css';

export default function Auth() {
  const { login, register, error, clearError } = useAuthStore();
  const [mode, setMode] = useState('login');

  const savedCreds = (() => {
    try {
      const saved = localStorage.getItem('taskflow_remembered_credentials');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [rememberMe, setRememberMe] = useState(Boolean(savedCreds));
  const [email, setEmail] = useState(savedCreds?.email || '');
  const [password, setPassword] = useState(savedCreds?.password || '');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const formEl = e.currentTarget;
    const emailVal = formEl.elements.email?.value ?? email;
    const passwordVal = formEl.elements.password?.value ?? password;
    const nameVal = formEl.elements.name?.value ?? name;

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(emailVal, passwordVal);
        if (rememberMe) {
          localStorage.setItem('taskflow_remembered_credentials', JSON.stringify({ email: emailVal, password: passwordVal }));
        } else {
          localStorage.removeItem('taskflow_remembered_credentials');
        }
      } else {
        await register(emailVal, passwordVal, nameVal);
        if (rememberMe) {
          localStorage.setItem('taskflow_remembered_credentials', JSON.stringify({ email: emailVal, password: passwordVal }));
        }
      }
    } catch {
      /* error handled by store */
    }
    setLoading(false);
  };

  const switchMode = () => {
    const nextMode = mode === 'login' ? 'register' : 'login';
    setMode(nextMode);
    clearError();
    if (nextMode === 'login' && savedCreds) {
      if (!email) setEmail(savedCreds.email);
      if (!password) setPassword(savedCreds.password);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.orbs}><div className={styles.orb1} /><div className={styles.orb2} /></div>
      <div className={styles.card}>
        <div className={styles.logoRow}><div className={styles.logoIcon}>T</div><span className={styles.logoText}>TaskFlow</span></div>
        <h1 className={styles.heading}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className={styles.sub}>{mode === 'login' ? 'Sign in to continue to your workspace' : 'Sign up to start managing your tasks'}</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} method="post" action="#" autoComplete="on" className={styles.form}>
          {mode === 'register' && (
            <input
              id="name"
              name="name"
              type="text"
              className="input"
              placeholder="Display name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            id="email"
            name="email"
            className="input"
            type="email"
            placeholder="Email address"
            autoComplete={mode === 'login' ? 'username' : 'email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className={styles.passwordWrap}>
            <input
              id="password"
              name="password"
              className={`input ${styles.passwordInput}`}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {mode === 'login' && (
            <label className={styles.rememberRow}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.rememberCheckbox}
              />
              <span>Remember credentials</span>
            </label>
          )}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className={styles.switch}>{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button className={styles.switchBtn} onClick={switchMode}>{mode === 'login' ? 'Sign up' : 'Sign in'}</button></p>
      </div>
    </div>
  );
}
