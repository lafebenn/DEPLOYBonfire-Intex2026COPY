import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BonfireLogo } from "@/components/BonfireLogo";
import { authApi } from "@/lib/api";

export default function RegisterDonorPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 14) {
      setError("Password must be at least 14 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.registerDonor({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      if (!res.success) throw new Error(res.message || "Registration failed");
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Button variant="outline" size="lg" className="w-full" asChild>
          <Link to="/">Back to home</Link>
        </Button>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <BonfireLogo size="lg" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Create a donor account</h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            If we already have your supporter record on file, we will link it to your login automatically when the email
            matches.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Register</CardTitle>
            <CardDescription>Donor portal access only. Staff accounts are created by an administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Display name</Label>
                <Input
                  id="reg-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">At least 14 characters (same rules as staff-created accounts).</p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
