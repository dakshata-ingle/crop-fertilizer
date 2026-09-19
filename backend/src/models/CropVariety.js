import mongoose from "mongoose";

const cropVarietySchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
      index: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    maturityDays: {
      type: Number,
      default: 0,
    },

    yieldPerHectare: {
      type: Number,
      default: 0,
    },

    resistances: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

cropVarietySchema.index(
  { cropId: 1, code: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("CropVariety", cropVarietySchema);
