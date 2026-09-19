import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Fertilizer.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../models/FertilizerPriceHistory.js', () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../models/FertilizerChangeHistory.js', () => ({
  default: {
    insertMany: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('../utils/auditLogger.js', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../middleware/auth.js', () => ({
  default: (req, _res, next) => {
    const role = req.get('x-user-role') || 'client_admin';
    req.userId = 'user-1';
    req.userRole = role;
    req.user = { name: 'Test Admin' };
    req.clientId = role === 'super_admin' ? undefined : 'client-1';
    next();
  },
}));

vi.mock('../middleware/authorize.js', () => ({
  default: () => (_req, _res, next) => next(),
}));

vi.mock('../models/Client.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('../utils/upload.js', () => ({
  upload: { single: () => (_req, _res, next) => next() },
  getUploadUrl: vi.fn(() => '/uploads/test.jpg'),
}));

import Fertilizer from '../models/Fertilizer.js';
import FertilizerPriceHistory from '../models/FertilizerPriceHistory.js';
import FertilizerChangeHistory from '../models/FertilizerChangeHistory.js';
import Client from '../models/Client.js';
import fertilizersRouter from './fertilizers.js';

describe('fertilizers routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    Fertilizer.findById.mockResolvedValue(null);
    app = express();
    app.use(express.json());
    app.use('/fertilizers', fertilizersRouter);
  });

  it('creates a fertilizer as client_admin and returns it in the response', async () => {
    Fertilizer.findOne.mockResolvedValue(null);
    Fertilizer.create.mockResolvedValue({
      _id: 'fert-1',
      name: 'Urea',
      clientId: 'client-1',
      createdBy: 'user-1',
      isActive: true,
      status: 'pending',
    });

    const response = await request(app)
      .post('/fertilizers')
      .send({ name: 'Urea' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.fertilizer.name).toBe('Urea');
  });

  it('allows super_admin to create a fertilizer with explicit clientId', async () => {
    Fertilizer.findOne.mockResolvedValue(null);
    Client.findById.mockResolvedValue({ _id: 'client-2' });
    Fertilizer.create.mockResolvedValue({
      _id: 'fert-2',
      name: 'DAP',
      clientId: 'client-2',
      createdBy: 'user-1',
      isActive: true,
      status: 'approved',
    });

    const response = await request(app)
      .post('/fertilizers')
      .set('x-user-role', 'super_admin')
      .send({ name: 'DAP', clientId: 'client-2' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.fertilizer.status).toBe('approved');
    expect(response.body.fertilizer.clientId).toBe('client-2');
  });

  it('updates fertilizer composition and micronutrients for super_admin', async () => {
    const fertilizerDoc = {
      _id: 'fert-3',
      clientId: 'client-1',
      name: 'NPK Plus',
      n: 10,
      p: 20,
      k: 30,
      bagWeight: 50,
      price: 100,
      description: 'Old description',
      micronutrients: {
        sulfur: 0,
        zinc: 0,
        boron: 0,
        iron: 0,
        manganese: 0,
        copper: 0,
      },
      save: vi.fn().mockResolvedValue(true),
    };

    Fertilizer.findOne.mockResolvedValue(fertilizerDoc);

    const response = await request(app)
      .put('/fertilizers/fert-3')
      .set('x-user-role', 'super_admin')
      .send({
        n: 15,
        p: 25,
        k: 35,
        sulfur: 2,
        zinc: 3,
        boron: 1,
        iron: 4,
        manganese: 5,
        copper: 6,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(fertilizerDoc.n).toBe(15);
    expect(fertilizerDoc.p).toBe(25);
    expect(fertilizerDoc.k).toBe(35);
    expect(fertilizerDoc.micronutrients.sulfur).toBe(2);
    expect(fertilizerDoc.micronutrients.zinc).toBe(3);
    expect(fertilizerDoc.micronutrients.boron).toBe(1);
    expect(fertilizerDoc.micronutrients.iron).toBe(4);
    expect(fertilizerDoc.micronutrients.manganese).toBe(5);
    expect(fertilizerDoc.micronutrients.copper).toBe(6);
  });

  it('filters fertilizers by client for super_admin', async () => {
    Fertilizer.countDocuments.mockResolvedValue(1);
    Fertilizer.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: 'fert-5', clientId: 'client-2', name: 'Potash', isActive: true, status: 'approved' }]),
    });

    const response = await request(app)
      .get('/fertilizers')
      .set('x-user-role', 'super_admin')
      .query({ clientId: 'client-2' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Fertilizer.find).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'client-2' }));
  });

  it('toggles fertilizer active status without changing approval state', async () => {
    const fertilizerDoc = {
      _id: 'fert-4',
      clientId: 'client-1',
      name: 'Bio Feed',
      status: 'approved',
      isActive: true,
      save: vi.fn().mockResolvedValue(true),
    };

    Fertilizer.findById.mockResolvedValue(fertilizerDoc);

    const response = await request(app)
      .patch('/fertilizers/fert-4/status')
      .set('x-user-role', 'super_admin')
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(fertilizerDoc.isActive).toBe(false);
    expect(fertilizerDoc.status).toBe('approved');
  });

  it('records a price history entry when a super_admin changes the fertilizer price', async () => {
    const fertilizerDoc = {
      _id: 'fert-7',
      clientId: 'client-1',
      name: 'Price Test',
      price: 120,
      micronutrients: {},
      save: vi.fn().mockResolvedValue(true),
    };

    Fertilizer.findOne.mockResolvedValue(fertilizerDoc);
    FertilizerPriceHistory.create.mockResolvedValue({ _id: 'history-1' });

    const response = await request(app)
      .put('/fertilizers/fert-7')
      .set('x-user-role', 'super_admin')
      .send({ price: 150 });

    expect(response.status).toBe(200);
    expect(FertilizerPriceHistory.create).toHaveBeenCalledWith(expect.objectContaining({
      fertilizerId: 'fert-7',
      previousPrice: 120,
      newPrice: 150,
    }));
  });

  it('soft deletes a fertilizer for super_admin', async () => {
    const fertilizerDoc = {
      _id: 'fert-6',
      clientId: 'client-1',
      name: 'Soft Feed',
      isActive: true,
      save: vi.fn().mockResolvedValue(true),
    };

    Fertilizer.findOne.mockResolvedValue(fertilizerDoc);

    const response = await request(app)
      .patch('/fertilizers/fert-6/soft-delete')
      .set('x-user-role', 'super_admin');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(fertilizerDoc.isActive).toBe(false);
  });
});
