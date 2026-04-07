import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Heart, Calendar, TrendingUp, FileText, Clock, Flame } from "lucide-react";
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

function topFactorSummary(factors: Record<string, number>): string {
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

      {data.highAttentionResidents && data.highAttentionResidents.length > 0 ? (
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/[0.03] to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              Residents needing attention
            </CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Top {data.highAttentionResidents.length} active cases by composite score: days since last process recording,
              emotional notes trend across recent sessions, incidents in the last 30 days, education attendance change,
              health trajectory, latest ML resident-risk prediction, and recorded case risk level.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
              {data.highAttentionResidents.map((r) => (
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
          </CardContent>
        </Card>
      ) : null}

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
