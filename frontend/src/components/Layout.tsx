import { ReactNode, useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Upload,
  AlertTriangle,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  GraduationCap,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sun, Moon } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Users, label: "Students", path: "/students" },
  { icon: Upload, label: "Upload Data", path: "/upload" },
  { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = typeof window !== "undefined"
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "null")?.role as string | undefined;
        } catch {
          return undefined;
        }
      })()
    : undefined;
  const overviewPath = userRole === "Counselor" ? "/counselor" : userRole === "Admin" ? "/admin" : "/dashboard";
  const items = useMemo(() => {
    const withOverview = [{ ...menuItems[0], path: overviewPath }, ...menuItems.slice(1)];
    if (userRole === "Counselor") {
      return withOverview.filter((item) => item.path !== "/upload");
    }
    if (userRole === "Admin") {
      return withOverview.filter((item) => item.path !== "/upload" && item.path !== "/reports");
    }
    return withOverview;
  }, [overviewPath, userRole]);

  const handleLogout = () => {
    navigate("/");
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const toDark = saved ? saved === "dark" : prefersDark;
      document.documentElement.classList.toggle("dark", !!toDark);
    } catch {}
  }, []);

  const toggleTheme = () => {
    try {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b bg-card">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X /> : <Menu />}
              </Button>
              <Link to={overviewPath} className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">EdTrack</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button
                aria-label="Toggle theme"
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card text-foreground transition hover:bg-accent"
              >
                <Sun className="h-4 w-4 dark:hidden" />
                <Moon className="hidden h-4 w-4 dark:block" />
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="w-64 pl-8"
                />
              </div>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  DS
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card pt-20 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-full overflow-y-auto px-3 pb-4">
          <ul className="space-y-2 font-medium">
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center rounded-lg p-3 transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-8">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pt-20 lg:pl-64">
        <div key={location.pathname} className="p-4 lg:p-8 animate-fade-in-up">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
