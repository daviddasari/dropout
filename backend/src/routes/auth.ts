import express from "express";
import { User } from "../models/User";
import { requireAuth } from "../middleware/auth";

const router = express.Router();

// Demo users (in-memory). Do NOT use this in production.
const DEMO_USERS = [
  {
    email: "admin@demo.edu",
    password: "admin123",
    name: "Admin Demo",
    role: "Admin" as const,
    token: "demo-token-admin",
  },
  {
    email: "counselor@demo.edu",
    password: "counselor123",
    name: "Counselor Demo",
    role: "Counselor" as const,
    token: "demo-token-counselor",
  },
  // Keep old demo for compatibility
  {
    email: "demo@edtrack.test",
    password: "demo123",
    name: "Demo User",
    role: "Teacher" as const,
    token: "demo-token",
  },
];

router.post("/login", async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body || {};

  const demo = DEMO_USERS.find((u) => u.email === email && u.password === password);
  if (demo) {
    // Persist login in MongoDB (upsert)
    try {
      await User.findOneAndUpdate(
        { email: demo.email },
        {
          $set: { name: demo.name, role: demo.role, lastLogin: new Date() },
          $inc: { loginCount: 1 },
        },
        { upsert: true, new: true }
      );
      console.log("User login persisted:", demo.email);
    } catch (err) {
      // If persistence fails, still allow login for demo purposes
      console.error("Failed to persist user login:", err);
    }

    return res.json({
      success: true,
      user: {
        email: demo.email,
        name: demo.name,
        role: demo.role,
      },
      token: demo.token, // dev token consumed by middleware
    });
  }

  // Try provisioned users in DB (DEV: plain password)
  try {
    const user = await User.findOne({ email }).lean();
    if (user && (user as any).password && password === (user as any).password) {
      await User.updateOne(
        { email },
        { $set: { lastLogin: new Date() }, $inc: { loginCount: 1 } }
      );
      // Return dynamic token consumed by middleware
      const role = (user as any).role || "Teacher";
      return res.json({
        success: true,
        user: { email: (user as any).email, name: (user as any).name, role },
        token: `user:email=${(user as any).email};role=${role}`,
      });
    }
  } catch {}

  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Admin-only: provision or update a user (Teacher/Counselor) with password (DEV only)
router.post(
  "/provision",
  requireAuth,
  async (req: express.Request, res: express.Response) => {
    try {
      const admin = (req as any).user;
      if (!admin || admin.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const { email, name, role, password } = req.body || {};
      if (!email || !password || !role) {
        return res.status(400).json({ success: false, message: "email, password and role are required" });
      }
      if (!["Teacher", "Counselor"].includes(role)) {
        return res.status(400).json({ success: false, message: "role must be Teacher or Counselor" });
      }
      const doc = await User.findOneAndUpdate(
        { email },
        {
          $set: { email, name: name || email.split("@")[0], role, password, lastLogin: new Date() },
          $inc: { loginCount: 0 },
        },
        { upsert: true, new: true }
      ).lean<any>();
      return res.json({ success: true, user: { email: (doc as any)?.email, name: (doc as any)?.name, role: (doc as any)?.role } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || "Provision failed" });
    }
  }
);

// Admin-only: update a user (name, role, password)
router.put(
  "/user",
  requireAuth,
  async (req: express.Request, res: express.Response) => {
    try {
      const admin = (req as any).user;
      if (!admin || admin.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const { email, name, role, password } = req.body || {};
      if (!email) return res.status(400).json({ success: false, message: "email is required" });
      const update: any = {};
      if (name !== undefined) update.name = name;
      if (role !== undefined) update.role = role;
      if (password !== undefined) update.password = password;
      const doc = await User.findOneAndUpdate({ email }, { $set: update }, { new: true }).lean<any>();
      if (!doc) return res.status(404).json({ success: false, message: "User not found" });
      return res.json({ success: true, user: { email: doc.email, name: doc.name, role: doc.role } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || "Update failed" });
    }
  }
);

// Admin-only: delete a user by email
router.delete(
  "/user",
  requireAuth,
  async (req: express.Request, res: express.Response) => {
    try {
      const admin = (req as any).user;
      if (!admin || admin.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const email = (req.query?.email as string) || (req.body as any)?.email;
      if (!email) return res.status(400).json({ success: false, message: "email is required" });
      const result = await User.deleteOne({ email });
      return res.json({ success: true, deleted: result.deletedCount || 0 });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || "Delete failed" });
    }
  }
);

// Admin-only: list users (basic fields)
router.get(
  "/users",
  requireAuth,
  async (req: express.Request, res: express.Response) => {
    try {
      const admin = (req as any).user;
      if (!admin || admin.role !== "Admin") {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const users = await User.find({}, { email: 1, name: 1, role: 1, lastLogin: 1, loginCount: 1 })
        .sort({ role: 1, email: 1 })
        .lean<any>();
      return res.json({ success: true, users });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || "List users failed" });
    }
  }
);

// Dev-only: seed Admin and Counselor users into DB
router.post("/seed", async (_req: express.Request, res: express.Response) => {
  const toSeed = [
    { email: "admin@demo.edu", name: "Admin Demo", role: "Admin" },
    { email: "counselor@demo.edu", name: "Counselor Demo", role: "Counselor" },
  ] as const;
  try {
    const results = [] as any[];
    for (const u of toSeed) {
      const doc = await User.findOneAndUpdate(
        { email: u.email },
        {
          $set: { name: u.name, role: u.role, lastLogin: new Date() },
          $inc: { loginCount: 1 },
        },
        { upsert: true, new: true }
      ).lean();
      results.push(doc);
    }
    return res.json({ success: true, users: results });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Seed failed", error: err?.message || String(err) });
  }
});

export default router;

