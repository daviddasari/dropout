import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Mail } from "lucide-react"; // <--- Imported Mail icon
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";

export default function Reports() {
  const [dateRange, setDateRange] = useState("this-month");
  const [reportType, setReportType] = useState("all");
  const [records, setRecords] = useState<any[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false); // <--- State for email loading
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) return;
        const role = (() => {
          try { return JSON.parse(localStorage.getItem("user") || "null")?.role as string | undefined; } catch { return undefined; }
        })();
        
        let res = await fetch(
          role === "Counselor" || role === "Admin" ? "http://localhost:5001/data/all" : "http://localhost:5001/data/mine",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok && (role === "Counselor" || role === "Admin")) {
          res = await fetch("http://localhost:5001/data/mine", { headers: { Authorization: `Bearer ${token}` } });
        }
        const result = await res.json();
        if (res.ok && result?.success) setRecords(Array.isArray(result.data) ? result.data : []);
      } catch {}
    };
    fetchData();
  }, [token]);

  const filtered = useMemo(() => {
    let data = [...records];
    if (reportType === "at-risk") data = data.filter((r: any) => r.Risk_Level === "High");
    if (reportType === "attendance") data = data.map((r: any) => ({ Student_ID: r.Student_ID, Name: r.Name, Class: r.Class, Attendance_Percent: r.Attendance_Percent }));
    if (reportType === "academic") data = data.map((r: any) => ({ Student_ID: r.Student_ID, Name: r.Name, Class: r.Class, GPA: r.GPA }));
    if (reportType === "financial") data = data.map((r: any) => ({ Student_ID: r.Student_ID, Name: r.Name, Class: r.Class, Fees_Paid: r.Fees_Paid, Family_Income: r.Family_Income }));
    return data;
  }, [records, reportType]);

  const computed = useMemo(() => {
    const data = filtered;
    const total = data.length;
    const avgAttendance = total
      ? Math.round((data.reduce((s: number, r: any) => s + Number(r.Attendance_Percent ?? 0), 0) / total) * 10) / 10
      : 0;
    const avgGpa = total
      ? Math.round((data.reduce((s: number, r: any) => s + Number(r.GPA ?? 0), 0) / total) * 100) / 100
      : 0;
    const low = data.filter((r: any) => r.Risk_Level === "Low").length;
    const med = data.filter((r: any) => r.Risk_Level === "Medium").length;
    const high = data.filter((r: any) => r.Risk_Level === "High").length;
    return { total, avgAttendance, avgGpa, low, med, high };
  }, [filtered]);

  // --- NEW: Email Handler ---
  const handleEmailReport = async () => {
    setSendingEmail(true);
    try {
      // Get current user email from local storage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userEmail = user.email;

      if (!userEmail) {
        toast.error("User email not found. Please log in again.");
        return;
      }

      // Call the backend API with current filtered data + summary
      const response = await fetch('http://localhost:5001/email/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail,
          reportType: `Report: ${reportType.toUpperCase()}`,
          rows: filtered,
          summary: computed,
        }),
      });

      if (response.ok) {
        toast.success(`Report sent to ${userEmail}`);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      toast.error("Failed to send email. Check backend connection.");
    } finally {
      setSendingEmail(false);
    }
  };
  // --------------------------

  const handleExport = (format: string) => {
    const data = filtered;
    if (!data.length) {
      toast.error("No data to export");
      return;
    }
    const fileBase = `edtrack_report_${reportType}_${new Date().toISOString().slice(0,10)}`;
    try {
      if (format === "csv") {
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${fileBase}.csv`; a.click(); URL.revokeObjectURL(url);
      } else if (format === "excel") {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${fileBase}.xlsx`);
      } else if (format === "pdf") {
        const w = window.open("", "_blank");
        if (!w) throw new Error("Popup blocked");
        const rows = data
          .map((r: any) => `<tr>${Object.values(r).map((v:any) => `<td style='border:1px solid #ddd;padding:6px'>${String(v)}</td>`).join("")}</tr>`) 
          .join("");
        const headers = Object.keys(data[0]).map((h) => `<th style='border:1px solid #ddd;padding:6px;text-align:left'>${h}</th>`).join("");
        w.document.write(`<!doctype html><html><head><title>Report</title></head><body>
          <h2>EdTrack Report (${reportType})</h2>
          <p>Total: ${computed.total} • Avg Attendance: ${computed.avgAttendance}% • Avg GPA: ${computed.avgGpa}</p>
          <table style='border-collapse:collapse;width:100%'><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
        </body></html>`);
        w.document.close();
        w.focus();
        w.print();
      }
      toast.success(`Exported ${format.toUpperCase()}`);
    } catch (e: any) {
      toast.error(e?.message || `Failed to export ${format}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive student reports
          </p>
        </div>

        {/* Filter Options */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Select filters and options for your report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="at-risk">At-Risk Students</SelectItem>
                    <SelectItem value="attendance">Attendance Report</SelectItem>
                    <SelectItem value="academic">Academic Performance</SelectItem>
                    <SelectItem value="financial">Financial Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Report</CardTitle>
            <CardDescription>
              Download report in your preferred format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* --- NEW EMAIL BUTTON --- */}
              <Button 
                onClick={handleEmailReport} 
                className="flex-1 min-w-[150px] bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={sendingEmail}
              >
                <Mail className="mr-2 h-4 w-4" />
                {sendingEmail ? "Sending..." : "Email Report"}
              </Button>

              <Button onClick={() => handleExport("pdf")} className="flex-1 min-w-[150px]">
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("excel")}
                className="flex-1 min-w-[150px]"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("csv")}
                className="flex-1 min-w-[150px]"
              >
                <Download className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>Preview of report data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{computed.total}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Average Attendance</p>
                  <p className="text-2xl font-bold">{computed.avgAttendance}%</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Average GPA</p>
                  <p className="text-2xl font-bold">{computed.avgGpa}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">Risk Distribution</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">Low Risk Students</span>
                    <span className="font-semibold text-success">{computed.low}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">Medium Risk Students</span>
                    <span className="font-semibold text-warning">{computed.med}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">High Risk Students</span>
                    <span className="font-semibold text-danger">{computed.high}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">Key Insights</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {computed.high} students currently categorized as High risk</li>
                  <li>• Average attendance is {computed.avgAttendance}% across selected data</li>
                  <li>• Average GPA is {computed.avgGpa}</li>
                  <li>• Top class by count: {(() => {
                    const counts: Record<string, number> = {};
                    records.forEach((r: any) => { counts[r.Class] = (counts[r.Class] || 0) + 1; });
                    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
                    return sorted[0]?.[0] || "N/A";
                  })()}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}