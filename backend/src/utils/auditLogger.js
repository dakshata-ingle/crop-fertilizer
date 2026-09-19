import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const logAuditEvent = async ({ actorId, actorName, actorRole, action, entityType, entityId, entityName, description, metadata = {} }) => {
  try {
    if (!actorId || !entityId) {
      return null;
    }

    const actor = await User.findById(actorId).select('name role').lean();

    const logEntry = await AuditLog.create({
      actorId,
      actorName: actorName || actor?.name || 'System',
      actorRole: actorRole || actor?.role || '',
      action,
      entityType,
      entityId,
      entityName: entityName || 'Unknown',
      description,
      metadata,
    });

    return logEntry;
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
    return null;
  }
};
