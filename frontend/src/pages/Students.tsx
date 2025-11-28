import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Student } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userRole = typeof window !== "undefined"
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "null")?.role as string | undefined;
        } catch {
          return undefined;
        }
      })()
    : undefined;

  useEffect(() => {
    const fetchMine = async () => {
      try {
        if (!token) return;
        let res = await fetch(
          userRole === "Counselor" || userRole === "Admin" ? "http://localhost:5001/data/all" : "http://localhost:5001/data/mine",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok && (userRole === "Counselor" || userRole === "Admin")) {
          // fallback to mine if all is not available
          res = await fetch("http://localhost:5001/data/mine", {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.data)) {
          const mapped: Student[] = result.data.map((r: any) => ({
            id: r.Student_ID,
            name: r.Name,
            class: r.Class,
            attendance: Number(r.Attendance_Percent ?? 0),
            gpa: Number(r.GPA ?? 0),
            feesPaid: String(r.Fees_Paid).toLowerCase() === "yes",
            familyIncome: Number(r.Family_Income ?? 0),
            riskLevel: r.Risk_Level,
          }));
          setStudents(mapped);
        }
      } catch {
        // ignore
      }
    };
    fetchMine();
  }, [token, userRole]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id.includes(searchTerm);
      const matchesClass = filterClass === "all" || student.class === filterClass;
      const matchesRisk = filterRisk === "all" || student.riskLevel === filterRisk;
      return matchesSearch && matchesClass && matchesRisk;
    });
  }, [students, searchTerm, filterClass, filterRisk]);

  // Mock attendance data for student profile
  const studentAttendanceData = [
    { month: "Jan", attendance: 72 },
    { month: "Feb", attendance: 68 },
    { month: "Mar", attendance: 75 },
    { month: "Apr", attendance: 70 },
    { month: "May", attendance: 72 },
  ];

  const studentGPAData = [
    { month: "Jan", gpa: 6.5 },
    { month: "Feb", gpa: 6.2 },
    { month: "Mar", gpa: 6.4 },
    { month: "Apr", gpa: 6.0 },
    { month: "May", gpa: 6.2 },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            View and manage student records
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="9A">9A</SelectItem>
                  <SelectItem value="9B">9B</SelectItem>
                  <SelectItem value="9C">9C</SelectItem>
                  <SelectItem value="10A">10A</SelectItem>
                  <SelectItem value="10B">10B</SelectItem>
                  <SelectItem value="10C">10C</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Low">Low Risk</SelectItem>
                  <SelectItem value="Medium">Medium Risk</SelectItem>
                  <SelectItem value="High">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Records</CardTitle>
            <CardDescription>
              {filteredStudents.length} students found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">ID</th>
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Class</th>
                    <th className="p-3 text-left font-medium">Attendance</th>
                    <th className="p-3 text-left font-medium">GPA</th>
                    <th className="p-3 text-left font-medium">Fee Status</th>
                    <th className="p-3 text-left font-medium">Risk Level</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono text-sm">{student.id}</td>
                      <td className="p-3 font-medium">{student.name}</td>
                      <td className="p-3">{student.class}</td>
                      <td className="p-3">{student.attendance}%</td>
                      <td className="p-3">{student.gpa}</td>
                      <td className="p-3">
                        {student.feesPaid ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-danger" />
                        )}
                      </td>
                      <td className="p-3">
                        <RiskBadge level={student.riskLevel} />
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Student Profile Dialog */}
        <Dialog
          open={selectedStudent !== null}
          onOpenChange={() => setSelectedStudent(null)}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedStudent?.name}
              </DialogTitle>
              <DialogDescription>
                Student ID: {selectedStudent?.id} • Class: {selectedStudent?.class}
              </DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Risk Assessment
                      </p>
                      <RiskBadge level={selectedStudent.riskLevel} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Family Income
                    </p>
                    <p className="text-lg font-semibold">
                      ₹{selectedStudent.familyIncome.toLocaleString()}
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="academics" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="academics">Academics</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="academics" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Current GPA
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold">
                            {selectedStudent.gpa}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Fee Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold">
                            {selectedStudent.feesPaid ? "Paid" : "Pending"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">GPA Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={studentGPAData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="gpa"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="attendance" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Current Attendance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          {selectedStudent.attendance}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Monthly Attendance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={studentAttendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="attendance"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Counselor Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {selectedStudent.counselorNotes ||
                            "No notes available"}
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
