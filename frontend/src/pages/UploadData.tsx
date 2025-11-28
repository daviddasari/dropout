import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

interface UploadedRow {
  Student_ID: string;
  Name: string;
  Class: string;
  Attendance_Percent: number;
  GPA: number;
  Fees_Paid: string;
  Family_Income: number;
  Risk_Level: string;
}

export default function UploadData() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<UploadedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [myData, setMyData] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const navigate = useNavigate();
  const userRole = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")?.role as string | undefined;
    } catch {
      return undefined;
    }
  }, []);

  const fetchMyData = async () => {
    try {
      if (!token) return;
      const res = await fetch("http://localhost:5001/data/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result?.success) {
        setMyData(result.data || []);
      }
    } catch {
      // silent
    }
  };

  const handleDelete = async () => {
    try {
      if (!token) {
        toast.error("Login required");
        return;
      }
      setDeleting(true);
      const res = await fetch("http://localhost:5001/data/mine", {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || "Delete failed");
      }
      toast.success("Existing data deleted");
      setFile(null);
      setData([]);
      setIsValidated(false);
      await fetchMyData();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    // Block counselor access
    if (userRole === "Counselor") {
      toast.error("Counselors cannot upload data");
      navigate("/counselor");
      return;
    }
    fetchMyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (myData.length > 0) {
        toast.error("You already have uploaded data. Delete it before uploading a new sheet.");
        return;
      }
      setFile(selectedFile);
      readFile(selectedFile);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (myData.length > 0) {
        toast.error("You already have uploaded data. Delete it before uploading a new sheet.");
        return;
      }
      setFile(droppedFile);
      readFile(droppedFile);
    }
  };

  const normalizeRows = (rows: any[]): UploadedRow[] => {
    return rows.map((r) => {
      const o: any = { ...r };
      if (o["Attendance_%"] !== undefined && o["Attendance_Percent"] === undefined) {
        o["Attendance_Percent"] = o["Attendance_%"];
        delete o["Attendance_%"];
      }
      if (o["Fees Paid"] !== undefined && o["Fees_Paid"] === undefined) {
        o["Fees_Paid"] = o["Fees Paid"];
        delete o["Fees Paid"];
      }
      return o as UploadedRow;
    });
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(result, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws) as any[];
        const normalized = normalizeRows(json);
        setData(normalized);
        setIsValidated(false);
        setValidationErrors([]);
        toast.success(`File loaded: ${normalized.length} rows`);
      } catch (error) {
        toast.error("Error reading file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = () => {
    const errors: string[] = [];
    const requiredFields = [
      "Student_ID",
      "Name",
      "Class",
      "Attendance_Percent",
      "GPA",
      "Fees_Paid",
      "Family_Income",
      "Risk_Level",
    ];

    data.forEach((row, index) => {
      requiredFields.forEach((field) => {
        if (!row[field as keyof UploadedRow]) {
          errors.push(`Row ${index + 2}: Missing ${field}`);
        }
      });

      if (row.GPA && (row.GPA < 0 || row.GPA > 10)) {
        errors.push(`Row ${index + 2}: GPA must be between 0 and 10`);
      }

      if (
        row.Attendance_Percent &&
        (row.Attendance_Percent < 0 || row.Attendance_Percent > 100)
      ) {
        errors.push(`Row ${index + 2}: Attendance must be between 0 and 100`);
      }
    });

    setValidationErrors(errors);
    setIsValidated(true);

    if (errors.length === 0) {
      toast.success("Data validated successfully!");
    } else {
      toast.error(`Validation failed: ${errors.length} errors found`);
    }
  };

  const handleUpload = async () => {
    if (myData.length > 0) {
      toast.error("Please delete your existing sheet before uploading a new one.");
      return;
    }
    if (!isValidated) {
      toast.error("Please validate data before uploading");
      return;
    }

    if (validationErrors.length > 0) {
      toast.error("Cannot upload data with validation errors");
    }

    try {
      const res = await fetch("http://localhost:5001/data/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || "Upload failed");
      }
      toast.success(`Uploaded ${result.inserted}/${result.total} rows`);
      setFile(null);
      setData([]);
      setIsValidated(false);
      fetchMyData();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Student_ID: "101",
        Name: "John Doe",
        Class: "10A",
        Attendance_Percent: 85,
        GPA: 7.5,
        Fees_Paid: "Yes",
        Family_Income: 400000,
        Risk_Level: "Low",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "EdTrack_Template.xlsx");
    toast.success("Template downloaded");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Upload Student Data</h1>
          <p className="text-muted-foreground">
            Import student data from Excel or CSV files
          </p>
        </div>

        {/* Download Template */}
        <Card>
          <CardHeader>
            <CardTitle>Excel Template</CardTitle>
            <CardDescription>
              Download the template to see required columns and format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Student_ID</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Class</th>
                    <th className="p-2 text-left">Attendance_%</th>
                    <th className="p-2 text-left">GPA</th>
                    <th className="p-2 text-left">Fees_Paid</th>
                    <th className="p-2 text-left">Family_Income</th>
                    <th className="p-2 text-left">Risk_Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b text-muted-foreground">
                    <td className="p-2">101</td>
                    <td className="p-2">John Doe</td>
                    <td className="p-2">10A</td>
                    <td className="p-2">85</td>
                    <td className="p-2">7.5</td>
                    <td className="p-2">Yes</td>
                    <td className="p-2">400000</td>
                    <td className="p-2">Low</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Select an Excel (.xlsx) or CSV file containing student data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myData.length > 0 && (
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                You already have uploaded data ({myData.length} records). Delete it to upload a new sheet.
              </div>
            )}
            <div
              onDragOver={onDragOver}
              onDrop={onDrop}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors hover:border-primary"
              aria-disabled={myData.length > 0}
            >
              <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground" />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-center"
              >
                <span className="font-medium text-primary">
                  Click to upload
                </span>{" "}
                or drag and drop
                <p className="mt-1 text-sm text-muted-foreground">
                  XLSX or CSV (max 10MB)
                </p>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={myData.length > 0}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="flex-1 text-sm">{file.name}</span>
                <span className="text-sm text-muted-foreground">
                  {data.length} rows
                </span>
              </div>
            )}

            {data.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={validateData} variant="outline" className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Validate Data
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={myData.length > 0 || !isValidated || validationErrors.length > 0}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload to System
                </Button>
              </div>
            )}

            {myData.length > 0 && (
              <div className="flex justify-end">
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete Existing Data"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Results */}
        {isValidated && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              {validationErrors.length === 0 ? (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    All data validated successfully! Ready to upload.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-danger">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {validationErrors.length} validation errors found
                    </span>
                  </div>
                  <ul className="ml-7 list-disc space-y-1 text-sm">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index} className="text-muted-foreground">
                        {error}
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-muted-foreground">
                        ... and {validationErrors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Data Preview */}
        {data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>First 5 rows of uploaded data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(data[0]).map((key) => (
                        <th key={key} className="p-2 text-left">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="p-2">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Uploaded Data */}
        <Card>
          <CardHeader>
            <CardTitle>My Uploaded Data</CardTitle>
            <CardDescription>
              {myData.length === 0 ? "No records uploaded yet" : `${myData.length} records uploaded`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Student_ID</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Class</th>
                      <th className="p-2 text-left">Attendance_%</th>
                      <th className="p-2 text-left">GPA</th>
                      <th className="p-2 text-left">Fees_Paid</th>
                      <th className="p-2 text-left">Family_Income</th>
                      <th className="p-2 text-left">Risk_Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myData.slice(0, 20).map((row: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{row.Student_ID}</td>
                        <td className="p-2">{row.Name}</td>
                        <td className="p-2">{row.Class}</td>
                        <td className="p-2">{row.Attendance_Percent}</td>
                        <td className="p-2">{row.GPA}</td>
                        <td className="p-2">{row.Fees_Paid}</td>
                        <td className="p-2">{row.Family_Income}</td>
                        <td className="p-2">{row.Risk_Level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {myData.length > 20 && (
                  <p className="mt-2 text-xs text-muted-foreground">Showing first 20 records</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
