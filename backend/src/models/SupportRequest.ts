import mongoose from "mongoose";

const SupportRequestSchema = new mongoose.Schema(
  {
    teacherEmail: { type: String, index: true },
    studentId: { type: String },
    studentName: { type: String },
    class: { type: String },
    riskLevel: { type: String },
    reason: { type: String },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const SupportRequest =
  mongoose.models.SupportRequest || mongoose.model("SupportRequest", SupportRequestSchema);
