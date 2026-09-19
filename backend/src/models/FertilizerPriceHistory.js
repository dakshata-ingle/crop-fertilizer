import mongoose from 'mongoose';

const fertilizerPriceHistorySchema = new mongoose.Schema(
  {
    fertilizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fertilizer',
      required: true,
      index: true,
    },
    previousPrice: {
      type: Number,
      default: 0,
    },
    newPrice: {
      type: Number,
      default: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('FertilizerPriceHistory', fertilizerPriceHistorySchema);
