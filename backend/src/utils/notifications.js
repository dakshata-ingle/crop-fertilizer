import Notification from '../models/Notification.js';
import UserClient from '../models/UserClient.js';

export const createApprovalNotifications = async ({
  entityType,
  entityName,
  entityId,
  clientId,
  status,
  createdBy,
  actorId,
}) => {
  try {
    const memberships = await UserClient.find({ clientId, status: 'active' })
      .populate('userId', '_id name email role')
      .lean();

    const recipients = (memberships || [])
      .filter((membership) => membership.userId)
      .filter((membership) => ['client_admin', 'farmer'].includes(membership.roleInClient));

    const seenUsers = new Set();
    const uniqueRecipients = recipients.filter((membership) => {
      const userId = membership.userId?._id?.toString() || membership.userId?.toString();
      if (!userId || seenUsers.has(userId)) {
        return false;
      }
      seenUsers.add(userId);
      return true;
    });

    const actionLabel = status === 'approved' ? 'approved' : 'requires revision';
    const title = status === 'approved'
      ? `${entityType === 'crop' ? 'Crop' : 'Fertilizer'} approved`
      : `${entityType === 'crop' ? 'Crop' : 'Fertilizer'} update needed`;
    const message = `${entityName} has been ${actionLabel}. ${status === 'approved' ? 'It is now available for use.' : 'Please review the submission details and resubmit if needed.'}`;

    const notifications = uniqueRecipients.map((membership) => ({
      userId: membership.userId._id,
      role: membership.roleInClient,
      type: status === 'approved' ? `${entityType}_approved` : `${entityType}_rejected`,
      title,
      message,
      metadata: {
        entityType,
        entityName,
        entityId,
        clientId,
        status,
        createdBy,
        actorId,
      },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications;
  } catch (error) {
    console.error('Failed to create approval notifications:', error.message);
    return [];
  }
};
