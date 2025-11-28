import { Student, Alert, DashboardStats, User } from "@/types";

export const mockUser: User = {
  id: "1",
  name: "Dr. Sharma",
  email: "sharma@edtrack.edu",
  role: "Admin",
};

export const mockStudents: Student[] = [
  {
    id: "101",
    name: "Arjun Mehta",
    class: "10A",
    attendance: 72,
    gpa: 6.2,
    feesPaid: true,
    familyIncome: 350000,
    riskLevel: "Medium",
    counselorNotes: "Needs attention in mathematics. Family facing financial challenges.",
  },
  {
    id: "102",
    name: "Priya Singh",
    class: "9B",
    attendance: 89,
    gpa: 8.4,
    feesPaid: false,
    familyIncome: 500000,
    riskLevel: "Low",
    counselorNotes: "Excellent performance. Fee pending for last month.",
  },
  {
    id: "103",
    name: "Rahul Das",
    class: "10C",
    attendance: 58,
    gpa: 5.0,
    feesPaid: true,
    familyIncome: 280000,
    riskLevel: "High",
    counselorNotes: "Critical case. Multiple absences. Family counseling recommended.",
  },
  {
    id: "104",
    name: "Sneha Patel",
    class: "9A",
    attendance: 95,
    gpa: 9.1,
    feesPaid: true,
    familyIncome: 750000,
    riskLevel: "Low",
  },
  {
    id: "105",
    name: "Vikram Kumar",
    class: "10B",
    attendance: 68,
    gpa: 5.8,
    feesPaid: false,
    familyIncome: 320000,
    riskLevel: "High",
    counselorNotes: "Attendance issues. Recommended for counseling session.",
  },
  {
    id: "106",
    name: "Ananya Reddy",
    class: "9C",
    attendance: 82,
    gpa: 7.6,
    feesPaid: true,
    familyIncome: 450000,
    riskLevel: "Low",
  },
  {
    id: "107",
    name: "Karan Verma",
    class: "10A",
    attendance: 75,
    gpa: 6.8,
    feesPaid: true,
    familyIncome: 380000,
    riskLevel: "Medium",
  },
  {
    id: "108",
    name: "Meera Joshi",
    class: "9B",
    attendance: 91,
    gpa: 8.9,
    feesPaid: true,
    familyIncome: 620000,
    riskLevel: "Low",
  },
];

export const mockAlerts: Alert[] = [
  {
    id: "a1",
    studentId: "103",
    studentName: "Rahul Das",
    class: "10C",
    reason: "Attendance below 60%, GPA below 5.5",
    counselorAssigned: "Ms. Gupta",
    timestamp: new Date("2025-01-15"),
    resolved: false,
  },
  {
    id: "a2",
    studentId: "105",
    studentName: "Vikram Kumar",
    class: "10B",
    reason: "Low attendance, Fee payment pending",
    counselorAssigned: "Mr. Kapoor",
    timestamp: new Date("2025-01-16"),
    resolved: false,
  },
  {
    id: "a3",
    studentId: "101",
    studentName: "Arjun Mehta",
    class: "10A",
    reason: "Declining GPA trend",
    timestamp: new Date("2025-01-17"),
    resolved: false,
  },
];

export const mockDashboardStats: DashboardStats = {
  averageAttendance: 78.5,
  studentsAtRisk: 3,
  feePending: 2,
  totalStudents: 8,
};

export const attendanceData = [
  { month: "Jan", "10A": 85, "9B": 88, "10C": 72 },
  { month: "Feb", "10A": 82, "9B": 90, "10C": 68 },
  { month: "Mar", "10A": 88, "9B": 92, "10C": 70 },
  { month: "Apr", "10A": 86, "9B": 89, "10C": 65 },
  { month: "May", "10A": 90, "9B": 91, "10C": 71 },
];

export const academicTrendData = [
  { month: "Jan", gpa: 7.2 },
  { month: "Feb", gpa: 7.4 },
  { month: "Mar", gpa: 7.1 },
  { month: "Apr", gpa: 7.5 },
  { month: "May", gpa: 7.3 },
];

export const riskDistributionData = [
  { name: "Low Risk", value: 5, fill: "hsl(var(--success))" },
  { name: "Medium Risk", value: 2, fill: "hsl(var(--warning))" },
  { name: "High Risk", value: 3, fill: "hsl(var(--danger))" },
];
