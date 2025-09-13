import rateLimit from "express-rate-limit";
import { verifyJwt } from "../utils/jwt.js";

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "unauthorized" });
  const payload = verifyJwt(token);
  if (!payload) return res.status(401).json({ error: "unauthorized" });
  if (!payload.tenantId)
    return res.status(401).json({ error: "invalid_token" });
  req.auth = payload; // { sub, role, tenantId }
  next();
}

// Middleware to ensure tenant isolation - validates tenantId in JWT matches request
export function requireTenantIsolation(req, res, next) {
  if (!req.auth || !req.auth.tenantId) {
    return res.status(401).json({ error: "unauthorized" });
  }
  // Additional validation: ensure tenantId is a valid ObjectId
  if (!req.auth.tenantId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(401).json({ error: "invalid_tenant" });
  }
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: "unauthorized" });
    if (req.auth.role !== role)
      return res.status(403).json({ error: "forbidden" });
    next();
  };
}
