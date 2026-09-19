import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../controllers/clientController.js', () => ({
  createClient: vi.fn((req, res) => res.status(201).json({ success: true, message: 'Client created successfully.' })),
  getActiveClientsForSignup: vi.fn((req, res) => res.status(200).json({ success: true, clients: [{ _id: 'client-1', name: 'Acme' }] })),
  getAllClients: vi.fn((req, res) => res.status(200).json({ success: true, clients: [] })),
  getClientById: vi.fn((req, res) => res.status(200).json({ success: true, client: { id: req.params.id } })),
  updateClient: vi.fn((req, res) => res.status(200).json({ success: true, message: 'Client updated successfully.' })),
  updateClientStatus: vi.fn((req, res) => res.status(200).json({ success: true, message: 'Client status updated.' })),
  toggleClientActiveStatus: vi.fn((req, res) => res.status(200).json({ success: true, message: 'Client active status updated.' })),
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

vi.mock('../utils/upload.js', () => ({
  upload: { single: () => (_req, _res, next) => next() },
}));

import clientsRouter from './clients.js';

describe('clients routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/clients', clientsRouter);
  });

  it('routes create requests through the controller', async () => {
    const response = await request(app)
      .post('/clients')
      .send({ name: 'Acme', code: 'ACME', email: 'info@acme.com' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('routes list requests through the controller', async () => {
    const response = await request(app).get('/clients');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('returns active clients for public signup', async () => {
    const response = await request(app).get('/clients/public/active');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.clients).toHaveLength(1);
  });

  it('routes detail requests through the controller', async () => {
    const response = await request(app).get('/clients/client-1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.client.id).toBe('client-1');
  });

  it('routes update requests through the controller', async () => {
    const response = await request(app)
      .put('/clients/client-1')
      .send({ name: 'Acme Updated', code: 'ACME', email: 'info@acme.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
