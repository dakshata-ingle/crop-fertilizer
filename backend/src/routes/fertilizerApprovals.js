import express from 'express';
import authMiddleware from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import Fertilizer from '../models/Fertilizer.js';
import { createApprovalNotifications } from '../utils/notifications.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

router.get('/pending', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const fertilizers = await Fertilizer.find({
      status: 'pending',
      isActive: true,
    })
      .populate('clientId', 'name code email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      fertilizers: fertilizers.map((fertilizer) => ({
        ...fertilizer,
        clientName: fertilizer.clientId?.name || 'Unassigned',
        clientCode: fertilizer.clientId?.code || '—',
        createdByName: fertilizer.createdBy?.name || 'Unknown',
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending fertilizers.',
    });
  }
});

router.patch('/:id/status', authMiddleware, authorize('super_admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fertilizer status.',
      });
    }

    const fertilizer = await Fertilizer.findById(req.params.id);

    if (!fertilizer) {
      return res.status(404).json({
        success: false,
        message: 'Fertilizer not found.',
      });
    }

    fertilizer.status = status;
    fertilizer.approvedBy = req.userId;
    fertilizer.approvedAt = new Date();
    await fertilizer.save();

    await logAuditEvent({
      actorId: req.userId,
      actorName: req.user?.name || 'System',
      actorRole: req.userRole,
      action: status === 'approved' ? 'approved' : 'rejected',
      entityType: 'fertilizer',
      entityId: fertilizer._id,
      entityName: fertilizer.name,
      description: status === 'approved' ? 'Approved fertilizer record' : 'Rejected fertilizer record',
      metadata: { status },
    });

    await createApprovalNotifications({
      entityType: 'fertilizer',
      entityName: fertilizer.name,
      entityId: fertilizer._id,
      clientId: fertilizer.clientId,
      status,
      createdBy: fertilizer.createdBy,
      actorId: req.userId,
    });

    res.json({
      success: true,
      message: status === 'approved' ? 'Fertilizer approved successfully.' : 'Fertilizer rejected successfully.',
      fertilizer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update fertilizer status.',
    });
  }
});

export default router;
