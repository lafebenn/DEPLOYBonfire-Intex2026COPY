import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Heart, Calendar, TrendingUp, FileText, Clock, Flame, UserPlus, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { authApi, dashboardApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type SafehouseOcc = {
  safehouseId: number;
  name: string;
  currentOccupancy: number;
  capacityGirls: number;
};

type RecentDonation = {
  donationId: number;
  amount: number | null;
  estimatedValue: number | null;
  donationDate: string;
  donationType: string;
  supporterName: string;
};

type AttentionResident = {
  residentId: number;
  displayName: string;
  caseControlNo: string;
  internalCode: string;
  safehouseName: string;
  currentRiskLevel: string;
  compositeScore: number;
  flameLevel: number;
  factors: Record<string, number>;
};

type AdminDashboardData = {
  activeResidentCount: number;
  atRiskCount: number;
  monthlyDonationTotal: number;
  safehouseOccupancy: SafehouseOcc[];
  recentDonations: RecentDonation[];
  highAttentionResidents?: AttentionResident[];
};

function pickNum(a: unknown, b?: unknown): number {
  const n = Number(a ?? b);
  return Number.isFinite(n) ? n : 0;
}

/** Normalizes /api/dashboard/admin payloads (camelCase or PascalCase, optional arrays). */
function normalizeAdminDashboard(raw: unknown): AdminDashboardData {
  const d = raw as Record<string, unknown>;
  const haRaw = d.highAttentionResidents ?? d.HighAttentionResidents;
  const list = Array.isArray(haRaw) ? haRaw : [];
  const highAttentionResidents: AttentionResident[] = list.map((row) => {
    const r = row as Record<string, unknown>;
    const f = (r.factors ?? r.Factors) as Record<string, unknown> | undefined;
    const factors: Record<string, number> = {};
    if (f && typeof f === "object") {
      for (const [k, v] of Object.entries(f)) {
        const n = Number(v);
        if (Number.isFinite(n)) factors[k] = n;
      }
    }
    return {
      residentId: pickNum(r.residentId, r.ResidentId),
      displayName: String(r.displayName ?? r.DisplayName ?? ""),
      caseControlNo: String(r.caseControlNo ?? r.CaseControlNo ?? ""),
      internalCode: String(r.internalCode ?? r.InternalCode ?? ""),
      safehouseName: String(r.safehouseName ?? r.SafehouseName ?? ""),
      currentRiskLevel: String(r.currentRiskLevel ?? r.CurrentRiskLevel ?? ""),
      compositeScore: pickNum(r.compositeScore, r.CompositeScore),
      flameLevel: pickNum(r.flameLevel, r.FlameLevel),
      factors,
    };
  });

  const occ = (d.safehouseOccupancy ?? d.SafehouseOccupancy) as unknown[];
  const safehouseOccupancy: SafehouseOcc[] = Array.isArray(occ)
    ? occ.map((x) => {
        const r = x as Record<string, unknown>;
        return {
          safehouseId: pickNum(r.safehouseId, r.SafehouseId),
          name: String(r.name ?? r.Name ?? ""),
          currentOccupancy: pickNum(r.currentOccupancy, r.CurrentOccupancy),
          capacityGirls: pickNum(r.capacityGirls, r.CapacityGirls),
        };
      })
    : [];

  const donations = (d.recentDonations ?? d.RecentDonations) as unknown[];
  const recentDonations: RecentDonation[] = Array.isArray(donations)
    ? donations.map((x) => {
        const r = x as Record<string, unknown>;
        return {
          donationId: pickNum(r.donationId, r.DonationId),
          amount: r.amount != null ? Number(r.amount) : r.Amount != null ? Number(r.Amount) : null,
          estimatedValue:
            r.estimatedValue != null ? Number(r.estimatedValue) : r.EstimatedValue != null ? Number(r.EstimatedValue) : null,
          donationDate: String(r.donationDate ?? r.DonationDate ?? ""),
          donationType: String(r.donationType ?? r.DonationType ?? ""),
          supporterName: String(r.supporterName ?? r.SupporterName ?? ""),
        };
      })
    : [];

  return {
    activeResidentCount: pickNum(d.activeResidentCount, d.ActiveResidentCount),
    atRiskCount: pickNum(d.atRiskCount, d.AtRiskCount),
    monthlyDonationTotal: pickNum(d.monthlyDonationTotal, d.MonthlyDonationTotal),
    safehouseOccupancy,
    recentDonations,
    highAttentionResidents,
  };
}

const FACTOR_LABELS: Record<string, string> = {
  recordingOverdue: "Process recording gap",
  emotionalTrend: "Emotional trend (recent sessions)",
  incidents30d: "Incidents (30 d)",
  educationAttendanceDrop: "Attendance drop",
  healthDecline: "Health score decline",
  mlResidentRisk: "ML resident risk",
  caseRiskLevel: "Case risk level",
};

function flameClass(level: number): string {
  if (level >= 3) return "h-6 w-6 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.45)]";
  if (level >= 2) return "h-5 w-5 text-orange-500";
  if (level >= 1) return "h-4 w-4 text-amber-500";
  return "h-4 w-4 text-muted-foreground/60";
}

/** Light tint + accent stripe for the whole row; hover deepens the same hue. */
function attentionRowClass(flameLevel: number): string {
  if (flameLevel >= 3) {
    return "bg-red-500/[0.07] dark:bg-red-950/35 border-l-[3px] border-l-red-500/55 hover:bg-red-500/[0.12] dark:hover:bg-red-950/50";
  }
  if (flameLevel >= 2) {
    return "bg-orange-500/[0.07] dark:bg-orange-950/30 border-l-[3px] border-l-orange-500/50 hover:bg-orange-500/[0.12] dark:hover:bg-orange-950/45";
  }
  if (flameLevel >= 1) {
    return "bg-amber-500/[0.08] dark:bg-amber-950/25 border-l-[3px] border-l-amber-500/45 hover:bg-amber-500/[0.13] dark:hover:bg-amber-950/40";
  }
  return "bg-muted/35 border-l-[3px] border-l-muted-foreground/30 hover:bg-muted/55";
}

/** Matches flame tier: same reds / oranges / ambers as the icon beside it. */
function attentionRiskBadgeClass(flameLevel: number): string {
  if (flameLevel >= 3) {
    return "border-red-500/55 bg-red-500/10 text-red-600 shadow-[0_0_10px_-4px_rgba(239,68,68,0.45)] dark:text-red-400 dark:bg-red-500/15 dark:border-red-500/45";
  }
  if (flameLevel >= 2) {
    return "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400 dark:bg-orange-500/15 dark:border-orange-500/45";
  }
  if (flameLevel >= 1) {
    return "border-amber-500/45 bg-amber-500/10 text-amber-800 dark:text-amber-400 dark:bg-amber-500/15 dark:border-amber-500/40";
  }
  return "border-muted-foreground/25 bg-muted/40 text-muted-foreground";
}

function topFactorSummary(factors: Record<string, number> | null | undefined): string {
  if (!factors || typeof factors !== "object") return "No factor breakdown yet.";
  const entries = Object.entries(factors).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 2).filter(([, v]) => v > 5);
  if (top.length === 0) return "No single driver — blended signals";
  return top.map(([k, v]) => `${FACTOR_LABELS[k] ?? k} ${Math.round(v)}%`).join(" · ");
}

function formatPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

function donationLine(d: RecentDonation): string {
  const amt = d.amount ?? d.estimatedValue;
  const amtStr = amt != null ? formatPhp(Number(amt)) : d.donationType;
  return `${d.supporterName} · ${d.donationType} · ${amtStr}`;
}

export default function AdminDashboard() {
  const { user, verifyTwoFactor } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createRole, setCreateRole] = useState<"Admin" | "Staff" | "Donor">("Staff");
  const [createLinkedSupporterId, setCreateLinkedSupporterId] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [twoFaSetup, setTwoFaSetup] = useState<{ sharedKey: string; authenticatorUri: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  useEffect(() => {
    dashboardApi
      .admin()
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Failed to load dashboard");
        setData(normalizeAdminDashboard(res.data));
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword.trim() || !createDisplayName.trim()) {
      toast({ title: "Missing fields", description: "Email, display name, and password are required.", variant: "destructive" });
      return;
    }
    if (createPassword.length < 14) {
      toast({ title: "Password too short", description: "Use at least 14 characters.", variant: "destructive" });
      return;
    }
    setCreateSubmitting(true);
    try {
      const body = {
        email: createEmail.trim(),
        password: createPassword,
        displayName: createDisplayName.trim(),
        role: createRole,
      } as {
        email: string;
        password: string;
        displayName: string;
        role: string;
        linkedSupporterId?: number;
      };
      if (createRole === "Donor" && createLinkedSupporterId.trim()) {
        const n = Number(createLinkedSupporterId.trim());
        if (!Number.isInteger(n) || n < 1) {
          toast({ title: "Invalid supporter ID", description: "Enter a positive integer or leave blank to match by email.", variant: "destructive" });
          setCreateSubmitting(false);
          return;
        }
        body.linkedSupporterId = n;
      }
      const res = await authApi.register(body);
      if (!res.success) throw new Error(res.message || "Could not create user");
      toast({ title: "User created", description: `${createRole} account for ${createEmail.trim()}` });
      setCreateOpen(false);
      setCreateEmail("");
      setCreatePassword("");
      setCreateDisplayName("");
      setCreateLinkedSupporterId("");
      setCreateRole("Staff");
    } catch (err: unknown) {
      toast({
        title: "Create user failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreateSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!data) return <div className="p-8 text-muted-foreground">No data</div>;

  const stats = [
    { label: "Active Residents", value: String(data.activeResidentCount), icon: Users, trend: "Currently active cases" },
    { label: "At-Risk Residents", value: String(data.atRiskCount), icon: TrendingUp, trend: "ML risk flag count" },
    { label: "This Month's Donations", value: formatPhp(Number(data.monthlyDonationTotal)), icon: Heart, trend: "Sum for current month" },
    { label: "Safehouses", value: String(data.safehouseOccupancy.length), icon: Calendar, trend: "Active safehouse sites" },
  ];

  const recentActivity = (data.recentDonations ?? []).map((d) => ({
    text: donationLine(d),
    time: d.donationDate,
    type: "donation" as const,
  }));

  const attentionList = data.highAttentionResidents ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-bold">Bonfire · Program operations</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Authorized staff workspace. Signed in as{" "}
          <span className="text-foreground font-medium">{user?.name}</span>
          <span className="capitalize"> · {user?.role?.replace(/_/g, " ")}</span>
          . Figures below roll up from internal program reporting. Handle with care.
        </p>
      </div>

      <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/[0.03] to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Residents needing attention
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Up to three active cases ranked by composite score: process recording recency, emotional trend across recent
            sessions, incidents (30 d), education attendance, health trajectory, ML resident-risk prediction, and case risk
            level.
          </p>
        </CardHeader>
        <CardContent>
          {attentionList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No active residents in caseload right now, or scores are still computing. When there are active cases, the
              highest-need profiles appear here.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
              {attentionList.map((r) => (
                <li key={r.residentId}>
                  <Link
                    to={`/app/caseload/${r.residentId}`}
                    className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${attentionRowClass(r.flameLevel)}`}
                  >
                    <Flame className={`shrink-0 mt-0.5 ${flameClass(r.flameLevel)}`} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{r.displayName}</span>
                        {r.caseControlNo && r.caseControlNo !== r.displayName ? (
                          <span className="text-xs text-muted-foreground">({r.caseControlNo})</span>
                        ) : null}
                        {r.currentRiskLevel ? (
                          <Badge variant="outline" className={`text-[10px] capitalize ${attentionRiskBadgeClass(r.flameLevel)}`}>
                            {r.currentRiskLevel}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.safehouseName ? `${r.safehouseName} · ` : ""}
                        Score {r.compositeScore}
                      </p>
                      <p className="text-xs text-muted-foreground/90 mt-1 leading-snug">{topFactorSummary(r.factors)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground font-body">{s.label}</CardTitle>
                <s.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-heading font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-heading">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Two-factor authentication
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal leading-relaxed">
            Add a time-based code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.).
            After you finish setup, sign out and sign in with your password—you will be prompted for a 6-digit code.
            Google sign-in may not require this code in the current demo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.twoFactorEnabled ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Two-factor authentication is enabled on your account.
            </p>
          ) : twoFaSetup ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                In your authenticator app, add an account and either scan the QR from the &quot;Add to app&quot; link or enter
                this secret key manually.
              </p>
              <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs break-all select-all">
                {twoFaSetup.sharedKey}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(twoFaSetup.sharedKey);
                    toast({ title: "Copied", description: "Secret key copied to clipboard." });
                  }}
                >
                  Copy secret key
                </Button>
                <Button type="button" variant="secondary" size="sm" asChild>
                  <a href={twoFaSetup.authenticatorUri}>Open in authenticator app</a>
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dash-2fa-code">6-digit code</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="dash-2fa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={twoFaBusy}
                    className="sm:max-w-[12rem]"
                  />
                  <Button
                    type="button"
                    disabled={twoFaBusy || twoFaCode.length !== 6 || !user?.email}
                    onClick={async () => {
                      if (!user?.email) return;
                      setTwoFaBusy(true);
                      try {
                        await verifyTwoFactor(user.email, twoFaCode);
                        setTwoFaSetup(null);
                        setTwoFaCode("");
                        toast({
                          title: "Two-factor enabled",
                          description: "Next sign-in will ask for your authenticator code.",
                        });
                      } catch (err) {
                        toast({
                          title: "Could not verify",
                          description: err instanceof Error ? err.message : "Check the code and try again.",
                          variant: "destructive",
                        });
                      } finally {
                        setTwoFaBusy(false);
                      }
                    }}
                  >
                    {twoFaBusy ? "Verifying…" : "Confirm & enable"}
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setTwoFaSetup(null);
                  setTwoFaCode("");
                }}
                disabled={twoFaBusy}
              >
                Cancel setup
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={twoFaBusy}
              onClick={async () => {
                setTwoFaBusy(true);
                try {
                  const res = await authApi.enable2fa();
                  if (!res.success || !res.data) throw new Error(res.message || "Could not start 2FA setup");
                  setTwoFaSetup({ sharedKey: res.data.sharedKey, authenticatorUri: res.data.authenticatorUri });
                  setTwoFaCode("");
                } catch (err) {
                  toast({
                    title: "Setup failed",
                    description: err instanceof Error ? err.message : "Try again later.",
                    variant: "destructive",
                  });
                } finally {
                  setTwoFaBusy(false);
                }
              }}
            >
              {twoFaBusy ? "Starting…" : "Set up authenticator"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <UserPlus className="h-5 w-5 text-primary" />
              Team accounts
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Create staff, admin, or donor logins. Donors can also self-register from the login page unless you disable
              that flow later.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
            Create user
          </Button>
        </CardHeader>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>
                Password must be at least 14 characters. For donors, leave supporter ID blank to auto-link by email when
                possible.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cu-role">Role</Label>
                <Select value={createRole} onValueChange={(v) => setCreateRole(v as "Admin" | "Staff" | "Donor")}>
                  <SelectTrigger id="cu-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Donor">Donor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cu-name">Display name</Label>
                <Input
                  id="cu-name"
                  value={createDisplayName}
                  onChange={(e) => setCreateDisplayName(e.target.value)}
                  disabled={createSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cu-email">Email</Label>
                <Input
                  id="cu-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  disabled={createSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cu-password">Temporary password</Label>
                <Input
                  id="cu-password"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  disabled={createSubmitting}
                  autoComplete="new-password"
                />
              </div>
              {createRole === "Donor" && (
                <div className="grid gap-2">
                  <Label htmlFor="cu-sid">Supporter ID (optional)</Label>
                  <Input
                    id="cu-sid"
                    inputMode="numeric"
                    placeholder="e.g. 42 — or leave blank to match by email"
                    value={createLinkedSupporterId}
                    onChange={(e) => setCreateLinkedSupporterId(e.target.value)}
                    disabled={createSubmitting}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent donations.</p>
              ) : (
                recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "New Intake", badge: "Case", to: "/app/intake/new" },
                { label: "Record Visit", badge: "Visit", to: "/app/visits/new" },
                { label: "Add Donation", badge: "Donor", to: "/app/donations/new" },
                { label: "Schedule Conference", badge: "Meeting", to: "/app/conferences/new" },
                { label: "Process Recording", badge: "Record", to: "/app/recordings/new" },
                { label: "Generate Report", badge: "Report", to: "/app/reports/generate" },
                { label: "Social insights", badge: "Outreach", to: "/app/social" },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent transition-colors text-left"
                >
                  <span className="text-sm font-medium">{action.label}</span>
                  <Badge variant="outline" className="text-xs">{action.badge}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
