import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Crop.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../utils/auditLogger.js', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/notifications.js', () => ({
  createApprovalNotifications: vi.fn().mockResolvedValue(undefined),
}));

let currentUserRole = 'client_admin';
vi.mock('../middleware/auth.js', () => ({
  default: (req, _res, next) => {
    req.userId = 'user-1';
    req.userRole = currentUserRole;
    req.clientId = 'client-1';
    req.user = { name: 'Test Admin' };
    next();
  },
}));

vi.mock('../middleware/authorize.js', () => ({
  default: () => (_req, _res, next) => next(),
}));

vi.mock('../utils/upload.js', () => ({
  upload: { single: () => (_req, _res, next) => next() },
  getUploadUrl: vi.fn(() => '/uploads/test.jpg'),
}));

import Crop from '../models/Crop.js';
import cropsRouter from './crops.js';

describe('crops routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/crops', cropsRouter);
  });

  it('creates a crop and returns the created record', async () => {
    Crop.findOne.mockResolvedValue(null);
    Crop.create.mockResolvedValue({
      _id: 'crop-1',
      name: 'Maize',
      clientId: 'client-1',
      createdBy: 'user-1',
      isActive: true,
      status: 'pending',
    });

    const response = await request(app)
      .post('/crops')
      .send({ name: 'Maize', clientId: 'client-1' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.crop.name).toBe('Maize');
  });

  it('allows super_admin to list crops across clients and filter by client', async () => {
    currentUserRole = 'super_admin';
    Crop.countDocuments.mockResolvedValue(1);
    Crop.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: 'crop-2', name: 'Wheat', clientId: 'client-2', status: 'approved', isActive: true }]),
    });

    const response = await request(app)
      .get('/crops')
      .query({ clientId: 'client-2' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Crop.find).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'client-2' }));
  });

  it('toggles crop active status without changing approval state', async () => {
    currentUserRole = 'super_admin';
    const cropDoc = {
      _id: 'crop-3',
      name: 'Rice',
      status: 'approved',
      isActive: true,
      save: vi.fn().mockResolvedValue(undefined),
    };

    Crop.findById.mockResolvedValue(cropDoc);

    const response = await request(app)
      .patch('/crops/crop-3/active-status')
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(cropDoc.isActive).toBe(false);
    expect(cropDoc.status).toBe('approved');
  });

  it('approves a crop and returns the approved record', async () => {
    currentUserRole = 'super_admin';
    Crop.findById.mockResolvedValue({
      _id: 'crop-1',
      name: 'Maize',
      status: 'pending',
      createdBy: 'user-1',
      clientId: 'client-1',
      save: vi.fn().mockResolvedValue(undefined),
    });

    const response = await request(app)
      .patch('/crops/crop-1/status')
      .send({ status: 'approved' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.crop.status).toBe('approved');
  });
});
