import React from 'react';
import styles from './Card.module.css';

/**
 * Reusable Card Component
 */
export default function Card({
  children,
  hoverable = false,
  bordered = true,
  className = '',
  onClick,
  ...props
}) {
  const cardClasses = [
    styles.card,
    bordered ? styles.bordered : '',
    hoverable ? styles.hoverable : '',
    onClick ? styles.clickable : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={`${styles.header} ${className}`} {...props}>{children}</div>;
}

export function CardBody({ children, className = '', ...props }) {
  return <div className={`${styles.body} ${className}`} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }) {
  return <div className={`${styles.footer} ${className}`} {...props}>{children}</div>;
}

