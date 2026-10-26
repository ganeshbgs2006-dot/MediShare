import { bookingModel } from '../models/bookingModel.js';
import { equipmentModel } from '../models/equipmentModel.js';
import { userModel } from '../models/userModel.js';
import { conditionLogModel } from '../models/conditionLogModel.js';
import { notificationService } from '../services/notificationService.js';
import { waitlistModel } from '../models/waitlistModel.js';
import { getPool, query } from '../config/db.js';

export const bookingController = {
  /**
   * Submit a new booking request with strict date-overlap concurrency checks
   */
  async createBooking(req, res, next) {
    const pool = getPool();
    let connection;

    try {
      const seekerId = req.user.id;
      const userRole = req.user.role;
      const { equipmentId, startDate, endDate, seekerMessage } = req.body;

      // 0. Role enforcement: Only seekers and admins can submit equipment loan requests
      if (userRole !== 'seeker' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only registered borrowers/seekers can submit equipment loan requests. Partner accounts manage inventory and cannot book equipment.',
          code: 'SEEKER_ROLE_REQUIRED'
        });
      }

      // 1. Input validations
      if (!equipmentId) {
        return res.status(400).json({ success: false, error: 'Equipment ID is required.' });
      }
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Start date and end date are required.' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date format provided.' });
      }

      if (start < today) {
        return res.status(400).json({ success: false, error: 'Start date cannot be in the past.' });
      }

      if (end < start) {
        return res.status(400).json({ success: false, error: 'End date cannot be earlier than start date.' });
      }

      const durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (durationDays > 90) {
        return res.status(400).json({ success: false, error: 'Maximum loan duration is 90 days per request.' });
      }

      // 2. Equipment check
      const equipment = await equipmentModel.findById(equipmentId);
      if (!equipment) {
        return res.status(404).json({ success: false, error: 'Equipment not found in catalog.' });
      }

      if (equipment.owner_id === seekerId) {
        return res.status(400).json({ success: false, error: 'You cannot request a booking for your own equipment listing.' });
      }

      if (equipment.moderation_status !== 'approved') {
        return res.status(400).json({ success: false, error: 'This equipment is currently undergoing administrative moderation review.' });
      }

      if (equipment.availability_status === 'retired' || equipment.availability_status === 'maintenance') {
        return res.status(400).json({ success: false, error: `This equipment is currently marked as ${equipment.availability_status} and cannot be booked.` });
      }

      // 3. Concurrency-safe overlap check in a transaction
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const overlapCheck = await bookingModel.checkDateOverlap(equipmentId, startDate, endDate, null, connection);
      if (overlapCheck.hasOverlap) {
        await connection.rollback();
        const conflict = overlapCheck.conflicts[0];
        return res.status(409).json({
          success: false,
          error: `Equipment is already reserved from ${conflict.start_date.toISOString().split('T')[0]} to ${conflict.end_date.toISOString().split('T')[0]}. Please select alternate dates.`,
          code: 'BOOKING_CONFLICT'
        });
      }

      // 4. Calculate pricing & generate unique reference
      const totalPrice = Number((durationDays * Number(equipment.price_per_day || 0)).toFixed(2));
      const refSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const bookingReference = `BK-${Date.now().toString(36).toUpperCase()}-${refSuffix}`;

      // 5. Create booking inside transaction
      const newBooking = await bookingModel.create({
        equipmentId,
        seekerId,
        startDate,
        endDate,
        seekerMessage,
        totalPrice,
        bookingReference
      }, connection);

      await connection.commit();

      // Dispatch non-blocking in-app notification & optional email
      try {
        const owner = await userModel.findById(equipment.owner_id);
        const seeker = await userModel.findById(seekerId);
        await notificationService.notifyBookingCreated({
          booking: newBooking,
          seeker,
          owner,
          equipment
        });
      } catch (notifErr) {
        console.warn('[BOOKING] Notification dispatch error:', notifErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Booking request submitted successfully. The equipment partner will review your request.',
        booking: newBooking
      });
    } catch (err) {
      if (connection) await connection.rollback();
      next(err);
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Retrieve bookings made by logged-in seeker
   */
  async getMyBookings(req, res, next) {
    try {
      const seekerId = req.user.id;
      const { status, limit = 50, page = 1 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const bookings = await bookingModel.listBySeeker(seekerId, {
        status,
        limit: Number(limit),
        offset
      });

      return res.status(200).json({
        success: true,
        bookings,
        count: bookings.length
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Retrieve incoming requests for equipment owned by logged-in partner
   */
  async getOwnerBookings(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { status, limit = 50, page = 1 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const bookings = await bookingModel.listByOwner(ownerId, {
        status,
        limit: Number(limit),
        offset
      });

      return res.status(200).json({
        success: true,
        bookings,
        count: bookings.length
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get single booking details with authorization check
   */
  async getBookingById(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await bookingModel.findById(id);

      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking record not found.' });
      }

      // Authorization: seeker, owner, or admin
      const isSeeker = booking.seeker_id === req.user.id;
      const isOwner = booking.owner_id === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isSeeker && !isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not have permission to view this booking record.'
        });
      }

      return res.status(200).json({
        success: true,
        booking
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update booking status (Owner workflow: Accept, Reject, Handover, Return)
   */
  async updateStatus(req, res, next) {
    const pool = getPool();
    let connection;

    try {
      const { id } = req.params;
      const { status, reason, handoverNotes } = req.body;

      const validTransitions = ['approved', 'rejected', 'active_loan', 'returned'];
      if (!validTransitions.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Permitted owner transitions are: ${validTransitions.join(', ')}.`
        });
      }

      const booking = await bookingModel.findById(id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      // Check ownership or admin
      const isOwner = booking.owner_id === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only the equipment owner or platform administrator can update request status.'
        });
      }

      // Transition validation rules
      if (status === 'approved') {
        if (booking.status !== 'pending') {
          return res.status(400).json({
            success: false,
            error: `Cannot accept booking in '${booking.status}' status. Only 'pending' requests can be accepted.`
          });
        }

        // Concurrency check before approving!
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const overlapCheck = await bookingModel.checkDateOverlap(
          booking.equipment_id,
          booking.start_date,
          booking.end_date,
          booking.id,
          connection
        );

        if (overlapCheck.hasOverlap) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            error: 'Cannot accept request: Another confirmed booking already occupies an overlapping period for this equipment.',
            code: 'CONFIRMED_OVERLAP'
          });
        }

        const updated = await bookingModel.updateStatus(id, 'approved', { handoverNotes }, connection);
        await connection.commit();

        try {
          const seeker = await userModel.findById(booking.seeker_id);
          await notificationService.notifyBookingApproved({
            booking: updated,
            seeker,
            equipment: { name: booking.equipment_name }
          });
        } catch (e) {
          console.warn('[BOOKING] Notification error:', e.message);
        }

        return res.status(200).json({
          success: true,
          message: 'Booking request accepted and confirmed.',
          booking: updated
        });
      }

      if (status === 'rejected') {
        if (booking.status !== 'pending') {
          return res.status(400).json({
            success: false,
            error: `Cannot decline request in '${booking.status}' status.`
          });
        }
        const updated = await bookingModel.updateStatus(id, 'rejected', {
          rejectionReason: reason || 'Equipment unavailable for requested period.'
        });

        try {
          const seeker = await userModel.findById(booking.seeker_id);
          await notificationService.notifyBookingRejected({
            booking: updated,
            seeker,
            equipment: { name: booking.equipment_name },
            reason
          });
        } catch (e) {
          console.warn('[BOOKING] Notification error:', e.message);
        }

        return res.status(200).json({
          success: true,
          message: 'Booking request has been declined.',
          booking: updated
        });
      }

      if (status === 'active_loan') {
        if (booking.status !== 'approved') {
          return res.status(400).json({
            success: false,
            error: `Cannot activate loan from '${booking.status}' status. Request must be 'approved' first.`
          });
        }
        const updated = await bookingModel.updateStatus(id, 'active_loan', { handoverNotes });

        try {
          const seeker = await userModel.findById(booking.seeker_id);
          await notificationService.notifyBookingHandover({
            booking: updated,
            seeker,
            equipment: { name: booking.equipment_name }
          });
        } catch (e) {
          console.warn('[BOOKING] Notification error:', e.message);
        }

        return res.status(200).json({
          success: true,
          message: 'Equipment handover logged. Loan is now active.',
          booking: updated
        });
      }

      if (status === 'returned') {
        if (booking.status !== 'active_loan' && booking.status !== 'approved') {
          return res.status(400).json({
            success: false,
            error: `Cannot complete return for booking in '${booking.status}' status.`
          });
        }

        // STRICT MANDATORY RETURN VIDEO VERIFICATION:
        // BOTH seeker and owner return videos are required before final return closure!
        if (!isAdmin) {
          const missingSeeker = !booking.seeker_return_video_url;
          const missingOwner = !booking.owner_return_video_url;

          if (missingSeeker || missingOwner) {
            return res.status(400).json({
              success: false,
              error: 'Mandatory return condition video recordings from BOTH seeker and owner are required before return can be finalized.',
              code: 'RETURN_VIDEOS_REQUIRED',
              missingSeekerVideo: missingSeeker,
              missingOwnerVideo: missingOwner,
              seekerVideoSubmitted: Boolean(booking.seeker_return_video_url),
              ownerVideoSubmitted: Boolean(booking.owner_return_video_url)
            });
          }
        }

        const updated = await bookingModel.updateStatus(id, 'returned', { handoverNotes });

        try {
          const seeker = await userModel.findById(booking.seeker_id);
          const owner = await userModel.findById(booking.owner_id);
          await notificationService.notifyBookingReturned({
            booking: updated,
            seeker,
            owner,
            equipment: { id: booking.equipment_id, name: booking.equipment_name }
          });
          // Notify queued waitlist seekers that equipment has returned!
          await waitlistModel.notifyEligibleWaitlist(booking.equipment_id);
        } catch (e) {
          console.warn('[BOOKING] Notification/Waitlist error:', e.message);
        }

        return res.status(200).json({
          success: true,
          message: 'Equipment return verified and recorded. Booking completed.',
          booking: updated
        });
      }
    } catch (err) {
      if (connection) await connection.rollback();
      next(err);
    } finally {
      if (connection) connection.release();
    }
  },

  /**
   * Cancel booking (Seeker or Owner action)
   */
  async cancelBooking(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await bookingModel.findById(id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      const isSeeker = booking.seeker_id === req.user.id;
      const isOwner = booking.owner_id === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isSeeker && !isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not authorized to cancel this booking.'
        });
      }

      // Cancellation eligibility rules
      if (booking.status === 'returned' || booking.status === 'cancelled' || booking.status === 'rejected') {
        return res.status(400).json({
          success: false,
          error: `Cannot cancel a booking that is already '${booking.status}'.`
        });
      }

      if (booking.status === 'active_loan' && !isAdmin) {
        return res.status(400).json({
          success: false,
          error: 'Active equipment loans cannot be cancelled directly; they must be completed through the return inspection workflow.'
        });
      }

      const updated = await bookingModel.updateStatus(id, 'cancelled', {
        cancellationReason: reason || `Cancelled by ${isAdmin ? 'admin' : isSeeker ? 'seeker' : 'owner'}.`
      });

      try {
        const recipientId = isSeeker ? booking.owner_id : booking.seeker_id;
        await notificationService.notifyBookingCancelled({
          booking: updated,
          recipientId,
          cancelledByName: req.user.fullName || req.user.full_name || (isSeeker ? 'Care seeker' : 'Partner'),
          equipment: { name: booking.equipment_name },
          reason
        });
      } catch (e) {
        console.warn('[BOOKING] Cancellation notification error:', e.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Booking has been cancelled.',
        booking: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Submit return condition inspection video and notes (Seeker or Owner)
   */
  async submitReturnInspection(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { videoUrl, notes, conditionGrade = 'Good', isDisputed = false, disputeReason } = req.body;

      if (!videoUrl || !videoUrl.trim()) {
        return res.status(400).json({
          success: false,
          error: 'A recorded return condition video URL or file is required.'
        });
      }

      const validConditions = ['Good', 'Fair', 'Needs Inspection'];
      if (!validConditions.includes(conditionGrade)) {
        return res.status(400).json({
          success: false,
          error: `Invalid condition grade. Must be one of: ${validConditions.join(', ')}`
        });
      }

      if (isDisputed && (!disputeReason || !disputeReason.trim())) {
        return res.status(400).json({
          success: false,
          error: 'A dispute explanation is required when reporting an issue or damage.'
        });
      }

      const booking = await bookingModel.findById(id);
      if (!booking) {
        return res.status(404).json({ success: false, error: 'Booking not found.' });
      }

      const isSeeker = Number(booking.seeker_id) === Number(userId);
      const isOwner = Number(booking.owner_id) === Number(userId);
      const isAdmin = req.user.role === 'admin';

      if (!isSeeker && !isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You are not a party to this booking.'
        });
      }

      const userRole = isSeeker ? 'seeker' : 'owner';

      // Submit return inspection to booking
      const updatedBooking = await bookingModel.submitReturnInspection(id, {
        userRole,
        videoUrl: videoUrl.trim(),
        notes: notes ? notes.trim() : null,
        conditionGrade,
        isDisputed: Boolean(isDisputed),
        disputeReason: disputeReason ? disputeReason.trim() : null
      });

      // Insert condition log entry
      try {
        await conditionLogModel.create({
          bookingId: id,
          equipmentId: booking.equipment_id,
          loggedBy: userId,
          stage: 'return',
          conditionGrade,
          notes: notes ? notes.trim() : (isSeeker ? 'Seeker return verification' : 'Owner return verification'),
          verifiedBySeeker: isSeeker,
          verifiedByOwner: isOwner || isAdmin,
          isDisputed: Boolean(isDisputed),
          disputeReason: isDisputed ? disputeReason.trim() : null
        });
      } catch (logErr) {
        console.warn('[BOOKING] Condition log create error:', logErr.message);
      }

      // Record in equipment_media as return evidence
      try {
        await query(
          `INSERT INTO equipment_media (equipment_id, booking_id, media_type, file_url, caption, stage) VALUES (?, ?, 'video', ?, ?, 'return_evidence')`,
          [booking.equipment_id, id, videoUrl.trim(), `${isSeeker ? 'Seeker' : 'Owner'} Return Condition Video`]
        );
      } catch (mediaErr) {
        console.warn('[BOOKING] Equipment media insert error:', mediaErr.message);
      }

      // Notify the counterparty
      try {
        const counterpartyId = isSeeker ? booking.owner_id : booking.seeker_id;
        const senderName = req.user.fullName || req.user.full_name || (isSeeker ? 'Borrower' : 'Equipment Owner');
        await notificationService.notifyUser(counterpartyId, {
          type: isDisputed ? 'return_disputed' : 'return_video_submitted',
          title: isDisputed ? 'Condition Dispute Raised on Return' : 'Return Condition Video Submitted',
          message: `${senderName} has submitted return inspection evidence with condition rated "${conditionGrade}".${isDisputed ? ` Note: A dispute was flagged: "${disputeReason}".` : ''}`,
          relatedEntityType: 'booking',
          relatedEntityId: id
        });
      } catch (notifErr) {
        console.warn('[BOOKING] Return notification error:', notifErr.message);
      }

      return res.status(200).json({
        success: true,
        booking: updatedBooking,
        message: 'Return condition inspection video and verification submitted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};

export default bookingController;

