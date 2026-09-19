import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Fertilizer.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../utils/notifications.js', () => ({
  createApprovalNotifications: vi.fn().mockResolvedValue(undefined),
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

import Fertilizer from '../models/Fertilizer.js';
import fertilizerApprovalsRouter from './fertilizerApprovals.js';

describe('fertilizer approvals routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/fertilizer-approvals', fertilizerApprovalsRouter);
  });

  it('approves a pending fertilizer and records the status update', async () => {
    const fertilizerDoc = {
      _id: 'fert-1',
      name: 'Urea',
      clientId: 'client-1',
      createdBy: 'user-2',
      save: vi.fn().mockResolvedValue(undefined),
    };

    Fertilizer.findById.mockResolvedValue(fertilizerDoc);

    const response = await request(app)
      .patch('/fertilizer-approvals/fert-1/status')
      .send({ status: 'approved' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.fertilizer.status).toBe('approved');
  });
});
