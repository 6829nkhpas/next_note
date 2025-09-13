import express from "express";
import bcrypt from "bcryptjs";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { Note } from "../models/Note.js";
import {
  requireAuth,
  requireRole,
  requireTenantIsolation,
} from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/:slug/upgrade",
  requireAuth,
  requireTenantIsolation,
  requireRole("admin"),
  async (req, res) => {
    const { tenantId } = req.auth;
    const { slug } = req.params;
    const { plan } = req.body || {};
    const newPlan = plan === "free" ? "free" : "pro";
    const tenant = await Tenant.findOneAndUpdate(
      { _id: tenantId, slug },
      { $set: { plan: newPlan } },
      { new: true }
    ).lean();
    if (!tenant) return res.status(404).json({ error: "not_found" });
    res.json({
      id: String(tenant._id),
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.plan,
    });
  }
);

// Admin invite endpoint
router.post(
  "/:slug/invite",
  requireAuth,
  requireTenantIsolation,
  requireRole("admin"),
  async (req, res) => {
    const { tenantId } = req.auth;
    const { slug } = req.params;
    const { email, role } = req.body || {};
    if (!email || !role) return res.status(400).json({ error: "invalid_body" });
    const tenant = await Tenant.findOne({ _id: tenantId, slug }).lean();
    if (!tenant) return res.status(404).json({ error: "not_found" });
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: "user_exists" });
    const passwordHash = await bcrypt.hash("password", 10);
    const user = await User.create({ email, role, tenantId, passwordHash });
    res
      .status(201)
      .json({ id: String(user._id), email: user.email, role: user.role });
  }
);

// List users in tenant (admin only)
router.get(
  "/:slug/users",
  requireAuth,
  requireTenantIsolation,
  requireRole("admin"),
  async (req, res) => {
    const { tenantId } = req.auth;
    const { slug } = req.params;
    const tenant = await Tenant.findOne({ _id: tenantId, slug }).lean();
    if (!tenant) return res.status(404).json({ error: "not_found" });
    const users = await User.find({ tenantId })
      .select({ email: 1, role: 1, plan: 1 })
      .lean();
    res.json({
      users: users.map((u) => ({
        id: String(u._id),
        email: u.email,
        role: u.role,
        plan: u.plan || "free",
      })),
    });
  }
);

// Toggle user plan (admin only)
router.post(
  "/:slug/users/:userId/toggle-plan",
  requireAuth,
  requireTenantIsolation,
  requireRole("admin"),
  async (req, res) => {
    const { tenantId } = req.auth;
    const { slug, userId } = req.params;
    const tenant = await Tenant.findOne({ _id: tenantId, slug }).lean();
    if (!tenant) return res.status(404).json({ error: "not_found" });

    const user = await User.findOne({ _id: userId, tenantId }).lean();
    if (!user) return res.status(404).json({ error: "user_not_found" });

    // Don't allow changing admin plans - admins are always pro
    if (user.role === "admin") {
      return res.status(400).json({ error: "cannot_change_admin_plan" });
    }

    const newPlan = user.plan === "free" ? "pro" : "free";
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, tenantId },
      { $set: { plan: newPlan } },
      { new: true }
    )
      .select({ email: 1, role: 1, plan: 1 })
      .lean();

    res.json({
      id: String(updatedUser._id),
      email: updatedUser.email,
      role: updatedUser.role,
      plan: updatedUser.plan,
    });
  }
);

// Delete user (admin only) - but not other admins
router.delete(
  "/:slug/users/:userId",
  requireAuth,
  requireTenantIsolation,
  requireRole("admin"),
  async (req, res) => {
    const { tenantId, sub } = req.auth;
    const { slug, userId } = req.params;
    const tenant = await Tenant.findOne({ _id: tenantId, slug }).lean();
    if (!tenant) return res.status(404).json({ error: "not_found" });

    const user = await User.findOne({ _id: userId, tenantId }).lean();
    if (!user) return res.status(404).json({ error: "user_not_found" });

    // Don't allow deleting other admins
    if (user.role === "admin") {
      return res.status(400).json({ error: "cannot_delete_admin" });
    }

    // Don't allow deleting yourself
    if (String(user._id) === String(sub)) {
      return res.status(400).json({ error: "cannot_delete_self" });
    }

    // Delete user and all their notes
    await Promise.all([
      User.deleteOne({ _id: userId, tenantId }),
      Note.deleteMany({ createdBy: userId, tenantId })
    ]);

    res.status(204).end();
  }
);

export default router;
