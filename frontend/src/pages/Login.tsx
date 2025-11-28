import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    const emailLc = email.toLowerCase();
    if (emailLc === "admin@demo.edu" && password === "admin123") {
      const user = { id: "a1", name: "Admin Demo", email: emailLc, role: "Admin" };
      localStorage.setItem("token", "demo-token-admin");
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Logged in as Admin (Demo)");
      navigate("/admin");
      return;
    }
    if (emailLc === "counselor@demo.edu" && password === "counselor123") {
      const user = { id: "c1", name: "Counselor Demo", email: emailLc, role: "Counselor" };
      localStorage.setItem("token", "demo-token-counselor");
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Logged in as Counselor (Demo)");
      navigate("/counselor");
      return;
    }
    try {
      const res = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok || !result?.success) {
        throw new Error(result?.message || "Login failed");
      }
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      toast.success(`Logged in as ${result.user?.email || role}`);
      const userRole = result?.user?.role;
      if (userRole === "Counselor") {
        navigate("/counselor");
      } else if (userRole === "Admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    }
  };

  const handleGuestAccess = () => {
    toast.success("Accessing as Guest");
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen">
      {/* Global animated background (covers both columns) */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full text-muted-foreground/10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute right-10 top-40 h-80 w-80 rounded-full bg-warning/20 blur-3xl animate-float-delay" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-success/20 blur-3xl animate-float-slow" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-10 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">EdTrack</span>
          </div>

          <div className="mb-8">
            <p className="text-sm text-muted-foreground">Start your journey</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Sign in to EdTrack</h1>
          </div>

          <Card className="backdrop-blur">
            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Counselor">Counselor</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E‑mail</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">Sign In</Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGuestAccess}>Continue as Guest</Button>
            </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Message card over background */}
        <div className="hidden items-center justify-center p-6 lg:flex">
          <div className="rounded-3xl border bg-card/60 p-8 shadow-xl backdrop-blur-md animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <p className="text-xl font-semibold">Learn. Predict. Support.</p>
            </div>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              AI-powered insights to identify at-risk students early and guide timely interventions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
