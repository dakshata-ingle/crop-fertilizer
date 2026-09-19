import express from 'express';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import Crop from '../models/Crop.js';
import { createApprovalNotifications } from '../utils/notifications.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { buildBooleanFilter, buildPaginationMeta, buildSortOptions, buildTextSearch, parsePagination } from '../utils/queryParams.js';
import { getUploadUrl, upload } from '../utils/upload.js';

const router = express.Router();

const normalizeCropId = (value) => {
  const base = (value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return base || 'crop';
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

const parseJsonField = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value || {};
};

router.get('/', authMiddleware, authorize('client_admin', 'farmer', 'super_admin'), async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || '';
    const clientId = req.query.clientId || '';
    const isActive = buildBooleanFilter(req.query.isActive);
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const { page, limit, hasPaginationRequest } = parsePagination(req.query);

    const query = {
      ...buildTextSearch(search, ['name', 'cropId', 'botanicalName', 'description']),
    };

    if (req.userRole === 'client_admin' || req.userRole === 'farmer') {
      query.clientId = req.clientId;
    } else if (clientId) {
      query.clientId = clientId;
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    } else {
      query.isActive = true;
    }

    if (req.userRole === 'farmer') {
      query.status = 'approved';
    } else if (status) {
      query.status = status;
    }

    const totalItems = await Crop.countDocuments(query);
    const baseQuery = Crop.find(query)
      .sort(buildSortOptions({ sortBy, sortOrder, fallbackField: 'createdAt', allowedFields: ['name', 'cropId', 'createdAt', 'status', 'growthPeriodDays'] }));
    const crops = hasPaginationRequest
      ? await baseQuery.skip((page - 1) * limit).limit(limit).lean()
      : await baseQuery.lean();

    res.json({
      success: true,
      crops,
      count: totalItems,
      pagination: buildPaginationMeta({ page, limit, totalItems, hasPaginationRequest }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch crops.',
    });
  }
});

router.get('/pending', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const { page, limit, hasPaginationRequest } = parsePagination(req.query);

    const query = {
      status: 'pending',
      isActive: true,
      ...buildTextSearch(search, ['name', 'cropId', 'botanicalName', 'description']),
    };

    const totalItems = await Crop.countDocuments(query);
    const baseQuery = Crop.find(query)
      .populate('clientId', 'name code email')
      .populate('createdBy', 'name email')
      .sort(buildSortOptions({ sortBy, sortOrder, fallbackField: 'createdAt', allowedFields: ['name', 'cropId', 'createdAt', 'status'] }));
    const crops = hasPaginationRequest
      ? await baseQuery.skip((page - 1) * limit).limit(limit).lean()
      : await baseQuery.lean();

    res.json({
      success: true,
      crops: crops.map((crop) => ({
        ...crop,
        clientName: crop.clientId?.name || 'Unassigned',
        clientCode: crop.clientId?.code || '—',
        createdByName: crop.createdBy?.name || 'Unknown',
      })),
      count: totalItems,
      pagination: buildPaginationMeta({ page, limit, totalItems, hasPaginationRequest }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending crops.',
    });
  }
});

router.post('/', authMiddleware, authorize('client_admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const {
      cropId,
      name,
      botanicalName,
      npk,
      customDose,
      varieties,
      growthStages,
      growthPeriodDays,
      description,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Crop name is required.',
      });
    }

    const targetClientId = req.userRole === 'super_admin' ? req.body.clientId : req.clientId;

    if (req.userRole === 'super_admin' && !targetClientId) {
      return res.status(400).json({
        success: false,
        message: 'clientId is required for super admins.',
      });
    }

    const normalizedCropId = normalizeCropId(cropId || name);
    const existing = await Crop.findOne({
      clientId: targetClientId,
      cropId: normalizedCropId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A crop with this code already exists for your client.',
      });
    }

    const parsedNpk = parseJsonField(npk);
    const parsedCustomDose = parseJsonField(customDose);

    const crop = await Crop.create({
      clientId: targetClientId,
      cropId: normalizedCropId,
      name: name.trim(),
      botanicalName: botanicalName?.trim() || '',
      npk: {
        n: Number(parsedNpk?.n) || 0,
        p: Number(parsedNpk?.p) || 0,
        k: Number(parsedNpk?.k) || 0,
      },
      customDose: {
        n: Number(parsedCustomDose?.n) || 0,
        p: Number(parsedCustomDose?.p) || 0,
        k: Number(parsedCustomDose?.k) || 0,
      },
      varieties: parseStringArray(varieties),
      growthStages: parseStringArray(growthStages),
      growthPeriodDays: Number(growthPeriodDays) || 0,
      status: req.userRole === 'super_admin' ? 'approved' : 'pending',
      createdBy: req.userId,
      isActive: true,
      description: description?.trim() || '',
      image: getUploadUrl(req.file?.filename || ''),
    });

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'created',
      entityType: 'crop',
      entityId: crop._id,
      entityName: crop.name,
      description: 'Created crop record',
      metadata: { cropId: crop.cropId },
    });

    await createApprovalNotifications({
      entityType: 'crop',
      entityName: crop.name,
      entityId: crop._id,
      clientId: crop.clientId,
      status: crop.status,
      createdBy: crop.createdBy,
      actorId: req.userId,
    });

    res.status(201).json({
      success: true,
      message: req.userRole === 'super_admin'
        ? 'Crop created successfully and approved in the system catalog.'
        : 'Crop created successfully and is pending approval.',
      crop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create crop.',
    });
  }
});

