import { waitlistModel } from '../models/waitlistModel.js';
import { equipmentModel } from '../models/equipmentModel.js';

export const waitlistController = {
  /**
   * Join waitlist for unavailable equipment
   */
  async joinWaitlist(req, res, next) {
    try {
      const seekerId = req.user.id;
      const { equipmentId, requestedFrom, requestedTo, notes } = req.body;

      if (!equipmentId) {
        return res.status(400).json({ success: false, error: 'Equipment ID is required.' });
      }

      const item = await equipmentModel.findById(equipmentId);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Equipment record not found.' });
      }

      const result = await waitlistModel.join({
        equipmentId,
        seekerId,
        requestedFrom,
        requestedTo,
        notes
      });

      return res.status(200).json({
        success: true,
        message: result.alreadyWaitlisted
          ? 'You are already on the active waitlist for this equipment.'
          : 'You have been added to the priority equipment waitlist.',
        entry: result,
        queuePosition: result.queuePosition
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Leave waitlist by entry ID
   */
  async leaveWaitlist(req, res, next) {
    try {
      const seekerId = req.user.id;
      const { id } = req.params;

      const removed = await waitlistModel.leave(id, seekerId);
      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Waitlist record not found or does not belong to you.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'You have been removed from the equipment waitlist.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Leave waitlist by equipment ID
   */
  async leaveByEquipment(req, res, next) {
    try {
      const seekerId = req.user.id;
      const { equipmentId } = req.params;

      const removed = await waitlistModel.leaveByEquipment(equipmentId, seekerId);

      return res.status(200).json({
        success: true,
        message: removed
          ? 'You have left the waitlist for this equipment.'
          : 'No active waitlist entry found.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get active waitlist entries for logged-in seeker
   */
  async getMyWaitlist(req, res, next) {
    try {
      const seekerId = req.user.id;
      const entries = await waitlistModel.listBySeeker(seekerId);

      return res.status(200).json({
        success: true,
        waitlist: entries
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Check waitlist status for a specific equipment item
   */
  async getStatusForEquipment(req, res, next) {
    try {
      const { equipmentId } = req.params;
      const seekerId = req.user ? req.user.id : null;

      if (!seekerId) {
        const totalWaitlist = await waitlistModel.countActive(equipmentId);
        return res.status(200).json({
          success: true,
          isWaitlisted: false,
          totalWaitlist
        });
      }

      const status = await waitlistModel.getStatusForSeeker(equipmentId, seekerId);
      return res.status(200).json({
        success: true,
        ...status
      });
    } catch (err) {
      next(err);
    }
  }
};

export default waitlistController;

