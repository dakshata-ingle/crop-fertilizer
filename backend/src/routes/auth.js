import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/auth.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import UserClient from '../models/UserClient.js';
import { buildPaginationMeta, buildSortOptions, buildTextSearch, parsePagination } from '../utils/queryParams.js';
const router = express.Router();

// Signup (Farmers only)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone, village, registerUnder = 'individual', loginType = 'farmer' } = req.body;

    // Only farmers can signup
    if (loginType !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Signup is only available for farmers. Admin users must be created by super admins.',
      });
    }

    // Validation
    if (!name || !email || !password || !confirmPassword || !phone || !village) {
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
   
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login instead.',
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create farmer user
    const newUserData = {
      name,
      email,
      phone,
      village,
      password: hashedPassword,
      role: 'farmer',
    };

    const user = await User.create(newUserData);
    // Find default client
    const defaultClient = await Client.findOne({
      code: 'DEFAULT',
    });

    if (!defaultClient) {
      throw new Error('Default client not found.');
    }

    const selectedClientId = typeof registerUnder === 'string' && registerUnder !== 'individual'
      ? registerUnder
      : null;

    if (selectedClientId && !mongoose.isValidObjectId(selectedClientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client selection.',
      });
    }

    const selectedClient = selectedClientId
      ? await Client.findOne({
          _id: selectedClientId,
          isActive: true,
          status: 'approved',
        })
      : null;

    if (selectedClientId && !selectedClient) {
      return res.status(400).json({
        success: false,
        message: 'Selected client is not available for registration.',
      });
    }

    const assignedClient = selectedClient || defaultClient;

    // Create UserClient mapping
    await UserClient.create({
      userId: user._id,
      clientId: assignedClient._id,
      roleInClient: 'farmer',
    });
    // Generate token
    const token = jwt.sign(
    {
    userId: user._id,
    role: user.role,
    clientId: assignedClient._id,
},
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        village: user.village,
        role: user.role,
        clientId: assignedClient._id,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Signup failed.',
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, loginType = 'farmer' } = req.body;
    const allowedRoles = ['farmer', 'client_admin', 'super_admin'];

    if (!allowedRoles.includes(loginType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid login type.',
      });
    }
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email, password, or login type.',
      });
    }

    // Compare password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email, password, or login type.',
      });
    }

    if (user.role !== loginType) {
      return res.status(403).json({
        success: false,
        message: 'Invalid email, password, or login type.',
      });
    }

    let clientId = null;

    if (user.role === 'client_admin' || user.role === 'farmer') {
      const membershipQuery = {
        userId: user._id,
        status: 'active',
        roleInClient: user.role,
      };

      const membership = await UserClient.findOne(membershipQuery);

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'User is not assigned to any active client role.',
        });
      }

      clientId = membership.clientId;
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        clientId: user.role === 'super_admin' ? null : clientId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        village: user.village,
        role: user.role,
        clientId: clientId,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed.',
    });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        village: user.village,
        role: user.role,
        clientId: req.clientId,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user.',
    });
  }
});

// Admin-only: list all users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admins only.',
      });
    }

    const search = req.query.search || '';
    const role = req.query.role || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const { page, limit, hasPaginationRequest } = parsePagination(req.query);

    const query = {
      ...buildTextSearch(search, ['name', 'email', 'phone', 'village']),
    };

    if (role) {
      query.role = role;
    }

    const totalItems = await User.countDocuments(query);
    const baseQuery = User.find(query, '-password')
      .sort(buildSortOptions({ sortBy, sortOrder, fallbackField: 'createdAt', allowedFields: ['name', 'email', 'phone', 'village', 'createdAt'] }));
    const users = hasPaginationRequest
      ? await baseQuery.skip((page - 1) * limit).limit(limit).lean()
      : await baseQuery.lean();

    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      village: user.village,
      role: user.role,
      clientId: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json({
      success: true,
      users: formattedUsers,
      count: totalItems,
      pagination: buildPaginationMeta({ page, limit, totalItems, hasPaginationRequest }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
    });
  }
});

export default router;
