import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notifications.',
    });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read.',
    });
  }
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notifications as read.',
    });
  }
});

export default router;
