import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  MapPin,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button/Button';
import Card, { CardBody } from '../../components/common/Card/Card';
import styles from './Auth.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'owner' ? 'owner' : 'seeker';

  const { register, error: authError, clearError } = useAuth();

  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [serviceArea, setServiceArea] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setLocalError('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please retype carefully.');
      return;
    }
    if (role === 'owner' && !serviceArea.trim()) {
      setLocalError('Please specify your primary service area / neighborhood.');
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim() || null,
      role,
      organizationName: role === 'owner' ? (organizationName.trim() || fullName.trim()) : null,
      serviceArea: serviceArea.trim() || null
    });
    setIsSubmitting(false);

    if (result.success) {
      navigate('/marketplace', { replace: true });
    }
  };

  const displayError = localError || authError;

  return (
    <div className={styles.authPage}>
      <div className={`container ${styles.authContainer}`} style={{ maxWidth: '520px' }}>
        <Card className={styles.authCard}>
          <CardBody className={styles.authBody}>
            {/* Header */}
            <div className={styles.authHeader}>
              <Link to="/" className={styles.authLogo}>
                <div className={styles.logoIcon}>
                  <HeartPulse size={24} color="#ffffff" strokeWidth={2.5} />
                </div>
                <span className={styles.brandTitle}>MediShare</span>
              </Link>
              <h1 className={styles.authHeading}>Join the Network</h1>
              <p className={styles.authSubtitle}>
                Create your verified account to access local equipment loans or list medical equipment.
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className={styles.roleTabs} role="tablist" aria-label="Account Type">
              <button
                type="button"
                className={`${styles.roleTab} ${role === 'seeker' ? styles.activeRoleTab : ''}`}
                onClick={() => setRole('seeker')}
                role="tab"
                aria-selected={role === 'seeker'}
              >
                <User size={16} />
                <div>
                  <strong>Care Seeker</strong>
                  <small>Borrow or request items</small>
                </div>
              </button>
              <button
                type="button"
                className={`${styles.roleTab} ${role === 'owner' ? styles.activeRoleTab : ''}`}
                onClick={() => setRole('owner')}
                role="tab"
                aria-selected={role === 'owner'}
              >
                <ShieldCheck size={16} />
                <div>
                  <strong>Equipment Partner</strong>
                  <small>Share or donate devices</small>
                </div>
              </button>
            </div>

            {/* Error Alert */}
            {displayError && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircle size={18} className={styles.errorIcon} />
                <span>{displayError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="reg-fullname" className={styles.label}>
                  Full Name / Contact Person *
                </label>
                <div className={styles.inputWrap}>
                  <User size={18} className={styles.fieldIcon} aria-hidden="true" />
                  <input
                    id="reg-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className={styles.input}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-email" className={styles.label}>
                    Email Address *
                  </label>
                  <div className={styles.inputWrap}>
                    <Mail size={18} className={styles.fieldIcon} aria-hidden="true" />
                    <input
                      id="reg-email"
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
                  <label htmlFor="reg-phone" className={styles.label}>
                    Phone Number
                  </label>
                  <div className={styles.inputWrap}>
                    <Phone size={18} className={styles.fieldIcon} aria-hidden="true" />
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={styles.input}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Specific Fields */}
              {role === 'owner' && (
                <div className={styles.ownerFieldsBox}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="reg-org" className={styles.label}>
                      Organization / Clinic Name (Optional)
                    </label>
                    <div className={styles.inputWrap}>
                      <Building size={18} className={styles.fieldIcon} aria-hidden="true" />
                      <input
                        id="reg-org"
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="e.g. St. Jude Community Clinic / Private Donor"
                        className={styles.input}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="reg-service-area" className={styles.label}>
                      Primary Service Area / Neighborhood *
                    </label>
                    <div className={styles.inputWrap}>
                      <MapPin size={18} className={styles.fieldIcon} aria-hidden="true" />
                      <input
                        id="reg-service-area"
                        type="text"
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        placeholder="e.g. North Campus District, Metro"
                        required
                        className={styles.input}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password Fields */}
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-password" className={styles.label}>
                    Password *
                  </label>
                  <div className={styles.inputWrap}>
                    <Lock size={18} className={styles.fieldIcon} aria-hidden="true" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className={styles.input}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-confirm" className={styles.label}>
                    Confirm Password *
                  </label>
                  <div className={styles.inputWrap}>
                    <Lock size={18} className={styles.fieldIcon} aria-hidden="true" />
                    <input
                      id="reg-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
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
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                rightIcon={<ArrowRight size={18} />}
              >
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </Button>
            </form>

            {/* Login Link */}
            <div className={styles.authFooter}>
              <span>Already have an account? </span>
              <Link to="/login" className={styles.footerLink}>
                Sign In
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
