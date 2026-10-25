import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HeartPulse,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button/Button';
import Card, { CardBody } from '../../components/common/Card/Card';
import styles from './Auth.module.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where to redirect after login (default to /marketplace or /)
  const from = location.state?.from?.pathname || '/marketplace';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleUseDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLocalError('');
    clearError();
  };

  const displayError = localError || authError;

  return (
    <div className={styles.authPage}>
      <div className={`container ${styles.authContainer}`}>
        <Card className={styles.authCard}>
          <CardBody className={styles.authBody}>
            {/* Header / Brand */}
            <div className={styles.authHeader}>
              <Link to="/" className={styles.authLogo}>
                <div className={styles.logoIcon}>
                  <HeartPulse size={24} color="#ffffff" strokeWidth={2.5} />
                </div>
                <span className={styles.brandTitle}>MediShare</span>
              </Link>
              <h1 className={styles.authHeading}>Welcome Back</h1>
              <p className={styles.authSubtitle}>
                Sign in to manage equipment loans, track verification, or coordinate returns.
              </p>
            </div>

            {/* Error Alert Banner */}
            {displayError && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircle size={18} className={styles.errorIcon} />
                <span>{displayError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="login-email" className={styles.label}>
                  Email Address
                </label>
                <div className={styles.inputWrap}>
                  <Mail size={18} className={styles.fieldIcon} aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    className={styles.input}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="login-password" className={styles.label}>
                    Password
                  </label>
                </div>
                <div className={styles.inputWrap}>
                  <Lock size={18} className={styles.fieldIcon} aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className={styles.input}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.togglePasswordBtn}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                rightIcon={<ArrowRight size={18} />}
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>

            {/* Quick Demo Accounts Helper */}
            <div className={styles.demoAccountsSection}>
              <div className={styles.demoHeader}>
                <Sparkles size={14} color="var(--teal-600)" />
                <span>Quick Test Accounts</span>
              </div>
              <div className={styles.demoButtonsRow}>
                <button
                  type="button"
                  className={styles.demoBtn}
                  onClick={() => handleUseDemoAccount('priya.seeker@example.com', 'Seeker@123')}
                  title="Care Seeker / Patient Family"
                >
                  <User size={12} /> Seeker
                </button>
                <button
                  type="button"
                  className={styles.demoBtn}
                  onClick={() => handleUseDemoAccount('partner@stjude.org', 'Partner@123')}
                  title="Care Partner / Clinic Owner"
                >
                  <ShieldCheck size={12} /> Partner
                </button>
                <button
                  type="button"
                  className={styles.demoBtn}
                  onClick={() => handleUseDemoAccount('admin@medishare.org', 'Admin@123')}
                  title="Platform Administrator"
                >
                  <ShieldCheck size={12} /> Admin
                </button>
              </div>
            </div>

            {/* Register Link */}
            <div className={styles.authFooter}>
              <span>Don't have an account yet? </span>
              <Link to="/register" className={styles.footerLink}>
                Create an Account
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
