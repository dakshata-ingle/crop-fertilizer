import mongoose from "mongoose";

const userClientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    roleInClient: {
        type: String,
        enum: [
            "client_admin",
            "farmer",
            "field_officer",
            "agronomist"
        ],
        default: "farmer",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    joinedAt: {
        type: Date,
        default: Date.now,
        immutable: true,
   },
  },
  {
    timestamps: true,
  }
);

// One user can have only one entry per client
userClientSchema.index(
  { userId: 1, clientId: 1 },
  { unique: true }
);
userClientSchema.index({
  clientId: 1,
});
export default mongoose.model("UserClient", userClientSchema);