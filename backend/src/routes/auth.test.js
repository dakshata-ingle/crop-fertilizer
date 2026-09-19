import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../models/Client.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('../models/UserClient.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
  },
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

import User from '../models/User.js';
import Client from '../models/Client.js';
import UserClient from '../models/UserClient.js';
import authRouter from './auth.js';

describe('auth routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  it('creates a new farmer account and returns a token', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'new-user',
      name: 'Farmer One',
      email: 'farmer@example.com',
      phone: '1234567890',
      village: 'Village',
      role: 'farmer',
    });
    Client.findOne.mockResolvedValue({ _id: 'client-1' });
    UserClient.create.mockResolvedValue({});

    const response = await request(app)
      .post('/auth/signup')
      .send({
        name: 'Farmer One',
        email: 'farmer@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '1234567890',
        village: 'Village',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.role).toBe('farmer');
  });

  it('creates a new farmer account under a selected client when provided', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'new-user',
      name: 'Farmer One',
      email: 'farmer@example.com',
      phone: '1234567890',
      village: 'Village',
      role: 'farmer',
    });
    Client.findOne
      .mockResolvedValueOnce({ _id: 'default-client', code: 'DEFAULT' })
      .mockResolvedValueOnce({ _id: '64b64b64b64b64b64b64b64b', isActive: true, status: 'approved' });
    UserClient.create.mockResolvedValue({});

    const response = await request(app)
      .post('/auth/signup')
      .send({
        name: 'Farmer One',
        email: 'farmer@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '1234567890',
        village: 'Village',
        registerUnder: '64b64b64b64b64b64b64b64b',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.clientId).toBe('64b64b64b64b64b64b64b64b');
    expect(UserClient.create).toHaveBeenCalledWith(expect.objectContaining({ clientId: '64b64b64b64b64b64b64b64b' }));
  });

  it('returns the current user for authenticated requests', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-1',
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '111',
      village: 'Village',
      role: 'super_admin',
    });

    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.name).toBe('Test Admin');
  });

  it('logs in a user with valid credentials and returns a token', async () => {
    User.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: 'user-1',
        email: 'admin@example.com',
        password: 'hashed-password',
        role: 'super_admin',
      }),
    });
    vi.mocked(UserClient.findOne).mockResolvedValue({ clientId: 'client-1', roleInClient: 'super_admin', status: 'active' });
    const bcryptjs = await import('bcryptjs');
    vi.spyOn(bcryptjs.default, 'compare').mockResolvedValue(true);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password123', loginType: 'super_admin' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeTruthy();
  });

  it('rejects login attempts when the requested role does not match the user role', async () => {
    User.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: 'user-2',
        email: 'farmer@example.com',
        password: 'hashed-password',
        role: 'farmer',
      }),
    });
    const bcryptjs = await import('bcryptjs');
    vi.spyOn(bcryptjs.default, 'compare').mockResolvedValue(true);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'farmer@example.com', password: 'password123', loginType: 'super_admin' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('lists users for super admins', async () => {
    User.countDocuments.mockResolvedValue(1);
    User.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'user-1',
            name: 'Test Admin',
            email: 'admin@example.com',
            phone: '111',
            village: 'Village',
            role: 'super_admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      }),
    });

    const response = await request(app).get('/auth/users');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.users).toHaveLength(1);
  });
});
