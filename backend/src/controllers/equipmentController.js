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
  },

  /**
   * Create a new medical equipment listing (requires approved owner)
   */
  async createEquipment(req, res, next) {
    try {
      const ownerId = req.user.id;
      const {
        name,
        category,
        description,
        conditionGrade = 'Good',
        conditionDetails,
        knownDamage,
        sharingType = 'free',
        pricePerDay = 0,
        serviceArea,
        imageUrl,
        videoUrl,
        gallery = []
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Equipment name is required.' });
      }
      if (!category || !category.trim()) {
        return res.status(400).json({ success: false, error: 'Equipment category is required.' });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ success: false, error: 'Detailed description is required.' });
      }
      if (!serviceArea || !serviceArea.trim()) {
        return res.status(400).json({ success: false, error: 'Service area / location is required.' });
      }

      const validSharingTypes = ['free', 'rental', 'donation'];
      if (!validSharingTypes.includes(sharingType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid sharingType. Must be one of: ${validSharingTypes.join(', ')}`
        });
      }

      if (sharingType === 'rental' && (!pricePerDay || Number(pricePerDay) <= 0)) {
        return res.status(400).json({
          success: false,
          error: 'A positive daily rental rate (pricePerDay) is required for rental equipment.'
        });
      }

      const validConditions = ['Good', 'Fair', 'Needs Inspection'];
      if (!validConditions.includes(conditionGrade)) {
        return res.status(400).json({
          success: false,
          error: `Invalid conditionGrade. Must be one of: ${validConditions.join(', ')}`
        });
      }

      const newItem = await equipmentModel.create({
        ownerId,
        name,
        category,
        description,
        conditionGrade,
        conditionDetails,
        knownDamage,
        sharingType,
        pricePerDay,
        serviceArea,
        imageUrl,
        videoUrl,
        gallery
      });

      return res.status(201).json({
        success: true,
        equipment: newItem,
        message: 'Medical equipment listing published successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update an existing equipment listing
   */
  async updateEquipment(req, res, next) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const existing = await equipmentModel.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Equipment listing not found.' });
      }

      if (!isAdmin && Number(existing.owner_id) !== Number(ownerId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only edit your own equipment listings.'
        });
      }

      const updated = await equipmentModel.update(id, ownerId, req.body, isAdmin);

      return res.status(200).json({
        success: true,
        equipment: updated,
        message: 'Equipment listing updated successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete an equipment listing (only if no active/pending bookings)
   */
  async deleteEquipment(req, res, next) {
    try {
      const { id } = req.params;
      const ownerId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const result = await equipmentModel.delete(id, ownerId, isAdmin);

      if (result.notFound) {
        return res.status(404).json({ success: false, error: 'Equipment listing not found.' });
      }

      if (result.forbidden) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only delete your own equipment listings.'
        });
      }

      if (result.hasActiveBookings) {
        return res.status(400).json({
          success: false,
          error: result.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Equipment listing deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};

export default equipmentController;

