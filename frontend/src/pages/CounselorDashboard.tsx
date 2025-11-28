import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Users, Calendar, MessageSquare, AlertTriangle, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CounselorDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [teacherEmail, setTeacherEmail] = useState<string>("all");
  const [teacherEmails, setTeacherEmails] = useState<string[]>([]);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchAllPrefer = async () => {
      try {
        if (!token) return;
        // Try admin-like endpoint first; fallback to mine
        let res = await fetch("http://localhost:5001/data/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          res = await fetch("http://localhost:5001/data/mine", {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        const result = await res.json();
        if (res.ok && result?.success) setRecords(Array.isArray(result.data) ? result.data : []);
      } catch {}
    };
    fetchAllPrefer();
  }, [token]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        if (!token) return;
        const res = await fetch("http://localhost:5001/data/teachers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.emails)) {
          setTeacherEmails(result.emails);
        }
      } catch {}
    };
    fetchTeachers();
  }, [token]);

  // Fetch support requests for counselors
  useEffect(() => {
    const fetchSupport = async () => {
      try {
        if (!token) return;
        const q = teacherEmail !== "all" ? `?teacherEmail=${encodeURIComponent(teacherEmail)}` : "";
        const res = await fetch(`http://localhost:5001/data/support${q}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.items)) setSupportRequests(result.items);
      } catch {}
    };
    fetchSupport();
  }, [token, teacherEmail]);

  const classes = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r: any) => {
      if (r.Class) set.add(String(r.Class));
    });
    return Array.from(set).sort();
  }, [records]);

  const derivedTeacherEmails = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r: any) => {
      const e = String(r.TeacherEmail || "").trim();
      if (e) set.add(e);
    });
    return Array.from(set).sort();
  }, [records]);

  const emailsToShow = teacherEmails.length ? teacherEmails : derivedTeacherEmails;

  useEffect(() => {
    // If nothing selected and we have emails, preselect "all" by default (keep as is)
    // If a previously selected email is not in the new list, reset to "all"
    if (teacherEmail !== "all" && emailsToShow.length && !emailsToShow.includes(teacherEmail)) {
      setTeacherEmail("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailsToShow.join("," )]);

  const visibleRecords = useMemo(() => {
    return records.filter((r: any) => {
      const classOk = selectedClass === "all" || String(r.Class) === selectedClass;
      const teacherOk = teacherEmail === "all" || String(r.TeacherEmail || "") === teacherEmail;
      return classOk && teacherOk;
    });
  }, [records, selectedClass, teacherEmail]);

  useEffect(() => {
    // Persist temporary counselor choices in dev
    try {
      localStorage.setItem("counselor_selected_class", selectedClass);
      localStorage.setItem("counselor_teacher_email", teacherEmail);
    } catch {}
  }, [selectedClass, teacherEmail]);

  useEffect(() => {
    // Load persisted selections
    try {
      const savedClass = localStorage.getItem("counselor_selected_class");
      const savedEmail = localStorage.getItem("counselor_teacher_email");
      if (savedClass) setSelectedClass(savedClass);
      if (savedEmail) setTeacherEmail(savedEmail);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const assigned = visibleRecords.length || 0;
    const highRisk = visibleRecords.filter((r: any) => String(r.Risk_Level) === "High").length;
    const sessionsThisWeek = 0;
    const openAlerts = highRisk; // placeholder mapping
    return { assigned, highRisk, sessionsThisWeek, openAlerts };
  }, [visibleRecords]);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Counselor Overview</h1>
          <p className="text-muted-foreground">Manage caseload, sessions, and student alerts</p>
        </div>

        {/* Counselor Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Scope Selection</CardTitle>
            <CardDescription>Choose the teacher email and class you are counseling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Select value={teacherEmail} onValueChange={setTeacherEmail}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <SelectValue placeholder="Select teacher" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {emailsToShow.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {emailsToShow.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No teacher emails found yet. Upload data while logged in as a Teacher to populate this list.
                </div>
              )}
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Assigned Students" value={stats.assigned} icon={Users} variant="default" />
          <StatCard title="High Risk" value={stats.highRisk} icon={AlertTriangle} variant="danger" />
          <StatCard title="Sessions (This Week)" value={stats.sessionsThisWeek} icon={Calendar} variant="success" />
          <StatCard title="Open Alerts" value={stats.openAlerts} icon={MessageSquare} variant="warning" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Students</CardTitle>
              <CardDescription>Students currently in your caseload</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visibleRecords.slice(0, 8).map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{r.Name}</p>
                      <p className="text-sm text-muted-foreground">{r.Class}</p>
                    </div>
                    <div className="text-sm">Risk: {r.Risk_Level || "Unknown"}</div>
                  </div>
                ))}
                {!visibleRecords.length && <p className="text-sm text-muted-foreground">No students for the selected class.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Schedule and follow-ups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">No sessions scheduled. Add sessions from the Students page.</div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Support Requests</CardTitle>
              <CardDescription>Requests sent by teachers{teacherEmail !== "all" ? ` • ${teacherEmail}` : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supportRequests.map((req: any, i: number) => (
                  <div
                    key={i}
                    className={`flex items-start justify-between rounded-lg border p-3 animate-fade-in-up ${req.resolved ? 'opacity-60' : ''}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{req.studentName} <span className="text-xs text-muted-foreground">({req.studentId})</span></p>
                      <p className="text-sm text-muted-foreground">{req.class || "N/A"} • Risk: {req.riskLevel || "-"}</p>
                      <p className="text-sm">{req.reason}</p>
                      {req.resolved && <span className="text-xs text-muted-foreground">Resolved</span>}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <div>{req.teacherEmail}</div>
                      <div>{new Date(req.createdAt).toLocaleString()}</div>
                      {!req.resolved && (
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
                                // refresh list
                                const q = teacherEmail !== 'all' ? `?teacherEmail=${encodeURIComponent(teacherEmail)}` : '';
                                const r2 = await fetch(`http://localhost:5001/data/support${q}`, { headers: { Authorization: `Bearer ${token}` } });
                                const j2 = await r2.json();
                                if (r2.ok && j2?.success) setSupportRequests(j2.items);
                              } catch (e: any) {
                                toast.error(e?.message || 'Failed to resolve');
                              }
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!supportRequests.length && (
                  <p className="text-sm text-muted-foreground">No support requests yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Students requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const scopedHigh = visibleRecords.filter((r: any) => String(r.Risk_Level) === "High");
                  const globalHigh = scopedHigh.length ? [] : records.filter((r: any) => String(r.Risk_Level) === "High");
                  const scopedMedium = (scopedHigh.length || globalHigh.length) ? [] : visibleRecords.filter((r: any) => String(r.Risk_Level) === "Medium");
                  const list = (scopedHigh.length ? scopedHigh : (globalHigh.length ? globalHigh : scopedMedium)).slice(0, 5);
                  return list.length ? (
                    list.map((r: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border p-3 animate-fade-in-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <AlertTriangle className={`h-5 w-5 ${String(r.Risk_Level) === 'High' ? 'text-danger' : 'text-warning'}`} />
                        <div className="flex-1">
                          <p className="font-medium">{r.Name}</p>
                          <p className="text-sm text-muted-foreground">{r.Class} • {String(r.Risk_Level)} risk</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No alerts available for the selected scope.</p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
