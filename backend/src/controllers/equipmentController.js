import { equipmentModel } from '../models/equipmentModel.js';
import { bookingModel } from '../models/bookingModel.js';

export const equipmentController = {
  /**
   * Get all active & moderated equipment for marketplace
   */
  async listEquipment(req, res, next) {
    try {
      const { category, sharingType, availability, search, limit = 50, page = 1 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const items = await equipmentModel.list({
        category,
        sharingType,
        availability,
        search,
        moderationStatus: 'approved',
        limit: Number(limit),
        offset
      });

      const total = await equipmentModel.count({
        category,
        sharingType,
        search,
        moderationStatus: 'approved'
      });

      return res.status(200).json({
        success: true,
        equipment: items,
        total,
        page: Number(page),
        limit: Number(limit)
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get equipment details by ID
   */
  async getEquipmentById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await equipmentModel.findById(id);

      if (!item) {
        return res.status(404).json({ success: false, error: 'Equipment record not found.' });
      }

      return res.status(200).json({
        success: true,
        equipment: item
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Check equipment availability for requested dates
   */
  async checkAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Both startDate and endDate are required.' });
      }

      const overlapCheck = await bookingModel.checkDateOverlap(id, startDate, endDate);

      return res.status(200).json({
        success: true,
        available: !overlapCheck.hasOverlap,
        conflictsCount: overlapCheck.conflicts.length
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get equipment owned by logged-in partner
   */
  async getMyEquipment(req, res, next) {
    try {
      const ownerId = req.user.id;
      const items = await equipmentModel.listByOwner(ownerId);

      return res.status(200).json({
        success: true,
        equipment: items
      });
    } catch (err) {
      next(err);
    }
  }
};

export default equipmentController;
