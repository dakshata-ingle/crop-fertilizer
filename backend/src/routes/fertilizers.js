import express from 'express';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import Fertilizer from '../models/Fertilizer.js';
import FertilizerPriceHistory from '../models/FertilizerPriceHistory.js';
import FertilizerChangeHistory from '../models/FertilizerChangeHistory.js';
import Client from '../models/Client.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { buildBooleanFilter, buildPaginationMeta, buildSortOptions, buildTextSearch, parsePagination } from '../utils/queryParams.js';
import { getUploadUrl, upload } from '../utils/upload.js';

const router = express.Router();

const normalizeFertilizerId = (value) => {
  const base = (value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return base || 'fertilizer';
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
      ...buildTextSearch(search, ['name', 'fertilizerId', 'description']),
    };

    if (req.userRole === 'client_admin' || req.userRole === 'farmer') {
      query.clientId = req.clientId;
    } else if (clientId) {
      query.clientId = clientId;
    }

    if (req.userRole === 'super_admin' && req.query.isActive === undefined) {
      delete query.isActive;
    } else if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    } else {
      query.isActive = true;
    }

    if (req.userRole === 'farmer') {
      query.status = 'approved';
    } else if (status) {
      query.status = status;
    }

    const totalItems = await Fertilizer.countDocuments(query);
    const baseQuery = Fertilizer.find(query)
      .sort(buildSortOptions({ sortBy, sortOrder, fallbackField: 'createdAt', allowedFields: ['name', 'fertilizerId', 'createdAt', 'status', 'price'] }));
    const fertilizers = hasPaginationRequest
      ? await baseQuery.skip((page - 1) * limit).limit(limit).lean()
      : await baseQuery.lean();

    res.json({
      success: true,
      fertilizers,
      count: totalItems,
      pagination: buildPaginationMeta({ page, limit, totalItems, hasPaginationRequest }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch fertilizers.',
    });
  }
});

router.get('/:id', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const query = { _id: req.params.id };

    if (req.userRole !== 'super_admin') {
      query.isActive = true;
    }

    if (req.userRole === 'client_admin') {
      query.clientId = req.clientId;
    }

    const fertilizer = await Fertilizer.findOne(query).lean();

    if (!fertilizer) {
      return res.status(404).json({
        success: false,
        message: 'Fertilizer not found.',
      });
    }

    res.json({
      success: true,
      fertilizer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch fertilizer.',
    });
  }
});

router.get('/:id/price-history', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const history = await FertilizerPriceHistory.find({ fertilizerId: req.params.id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate('updatedBy', 'name email')
      .lean();

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch fertilizer price history.',
    });
  }
});

router.get('/:id/change-history', authMiddleware, authorize('super_admin', 'client_admin'), async (req, res) => {
  try {
    const fertilizer = await Fertilizer.findOne({
      _id: req.params.id,
      isActive: true,
      ...(req.userRole === 'client_admin' && { clientId: req.clientId }),
    });

    if (!fertilizer) {
      return res.status(404).json({
        success: false,
        message: 'Fertilizer not found.',
      });
    }

    const history = await FertilizerChangeHistory.find({ fertilizerId: req.params.id })
      .sort({ updatedAt: -1, _id: -1 })
      .lean();

    res.json({
      success: true,
      message: 'Fertilizer change history retrieved successfully.',
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch fertilizer change history.',
    });
  }
});

router.post('/', authMiddleware, authorize('client_admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, fertilizerId, n, p, k, bagWeight, price, description, clientId, sulfur, zinc, boron, iron, manganese, copper } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Fertilizer name is required.',
      });
    }

    const targetClientId = req.userRole === 'super_admin' ? clientId : req.clientId;

    if (req.userRole === 'super_admin' && !targetClientId) {
      return res.status(400).json({
        success: false,
        message: 'clientId is required for super admins.',
      });
    }

    const normalizedFertilizerId = normalizeFertilizerId(fertilizerId || name);
    const existing = await Fertilizer.findOne({
      clientId: targetClientId,
      fertilizerId: normalizedFertilizerId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A fertilizer with this code already exists for the selected client.',
      });
    }

    if (req.userRole === 'super_admin') {
      const client = await Client.findById(targetClientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found.',
        });
      }
    }

    const fertilizer = await Fertilizer.create({
      clientId: targetClientId,
      fertilizerId: normalizedFertilizerId,
      name: name.trim(),
      n: Number(n) || 0,
      p: Number(p) || 0,
      k: Number(k) || 0,
      bagWeight: Number(bagWeight) || 50,
      price: Number(price) || 0,
      description: description?.trim() || '',
      micronutrients: {
        sulfur: Number(sulfur) || 0,
        zinc: Number(zinc) || 0,
        boron: Number(boron) || 0,
        iron: Number(iron) || 0,
        manganese: Number(manganese) || 0,
        copper: Number(copper) || 0,
      },
      status: req.userRole === 'super_admin' ? 'approved' : 'pending',
      approvedBy: req.userRole === 'super_admin' ? req.userId : null,
      approvedAt: req.userRole === 'super_admin' ? new Date() : null,
      createdBy: req.userId,
      isActive: true,
      image: getUploadUrl(req.file?.filename || ''),
    });

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'created',
      entityType: 'fertilizer',
      entityId: fertilizer._id,
      entityName: fertilizer.name,
      description: 'Created fertilizer record',
      metadata: { fertilizerId: fertilizer.fertilizerId, clientId: targetClientId },
    });

    res.status(201).json({
      success: true,
      message: req.userRole === 'super_admin'
        ? 'Fertilizer created successfully and approved in the system catalog.'
        : 'Fertilizer created successfully and is pending approval.',
      fertilizer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create fertilizer.',
    });
  }
});

