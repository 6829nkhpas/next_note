import express from "express";
import { Note } from "../models/Note.js";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { requireAuth, requireTenantIsolation } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireTenantIsolation);

router.get("/", async (req, res) => {
  const { tenantId, sub } = req.auth;
  // Only get notes created by the current user
  const notes = await Note.find({ tenantId, createdBy: sub })
    .sort({ created_at: -1 })
    .lean();
  res.json({ notes: notes.map((n) => ({ ...n, id: String(n._id) })) });
});

router.post("/", async (req, res) => {
  const { tenantId, sub } = req.auth;
  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) return res.status(400).json({ error: "invalid_tenant" });

  // Check user's individual plan, not tenant plan
  const user = await User.findById(sub).lean();
  if (!user) return res.status(400).json({ error: "invalid_user" });

  if (user.plan === "free") {
    // Check the count of notes for this specific user, not all tenant notes
    const count = await Note.countDocuments({ tenantId, createdBy: sub });
    if (count >= 3)
      return res.status(403).json({ error: "free_limit_reached" });
  }

  const { title, content } = req.body || {};
  const note = await Note.create({
    tenantId,
    title: title || "",
    content: content || "",
    createdBy: sub,
  });
  res.status(201).json({ id: String(note._id) });
});

router.get("/:id", async (req, res) => {
  const { tenantId, sub } = req.auth;
  // Only allow access to notes created by the current user
  const note = await Note.findOne({
    _id: req.params.id,
    tenantId,
    createdBy: sub,
  }).lean();
  if (!note) return res.status(404).json({ error: "not_found" });
  res.json({ ...note, id: String(note._id) });
});

router.put("/:id", async (req, res) => {
  const { tenantId, sub } = req.auth;
  const { title, content } = req.body || {};
  // Only allow updating notes created by the current user
  const updated = await Note.findOneAndUpdate(
    { _id: req.params.id, tenantId, createdBy: sub },
    { $set: { title, content } },
    { new: true }
  ).lean();
  if (!updated) return res.status(404).json({ error: "not_found" });
  res.json({ ...updated, id: String(updated._id) });
});

router.delete("/:id", async (req, res) => {
  const { tenantId, sub } = req.auth;
  // Only allow deleting notes created by the current user
  const result = await Note.deleteOne({
    _id: req.params.id,
    tenantId,
    createdBy: sub,
  });
  if (!result.deletedCount) return res.status(404).json({ error: "not_found" });
  res.status(204).end();
});

export default router;
