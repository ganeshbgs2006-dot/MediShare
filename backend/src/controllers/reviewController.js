import { reviewModel } from '../models/reviewModel.js';
import { bookingModel } from '../models/bookingModel.js';
import { notificationService } from '../services/notificationService.js';
import { auditLogModel } from '../models/auditLogModel.js';

export const reviewController = {
  /**
   * Submit a review for a completed (returned) booking
   */
  async createReview(req, res, next) {
    try {
      const reviewerId = req.user.id;
      const { bookingId, rating, comment } = req.body;

      if (!bookingId) {
        return res.status(400).json({ success: false, error: 'Booking ID is required.' });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be an integer between 1 and 5.' });
      }

      const booking = await bookingModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking record not found.' });
      }

      // Must be in returned status to submit a review!
      if (booking.status !== 'returned') {
        return res.status(400).json({
          success: false,
          error: `Reviews can only be submitted for completed loans with confirmed returns (current status: ${booking.status}).`
        });
      }

      // Reviewer must be a participant in the loan (seeker or owner)
      const isSeeker = booking.seeker_id === reviewerId;
      const isOwner = booking.owner_id === reviewerId;

      if (!isSeeker && !isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not a verified participant in this loan.'
        });
      }

      // Check if already reviewed
      const existing = await reviewModel.getByBooking(bookingId);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'You have already submitted a review for this completed loan.'
        });
      }

      const revieweeId = isSeeker ? booking.owner_id : booking.seeker_id;

      const review = await reviewModel.create({
        bookingId,
        reviewerId,
        revieweeId,
        equipmentId: booking.equipment_id,
        rating: Number(rating),
        comment
      });

      // Notify the recipient
      await notificationService.notifyReviewSubmitted({
        review,
        reviewerName: req.user.fullName || req.user.full_name || 'A community member',
        recipientId: revieweeId,
        equipmentName: booking.equipment_name
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your verified community review has been published.',
        review
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get public reviews and ratings breakdown for an equipment item
   */
  async getEquipmentReviews(req, res, next) {
    try {
      const { equipmentId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const reviews = await reviewModel.listByEquipment(equipmentId, {
        limit: Number(limit),
        offset
      });

      const summary = await reviewModel.getEquipmentRatingSummary(equipmentId);

      return res.status(200).json({
        success: true,
        reviews,
        summary
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Check if a specific booking has been reviewed
   */
  async getBookingReview(req, res, next) {
    try {
      const { bookingId } = req.params;
      const review = await reviewModel.getByBooking(bookingId);

      return res.status(200).json({
        success: true,
        hasReviewed: Boolean(review),
        review
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: list all reviews for moderation
   */
  async adminListReviews(req, res, next) {
    try {
      const { status = 'all', page = 1, limit = 20 } = req.query;
      const reviews = await reviewModel.listAllAdmin({ status, page, limit });
      const total = await reviewModel.countAllAdmin({ status });

      return res.status(200).json({
        success: true,
        reviews,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: update moderation status of a review
   */
  async adminModerateReview(req, res, next) {
    try {
      const { id } = req.params;
      const { moderationStatus, reason } = req.body;

      const valid = ['approved', 'flagged', 'hidden'];
      if (!valid.includes(moderationStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid moderation status. Must be one of: ${valid.join(', ')}`
        });
      }

      const target = await reviewModel.findById(id);
      if (!target) {
        return res.status(404).json({ success: false, error: 'Review not found.' });
      }

      const updated = await reviewModel.updateModeration(id, moderationStatus, reason || null);

      // Audit log entry
      await auditLogModel.create({
        adminId: req.user.id,
        action: 'REVIEW_MODERATED',
        entityType: 'review',
        entityId: id,
        oldValue: { moderation_status: target.moderation_status },
        newValue: { moderation_status: moderationStatus },
        reason: reason || `Review moderation updated to ${moderationStatus}`,
        ipAddress: req.ip
      });

      return res.status(200).json({
        success: true,
        message: `Review moderation status updated to ${moderationStatus}.`,
        review: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

export default reviewController;

