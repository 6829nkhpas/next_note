import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    plan: { type: String, enum: ["free", "pro"], default: "free", index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);


