import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    Student_ID: { type: String },
    Name: { type: String },
    Class: { type: String },
    Attendance_Percent: { type: Number },
    GPA: { type: Number },
    Fees_Paid: { type: String },
    Family_Income: { type: Number },
    Risk_Level: { type: String },
    TeacherEmail: { type: String, index: true },
  },
  { timestamps: true }
);

export const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);
