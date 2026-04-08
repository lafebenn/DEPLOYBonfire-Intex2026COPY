import { Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BonfireLogo } from "@/components/BonfireLogo";
import {
  LayoutDashboard,
  Users,
  Heart,
  FileText,
  Home,
  Calendar,
  BarChart3,
  Share2,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, roles: ["admin", "staff", "fundraising_director"] },
  { title: "Caseload", url: "/app/caseload", icon: Users, roles: ["admin", "staff"] },
  { title: "Process Recording", url: "/app/process-recording", icon: FileText, roles: ["admin", "staff"] },
  { title: "Home Visits", url: "/app/home-visits", icon: Home, roles: ["admin", "staff"] },
  { title: "Case Conferences", url: "/app/case-conferences", icon: Calendar, roles: ["admin", "staff"] },
  { title: "Donors", url: "/app/donors", icon: Heart, roles: ["admin", "staff", "fundraising_director"] },
  { title: "Reports", url: "/app/reports", icon: BarChart3, roles: ["admin", "fundraising_director"] },
  { title: "Social insights", url: "/app/social", icon: Share2, roles: ["admin", "staff", "fundraising_director"] },
];

export default function AuthenticatedLayout() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

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

  /** Donors use the public donor/giving flow only (not the staff app shell). */
  if (user?.role === "donor") {
    return <Navigate to="/donate" replace />;
  }

  const visibleNav = navItems.filter((item) => item.roles.includes(user!.role));
  const activeTitle =
    visibleNav.find((i) => location.pathname === i.url || (i.url !== "/app" && location.pathname.startsWith(i.url)))?.title ||
    "Bonfire";

  const activeByUrl = useMemo(() => {
    const path = location.pathname;
    const map = new Map<string, boolean>();
    for (const i of visibleNav) {
      const isActive = path === i.url || (i.url !== "/app" && path.startsWith(i.url));
      map.set(i.url, isActive);
    }
    return map;
  }, [location.pathname, visibleNav]);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-svh w-full bg-background">
        <Sidebar collapsible="icon" variant="sidebar">
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-3">
            <div className="flex items-center gap-2 px-2">
              <BonfireLogo variant="sidebar" />
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={activeByUrl.get(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2" title={user?.name}>
              <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-sidebar-primary" aria-hidden />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{user?.role.replace("_", " ")}</p>
              </div>
            </div>

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Sign Out"
                  className={cn("text-sidebar-foreground/70 hover:text-destructive")}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 sm:px-6 shrink-0">
            <SidebarTrigger className="mr-3" />
            <h1 className="font-heading text-base sm:text-lg font-semibold text-foreground truncate">{activeTitle}</h1>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-[1200px] mx-auto">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
