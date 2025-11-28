import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Users, AlertTriangle, GraduationCap, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [teacherEmails, setTeacherEmails] = useState<string[]>([]);
  const [teacher, setTeacher] = useState<string>("all");
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ email: "", name: "", role: "Teacher", password: "" });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (!token) return;
        const res = await fetch("http://localhost:5001/data/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result?.success) setRecords(Array.isArray(result.data) ? result.data : []);
      } catch {}
    };
    fetchAll();
  }, [token]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        if (!token) return;
        const res = await fetch("http://localhost:5001/data/teachers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.emails)) setTeacherEmails(result.emails);
      } catch {}
    };
    fetchTeachers();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!token) return;
        const res = await fetch("http://localhost:5001/auth/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.users)) setUsers(result.users);
      } catch {}
    };
    fetchUsers();
  }, [token]);

  const visible = useMemo(() => {
    return records.filter((r: any) => teacher === "all" || String(r.TeacherEmail || "") === teacher);
  }, [records, teacher]);

  const stats = useMemo(() => {
    const totalStudents = visible.length;
    const teachers = new Set(visible.map((r: any) => r.TeacherEmail).filter(Boolean)).size;
    const high = visible.filter((r: any) => r.Risk_Level === "High").length;
    return { totalStudents, totalTeachers: teachers, highRisk: high };
  }, [visible]);

  const classes = useMemo(() => {
    const map = new Map<string, number>();
    visible.forEach((r: any) => map.set(r.Class, (map.get(r.Class) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [visible]);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Overview</h1>
          <p className="text-muted-foreground">Global insights across all teachers and classes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
            <CardDescription>Filter by teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={teacher} onValueChange={setTeacher}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <SelectValue placeholder="All Teachers" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teacherEmails.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} variant="default" />
          <StatCard title="High Risk" value={stats.highRisk} icon={AlertTriangle} variant="danger" />
          <StatCard title="Teachers" value={stats.totalTeachers} icon={GraduationCap} variant="success" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Classes by Enrollment</CardTitle>
            <CardDescription>Top classes by student count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classes.slice(0, 10).map(([cls, count]) => (
                <div key={cls} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span className="font-medium">{cls || "N/A"}</span>
                  <span>{count}</span>
                </div>
              ))}
              {!classes.length && <p className="text-sm text-muted-foreground">No data.</p>}
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Create Teacher/Counselor accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))}
              />
              <Input
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))}
              />
              <Select value={newUser.role} onValueChange={(v) => setNewUser((s) => ({ ...s, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Counselor">Counselor</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  if (!newUser.email || !newUser.password) {
                    toast.error("Email and password are required");
                    return;
                  }
                  const res = await fetch("http://localhost:5001/auth/provision", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(newUser),
                  });
                  const result = await res.json();
                  if (!res.ok || !result?.success) throw new Error(result?.message || "Provision failed");
                  toast.success("User provisioned");
                  setNewUser({ email: "", name: "", role: "Teacher", password: "" });
                  // refresh lists
                  try {
                    const ures = await fetch("http://localhost:5001/auth/users", {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const ujson = await ures.json();
                    if (ures.ok && ujson?.success) setUsers(ujson.users);
                    const tres = await fetch("http://localhost:5001/data/teachers", {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const tjson = await tres.json();
                    if (tres.ok && tjson?.success) setTeacherEmails(tjson.emails || []);
                  } catch {}
                } catch (e: any) {
                  toast.error(e?.message || "Failed to provision user");
                }
              }}
            >
              Create User
            </Button>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Role</th>
                    <th className="p-2 text-left">Last Login</th>
                    <th className="p-2 text-left">Logins</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.name}</td>
                      <td className="p-2">{u.role}</td>
                      <td className="p-2">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "-"}</td>
                      <td className="p-2">{u.loginCount ?? 0}</td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td className="p-2 text-muted-foreground" colSpan={5}>No users yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
