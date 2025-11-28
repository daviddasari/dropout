import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Alerts() {
  const [filterRisk, setFilterRisk] = useState("all");
  const [records, setRecords] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userRole = typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("user") || "null")?.role as string | undefined; } catch { return undefined; } })() : undefined;
  const [resolvedMap, setResolvedMap] = useState<Record<string, boolean>>({});
  const [mySupport, setMySupport] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) return;
        let url = "http://localhost:5001/data/mine";
        if (userRole === "Counselor" || userRole === "Admin") url = "http://localhost:5001/data/all";
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const result = await res.json();
        if (res.ok && result?.success) setRecords(Array.isArray(result.data) ? result.data : []);
      } catch {}
    };
    fetchData();
  }, [token, userRole]);

  // For teachers, fetch their support requests to compute 'Resolved Today'
  useEffect(() => {
    const fetchSupportMine = async () => {
      try {
        if (!token || userRole !== "Teacher") return;
        const res = await fetch("http://localhost:5001/data/support/mine", { headers: { Authorization: `Bearer ${token}` } });
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.items)) setMySupport(result.items);
      } catch {}
    };
    fetchSupportMine();
  }, [token, userRole]);

  const highCount = useMemo(() => records.filter((r: any) => r.Risk_Level === "High").length, [records]);
  const mediumCount = useMemo(() => records.filter((r: any) => r.Risk_Level === "Medium").length, [records]);
  const lowCount = useMemo(() => records.filter((r: any) => r.Risk_Level === "Low").length, [records]);

  const resolvedToday = useMemo(() => {
    const today = new Date();
    const isSameDay = (d?: string) => {
      if (!d) return false;
      const dt = new Date(d);
      return (
        dt.getFullYear() === today.getFullYear() &&
        dt.getMonth() === today.getMonth() &&
        dt.getDate() === today.getDate()
      );
    };
    // Teachers: count their resolved support requests today
    if (userRole === "Teacher") {
      return mySupport.filter((it: any) => it.resolved && isSameDay(it.resolvedAt)).length;
    }
    // Counselors/Admin: could compute from all support requests if needed (not implemented here)
    return 0;
  }, [mySupport, userRole]);

  const alerts = useMemo(() => {
    // Build alert items from records; flag High/Medium as alerts
    return records
      .filter((r: any) => ["High", "Medium"].includes(String(r.Risk_Level)))
      .map((r: any) => ({
        id: `${r._id}`,
        studentId: r.Student_ID,
        studentName: r.Name,
        class: r.Class,
        reason:
          r.Risk_Level === "High"
            ? "High risk based on uploaded data"
            : "Medium risk based on uploaded data",
        resolved: !!resolvedMap[`${r._id}`],
      }));
  }, [records, resolvedMap]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => filterRisk === "all" || String(records.find((r: any) => `${r._id}` === a.id)?.Risk_Level) === filterRisk);
  }, [alerts, filterRisk, records]);

  const handleSendSupport = async (alertId: string) => {
    try {
      const rec = records.find((r: any) => `${r._id}` === alertId);
      if (!rec) return;
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const res = await fetch("http://localhost:5001/data/support", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentId: rec.Student_ID,
          studentName: rec.Name,
          class: rec.Class,
          riskLevel: rec.Risk_Level,
          reason: alerts.find((a) => a.id === alertId)?.reason || "Teacher requested counselor support",
        }),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) throw new Error(result?.message || "Failed to send support request");
      toast.success("Support request sent to counselor");
      setResolvedMap((prev) => ({ ...prev, [alertId]: true }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to send support request");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and respond to student risk indicators
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2 border-danger/20 bg-danger/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    High Priority
                  </p>
                  <p className="text-3xl font-bold">
                    {highCount}
                  </p>
                </div>
                <AlertTriangle className="h-10 w-10 text-danger" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-warning/20 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Medium Priority
                  </p>
                  <p className="text-3xl font-bold">
                    {mediumCount}
                  </p>
                </div>
                <AlertTriangle className="h-10 w-10 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-success/20 bg-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Resolved Today
                  </p>
                  <p className="text-3xl font-bold">
                    {resolvedToday}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by:</label>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="High">High Risk</SelectItem>
                  <SelectItem value="Medium">Medium Risk</SelectItem>
                  <SelectItem value="Low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>
              {filteredAlerts.filter((a) => !a.resolved).length} unresolved
              alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const rec = records.find((r: any) => `${r._id}` === alert.id);
                const risk = String(rec?.Risk_Level || "Low") as any;
                return (
                  <Card
                    key={alert.id}
                    className={`border-l-4 ${
                      risk === "High"
                        ? "border-l-danger"
                        : risk === "Medium"
                        ? "border-l-warning"
                        : "border-l-success"
                    } ${alert.resolved ? "opacity-60" : ""}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {alert.studentName}
                            </h3>
                            <RiskBadge level={risk} />
                            {alert.resolved && (
                              <CheckCircle className="h-5 w-5 text-success" />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>Class: {alert.class}</span>
                            <span>•</span>
                            <span>Student ID: {alert.studentId}</span>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">Reason: </span>
                            {alert.reason}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!alert.resolved && userRole === "Teacher" && (
                            <Button onClick={() => handleSendSupport(alert.id)} size="sm">
                              <Send className="mr-2 h-4 w-4" />
                              Send Support
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
