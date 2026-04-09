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
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CONSENT_CHANGED_EVENT, mayPersistPreferenceCookies } from "@/lib/cookieConsent";

const SIDEBAR_OPEN_COOKIE = "bonfire_sidebar_open";
const SIDEBAR_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;

function readSidebarOpenFromCookie(): boolean | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${SIDEBAR_OPEN_COOKIE}=([^;]*)`));
  if (!match) return null;
  const raw = decodeURIComponent(match[1]!.replace(/\+/g, " "));
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

function writeSidebarOpenCookie(open: boolean) {
  document.cookie = `${SIDEBAR_OPEN_COOKIE}=${open ? "true" : "false"}; Path=/; Max-Age=${SIDEBAR_COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

function deleteSidebarOpenCookie() {
  document.cookie = `${SIDEBAR_OPEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

const navItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard, roles: ["admin", "staff", "fundraising_director"] },
  { title: "Caseload", url: "/app/caseload", icon: Users, roles: ["admin", "staff"] },
  { title: "Process Recording", url: "/app/recordings/new", icon: FileText, roles: ["admin", "staff"] },
  { title: "Home Visits", url: "/app/visits/new", icon: Home, roles: ["admin", "staff"] },
  { title: "Case Conferences", url: "/app/conferences/new", icon: Calendar, roles: ["admin", "staff"] },
  { title: "Donors", url: "/app/donors", icon: Heart, roles: ["admin", "fundraising_director"] },
  { title: "Reports", url: "/app/reports", icon: BarChart3, roles: ["admin", "staff", "fundraising_director"] },
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
    return <Navigate to="/donor" replace />;
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
    <div className="h-dvh min-h-0 flex overflow-hidden bg-background">
      <DesktopSidebar
        visibleNav={visibleNav}
        activeByUrl={activeByUrl}
        userName={user?.name ?? ""}
        userRole={user?.role ?? ""}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 sm:px-6 shrink-0">
          <h1 className="font-heading text-base sm:text-lg font-semibold text-foreground truncate">{activeTitle}</h1>
          <div className="ml-auto flex items-center gap-2">
            <MobileSidebarButton
              visibleNav={visibleNav}
              activeByUrl={activeByUrl}
              userName={user?.name ?? ""}
              userRole={user?.role ?? ""}
              onLogout={logout}
            />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function DesktopSidebar({
  visibleNav,
  activeByUrl,
  userName,
  userRole,
  onLogout,
}: {
  visibleNav: typeof navItems;
  activeByUrl: Map<string, boolean>;
  userName: string;
  userRole: string;
  onLogout: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof document === "undefined") return true;
    if (!mayPersistPreferenceCookies()) return true;
    return readSidebarOpenFromCookie() ?? true;
  });

  useEffect(() => {
    const onConsentChanged = () => {
      if (!mayPersistPreferenceCookies()) {
        deleteSidebarOpenCookie();
        setSidebarOpen(true);
      }
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsentChanged);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onConsentChanged);
  }, []);

  return (
    <aside
      className={cn(
        "hidden md:flex bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col h-full min-h-0 transition-all duration-300 shrink-0",
        sidebarOpen ? "w-64" : "w-16",
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        {sidebarOpen ? (
          <BonfireLogo variant="sidebar" />
        ) : (
          <Link to="/app" aria-label="Go to dashboard" className="mx-auto">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <span className="text-primary font-heading font-bold text-sm">B</span>
            </div>
          </Link>
        )}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-2 space-y-1">
        {visibleNav.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeByUrl.get(item.url) && "bg-sidebar-accent text-sidebar-primary font-medium",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>

      <div className="shrink-0 p-3 border-t border-sidebar-border bg-sidebar">
        <div
          className={cn("flex items-center gap-3 px-3 py-2 mb-1 rounded-xl", !sidebarOpen && "justify-center px-0")}
          title={userName}
        >
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-sidebar-primary" aria-hidden />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{userRole.replace("_", " ")}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setSidebarOpen((prev) => {
                const next = !prev;
                if (mayPersistPreferenceCookies()) writeSidebarOpenCookie(next);
                return next;
              });
            }}
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full",
              "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-destructive",
              !sidebarOpen && "hidden",
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebarButton({
  visibleNav,
  activeByUrl,
  userName,
  userRole,
  onLogout,
}: {
  visibleNav: typeof navItems;
  activeByUrl: Map<string, boolean>;
  userName: string;
  userRole: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
          <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
            <BonfireLogo variant="sidebar" />
          </div>
          <nav className="py-4 px-2 space-y-1">
            {visibleNav.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  activeByUrl.get(item.url) && "bg-sidebar-accent text-sidebar-primary font-medium",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto shrink-0 p-3 border-t border-sidebar-border bg-sidebar">
            <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl" title={userName}>
              <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-sidebar-primary" aria-hidden />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{userRole.replace("_", " ")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-destructive transition-colors w-full"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
