export type RiskLevel = "Low" | "Medium" | "High";

export type UserRole = "Admin" | "Teacher" | "Counselor" | "Parent" | "Guest";

export interface Student {
  id: string;
  name: string;
  class: string;
  attendance: number;
  gpa: number;
  feesPaid: boolean;
  familyIncome: number;
  riskLevel: RiskLevel;
  photoUrl?: string;
  counselorNotes?: string;
}

export interface Alert {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  reason: string;
  counselorAssigned?: string;
  timestamp: Date;
  resolved: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
}

export interface DashboardStats {
  averageAttendance: number;
  studentsAtRisk: number;
  feePending: number;
  totalStudents: number;
}

export interface UploadedData {
  fileName: string;
  uploadDate: Date;
  rowCount: number;
  validRows: number;
  errors: string[];
}
