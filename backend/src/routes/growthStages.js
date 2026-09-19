import express from 'express';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import GrowthStage from '../models/GrowthStage.js';
import Crop from '../models/Crop.js';
import CropVariety from '../models/CropVariety.js';
import User from '../models/User.js';
import { createApprovalNotifications } from '../utils/notifications.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { buildPaginationMeta, parsePagination } from '../utils/queryParams.js';

const router = express.Router();

// Get growth stages for a specific crop
router.get('/crop/:cropId', authMiddleware, authorize('client_admin', 'farmer', 'super_admin'), async (req, res) => {
  try {
    const { cropId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Verify crop exists and user has access
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    if (req.userRole === 'client_admin' && crop.clientId.toString() !== req.clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this crop' });
    }

    const query = {
      cropId,
      cropVarietyId: null, // Only crop-level stages, not variety-specific
      isActive: true,
    };

    if (req.userRole === 'farmer') {
      query.status = 'approved';
    }

    const totalItems = await GrowthStage.countDocuments(query);
    const stages = await GrowthStage.find(query)
      .sort({ stageNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      data: stages,
      pagination: buildPaginationMeta({ page: parseInt(page, 10), limit: parseInt(limit, 10), totalItems }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch growth stages' });
  }
});

// Get growth stages for a specific crop variety
router.get('/variety/:varietyId', authMiddleware, authorize('client_admin', 'farmer', 'super_admin'), async (req, res) => {
  try {
    const { varietyId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Verify variety exists
    const variety = await CropVariety.findById(varietyId);
    if (!variety) {
      return res.status(404).json({ success: false, message: 'Crop variety not found' });
    }

    // Verify user access
    if (req.userRole === 'client_admin' && variety.clientId.toString() !== req.clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this variety' });
    }

    const query = {
      cropVarietyId: varietyId,
      isActive: true,
    };

    if (req.userRole === 'farmer') {
      query.status = 'approved';
    }

    const totalItems = await GrowthStage.countDocuments(query);
    const stages = await GrowthStage.find(query)
      .sort({ stageNumber: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      data: stages,
      pagination: buildPaginationMeta({ page: parseInt(page, 10), limit: parseInt(limit, 10), totalItems }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch growth stages' });
  }
});

// Get pending growth stages (for super_admin approval)
router.get('/pending/approval', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const query = { status: 'pending', isActive: true };

    const totalItems = await GrowthStage.countDocuments(query);
    const stages = await GrowthStage.find(query)
      .populate('cropId', 'name cropId')
      .populate('cropVarietyId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      success: true,
      data: stages,
      pagination: buildPaginationMeta({ page: parseInt(page, 10), limit: parseInt(limit, 10), totalItems }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch pending stages' });
  }
});

// Get a specific growth stage
router.get('/:id', authMiddleware, authorize('client_admin', 'farmer', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const stage = await GrowthStage.findById(id)
      .populate('cropId', 'name cropId')
      .populate('cropVarietyId', 'name code')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!stage) {
      return res.status(404).json({ success: false, message: 'Growth stage not found' });
    }

    // Authorization check
    if (req.userRole === 'client_admin' && stage.clientId.toString() !== req.clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    res.json({ success: true, data: stage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch growth stage' });
  }
});

// Create a new growth stage
router.post('/', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const {
      cropId,
      cropVarietyId,
      stageName,
      stageNumber,
      durationDays,
      description,
      fertilizerRecommendation,
      irrigationNotes,
      pestManagement,
    } = req.body;

    // Verify crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ success: false, message: 'Crop not found' });
    }

    // Authorization check
    if (req.userRole === 'client_admin' && crop.clientId.toString() !== req.clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to create stage for this crop' });
    }

    // Verify variety exists if provided
    if (cropVarietyId) {
      const variety = await CropVariety.findById(cropVarietyId);
      if (!variety) {
        return res.status(404).json({ success: false, message: 'Crop variety not found' });
      }
      if (req.userRole === 'client_admin' && variety.clientId.toString() !== req.clientId) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this variety' });
      }
    }

    const user = await User.findById(req.userId);

    const newStage = new GrowthStage({
      cropId,
      cropVarietyId: cropVarietyId || null,
      clientId: crop.clientId,
      stageName: stageName?.trim(),
      stageNumber: parseInt(stageNumber, 10),
      durationDays: parseInt(durationDays, 10),
      description: description?.trim() || '',
      fertilizerRecommendation: fertilizerRecommendation || {},
      irrigationNotes: irrigationNotes || {},
      pestManagement: pestManagement || {},
      status: req.userRole === 'super_admin' ? 'approved' : 'pending',
      createdBy: req.userId,
      createdByName: user?.name || '',
      createdByEmail: user?.email || '',
      approvedBy: req.userRole === 'super_admin' ? req.userId : null,
      approvedAt: req.userRole === 'super_admin' ? new Date() : null,
    });

    await newStage.save();

    // Log audit event
    await logAuditEvent(req.userId, 'CREATE', 'GrowthStage', newStage._id, {
      stageName,
      stageNumber,
      cropId,
      cropVarietyId,
    });

    // Create notification for pending approval
    if (req.userRole === 'client_admin') {
      await createApprovalNotifications({
        type: 'GROWTH_STAGE_CREATED',
        itemId: newStage._id,
        itemType: 'GrowthStage',
        title: `New Growth Stage: ${stageName}`,
        description: `Client Admin created a new growth stage "${stageName}" for crop "${crop.name}" that needs approval`,
        createdBy: req.userId,
      });
    }

    res.status(201).json({
      success: true,
      message: req.userRole === 'super_admin' ? 'Growth stage created and approved' : 'Growth stage created and sent for approval',
      data: newStage,
    });
  } catch (error) {
    console.error('Create stage error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create growth stage' });
  }
});

// Update a growth stage
router.put('/:id', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      stageName,
      stageNumber,
      durationDays,
      description,
      fertilizerRecommendation,
      irrigationNotes,
      pestManagement,
    } = req.body;

    const stage = await GrowthStage.findById(id);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Growth stage not found' });
    }

    // Authorization check
    if (req.userRole === 'client_admin' && stage.clientId.toString() !== req.clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this stage' });
    }

    // Store previous values for audit
    const previousValues = {
      stageName: stage.stageName,
      stageNumber: stage.stageNumber,
      durationDays: stage.durationDays,
      description: stage.description,
      fertilizerRecommendation: stage.fertilizerRecommendation,
      irrigationNotes: stage.irrigationNotes,
      pestManagement: stage.pestManagement,
    };

    // Update fields
    stage.stageName = stageName?.trim() || stage.stageName;
    stage.stageNumber = parseInt(stageNumber, 10) || stage.stageNumber;
    stage.durationDays = parseInt(durationDays, 10) || stage.durationDays;
    stage.description = description?.trim() || stage.description;
    stage.fertilizerRecommendation = fertilizerRecommendation || stage.fertilizerRecommendation;
    stage.irrigationNotes = irrigationNotes || stage.irrigationNotes;
    stage.pestManagement = pestManagement || stage.pestManagement;

    // If client_admin updates, reset to pending
    if (req.userRole === 'client_admin') {
      stage.status = 'pending';
      stage.approvedBy = null;
      stage.approvedAt = null;
    }

    await stage.save();

    // Log audit event
    await logAuditEvent(req.userId, 'UPDATE', 'GrowthStage', id, {
      previousValues,
      newValues: {
        stageName: stage.stageName,
        stageNumber: stage.stageNumber,
        durationDays: stage.durationDays,
      },
    });

    res.json({
      success: true,
      message: req.userRole === 'super_admin' ? 'Growth stage updated' : 'Growth stage updated and sent for re-approval',
      data: stage,
    });
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update growth stage' });
  }
});

