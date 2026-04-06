import { useState } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BonfireLogo } from "@/components/BonfireLogo";
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const redirectParam = searchParams.get("redirect")?.trim() || "";
  const stateFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const requestedPath =
    redirectParam || stateFrom || "/app";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const outcome = await login(email, password);
      if (outcome.status === "mfa_required") {
        setMfaStep({ email: outcome.email });
        setPassword("");
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

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(
      "Demo only: MFA cannot be completed for grading accounts. Use admin@bonfire.org or donor@bonfire.org without MFA."
    );
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
                Account <strong>{mfaStep.email}</strong> has MFA enabled. Enter a code from your authenticator app.
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
                    onChange={(e) => setMfaCode(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" variant="secondary">
                  Verify
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">Demo accounts (INTEX grading)</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Admin (no MFA):</strong> admin@bonfire.org / admin123</p>
                <p><strong>Donor (no MFA, has history):</strong> donor@bonfire.org / donor123</p>
                <p><strong>MFA (cannot complete):</strong> mfa@bonfire.org / mfa123</p>
                <p><strong>Staff:</strong> staff@bonfire.org / staff123</p>
                <p><strong>Fundraising:</strong> director@bonfire.org / director123</p>
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
