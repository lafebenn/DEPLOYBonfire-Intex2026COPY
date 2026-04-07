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
import { Users, Heart, Calendar, TrendingUp, FileText, Clock, UserPlus } from "lucide-react";
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

type AdminDashboardData = {
  activeResidentCount: number;
  atRiskCount: number;
  monthlyDonationTotal: number;
  safehouseOccupancy: SafehouseOcc[];
  recentDonations: RecentDonation[];
};

function formatPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

function donationLine(d: RecentDonation): string {
  const amt = d.amount ?? d.estimatedValue;
  const amtStr = amt != null ? formatPhp(Number(amt)) : d.donationType;
  return `${d.supporterName} · ${d.donationType} · ${amtStr}`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
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

  useEffect(() => {
    dashboardApi
      .admin()
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Failed to load dashboard");
        setData(res.data as AdminDashboardData);
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