router.put('/:id', authMiddleware, authorize('client_admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const query = { _id: req.params.id, isActive: true };

    if (req.userRole === 'client_admin') {
      query.clientId = req.clientId;
    }

    const fertilizer = await Fertilizer.findOne(query);

    if (!fertilizer) {
      return res.status(404).json({
        success: false,
        message: 'Fertilizer not found.',
      });
    }

    // Capture previous values before any updates
    const previousValues = {
      name: fertilizer.name,
      fertilizerId: fertilizer.fertilizerId,
      n: fertilizer.n,
      p: fertilizer.p,
      k: fertilizer.k,
      bagWeight: fertilizer.bagWeight,
      price: fertilizer.price,
      description: fertilizer.description,
      clientId: fertilizer.clientId.toString(),
      sulfur: fertilizer.micronutrients.sulfur,
      zinc: fertilizer.micronutrients.zinc,
      boron: fertilizer.micronutrients.boron,
      iron: fertilizer.micronutrients.iron,
      manganese: fertilizer.micronutrients.manganese,
      copper: fertilizer.micronutrients.copper,
      image: fertilizer.image,
    };

    const { name, fertilizerId, n, p, k, bagWeight, price, description, clientId, sulfur, zinc, boron, iron, manganese, copper } = req.body;

    if (req.userRole === 'super_admin' && clientId && clientId !== fertilizer.clientId.toString()) {
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found.',
        });
      }
      fertilizer.clientId = clientId;
    }

    if (name) fertilizer.name = name.trim();
    if (fertilizerId !== undefined && fertilizerId !== null) {
      const normalizedFertilizerId = normalizeFertilizerId(fertilizerId);
      const duplicate = await Fertilizer.findOne({
        _id: { $ne: fertilizer._id },
        clientId: fertilizer.clientId,
        fertilizerId: normalizedFertilizerId,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'A fertilizer with this code already exists for the selected client.',
        });
      }

      fertilizer.fertilizerId = normalizedFertilizerId;
    }
    if (n !== undefined) fertilizer.n = Number(n) || 0;
    if (p !== undefined) fertilizer.p = Number(p) || 0;
    if (k !== undefined) fertilizer.k = Number(k) || 0;
    if (bagWeight !== undefined) fertilizer.bagWeight = Number(bagWeight) || 50;
    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (req.userRole === 'super_admin' && parsedPrice !== undefined && parsedPrice !== null && parsedPrice !== fertilizer.price) {
        await FertilizerPriceHistory.create({
          fertilizerId: fertilizer._id,
          previousPrice: fertilizer.price,
          newPrice: parsedPrice,
          updatedBy: req.userId,
          updatedAt: new Date(),
        });
      }
      fertilizer.price = parsedPrice || 0;
    }
    if (description !== undefined) fertilizer.description = description?.trim() || '';
    if (sulfur !== undefined) fertilizer.micronutrients.sulfur = Number(sulfur) || 0;
    if (zinc !== undefined) fertilizer.micronutrients.zinc = Number(zinc) || 0;
    if (boron !== undefined) fertilizer.micronutrients.boron = Number(boron) || 0;
    if (iron !== undefined) fertilizer.micronutrients.iron = Number(iron) || 0;
    if (manganese !== undefined) fertilizer.micronutrients.manganese = Number(manganese) || 0;
    if (copper !== undefined) fertilizer.micronutrients.copper = Number(copper) || 0;
    if (req.file?.filename) {
      fertilizer.image = getUploadUrl(req.file.filename);
    }

    if (req.userRole === 'super_admin') {
      fertilizer.status = 'approved';
      fertilizer.approvedBy = req.userId;
      fertilizer.approvedAt = new Date();
    } else {
      fertilizer.status = 'pending';
      fertilizer.approvedBy = null;
      fertilizer.approvedAt = null;
    }

    await fertilizer.save();

    // Record change history for modified fields
    const changeHistoryEntries = [];
    const fieldMappings = {
      name: 'name',
      fertilizerId: 'fertilizerId',
      n: 'n',
      p: 'p',
      k: 'k',
      bagWeight: 'bagWeight',
      price: 'price',
      description: 'description',
      clientId: 'clientId',
    };

    Object.entries(fieldMappings).forEach(([fieldName, dbField]) => {
      let newValue;
      if (dbField === 'clientId') {
        newValue = fertilizer[dbField].toString();
      } else {
        newValue = fertilizer[dbField];
      }

      if (previousValues[fieldName] !== newValue) {
        changeHistoryEntries.push({
          fertilizerId: fertilizer._id,
          fieldName,
          previousValue: previousValues[fieldName],
          newValue,
          updatedBy: req.userId,
          updatedByEmail: req.user?.email,
          updatedByName: req.user?.name,
          updatedAt: new Date(),
        });
      }
    });

    // Handle micronutrient changes
    const micronutrients = ['sulfur', 'zinc', 'boron', 'iron', 'manganese', 'copper'];
    micronutrients.forEach((nutrient) => {
      const newValue = fertilizer.micronutrients[nutrient];
      if (previousValues[nutrient] !== newValue) {
        changeHistoryEntries.push({
          fertilizerId: fertilizer._id,
          fieldName: `micronutrients.${nutrient}`,
          previousValue: previousValues[nutrient],
          newValue,
          updatedBy: req.userId,
          updatedByEmail: req.user?.email,
          updatedByName: req.user?.name,
          updatedAt: new Date(),
        });
      }
    });

    // Handle image changes
    if (previousValues.image !== fertilizer.image && req.file?.filename) {
      changeHistoryEntries.push({
        fertilizerId: fertilizer._id,
        fieldName: 'image',
        previousValue: previousValues.image,
        newValue: fertilizer.image,
        updatedBy: req.userId,
        updatedByEmail: req.user?.email,
        updatedByName: req.user?.name,
        updatedAt: new Date(),
      });
    }

    // Save all change history entries if any fields changed
    if (changeHistoryEntries.length > 0) {
      await FertilizerChangeHistory.insertMany(changeHistoryEntries);
    }

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'updated',
      entityType: 'fertilizer',
      entityId: fertilizer._id,
      entityName: fertilizer.name,
      description: 'Updated fertilizer record',
      metadata: { status: fertilizer.status, clientId: fertilizer.clientId },
    });

    res.json({
      success: true,
      message: req.userRole === 'super_admin'
        ? 'Fertilizer updated successfully in the system catalog.'
        : 'Fertilizer updated successfully and marked pending approval.',
      fertilizer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update fertilizer.',
    });
  }
});

