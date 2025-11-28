import express from "express";
import { Student } from "../models/Student";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import { SupportRequest } from "../models/SupportRequest";

const router = express.Router();

router.post("/upload", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const rows = req.body as any[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No data provided" });
    }

    const user = (req as any).user;

    // Enforce single active sheet per teacher
    const existingCount = await Student.countDocuments({ TeacherEmail: user?.email });
    if (existingCount > 0) {
      return res.status(409).json({
        success: false,
        message: "You already have uploaded data. Please delete your existing sheet before uploading a new one.",
      });
    }

    const docs = rows.map((r) => ({
      Student_ID: (r.Student_ID ?? "").toString(),
      Name: r.Name ?? "",
      Class: r.Class ?? "",
      Attendance_Percent: Number(r.Attendance_Percent ?? (r as any)["Attendance_%"] ?? 0),
      GPA: Number(r.GPA ?? 0),
      Fees_Paid: (r as any).Fees_Paid ?? (r as any)["Fees Paid"] ?? "",
      Family_Income: Number(r.Family_Income ?? 0),
      Risk_Level: r.Risk_Level ?? "",
      TeacherEmail: user?.email ?? "",
    }));

    const result = await Student.insertMany(docs, { ordered: false });

    return res.json({
      success: true,
      inserted: result.length,
      total: rows.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Upload failed", error: err?.message || String(err) });
  }
});

router.get("/mine", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const data = await Student.find({ TeacherEmail: user?.email }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Fetch failed", error: err?.message || String(err) });
  }
});

// Teacher: delete all of my uploaded data (clear existing sheet)
router.delete("/mine", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const result = await Student.deleteMany({ TeacherEmail: user?.email });
    return res.json({ success: true, deleted: result.deletedCount || 0 });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Delete failed", error: err?.message || String(err) });
  }
});

// Development-only: get all records. Accessible to Admin and Counselor roles.
router.get("/all", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== "Admin" && user.role !== "Counselor")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const data = await Student.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Fetch failed", error: err?.message || String(err) });
  }
});

// Teacher: create a support request for a student
router.post("/support", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "Teacher") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { studentId, studentName, class: klass, riskLevel, reason } = req.body || {};
    if (!studentId || !studentName) {
      return res.status(400).json({ success: false, message: "studentId and studentName are required" });
    }
    const doc = await SupportRequest.create({
      teacherEmail: user.email,
      studentId,
      studentName,
      class: klass,
      riskLevel,
      reason: reason || "Teacher requested counselor support",
      resolved: false,
    });
    return res.json({ success: true, request: doc });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Create support failed" });
  }
});

// Counselor/Admin: list support requests, optional ?teacherEmail=<email>
router.get("/support", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== "Counselor" && user.role !== "Admin")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const teacherEmail = String((req.query as any)?.teacherEmail || "").trim();
    const q: any = {};
    if (teacherEmail) q.teacherEmail = teacherEmail;
    const items = await SupportRequest.find(q).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, items });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "List support failed" });
  }
});

// Counselor/Admin: clear requests (bulk delete). Optional ?teacherEmail= to limit scope
router.delete("/support", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== "Counselor" && user.role !== "Admin")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const teacherEmail = String((req.query as any)?.teacherEmail || (req.body as any)?.teacherEmail || "").trim();
    const q: any = {};
    if (teacherEmail) q.teacherEmail = teacherEmail;
    const result = await SupportRequest.deleteMany(q);
    return res.json({ success: true, deleted: result.deletedCount || 0 });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Clear support failed" });
  }
});

// Counselor/Admin: resolve a single support request (mark resolved + timestamp)
router.patch("/support/:id", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== "Counselor" && user.role !== "Admin")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const id = req.params.id;
    const updated = await SupportRequest.findByIdAndUpdate(
      id,
      { $set: { resolved: true, resolvedAt: new Date() } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Resolve failed" });
  }
});

// Teacher: list my support requests (resolved and unresolved)
router.get("/support/mine", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "Teacher") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const items = await SupportRequest.find({ teacherEmail: user.email }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, items });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "List failed" });
  }
});

router.get("/mine", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const data = await Student.find({ TeacherEmail: user?.email }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Fetch failed", error: err?.message || String(err) });
  }
});

// Development-only: get all records. Accessible to Admin and Counselor roles.
router.get("/all", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== "Admin" && user.role !== "Counselor")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const data = await Student.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Fetch failed", error: err?.message || String(err) });
  }
});

// Distinct teacher emails (dev). Admin and Counselor only.
router.get("/teachers", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== "Admin" && user.role !== "Counselor")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const fromStudents: string[] = await Student.distinct("TeacherEmail", { TeacherEmail: { $ne: "" } });
    const teachers = await User.find({ role: { $regex: /^teacher$/i } }).select({ email: 1 }).lean();
    const fromUsers: string[] = teachers.map((t: any) => t.email).filter(Boolean);
    const emails = Array.from(new Set([...(fromStudents || []), ...(fromUsers || [])])).sort();
    return res.json({ success: true, emails });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Fetch failed", error: err?.message || String(err) });
  }
});

// Dev-only: seed a few demo students for a given teacher email
router.post("/seed", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== "Admin" && user.role !== "Counselor")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { teacherEmail = "demo@edtrack.test" } = (req.body || {}) as { teacherEmail?: string };
    const docs = [
      {
        Student_ID: "201",
        Name: "Rani Patel",
        Class: "10A",
        Attendance_Percent: 82,
        GPA: 7.1,
        Fees_Paid: "Yes",
        Family_Income: 420000,
        Risk_Level: "Low",
        TeacherEmail: teacherEmail,
      },
      {
        Student_ID: "202",
        Name: "Arav Shah",
        Class: "10B",
        Attendance_Percent: 58,
        GPA: 5.2,
        Fees_Paid: "No",
        Family_Income: 300000,
        Risk_Level: "High",
        TeacherEmail: teacherEmail,
      },
      {
        Student_ID: "203",
        Name: "Simran Kaur",
        Class: "9C",
        Attendance_Percent: 74,
        GPA: 6.3,
        Fees_Paid: "Yes",
        Family_Income: 380000,
        Risk_Level: "Medium",
        TeacherEmail: teacherEmail,
      },
    ];
    const result = await Student.insertMany(docs, { ordered: false });
    return res.json({ success: true, inserted: result.length, teacherEmail });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: "Seed failed", error: err?.message || String(err) });
  }
});

export default router;