// Update approval status (super_admin only)
router.patch('/:id/status', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const stage = await GrowthStage.findById(id);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Growth stage not found' });
    }

    const previousStatus = stage.status;
    stage.status = status;

    if (status === 'approved') {
      stage.approvedBy = req.userId;
      stage.approvedAt = new Date();
    }

    await stage.save();

    // Log audit event
    await logAuditEvent(req.userId, 'UPDATE', 'GrowthStage', id, {
      statusChange: { from: previousStatus, to: status },
    });

    res.json({ success: true, message: `Growth stage ${status}`, data: stage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update stage status' });
  }
});

// Soft delete a growth stage
router.patch('/:id/soft-delete', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const stage = await GrowthStage.findById(id);

    if (!stage) {
      return res.status(404).json({ success: false, message: 'Growth stage not found' });
    }

    // Authorization check
    if (req.userRole === 'client_admin' && stage.clientId.toString() !== req.clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this stage' });
    }

    stage.isActive = false;
    await stage.save();

    // Log audit event
    await logAuditEvent(req.userId, 'DELETE', 'GrowthStage', id, {
      stageName: stage.stageName,
      stageNumber: stage.stageNumber,
    });

    res.json({ success: true, message: 'Growth stage deleted', data: stage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete growth stage' });
  }
});

export default router;
