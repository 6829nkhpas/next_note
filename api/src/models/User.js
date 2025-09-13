import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);


