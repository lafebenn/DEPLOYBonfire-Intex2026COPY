import { useState } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useAuth, type User } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BonfireLogo } from "@/components/BonfireLogo";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { AlertCircle } from "lucide-react";

function resolvePostLoginPath(userRole: string, requested: string): string {
  if (userRole === "donor") {
    if (requested === "/donate" || requested.startsWith("/donate")) return "/donate";
    return "/donate";
  }
  if (requested && requested !== "/donate") return requested;
  return "/app";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState<{ email: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifyLoading, setMfaVerifyLoading] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const redirectParam = searchParams.get("redirect")?.trim() || "";
  const stateFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const requestedPath = redirectParam || stateFrom || "/app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGoogleError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const outcome = await login(email, password);
      if (outcome.status === "mfa_required") {
        if (outcome.requiresTwoFactor === true) {
          setMfaStep({ email: outcome.email });
          setPassword("");
        }
        return;
      }
      const dest = resolvePostLoginPath(outcome.user.role, requestedPath);
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!mfaStep) return;
    const code = mfaCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setMfaVerifyLoading(true);
    try {
      const user = await verifyTwoFactor(mfaStep.email, code);
      const dest = resolvePostLoginPath(user.role, requestedPath);
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setMfaVerifyLoading(false);
    }
  };

  const handleGoogleSuccess = (user: User) => {
    setGoogleError("");
    const dest = resolvePostLoginPath(user.role, requestedPath);
    navigate(dest, { replace: true });
  };

  if (mfaStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BonfireLogo size="lg" />
            </div>
            <p className="text-muted-foreground">Two-step verification</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Authenticator required</CardTitle>
              <CardDescription>
                Account <strong>{mfaStep.email}</strong> has two-factor authentication enabled. Enter the code from your
                authenticator app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="mfa">6-digit code</Label>
                  <Input
                    id="mfa"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={mfaVerifyLoading}
                  />
                </div>
                <Button type="submit" className="w-full" variant="secondary" disabled={mfaVerifyLoading}>
                  {mfaVerifyLoading ? "Verifying…" : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={mfaVerifyLoading}
                  onClick={() => {
                    setMfaStep(null);
                    setError("");
                    setMfaCode("");
                  }}
                >
                  Back to sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BonfireLogo size="lg" />
          </div>
          <p className="text-muted-foreground">Staff, donors, and administrators</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Enter your credentials. Donors must sign in before giving to the mission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading || googleBusy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading || googleBusy}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || googleBusy}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            {googleError && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {googleError}
              </div>
            )}
            <div className={googleBusy ? "opacity-70 pointer-events-none" : ""}>
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={(msg) => setGoogleError(msg)}
                onBusyChange={setGoogleBusy}
              />
            </div>
            {googleBusy && (
              <p className="text-center text-xs text-muted-foreground mt-2">Signing in with Google…</p>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">Grading accounts (no 2FA)</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Admin / Staff / Donor:</strong> use seeded sanctuary.org accounts (passwords 14+ chars from
                  your env).
                </p>
                <p>Enable 2FA from the app after sign-in to test the authenticator step.</p>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              <Link to="/" className="text-primary hover:underline">
                Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
