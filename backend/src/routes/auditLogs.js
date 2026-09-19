import express from 'express';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

router.get('/', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const auditLogs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      auditLogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch audit logs.',
    });
  }
});

export default router;
