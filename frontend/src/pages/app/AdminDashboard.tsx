import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Heart, Calendar, TrendingUp, FileText, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/lib/api";

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
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
