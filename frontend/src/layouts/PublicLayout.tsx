import { Outlet, Link } from "react-router-dom";
import { BonfireLogo } from "@/components/BonfireLogo";
import { Button } from "@/components/ui/button";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { useAuth } from "@/contexts/AuthContext";

export default function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="section-container flex items-center justify-between h-16 gap-4">
          <BonfireLogo />
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/impact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Impact</Link>
            <Link to="/donate" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Donate</Link>
            <Link to="/privacy" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                {user?.role === "donor" ? (
                  <Button asChild size="sm" variant="default">
                    <Link to="/donate">Donate</Link>
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <Link to="/app">Staff portal</Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card/50 py-10">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <BonfireLogo />
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
              <Link to="/impact" className="hover:text-foreground transition-colors">Our Impact</Link>
              <Link to="/donate" className="hover:text-foreground transition-colors">Donate</Link>
            </nav>
            <p className="text-sm text-muted-foreground">© 2026 Bonfire. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <CookieConsentBanner />
    </div>
  );
}
