import express from 'express';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import CropVariety from '../models/CropVariety.js';
import Crop from '../models/Crop.js';
import Client from '../models/Client.js';
import { createApprovalNotifications } from '../utils/notifications.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { buildBooleanFilter, buildPaginationMeta, buildSortOptions, buildTextSearch, parsePagination } from '../utils/queryParams.js';
import { getUploadUrl, upload } from '../utils/upload.js';

const router = express.Router();

const normalizeCode = (value) => {
  const base = (value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return base || 'variety';
};

const parseStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

// GET all crop varieties for a crop
router.get('/crop/:cropId', authMiddleware, authorize('client_admin', 'farmer', 'super_admin'), async (req, res) => {
  try {
    const { cropId } = req.params;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const isActive = buildBooleanFilter(req.query.isActive);
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const { page, limit, hasPaginationRequest } = parsePagination(req.query);

    const crop = await Crop.findOne({
      _id: cropId,
      isActive: true,
      ...(req.userRole === 'client_admin' && { clientId: req.clientId }),
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found.',
      });
    }

    const query = {
      cropId: crop._id,
      ...buildTextSearch(search, ['name', 'code', 'description']),
      ...(status && { status }),
      ...(isActive !== undefined && { isActive }),
      ...(req.userRole === 'client_admin' && { clientId: req.clientId }),
    };

    const totalCount = await CropVariety.countDocuments(query);
    const sortOptions = buildSortOptions(sortBy, sortOrder);

    let varieties;
    if (hasPaginationRequest) {
      varieties = await CropVariety.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .lean();
    } else {
      varieties = await CropVariety.find(query)
        .sort(sortOptions)
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .lean();
    }

    const pagination = hasPaginationRequest ? buildPaginationMeta(page, limit, totalCount) : null;

    res.json({
      success: true,
      varieties,
      count: varieties.length,
      pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch crop varieties.',
    });
  }
});

// GET pending crop varieties for approval
router.get('/pending', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const { page, limit, hasPaginationRequest } = parsePagination(req.query);

    const query = { status: 'pending', isActive: true };
    const totalCount = await CropVariety.countDocuments(query);
    const sortOptions = buildSortOptions(sortBy, sortOrder);

    let varieties;
    if (hasPaginationRequest) {
      varieties = await CropVariety.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('cropId', 'name')
        .populate('clientId', 'name code email')
        .populate('createdBy', 'name email')
        .lean();
    } else {
      varieties = await CropVariety.find(query)
        .sort(sortOptions)
        .populate('cropId', 'name')
        .populate('clientId', 'name code email')
        .populate('createdBy', 'name email')
        .lean();
    }

    const pagination = hasPaginationRequest ? buildPaginationMeta(page, limit, totalCount) : null;

    res.json({
      success: true,
      message: 'Pending crop varieties retrieved successfully.',
      varieties,
      count: varieties.length,
      pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending crop varieties.',
    });
  }
});

// POST create a new crop variety
router.post('/', authMiddleware, authorize('client_admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const { cropId, name, code, description, maturityDays, yieldPerHectare, resistances } = req.body;

    if (!cropId || !name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Crop ID, variety name, and code are required.',
      });
    }

    const crop = await Crop.findOne({
      _id: cropId,
      isActive: true,
      ...(req.userRole === 'client_admin' && { clientId: req.clientId }),
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found.',
      });
    }

    const normalizedCode = normalizeCode(code);
    const existingVariety = await CropVariety.findOne({
      cropId,
      code: normalizedCode,
    });

    if (existingVariety) {
      return res.status(400).json({
        success: false,
        message: 'A variety with this code already exists for the selected crop.',
      });
    }

    const varietyData = {
      cropId,
      clientId: crop.clientId,
      name: name.trim(),
      code: normalizedCode,
      description: description?.trim() || '',
      maturityDays: Number(maturityDays) || 0,
      yieldPerHectare: Number(yieldPerHectare) || 0,
      resistances: parseStringArray(resistances),
      createdBy: req.userId,
      status: req.userRole === 'super_admin' ? 'approved' : 'pending',
      approvedBy: req.userRole === 'super_admin' ? req.userId : null,
      approvedAt: req.userRole === 'super_admin' ? new Date() : null,
      image: req.file?.filename ? getUploadUrl(req.file.filename) : '',
    };

    const variety = new CropVariety(varietyData);
    await variety.save();

    if (req.userRole === 'client_admin') {
      await createApprovalNotifications(
        'CropVariety',
        variety._id,
        variety.name,
        `New crop variety "${variety.name}" pending approval for crop "${crop.name}"`
      );
    }

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'created',
      entityType: 'crop_variety',
      entityId: variety._id,
      entityName: variety.name,
      description: 'Created new crop variety',
      metadata: { cropId, status: variety.status },
    });

    res.status(201).json({
      success: true,
      message: req.userRole === 'super_admin'
        ? 'Crop variety created successfully and approved in the system catalog.'
        : 'Crop variety created successfully and marked pending approval.',
      variety,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create crop variety.',
    });
  }
});

