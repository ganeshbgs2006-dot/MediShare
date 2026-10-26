import { env } from '../config/env.js';

/**
 * MediShare Email Notification Service Adapter
 * 
 * Provides an optional, decoupled notification delivery channel.
 * When SMTP credentials are not configured, gracefully falls back
 * to in-app delivery without throwing or interrupting business transactions.
 */

export const emailService = {
  /**
   * Check if external email delivery is configured and enabled
   */
  isEnabled() {
    return Boolean(
      process.env.EMAIL_ENABLED === 'true' &&
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    );
  },

  /**
   * Send a transactional notification email with safety fallbacks
   */
  async sendEmail({ to, subject, text, html = null }) {
    if (!to || !to.includes('@')) {
      return { success: false, error: 'Invalid recipient address' };
    }

    if (!this.isEnabled()) {
      if (env.isDev) {
        console.log(`[EMAIL ADAPTER (MOCK)] To: ${to} | Subject: "${subject}"`);
      }
      return {
        success: true,
        delivered: false,
        simulated: true,
        message: 'Email adapter is in simulation mode (credentials not configured).'
      };
    }

    try {
      // In production with credentials, dynamically load nodemailer if installed
      // Dynamic import prevents hard dependency failures when nodemailer is absent
      const nodemailer = await import('nodemailer').catch(() => null);
      if (!nodemailer) {
        console.warn('[EMAIL ADAPTER] nodemailer package is not installed; falling back to simulated mode.');
        return { success: true, simulated: true };
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'MediShare Platform <no-reply@medishare.org>',
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`
      });

      return { success: true, delivered: true, messageId: info.messageId };
    } catch (err) {
      console.error('[EMAIL ADAPTER] Delivery failure:', err.message);
      // Fail gracefully: email failure must never crash booking/inspection transactions
      return { success: false, error: err.message, delivered: false };
    }
  }
};

export default emailService;

