import { notificationModel } from '../models/notificationModel.js';
import { emailService } from './emailService.js';

/**
 * MediShare Notification Service
 * Orchestrates event-driven in-app notifications and optional email dispatches.
 * All notification operations are safe and fail-soft.
 */

export const notificationService = {
  /**
   * New booking request submitted by seeker
   */
  async notifyBookingCreated({ booking, seeker, owner, equipment }) {
    try {
      // 1. Notify Owner / Equipment Partner
      await notificationModel.create({
        userId: owner.id,
        type: 'booking_request_received',
        title: 'New Equipment Booking Inquiry',
        message: `${seeker.fullName || seeker.full_name} has requested "${equipment.name}" from ${booking.start_date} to ${booking.end_date}.`,
        entityType: 'booking',
        entityId: booking.id
      });

      // Optional email to owner
      if (owner.email) {
        await emailService.sendEmail({
          to: owner.email,
          subject: `[MediShare] New Request for ${equipment.name}`,
          text: `Hello ${owner.fullName || owner.full_name},\n\nYou have received a new booking request for "${equipment.name}". Please log in to your partner queue to review the request.`
        });
      }

      // 2. Confirmation to Seeker
      await notificationModel.create({
        userId: seeker.id,
        type: 'booking_request_submitted',
        title: 'Booking Request Submitted',
        message: `Your booking inquiry for "${equipment.name}" (Ref: ${booking.booking_reference}) was sent to ${owner.fullName || owner.full_name}.`,
        entityType: 'booking',
        entityId: booking.id
      });
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyBookingCreated:', err.message);
    }
  },

  /**
   * Booking approved by owner
   */
  async notifyBookingApproved({ booking, seeker, equipment }) {
    try {
      await notificationModel.create({
        userId: seeker.id,
        type: 'booking_approved',
        title: 'Booking Request Confirmed!',
        message: `Your request for "${equipment.name}" (Ref: ${booking.booking_reference}) has been accepted. Check your bookings for pickup notes.`,
        entityType: 'booking',
        entityId: booking.id
      });

      if (seeker.email) {
        await emailService.sendEmail({
          to: seeker.email,
          subject: `[MediShare] Booking Accepted: ${equipment.name}`,
          text: `Great news! Your booking request for "${equipment.name}" has been accepted. Please review pickup instructions in your MediShare portal.`
        });
      }
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyBookingApproved:', err.message);
    }
  },

  /**
   * Booking declined by owner
   */
  async notifyBookingRejected({ booking, seeker, equipment, reason }) {
    try {
      await notificationModel.create({
        userId: seeker.id,
        type: 'booking_rejected',
        title: 'Booking Request Declined',
        message: `Your inquiry for "${equipment.name}" was declined. Reason: ${reason || 'Equipment unavailable on requested dates.'}`,
        entityType: 'booking',
        entityId: booking.id
      });
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyBookingRejected:', err.message);
    }
  },

  /**
   * Equipment handed over (loan started)
   */
  async notifyBookingHandover({ booking, seeker, equipment }) {
    try {
      await notificationModel.create({
        userId: seeker.id,
        type: 'booking_active_loan',
        title: 'Equipment Loan Active',
        message: `"${equipment.name}" has been marked handed over. Please inspect and handle the assistive device according to care guidelines.`,
        entityType: 'booking',
        entityId: booking.id
      });
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyBookingHandover:', err.message);
    }
  },

  /**
   * Equipment returned (loan completed)
   */
  async notifyBookingReturned({ booking, seeker, owner, equipment }) {
    try {
      // 1. Notify Seeker & invite review
      await notificationModel.create({
        userId: seeker.id,
        type: 'booking_returned',
        title: 'Loan Completed — Leave a Review',
        message: `Safe return of "${equipment.name}" confirmed. Share your experience by leaving a community review!`,
        entityType: 'booking',
        entityId: booking.id
      });

      // 2. Notify Owner
      await notificationModel.create({
        userId: owner.id,
        type: 'booking_returned_owner',
        title: 'Equipment Returned to Inventory',
        message: `"${equipment.name}" has been successfully returned and checked back into your catalog.`,
        entityType: 'equipment',
        entityId: equipment.id
      });
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyBookingReturned:', err.message);
    }
  },

  /**
   * Booking cancelled
   */
  async notifyBookingCancelled({ booking, recipientId, cancelledByName, equipment, reason }) {
    try {
      await notificationModel.create({
        userId: recipientId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Booking ${booking.booking_reference} for "${equipment.name}" was cancelled by ${cancelledByName}.${reason ? ' Reason: ' + reason : ''}`,
        entityType: 'booking',
        entityId: booking.id
      });
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyBookingCancelled:', err.message);
    }
  },

  /**
   * Equipment available for waitlisted seeker
   */
  async notifyWaitlistAvailable({ seekerId, equipment }) {
    try {
      await notificationModel.create({
        userId: seekerId,
        type: 'waitlist_available',
        title: 'Waitlist Update: Equipment Available!',
        message: `"${equipment.name}" is now available for reservation. Submit a booking request before availability changes.`,
        entityType: 'equipment',
        entityId: equipment.id
      });
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyWaitlistAvailable:', err.message);
    }
  },

  /**
   * Review submitted
   */
  async notifyReviewSubmitted({ review, reviewerName, recipientId, equipmentName }) {
    try {
      await notificationModel.create({
        userId: recipientId,
        type: 'review_received',
        title: 'New Community Review Received',
        message: `${reviewerName} gave a ${review.rating}-star review for "${equipmentName}".`,
        entityType: 'review',
        entityId: review.id
      });
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyReviewSubmitted:', err.message);
    }
  },

  /**
   * Disputed condition log recorded
   */
  async notifyDisputeRecorded({ bookingId, equipmentName, recipientId, reason }) {
    try {
      await notificationModel.create({
        userId: recipientId,
        type: 'dispute_recorded',
        title: 'Inspection Discrepancy Noted',
        message: `A disagreement was recorded during inspection for "${equipmentName}": "${reason}". An administrator will review.`,
        entityType: 'booking',
        entityId: bookingId
      });
    } catch (err) {
      console.error('[NOTIFICATION SERVICE] Error in notifyDisputeRecorded:', err.message);
    }
  }
};

export default notificationService;
