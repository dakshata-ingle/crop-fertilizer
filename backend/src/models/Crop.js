import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    cropId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    botanicalName: {
      type: String,
      default: "",
      trim: true,
    },

    npk: {
      n: { type: Number, default: 0 },
      p: { type: Number, default: 0 },
      k: { type: Number, default: 0 },
    },

    customDose: {
      n: { type: Number, default: 0 },
      p: { type: Number, default: 0 },
      k: { type: Number, default: 0 },
    },

    varieties: {
      type: [String],
      default: [],
    },

    growthStages: {
      type: [String],
      default: [],
    },

    growthPeriodDays: {
      type: Number,
      default: 0,
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
    },
    description: {
        type: String,
        default: "",
        trim: true,
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
cropSchema.index(
  { clientId: 1, cropId: 1 },
  { unique: true }
);
export default mongoose.model("Crop", cropSchema);