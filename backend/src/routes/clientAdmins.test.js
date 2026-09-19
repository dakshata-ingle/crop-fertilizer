import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../models/Client.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../models/UserClient.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('../utils/auditLogger.js', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../middleware/auth.js', () => ({
  default: (req, _res, next) => {
    req.userId = 'user-1';
    req.userRole = 'super_admin';
    req.clientId = 'client-1';
    req.user = { name: 'Test Admin' };
    next();
  },
}));

vi.mock('../middleware/authorize.js', () => ({
  default: () => (_req, _res, next) => next(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
}));

import User from '../models/User.js';
import Client from '../models/Client.js';
import UserClient from '../models/UserClient.js';
import clientAdminsRouter from './clientAdmins.js';

describe('client admins routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/client-admins', clientAdminsRouter);
  });

  it('creates a client admin account for a selected client', async () => {
    Client.findById.mockResolvedValue({ _id: 'client-1', name: 'Acme' });
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567890',
      village: 'Village',
      role: 'client_admin',
    });
    UserClient.create.mockResolvedValue({});

    const response = await request(app)
      .post('/client-admins')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '1234567890',
        village: 'Village',
        password: 'password123',
        confirmPassword: 'password123',
        clientId: 'client-1',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.admin.clientId).toBe('client-1');
  });

  it('updates the admin membership status', async () => {
    const membershipDoc = {
      _id: 'membership-1',
      userId: 'admin-1',
      status: 'active',
      save: vi.fn().mockResolvedValue(undefined),
    };

    const membershipQuery = {
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'membership-1',
          status: 'inactive',
          clientId: { _id: 'client-1', name: 'Acme' },
        }),
      }),
    };

    let findOneCount = 0;
    User.findOne.mockResolvedValue({ _id: 'admin-1', name: 'Admin User', role: 'client_admin' });
    UserClient.findOne.mockImplementation(() => {
      findOneCount += 1;
      return findOneCount === 1 ? membershipDoc : membershipQuery;
    });

    const response = await request(app)
      .patch('/client-admins/admin-1/status')
      .send({ status: 'inactive' });

    if (response.status !== 200) {
      console.log(response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.admin.status).toBe('inactive');
  });
});
