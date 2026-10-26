import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HeartPulse,
  Menu,
  X,
  PlusCircle,
  Search,
  ShieldCheck,
  User,
  Info,
  LogOut,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../common/Button/Button';
import NotificationBell from '../../common/NotificationBell/NotificationBell';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Community Network Trust Bar */}
      <div className={styles.topNotice} role="region" aria-label="Platform Notice">
        <div className={styles.noticeContent}>
          <Info size={14} className={styles.noticeIcon} aria-hidden="true" />
          <span>MediShare — Community Medical Equipment & Assistive Devices Network</span>
        </div>
      </div>

      <header className={styles.header}>
        <div className={`container ${styles.navContainer}`}>
          {/* MediShare Brand Logo */}
          <Link to="/" className={styles.brand} onClick={closeMobileMenu}>
            <div className={styles.logoIcon}>
              <HeartPulse size={24} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>MediShare</span>
              <span className={styles.brandTagline}>Community Health Network</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className={styles.navLinks} aria-label="Main Navigation">
            <Link
              to="/marketplace"
              className={`${styles.navLink} ${location.pathname === '/marketplace' ? styles.active : ''}`}
            >
              <Search size={16} />
              <span>Browse Equipment</span>
            </Link>

            {/* Role-specific Quick Links */}
            {isAuthenticated && user?.role === 'seeker' && (
              <Link
                to="/my-bookings"
                className={`${styles.navLink} ${location.pathname === '/my-bookings' ? styles.active : ''}`}
              >
                <Calendar size={16} />
                <span>My Requests</span>
              </Link>
            )}

            {isAuthenticated && (user?.role === 'owner' || user?.role === 'admin') && (
              <>
                <Link
                  to="/owner/inventory"
                  className={`${styles.navLink} ${location.pathname.startsWith('/owner/inventory') ? styles.active : ''}`}
                >
                  <Layers size={16} />
                  <span>Inventory</span>
                </Link>
                <Link
                  to="/owner/bookings"
                  className={`${styles.navLink} ${location.pathname === '/owner/bookings' ? styles.active : ''}`}
                >
                  <Calendar size={16} />
                  <span>Loan Requests</span>
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`${styles.navLink} ${location.pathname === '/admin' ? styles.active : ''}`}
              >
                <ShieldCheck size={16} />
                <span>Admin Console</span>
              </Link>
            )}

            <a href="/#how-it-works" className={styles.navLink}>
              <span>How It Works</span>
            </a>
            <a href="/#safety" className={styles.navLink}>
              <ShieldCheck size={16} />
              <span>Safety & Inspection</span>
            </a>
            <a href="/#impact" className={styles.navLink}>
              <span>Community Impact</span>
            </a>
          </nav>

          {/* Desktop Call To Actions */}
          <div className={styles.actions}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NotificationBell />
                <div className={styles.userProfileStrip}>
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      <User size={14} />
                    </div>
                    <div className={styles.userMeta}>
                      <span className={styles.userName}>{user.fullName}</span>
                      <span className={styles.userRoleTag}>
                        {user.role}
                        {(user.approvalStatus === 'pending' || user.approval_status === 'pending') && ' (Pending)'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    leftIcon={<LogOut size={14} />}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/register?role=owner">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<PlusCircle size={16} />}
                  >
                    List Equipment
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<User size={16} />}
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className={styles.mobileToggle}
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className={styles.mobileDropdown}>
            <Link to="/marketplace" className={styles.mobileLink} onClick={closeMobileMenu}>
              <Search size={18} />
              <span>Browse Equipment</span>
            </Link>

            {isAuthenticated && user?.role === 'seeker' && (
              <Link to="/my-bookings" className={styles.mobileLink} onClick={closeMobileMenu}>
                <Calendar size={18} />
                <span>My Requests</span>
              </Link>
            )}

            {isAuthenticated && (user?.role === 'owner' || user?.role === 'admin') && (
              <>
                <Link to="/owner/inventory" className={styles.mobileLink} onClick={closeMobileMenu}>
                  <Layers size={18} />
                  <span>Equipment Inventory</span>
                </Link>
                <Link to="/owner/bookings" className={styles.mobileLink} onClick={closeMobileMenu}>
                  <Calendar size={18} />
                  <span>Loan Requests</span>
                </Link>
              </>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin" className={styles.mobileLink} onClick={closeMobileMenu}>
                <ShieldCheck size={18} />
                <span>Admin Console</span>
              </Link>
            )}

            <a href="/#how-it-works" className={styles.mobileLink} onClick={closeMobileMenu}>
              <span>How It Works</span>
            </a>
            <a href="/#safety" className={styles.mobileLink} onClick={closeMobileMenu}>
              <ShieldCheck size={18} />
              <span>Safety & Inspection</span>
            </a>
            <a href="/#impact" className={styles.mobileLink} onClick={closeMobileMenu}>
              <span>Community Impact</span>
            </a>

            <div className={styles.mobileActions}>
              {isAuthenticated ? (
                <>
                  <div className={styles.mobileUserBadge}>
                    <User size={16} />
                    <span>Signed in as <strong>{user.fullName}</strong> ({user.role})</span>
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    leftIcon={<LogOut size={16} />}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/register?role=owner" onClick={closeMobileMenu}>
                    <Button variant="outline" fullWidth leftIcon={<PlusCircle size={16} />}>
                      List Equipment
                    </Button>
                  </Link>
                  <Link to="/login" onClick={closeMobileMenu}>
                    <Button variant="primary" fullWidth leftIcon={<User size={16} />}>
                      Sign In / Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
