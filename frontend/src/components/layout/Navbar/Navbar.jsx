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
  Info
} from 'lucide-react';
import Button from '../../common/Button/Button';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Non-production sample data disclaimer banner */}
      <div className={styles.topNotice} role="region" aria-label="Demonstration Notice">
        <div className={styles.noticeContent}>
          <Info size={14} className={styles.noticeIcon} aria-hidden="true" />
          <span>MediShare Demo — Sample listings shown for demonstration.</span>
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
            </div>
          </div>
        )}
      </header>
    </>
  );
}
