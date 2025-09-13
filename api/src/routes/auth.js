import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Tenant } from "../models/Tenant.js";
import { signJwt } from "../utils/jwt.js";
import { loginLimiter } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "missing_credentials" });
  const user = await User.findOne({ email }).lean();
  if (!user) return res.status(401).json({ error: "invalid_credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });
  const token = signJwt({ sub: String(user._id), tenantId: String(user.tenantId), role: user.role, plan: user.plan || "free" });
  const tenant = await Tenant.findById(user.tenantId).lean();
  res.json({ token, user: { id: String(user._id), email: user.email, role: user.role, plan: user.plan || "free" }, tenant: { id: String(tenant._id), slug: tenant.slug, name: tenant.name, plan: tenant.plan } });
});

export default router;