router.get('/:id', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
    };

    if (req.userRole !== 'super_admin') {
      query.clientId = req.clientId;
      query.isActive = true;
    }

    const crop = await Crop.findOne(query).lean();

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: req.userRole === 'super_admin' ? 'Crop not found.' : 'Crop not found for your client.',
      });
    }

    res.json({
      success: true,
      crop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch crop.',
    });
  }
});

router.put('/:id', authMiddleware, authorize('client_admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      isActive: true,
    };

    if (req.userRole === 'client_admin') {
      query.clientId = req.clientId;
    }

    const crop = await Crop.findOne(query);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: req.userRole === 'super_admin' ? 'Crop not found.' : 'Crop not found for your client.',
      });
    }

    const {
      cropId,
      name,
      botanicalName,
      npk,
      customDose,
      varieties,
      growthStages,
      growthPeriodDays,
      description,
    } = req.body;

    if (cropId !== undefined && cropId !== null) {
      const normalizedCropId = normalizeCropId(cropId);
      const duplicate = await Crop.findOne({
        _id: { $ne: crop._id },
        clientId: crop.clientId,
        cropId: normalizedCropId,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'A crop with this code already exists for your client.',
        });
      }

      crop.cropId = normalizedCropId;
    }

    if (name) crop.name = name.trim();
    if (botanicalName !== undefined) crop.botanicalName = botanicalName.trim();
    if (npk !== undefined) {
      const parsedNpk = parseJsonField(npk);
      crop.npk = {
        n: Number(parsedNpk?.n) || 0,
        p: Number(parsedNpk?.p) || 0,
        k: Number(parsedNpk?.k) || 0,
      };
    }
    if (customDose !== undefined) {
      const parsedCustomDose = parseJsonField(customDose);
      crop.customDose = {
        n: Number(parsedCustomDose?.n) || 0,
        p: Number(parsedCustomDose?.p) || 0,
        k: Number(parsedCustomDose?.k) || 0,
      };
    }
    if (varieties !== undefined) crop.varieties = parseStringArray(varieties);
    if (growthStages !== undefined) crop.growthStages = parseStringArray(growthStages);
    if (growthPeriodDays !== undefined) crop.growthPeriodDays = Number(growthPeriodDays) || 0;
    if (description !== undefined) crop.description = description.trim();
    if (req.file?.filename) {
      crop.image = getUploadUrl(req.file.filename);
    }

    if (req.userRole === 'super_admin') {
      crop.status = 'approved';
      crop.approvedBy = req.userId;
      crop.approvedAt = new Date();
    } else {
      crop.status = 'pending';
      crop.approvedBy = null;
      crop.approvedAt = null;
    }
    await crop.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'updated',
      entityType: 'crop',
      entityId: crop._id,
      entityName: crop.name,
      description: 'Updated crop record',
      metadata: { status: crop.status },
    });

    res.json({
      success: true,
      message: req.userRole === 'super_admin'
        ? 'Crop updated successfully in the system catalog.'
        : 'Crop updated successfully and marked pending approval.',
      crop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update crop.',
    });
  }
});

router.patch('/:id/soft-delete', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
      isActive: true,
    };

    if (req.userRole === 'client_admin') {
      query.clientId = req.clientId;
    }

    const crop = await Crop.findOne(query);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: req.userRole === 'super_admin' ? 'Crop not found.' : 'Crop not found for your client.',
      });
    }

    crop.isActive = false;
    await crop.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'deactivated',
      entityType: 'crop',
      entityId: crop._id,
      entityName: crop.name,
      description: 'Deactivated crop record',
      metadata: { isActive: crop.isActive },
    });

    res.json({
      success: true,
      message: 'Crop deactivated successfully.',
      crop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to soft delete crop.',
    });
  }
});

router.patch('/:id/active-status', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be provided as a boolean.',
      });
    }

    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found.',
      });
    }

    crop.isActive = isActive;
    await crop.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: isActive ? 'activated' : 'deactivated',
      entityType: 'crop',
      entityId: crop._id,
      entityName: crop.name,
      description: isActive ? 'Activated crop record' : 'Deactivated crop record',
      metadata: { isActive: crop.isActive },
    });

    res.json({
      success: true,
      message: isActive ? 'Crop activated successfully.' : 'Crop deactivated successfully.',
      crop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update crop status.',
    });
  }
});

router.patch('/:id/status', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid crop status.',
      });
    }

    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found.',
      });
    }

    crop.status = status;
    crop.approvedBy = req.userId;
    crop.approvedAt = new Date();
    await crop.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: status === 'approved' ? 'approved' : 'rejected',
      entityType: 'crop',
      entityId: crop._id,
      entityName: crop.name,
      description: status === 'approved' ? 'Approved crop record' : 'Rejected crop record',
      metadata: { status },
    });

    await createApprovalNotifications({
      entityType: 'crop',
      entityName: crop.name,
      entityId: crop._id,
      clientId: crop.clientId,
      status,
      createdBy: crop.createdBy,
      actorId: req.userId,
    });

    res.json({
      success: true,
      message: status === 'approved' ? 'Crop approved successfully.' : 'Crop rejected successfully.',
      crop,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update crop status.',
    });
  }
});

export default router;
