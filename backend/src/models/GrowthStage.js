import mongoose from "mongoose";

const growthStageSchema = new mongoose.Schema(
  {
    // Can be associated with Crop or CropVariety
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
      index: true,
    },

    cropVarietyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropVariety",
      default: null,
      index: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    stageName: {
      type: String,
      required: true,
      trim: true,
    },

    stageNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    fertilizerRecommendation: {
      n: { type: Number, default: 0 },
      p: { type: Number, default: 0 },
      k: { type: Number, default: 0 },
      notes: { type: String, default: "", trim: true },
    },

    irrigationNotes: {
      frequency: { type: String, default: "", trim: true }, // e.g., "every 5 days"
      duration: { type: String, default: "", trim: true },   // e.g., "1-2 hours"
      method: { type: String, default: "", trim: true },     // e.g., "drip", "flood"
      notes: { type: String, default: "", trim: true },
    },

    pestManagement: {
      commonPests: [{ type: String, trim: true }],
      controlMeasures: { type: String, default: "", trim: true },
      recommendedProducts: [{ type: String, trim: true }],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdByName: {
      type: String,
      default: "",
    },

    createdByEmail: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "growthstages",
  }
);

// Compound index for unique stages per crop variant (if variety specified) or crop
growthStageSchema.index({ cropId: 1, cropVarietyId: 1, stageNumber: 1 }, { unique: true });

export default mongoose.model("GrowthStage", growthStageSchema);
