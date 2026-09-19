import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: {
      type: String,
      default: '',
      trim: true,
    },
    actorRole: {
      type: String,
      default: '',
      trim: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'approved', 'rejected', 'deactivated', 'reactivated'],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['client', 'client_admin', 'crop', 'fertilizer'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
