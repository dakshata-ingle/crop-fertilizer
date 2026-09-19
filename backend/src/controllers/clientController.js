import Client from "../models/Client.js";
import { logAuditEvent } from '../utils/auditLogger.js';
import { buildBooleanFilter, buildPaginationMeta, buildSortOptions, buildTextSearch, parsePagination } from '../utils/queryParams.js';
import { getUploadUrl } from '../utils/upload.js';

// ========================================
// Create Client
// ========================================
export const createClient = async (req, res) => {
  try {
    const { name, code, email, phone, address } = req.body;
    const logoFileName = req.file?.filename || '';

    if (!name || !code || !email) {
      return res.status(400).json({
        success: false,
        message: "Name, Code and Email are required.",
      });
    }

    // Check duplicate name
    const existingName = await Client.findOne({ name });

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "Client name already exists.",
      });
    }

    // Check duplicate code
    const existingCode = await Client.findOne({
      code: code.toUpperCase(),
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Client code already exists.",
      });
    }

    const client = await Client.create({
      name,
      code: code.toUpperCase(),
      email,
      phone,
      address,
      createdBy: req.userId,
      logo: getUploadUrl(logoFileName),
    });

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'created',
      entityType: 'client',
      entityId: client._id,
      entityName: client.name,
      description: 'Created client record',
      metadata: { code: client.code },
    });

    res.status(201).json({
      success: true,
      message: "Client created successfully.",
      client,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// Update Client
// ========================================
export const updateClient = async (req, res) => {
  try {
    const { name, code, email, phone, address } = req.body;
    const logoFileName = req.file?.filename || '';

    if (!name || !code || !email) {
      return res.status(400).json({
        success: false,
        message: "Name, Code and Email are required.",
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    const normalizedCode = code.toUpperCase().trim();

    const existingName = await Client.findOne({
      name: name.trim(),
      _id: { $ne: client._id },
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "Client name already exists.",
      });
    }

    const existingCode = await Client.findOne({
      code: normalizedCode,
      _id: { $ne: client._id },
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Client code already exists.",
      });
    }

    client.name = name.trim();
    client.code = normalizedCode;
    client.email = email.toLowerCase().trim();
    client.phone = phone?.trim() || "";
    client.address = address?.trim() || "";

    if (logoFileName) {
      client.logo = getUploadUrl(logoFileName);
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: "Client updated successfully.",
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// Update Client Status
// ========================================
export const updateClientStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client status.',
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.',
      });
    }

    client.status = status;
    await client.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: status === 'approved' ? 'approved' : 'rejected',
      entityType: 'client',
      entityId: client._id,
      entityName: client.name,
      description: status === 'approved' ? 'Approved client record' : 'Rejected client record',
      metadata: { status },
    });

    res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Client approved successfully.' : 'Client rejected successfully.',
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// Soft Delete / Restore Client
// ========================================
export const toggleClientActiveStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be provided as a boolean.',
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.',
      });
    }

    client.isActive = isActive;
    client.status = isActive ? 'pending' : 'inactive';
    await client.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: isActive ? 'reactivated' : 'deactivated',
      entityType: 'client',
      entityId: client._id,
      entityName: client.name,
      description: isActive ? 'Reactivated client record' : 'Deactivated client record',
      metadata: { isActive },
    });

    res.status(200).json({
      success: true,
      message: isActive ? 'Client reactivated successfully.' : 'Client deactivated successfully.',
      client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// Get All Clients
// ========================================
export const getAllClients = async (req, res) => {
  try {
    const filter = req.userRole === "client_admin" && req.clientId
      ? { _id: req.clientId }
      : {};

    const search = req.query.search || '';
    const status = req.query.status || '';
    const isActive = buildBooleanFilter(req.query.isActive);
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const { page, limit, hasPaginationRequest } = parsePagination(req.query);

    const query = {
      ...filter,
      ...buildTextSearch(search, ['name', 'code', 'email', 'address']),
    };

    if (status) {
      query.status = status;
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    const baseQuery = Client.find(query)
      .populate("createdBy", "name email")
      .sort(buildSortOptions({ sortBy, sortOrder, fallbackField: 'createdAt', allowedFields: ['name', 'code', 'createdAt', 'status', 'updatedAt'] }));

    const totalItems = await Client.countDocuments(query);
    const clients = hasPaginationRequest
      ? await baseQuery.skip((page - 1) * limit).limit(limit).lean()
      : await baseQuery.lean();

    res.status(200).json({
      success: true,
      count: totalItems,
      clients,
      pagination: buildPaginationMeta({ page, limit, totalItems, hasPaginationRequest }),
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// Get Client By ID
// ========================================
export const getClientById = async (req, res) => {
  try {
    if (req.userRole !== 'super_admin' && req.clientId && req.params.id !== req.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this client.",
      });
    }

    const client = await Client.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    res.status(200).json({
      success: true,
      client,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// Get Active Clients for Public Signup
// ========================================
export const getActiveClientsForSignup = async (_req, res) => {
  try {
    const clients = await Client.find({
      isActive: true,
      status: 'approved',
    })
      .select('name code logo primaryColor secondaryColor')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

