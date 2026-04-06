import { Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BonfireLogo } from "@/components/BonfireLogo";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Users,
  Heart,
  FileText,
  Home,
  Calendar,
  BarChart3,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, roles: ["admin", "staff", "fundraising_director"] },
  { title: "Caseload", url: "/app/caseload", icon: Users, roles: ["admin", "staff"] },
  { title: "Process Recording", url: "/app/process-recording", icon: FileText, roles: ["admin", "staff"] },
  { title: "Home Visits", url: "/app/home-visits", icon: Home, roles: ["admin", "staff"] },
  { title: "Case Conferences", url: "/app/case-conferences", icon: Calendar, roles: ["admin", "staff"] },
  { title: "Donors", url: "/app/donors", icon: Heart, roles: ["admin", "fundraising_director"] },
  { title: "Reports", url: "/app/reports", icon: BarChart3, roles: ["admin", "fundraising_director"] },
];

export default function AuthenticatedLayout() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-3 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /** Donors use the public donor/giving flow only — not the staff app shell */
  if (user?.role === "donor") {
    return <Navigate to="/donate" replace />;
  }

  const visibleNav = navItems.filter((item) => item.roles.includes(user!.role));

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0`}
      >
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          {sidebarOpen ? (
            <BonfireLogo variant="sidebar" />
          ) : (
            <div className="mx-auto">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-heading font-bold text-sm">B</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/app"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          {sidebarOpen && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role.replace("_", " ")}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-4"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-lg font-semibold text-foreground">
            {visibleNav.find((i) => location.pathname === i.url || (i.url !== "/app" && location.pathname.startsWith(i.url)))?.title || "Bonfire"}
          </h1>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
