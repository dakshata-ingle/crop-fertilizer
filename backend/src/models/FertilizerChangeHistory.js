import mongoose from 'mongoose';

const fertilizerChangeHistorySchema = new mongoose.Schema(
  {
    fertilizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fertilizer',
      required: true,
      index: true,
    },
    fieldName: {
      type: String,
      required: true,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedByEmail: {
      type: String,
      default: null,
    },
    updatedByName: {
      type: String,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export default mongoose.model('FertilizerChangeHistory', fertilizerChangeHistorySchema);
