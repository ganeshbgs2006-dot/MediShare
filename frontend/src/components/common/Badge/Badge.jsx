import React from 'react';
import styles from './Badge.module.css';

/**
 * Reusable Status & Category Badge
 */
export default function Badge({
  children,
  variant = 'neutral', // 'available' | 'borrowed' | 'inspection' | 'free' | 'rental' | 'donation' | 'pending' | 'approved' | 'danger' | 'neutral'
  size = 'md',        // 'sm' | 'md'
  dot = false,
  className = '',
  ...props
}) {
  const badgeClasses = [
    styles.badge,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