router.patch('/:id/soft-delete', authMiddleware, authorize('client_admin', 'super_admin'), async (req, res) => {
  try {
    const query = {
      _id: req.params.id,
    };

    if (req.userRole === 'client_admin') {
      query.clientId = req.clientId;
    }

    const fertilizer = await Fertilizer.findOne(query);

    if (!fertilizer) {
      return res.status(404).json({
        success: false,
        message: req.userRole === 'client_admin'
          ? 'Fertilizer not found for your client.'
          : 'Fertilizer not found.',
      });
    }

    fertilizer.isActive = false;
    await fertilizer.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'deactivated',
      entityType: 'fertilizer',
      entityId: fertilizer._id,
      entityName: fertilizer.name,
      description: 'Deactivated fertilizer record',
      metadata: { isActive: fertilizer.isActive },
    });

    res.json({
      success: true,
      message: 'Fertilizer deactivated successfully.',
      fertilizer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate fertilizer.',
    });
  }
});

router.patch('/:id/status', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be provided as a boolean.',
      });
    }

    const fertilizer = await Fertilizer.findById(req.params.id);

    if (!fertilizer) {
      return res.status(404).json({
        success: false,
        message: 'Fertilizer not found.',
      });
    }

    const previousStatus = fertilizer.isActive;
    fertilizer.isActive = isActive;
    await fertilizer.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: isActive ? 'activated' : 'deactivated',
      entityType: 'fertilizer',
      entityId: fertilizer._id,
      entityName: fertilizer.name,
      description: isActive ? 'Activated fertilizer record' : 'Deactivated fertilizer record',
      metadata: { isActive: fertilizer.isActive, previousStatus },
    });

    res.json({
      success: true,
      message: isActive ? 'Fertilizer activated successfully.' : 'Fertilizer deactivated successfully.',
      fertilizer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update fertilizer status.',
    });
  }
});

export default router;
