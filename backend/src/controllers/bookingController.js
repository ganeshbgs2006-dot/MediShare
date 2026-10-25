import { bookingModel } from '../models/bookingModel.js';
import { equipmentModel } from '../models/equipmentModel.js';
import { getPool } from '../config/db.js';

export const bookingController = {
  /**
   * Submit a new booking request with strict date-overlap concurrency checks
   */
  async createBooking(req, res, next) {
    const pool = getPool();
    let connection;

    try {
      const seekerId = req.user.id;
      const { equipmentId, startDate, endDate, seekerMessage } = req.body;

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
        const updated = await bookingModel.updateStatus(id, 'returned', { handoverNotes });
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

      return res.status(200).json({
        success: true,
        message: 'Booking has been cancelled.',
        booking: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

export default bookingController;
