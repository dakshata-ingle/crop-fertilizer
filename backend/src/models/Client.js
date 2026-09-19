import mongoose from "mongoose";
import validator from "validator";

const clientSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      unique: true,
    },

    code: {
      type: String,
      required: [true, "Client code is required"],
      trim: true,
      uppercase: true,
      unique: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Contact Information
    email: {
      type: String,
      required: [true, "Client email is required"],
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    // Branding
    logo: {
      type: String,
      default: "",
    },

    primaryColor: {
      type: String,
      default: "#2E7D32",
    },

    secondaryColor: {
      type: String,
      default: "#4CAF50",
    },

    // Approval Workflow
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "inactive",
      ],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
clientSchema.index(
  {
    code: 1,
  },
  {
    unique: true,
  }
);

clientSchema.index(
  {
    name: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model("Client", clientSchema);