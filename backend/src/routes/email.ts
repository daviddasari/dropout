import express from "express";
import { requireAuth } from "../middleware/auth";
import { sendEmail } from "../config/email";
import { User } from "../models/User";

const router = express.Router();

router.post("/send-report", requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const { email, reportType, rows, summary } = req.body || {};
    if (!email || !reportType || !Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ success: false, message: "email, reportType and non-empty rows are required" });
    }

    const headers = Object.keys(rows[0] as any);
    const headerHtml = headers
      .map((h) => `<th style="border:1px solid #ddd;padding:6px;text-align:left">${h}</th>`)
      .join("");
    const bodyHtml = (rows as any[])
      .map(
        (r) =>
          `<tr>${headers
            .map((h) => `<td style="border:1px solid #ddd;padding:6px">${String((r as any)[h] ?? "")}</td>`)
            .join("")}</tr>`
      )
      .join("");

    const total = summary?.total ?? rows.length;
    const avgAttendance = summary?.avgAttendance ?? "-";
    const avgGpa = summary?.avgGpa ?? "-";

    const html = `<!doctype html><html><body>
      <h2>${String(reportType)}</h2>
      <p>Total: ${total} • Avg Attendance: ${avgAttendance}% • Avg GPA: ${avgGpa}</p>
      <table style="border-collapse:collapse;width:100%">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </body></html>`;

    const csvHeader = headers.join(",");
    const csvBody = (rows as any[])
      .map((r) =>
        headers
          .map((h) => {
            const raw = (r as any)[h];
            const v = raw == null ? "" : String(raw);
            return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(",")
      )
      .join("\n");
    const csv = `${csvHeader}\n${csvBody}`;

    const filename = `edtrack_report_${Date.now()}.csv`;

    // Determine recipients
    const currentUser = (req as any).user as { email?: string; role?: string } | undefined;
    const currentRole = currentUser?.role;

    const recipients = new Set<string>();
    if (email) recipients.add(String(email));

    // If triggered by a Teacher, also send to all Counselors
    if (currentRole === "Teacher") {
      const counselors = await User.find({ role: "Counselor" }, { email: 1 }).lean<any>();
      for (const c of counselors) {
        if (c?.email) recipients.add(String(c.email));
      }
    }

    // Send email to each recipient individually
    for (const addr of recipients) {
      const ok = await sendEmail(addr, String(reportType), html, [
        { filename, content: csv, contentType: "text/csv" },
      ]);
      if (!ok) {
        return res.status(500).json({ success: false, message: `Failed to send email to ${addr}` });
      }
    }

    return res.json({ success: true, recipients: Array.from(recipients) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Email send failed" });
  }
});

export default router;

