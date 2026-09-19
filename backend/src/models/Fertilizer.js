import mongoose from "mongoose";

const fertilizerSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    fertilizerId: {
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

    n: {
      type: Number,
      default: 0,
    },

    p: {
      type: Number,
      default: 0,
    },

    k: {
      type: Number,
      default: 0,
    },

    bagWeight: {
      type: Number,
      default: 50,
    },

    price: {
      type: Number,
      default: 0,
    },

    micronutrients: {
      sulfur: { type: Number, default: 0 },
      zinc: { type: Number, default: 0 },
      boron: { type: Number, default: 0 },
      iron: { type: Number, default: 0 },
      manganese: { type: Number, default: 0 },
      copper: { type: Number, default: 0 },
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
fertilizerSchema.index(
  { clientId: 1, fertilizerId: 1 },
  { unique: true }
);
export default mongoose.model("Fertilizer", fertilizerSchema);