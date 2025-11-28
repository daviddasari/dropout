import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function CounselorRequests() {
  const [teacherEmails, setTeacherEmails] = useState<string[]>([]);
  const [teacherEmail, setTeacherEmail] = useState<string>("all");
  const [items, setItems] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        if (!token) return;
        const res = await fetch("http://localhost:5001/data/teachers", { headers: { Authorization: `Bearer ${token}` } });
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.emails)) setTeacherEmails(result.emails);
      } catch {}
    };
    fetchTeachers();
  }, [token]);

  useEffect(() => {
    const fetchSupport = async () => {
      try {
        if (!token) return;
        const q = teacherEmail !== "all" ? `?teacherEmail=${encodeURIComponent(teacherEmail)}` : "";
        const res = await fetch(`http://localhost:5001/data/support${q}`, { headers: { Authorization: `Bearer ${token}` } });
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.items)) setItems(result.items);
      } catch {}
    };
    fetchSupport();
  }, [token, teacherEmail]);

  const summary = useMemo(() => {
    const total = items.length;
    const byRisk = items.reduce((m: any, it: any) => { const k = it.riskLevel || "Unknown"; m[k] = (m[k]||0)+1; return m; }, {} as Record<string, number>);
    return { total, byRisk };
  }, [items]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Support Requests</h1>
            <p className="text-muted-foreground">Requests sent by teachers</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/counselor")}> <ArrowLeft className="mr-2 h-4 w-4"/> Back to Overview</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <CardDescription>Select teacher to filter requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={teacherEmail} onValueChange={setTeacherEmail}>
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Requests ({summary.total})</CardTitle>
                <CardDescription>Newest first</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (!token) return;
                    const q = teacherEmail !== "all" ? `?teacherEmail=${encodeURIComponent(teacherEmail)}` : "";
                    const res = await fetch(`http://localhost:5001/data/support${q}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const result = await res.json();
                    if (!res.ok || !result?.success) throw new Error(result?.message || "Failed to clear requests");
                    toast.success(`Cleared ${result.deleted || 0} request(s)`);
                    // refresh
                    const r2 = await fetch(`http://localhost:5001/data/support${q}`, { headers: { Authorization: `Bearer ${token}` } });
                    const j2 = await r2.json();
                    if (r2.ok && j2?.success) setItems(j2.items);
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to clear requests");
                  }
                }}
              >
                Clear Requests{teacherEmail !== "all" ? " (This Teacher)" : ""}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((req: any, i: number) => (
                <div key={i} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="font-medium">{req.studentName} <span className="text-xs text-muted-foreground">({req.studentId})</span></p>
                    <p className="text-sm text-muted-foreground">{req.class || "N/A"} • Risk: {req.riskLevel || "-"}</p>
                    <p className="text-sm">{req.reason}</p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{req.teacherEmail}</div>
                    <div>{new Date(req.createdAt).toLocaleString()}</div>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            if (!token) return;
                            const res = await fetch(`http://localhost:5001/data/support/${req._id}`, {
                              method: 'PATCH',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            const result = await res.json();
                            if (!res.ok || !result?.success) throw new Error(result?.message || 'Failed to resolve');
                            // remove locally
                            setItems((prev) => prev.filter((x: any) => x._id !== req._id));
                          } catch (e: any) {
                            toast.error(e?.message || 'Failed to resolve');
                          }
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!items.length && <p className="text-sm text-muted-foreground">No support requests.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
