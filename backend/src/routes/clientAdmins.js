import express from 'express';
import bcryptjs from 'bcryptjs';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import UserClient from '../models/UserClient.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { buildPaginationMeta, buildSortOptions, buildTextSearch, parsePagination } from '../utils/queryParams.js';

const router = express.Router();

const buildAdminPayload = (admin, membership) => {
  const client = membership?.clientId;

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    village: admin.village,
    role: admin.role,
    status: membership?.status || 'inactive',
    clientId: client?._id || null,
    clientName: client?.name || 'Unassigned',
    clientCode: client?.code || '—',
    clientEmail: client?.email || '—',
    clientPhone: client?.phone || '—',
    clientAddress: client?.address || '—',
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

router.get('/', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const { page, limit, hasPaginationRequest } = parsePagination(req.query);

    const query = {
      role: 'client_admin',
      ...buildTextSearch(search, ['name', 'email', 'phone', 'village']),
    };

    if (status) {
      query.status = status;
    }

    const admins = await User.find(query).lean();

    if (!admins.length) {
      return res.json({
        success: true,
        admins: [],
      });
    }

    const memberships = await UserClient.find({
      userId: { $in: admins.map((admin) => admin._id) },
    })
      .populate('clientId')
      .lean();

    const membershipByUserId = memberships.reduce((acc, membership) => {
      acc[membership.userId.toString()] = membership;
      return acc;
    }, {});

    const formattedAdmins = admins.map((admin) => {
      const membership = membershipByUserId[admin._id.toString()];
      return buildAdminPayload(admin, membership);
    }).sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1;
      const left = a[sortBy] || '';
      const right = b[sortBy] || '';
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }
      return String(left).localeCompare(String(right)) * direction;
    });

    const totalItems = formattedAdmins.length;
    const pagedAdmins = hasPaginationRequest
      ? formattedAdmins.slice((page - 1) * limit, page * limit)
      : formattedAdmins;

    res.json({
      success: true,
      admins: pagedAdmins,
      count: totalItems,
      pagination: buildPaginationMeta({ page, limit, totalItems, hasPaginationRequest }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch client admins.',
    });
  }
});

router.get('/:id', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'client_admin' }).lean();

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Client admin not found.',
      });
    }

    const membership = await UserClient.findOne({
      userId: admin._id,
    }).populate('clientId').lean();

    res.json({
      success: true,
      admin: buildAdminPayload(admin, membership),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch client admin details.',
    });
  }
});

router.patch('/:id/status', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status.',
      });
    }

    const admin = await User.findOne({ _id: req.params.id, role: 'client_admin' });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Client admin not found.',
      });
    }

    const membership = await UserClient.findOne({ userId: admin._id });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Client admin membership not found.',
      });
    }

    membership.status = status;
    await membership.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: status === 'inactive' ? 'deactivated' : 'reactivated',
      entityType: 'client_admin',
      entityId: admin._id,
      entityName: admin.name,
      description: status === 'inactive' ? 'Deactivated client admin account' : 'Reactivated client admin account',
      metadata: { status },
    });

    const refreshedMembership = await UserClient.findOne({ userId: admin._id }).populate('clientId').lean();

    res.json({
      success: true,
      message: status === 'inactive' ? 'Client admin deactivated successfully.' : 'Client admin reactivated successfully.',
      admin: buildAdminPayload(admin, refreshedMembership),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update client admin status.',
    });
  }
});

router.put('/:id', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { name, email, phone, village, clientId } = req.body;

    if (!name || !email || !phone || !village || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    const admin = await User.findOne({ _id: req.params.id, role: 'client_admin' });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Client admin not found.',
      });
    }

    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Selected client was not found.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: admin._id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    admin.name = name.trim();
    admin.email = normalizedEmail;
    admin.phone = phone.trim();
    admin.village = village.trim();
    await admin.save();

    await UserClient.findOneAndUpdate(
      { userId: admin._id },
      { clientId: client._id, roleInClient: 'client_admin', status: 'active' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const refreshedMembership = await UserClient.findOne({ userId: admin._id }).populate('clientId').lean();

    res.json({
      success: true,
      message: 'Client admin updated successfully.',
      admin: buildAdminPayload(admin, refreshedMembership),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update client admin.',
    });
  }
});

router.post('/', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { name, email, phone, village, password, confirmPassword, clientId } = req.body;

    if (!name || !email || !phone || !village || !password || !confirmPassword || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Selected client was not found.',
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      village: village.trim(),
      password: hashedPassword,
      role: 'client_admin',
    });

    await UserClient.create({
      userId: createdUser._id,
      clientId: client._id,
      roleInClient: 'client_admin',
      status: 'active',
    });

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: 'created',
      entityType: 'client_admin',
      entityId: createdUser._id,
      entityName: createdUser.name,
      description: 'Created client admin account',
      metadata: { clientId: client._id },
    });

    res.status(201).json({
      success: true,
      message: 'Client admin created successfully.',
      admin: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        village: createdUser.village,
        role: createdUser.role,
        clientId: client._id,
        clientName: client.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create client admin.',
    });
  }
});

export default router;
