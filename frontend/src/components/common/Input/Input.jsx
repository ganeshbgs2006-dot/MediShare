import React, { forwardRef } from 'react';
import styles from './Input.module.css';

/**
 * Accessible Input Component
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    id,
    type = 'text',
    className = '',
    fullWidth = true,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={`${styles.inputContainer} ${error ? styles.hasError : ''}`}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`${styles.input} ${leftIcon ? styles.withLeftIcon : ''} ${
            rightIcon ? styles.withRightIcon : ''
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className={styles.errorMessage} role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className={styles.helperText}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;