// GET a specific crop variety
router.get('/:id', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      isActive: true,
      ...(req.userRole === 'client_admin' && { clientId: req.clientId }),
    };

    const variety = await CropVariety.findOne(query)
      .populate('cropId', 'name cropId')
      .populate('clientId', 'name code email')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .lean();

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Crop variety not found.',
      });
    }

    res.json({
      success: true,
      variety,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch crop variety.',
    });
  }
});

// PUT update a crop variety
router.put('/:id', authMiddleware, authorize('client_admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      isActive: true,
      ...(req.userRole === 'client_admin' && { clientId: req.clientId }),
    };

    const variety = await CropVariety.findOne(query);

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Crop variety not found.',
      });
    }

    const { name, code, description, maturityDays, yieldPerHectare, resistances } = req.body;

    if (name) variety.name = name.trim();
    if (code !== undefined) {
      const normalizedCode = normalizeCode(code);
      const duplicate = await CropVariety.findOne({
        _id: { $ne: variety._id },
        cropId: variety.cropId,
        code: normalizedCode,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'A variety with this code already exists for this crop.',
        });
      }

      variety.code = normalizedCode;
    }
    if (description !== undefined) variety.description = description?.trim() || '';
    if (maturityDays !== undefined) variety.maturityDays = Number(maturityDays) || 0;
    if (yieldPerHectare !== undefined) variety.yieldPerHectare = Number(yieldPerHectare) || 0;
    if (resistances !== undefined) variety.resistances = parseStringArray(resistances);
    if (req.file?.filename) {
      variety.image = getUploadUrl(req.file.filename);
    }

    if (req.userRole === 'super_admin') {
      variety.status = 'approved';
      variety.approvedBy = req.userId;
      variety.approvedAt = new Date();
    } else {
      variety.status = 'pending';
      variety.approvedBy = null;
      variety.approvedAt = null;
    }

    await variety.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'updated',
      entityType: 'crop_variety',
      entityId: variety._id,
      entityName: variety.name,
      description: 'Updated crop variety',
      metadata: { status: variety.status, cropId: variety.cropId },
    });

    res.json({
      success: true,
      message: req.userRole === 'super_admin'
        ? 'Crop variety updated successfully in the system catalog.'
        : 'Crop variety updated successfully and marked pending approval.',
      variety,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update crop variety.',
    });
  }
});

// PATCH soft delete a crop variety
router.patch('/:id/soft-delete', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      isActive: true,
      ...(req.userRole === 'client_admin' && { clientId: req.clientId }),
    };

    const variety = await CropVariety.findOne(query);

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Crop variety not found.',
      });
    }

    variety.isActive = false;
    await variety.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'soft_deleted',
      entityType: 'crop_variety',
      entityId: variety._id,
      entityName: variety.name,
      description: 'Soft-deleted crop variety',
      metadata: { cropId: variety.cropId },
    });

    res.json({
      success: true,
      message: 'Crop variety deleted successfully.',
      variety,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete crop variety.',
    });
  }
});

// PATCH activate/deactivate a crop variety
router.patch('/:id/status', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const variety = await CropVariety.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Crop variety not found.',
      });
    }

    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: pending, approved, rejected.',
      });
    }

    variety.status = status;
    if (status === 'approved') {
      variety.approvedBy = req.userId;
      variety.approvedAt = new Date();
    }

    await variety.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: status === 'approved' ? 'approved' : 'rejected',
      entityType: 'crop_variety',
      entityId: variety._id,
      entityName: variety.name,
      description: `${status === 'approved' ? 'Approved' : 'Rejected'} crop variety`,
      metadata: { cropId: variety.cropId },
    });

    res.json({
      success: true,
      message: `Crop variety ${status} successfully.`,
      variety,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update crop variety status.',
    });
  }
});

export default router;
