import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert, Award, FileCheck, ExternalLink } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Trust & Safety Highlights Strip */}
      <div className={styles.trustStrip}>
        <div className={`container ${styles.trustGrid}`}>
          <div className={styles.trustItem}>
            <Award className={styles.trustIcon} size={22} />
            <div>
              <h4 className={styles.trustTitle}>Vetted Equipment Partners</h4>
              <p className={styles.trustDesc}>Every equipment owner undergoes administrative credential verification.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <FileCheck className={styles.trustIcon} size={22} />
            <div>
              <h4 className={styles.trustTitle}>Mandatory Checklists</h4>
              <p className={styles.trustDesc}>Dual-stage handover & return condition inspection with timestamped media.</p>
            </div>
          </div>
          <div className={styles.trustItem}>
            <ShieldAlert className={styles.trustIcon} size={22} />
            <div>
              <h4 className={styles.trustTitle}>Transparent Priority</h4>
              <p className={styles.trustDesc}>Equitable community allocation with waitlist tracking and zero profiteering.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className={`container ${styles.mainContent}`}>
        <div className={styles.footerGrid}>
          {/* Brand & Purpose */}
          <div className={styles.brandCol}>
            <div className={styles.brand}>
              <div className={styles.logoIcon}>
                <HeartPulse size={20} color="#ffffff" strokeWidth={2.5} />
              </div>
              <span className={styles.brandTitle}>MediShare</span>
            </div>
            <p className={styles.brandMission}>
              A community-driven healthcare equipment network connecting patient families with verified owners.
              Democratizing medical recovery through secure lending, donation, and non-commercial rentals.
            </p>
          </div>

          {/* Categories */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Equipment Categories</h4>
            <ul className={styles.linkList}>
              <li><Link to="/marketplace?category=mobility">Mobility Aids & Wheelchairs</Link></li>
              <li><Link to="/marketplace?category=respiratory">Respiratory & Oxygen Concentrators</Link></li>
              <li><Link to="/marketplace?category=beds">Hospital Beds & Pressure Relief</Link></li>
              <li><Link to="/marketplace?category=monitoring">Vital Signs & Cardiac Monitors</Link></li>
              <li><Link to="/marketplace?category=pediatric">Pediatric & Rehabilitation Tools</Link></li>
            </ul>
          </div>

          {/* Workflow & Safety */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Platform & Safety</h4>
            <ul className={styles.linkList}>
              <li><a href="/#how-it-works">How MediShare Works</a></li>
              <li><a href="/#safety">Inspection Guidelines</a></li>
              <li><a href="/#safety">Condition Evidence Standards</a></li>
              <li><a href="/#impact">Community Impact Metrics</a></li>
              <li><Link to="/disclaimer">Health & Safety Disclaimer</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div className={styles.linkCol}>
            <h4 className={styles.colTitle}>Access Portals</h4>
            <ul className={styles.linkList}>
              <li><Link to="/login">Seeker & Borrower Login</Link></li>
              <li><Link to="/register?role=owner">Partner / Owner Registration</Link></li>
              <li><Link to="/admin/login">Hospital & Admin Console</Link></li>
              <li><Link to="/help">Help & Contact Assistance</Link></li>
            </ul>
          </div>
        </div>

        {/* Important Health & Regulatory Disclaimer Box */}
        <div className={styles.disclaimerBox}>
          <strong>Regulatory & Safety Notice:</strong> MediShare is a community peer-to-peer equipment sharing coordination tool. Listings, condition checklists, and owner approvals do not constitute medical certification, professional biomedical safety endorsement, or formal healthcare device licensure. Users are strongly advised to inspect all devices prior to use and consult certified healthcare professionals regarding device clinical appropriateness. Sample equipment listings are shown for illustration.
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p>© {currentYear} MediShare Community Health Network. All rights reserved.</p>
          <div className={styles.bottomLinks}>
            <a href="#privacy">Privacy Policy</a>
            <span className={styles.dot}>•</span>
            <a href="#terms">Terms of Safe Sharing</a>
            <span className={styles.dot}>•</span>
            <a href="#security">Security & Media Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

