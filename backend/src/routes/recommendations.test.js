import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../models/Recommendation.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

import app from '../server.js';
import Recommendation from '../models/Recommendation.js';
import jwt from 'jsonwebtoken';

describe('recommendations endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('saves a recommendation when a valid token is provided', async () => {
    jwt.verify.mockReturnValue({ userId: 'user-1', clientId: 'client-1' });
    Recommendation.create.mockResolvedValue({
      _id: 'rec-1',
      userId: 'user-1',
      clientId: 'client-1',
      crop: 'maize',
      isBookmarked: false,
    });

    const response = await request(app)
      .post('/api/recommendations')
      .send({ token: 'fake-token', crop: 'maize' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.recommendation._id).toBe('rec-1');
  });

  it('bookmarks a recommendation for an authenticated user', async () => {
    jwt.verify.mockReturnValue({ userId: 'user-1', clientId: 'client-1' });
    Recommendation.findOne.mockResolvedValue({
      _id: 'rec-1',
      userId: 'user-1',
      clientId: 'client-1',
      isBookmarked: false,
      save: vi.fn().mockResolvedValue(undefined),
    });

    const response = await request(app)
      .patch('/api/recommendations/rec-1/bookmark')
      .set('Authorization', 'Bearer fake-token')
      .send({ isBookmarked: true });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recommendation.isBookmarked).toBe(true);
  });

  it('returns recommendation history for the authenticated user', async () => {
    jwt.verify.mockReturnValue({ userId: 'user-1', clientId: 'client-1' });
    Recommendation.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { _id: 'rec-1', crop: 'maize', userId: 'user-1', clientId: 'client-1' },
      ]),
    });

    const response = await request(app)
      .get('/api/recommendations')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recommendations).toHaveLength(1);
  });
});
