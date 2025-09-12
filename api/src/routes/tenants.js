import express from "express";
import { Tenant } from "../models/Tenant.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/:slug/upgrade", requireAuth, requireRole("admin"), async (req, res) => {
  const { tenantId } = req.auth;
  const { slug } = req.params;
  const tenant = await Tenant.findOneAndUpdate(
    { _id: tenantId, slug },
    { $set: { plan: "pro" } },
    { new: true }
  ).lean();
  if (!tenant) return res.status(404).json({ error: "not_found" });
  res.json({ id: String(tenant._id), slug: tenant.slug, name: tenant.name, plan: tenant.plan });
});

export default router;


