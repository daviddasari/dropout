import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Users, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchMine = async () => {
      try {
        if (!token) return;
        const res = await fetch("http://localhost:5001/data/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result?.success) setRecords(Array.isArray(result.data) ? result.data : []);
      } catch {}
    };
    fetchMine();
  }, [token]);

  const stats = useMemo(() => {
    const total = records.length || 0;
    const avgAttendance = total
      ? Math.round(
          (records.reduce((s: number, r: any) => s + Number(r.Attendance_Percent ?? 0), 0) / total) * 10
        ) / 10
      : 0;
    const feePending = records.filter((r: any) => String(r.Fees_Paid).toLowerCase() !== "yes").length;
    const studentsAtRisk = records.filter((r: any) => String(r.Risk_Level) === "High").length;
    return { averageAttendance: avgAttendance, feePending, studentsAtRisk, totalStudents: total };
  }, [records]);

  const riskData = useMemo(() => {
    const levels = [
      { name: "Low", fill: "#22c55e" },
      { name: "Medium", fill: "#f59e0b" },
      { name: "High", fill: "#ef4444" },
    ];
    return levels.map((lvl) => ({
      name: lvl.name,
      value: records.filter((r: any) => r.Risk_Level === lvl.name).length,
      fill: lvl.fill,
    }));
  }, [records]);

  const gpaTrend = useMemo(() => {
    // Group by YYYY-MM of createdAt and average GPA
    const map = new Map<string, { sum: number; count: number }>();
    records.forEach((r: any) => {
      const d = r.createdAt ? new Date(r.createdAt) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const prev = map.get(key) || { sum: 0, count: 0 };
      prev.sum += Number(r.GPA ?? 0);
      prev.count += 1;
      map.set(key, prev);
    });
    const items = Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([key, v]) => ({ month: key, gpa: v.count ? Math.round((v.sum / v.count) * 100) / 100 : 0 }));
    return items;
  }, [records]);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Monitor student performance and risk indicators
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Average Attendance"
            value={`${stats.averageAttendance}%`}
            icon={TrendingUp}
            trend="+2.5% from last month"
            variant="success"
          />
          <StatCard
            title="Students at Risk"
            value={stats.studentsAtRisk}
            icon={AlertTriangle}
            trend="3 students need attention"
            variant="danger"
          />
          <StatCard
            title="Fee Pending"
            value={stats.feePending}
            icon={DollarSign}
            trend="2 students"
            variant="warning"
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            variant="default"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Academic Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance Trend</CardTitle>
              <CardDescription>Average GPA over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gpaTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Average GPA"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Level Distribution</CardTitle>
              <CardDescription>Current student risk categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Students requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {records
                  .filter((r: any) => r.Risk_Level === "High")
                  .slice(0, 3)
                  .map((r: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                      <AlertTriangle className="h-5 w-5 text-danger" />
                      <div className="flex-1">
                        <p className="font-medium">{r.Name}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.Class} • High risk
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
