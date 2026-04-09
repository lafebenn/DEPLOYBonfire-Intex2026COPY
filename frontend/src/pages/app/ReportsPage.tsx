import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  Download,
  FileText,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi, safehousesApi } from "@/lib/api";
import type { ReportAnalytics, SafehouseMonthlyRow } from "@/lib/reportAnalytics";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  computeReportAnalytics,
  mapDashboardReportsMetrics,
  downloadAccomplishmentAnnexCsv,
  downloadDonorImpactReportCsv,
  downloadProgramComparisonCsv,
  downloadCsv,
} from "@/lib/reportAnalytics";
import { AccomplishmentReportDialog } from "@/components/reports/AccomplishmentReportDialog";
import {
  ReportTemplatePreviewDialog,
  type ReportTemplatePreviewVariant,
} from "@/components/reports/ReportTemplatePreviewDialog";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReportTemplate = {
  id: string;
  title: string;
  description: string;
  lastRun: string;
  /** Which CSV export best matches this template */
  exportFn: "accomplishment" | "program" | "caseload" | "donor-impact";
  /** Which preview dialog to show */
  preview: ReportTemplatePreviewVariant;
};

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "annual-accomplishment",
    title: "Annual Program Accomplishment Report",
    description:
      "All-up summary of this page: narrative + annex covering caseload, staff documentation, donations, outcomes, reintegration, and safehouse comparison.",
    lastRun: "FY template",
    exportFn: "accomplishment",
    preview: "accomplishment",
  },
  {
    id: "monthly-caseload",
    title: "Monthly Caseload & Status Summary",
    description: "Active, transitioning, and completed residents; intake velocity vs documentation load.",
    lastRun: "Monthly",
    exportFn: "caseload",
    preview: "caseload",
  },
  {
    id: "program-safehouse",
    title: "Program & Safehouse Comparison",
    description: "Resident counts by program pathway and implied safehouse/program allocation from records.",
    lastRun: "Quarterly",
    exportFn: "program",
    preview: "program",
  },
  {
    id: "reintegration",
    title: "Reintegration & Transition Outcomes",
    description: "Transitioning and completed statuses as proxy for reintegration tracking (aggregate only).",
    lastRun: "Semi-annual",
    exportFn: "accomplishment",
    preview: "reintegration",
  },
  {
    id: "staff-doc",
    title: "Staff Activity & Documentation Compliance",
    description: "Process recordings vs caseload; home visit completion rates; conference throughput.",
    lastRun: "Monthly",
    exportFn: "accomplishment",
    preview: "staff",
  },
  {
    id: "donor-impact-monthly",
    title: "Donor Impact Summary",
    description:
      "How community giving shows up in care and programs: counts, gentle visuals, and plain language—written for supporters, not internal accounting.",
    lastRun: "Monthly (prior month)",
    exportFn: "donor-impact",
    preview: "donor-impact",
  },
];

const CHART_PRIMARY = "hsl(24, 76%, 43%)";
const CHART_SECONDARY = "hsl(17, 51%, 41%)";
const CHART_SAGE = "hsl(120, 15%, 42%)";

function runExport(kind: ReportTemplate["exportFn"], analytics: ReportAnalytics) {
  if (kind === "accomplishment") downloadAccomplishmentAnnexCsv(analytics);
  else if (kind === "program") downloadProgramComparisonCsv(analytics);
  else if (kind === "donor-impact") downloadDonorImpactReportCsv(analytics);
  else {
    const statusRows = Object.entries(analytics.byStatus).map(([k, v]) => [k, String(v)]);
    downloadCsv(
      `bonfire-caseload-status-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Status", "Count"],
      statusRows,
    );
  }
}

export default function ReportsPage() {
  const isMobile = useIsMobile();
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const givingAllRef = useRef<{
    donationCount: number;
    donationTotal: number;
    donationsByMonth: ReportAnalytics["donationsByMonth"];
    donationByType?: ReportAnalytics["donationByType"];
    donationByChannel?: ReportAnalytics["donationByChannel"];
    donationByCampaign?: ReportAnalytics["donationByCampaign"];
  } | null>(null);
  const [preview, setPreview] = useState<{ open: boolean; title: string }>({ open: false, title: "" });
  const [templatePreview, setTemplatePreview] = useState<{
    open: boolean;
    title: string;
    variant: ReportTemplatePreviewVariant;
  }>({ open: false, title: "", variant: "accomplishment" });

  const [monthsBack, setMonthsBack] = useState("12");
  const [safehouseId, setSafehouseId] = useState<string>("all");
  const [safehouses, setSafehouses] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;

    safehousesApi
      .list()
      .then((res) => {
        if (cancelled) return;
        const list =
          Array.isArray(res) ? res : res && typeof res === "object" && "data" in res ? ((res as { data?: unknown }).data as unknown) : [];
        const parsed =
          Array.isArray(list) ?
            list
              .map((r) => {
                if (!r || typeof r !== "object") return null;
                const o = r as Record<string, unknown>;
                const id = Number(o.safehouseId ?? o.SafehouseId ?? o.id ?? o.Id);
                const name = String(o.name ?? o.Name ?? "");
                if (!Number.isFinite(id) || !name) return null;
                return { id, name };
              })
              .filter((x): x is { id: number; name: string } => x !== null)
              .sort((a, b) => a.name.localeCompare(b.name))
            : [];
        setSafehouses(parsed);
      })
      .catch(() => {
        if (!cancelled) setSafehouses([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMetricsLoading(true);
    const mb = Number(monthsBack);
    const sh = safehouseId === "all" ? null : Number(safehouseId);

    dashboardApi
      .reportsMetrics({
        monthsBack: Number.isFinite(mb) ? mb : 12,
        safehouseId: sh != null && Number.isFinite(sh) ? sh : null,
      })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data != null) {
          const mapped = mapDashboardReportsMetrics(res.data);
          if (mapped) {
            // "Giving" is org-wide (time-range only) and should not vary with safehouse selection.
            // We cache the most recent "All safehouses" giving metrics for the selected time window.
            if (safehouseId === "all") {
              givingAllRef.current = {
                donationCount: mapped.donationCount,
                donationTotal: mapped.donationTotal,
                donationsByMonth: mapped.donationsByMonth,
                donationByType: mapped.donationByType,
                donationByChannel: mapped.donationByChannel,
                donationByCampaign: mapped.donationByCampaign,
              };
              setAnalytics(mapped);
            } else {
              const givingAll = givingAllRef.current;
              if (givingAll) {
              setAnalytics({
                ...mapped,
                donationCount: givingAll.donationCount,
                donationTotal: givingAll.donationTotal,
                donationsByMonth: givingAll.donationsByMonth,
                donationByType: givingAll.donationByType,
                donationByChannel: givingAll.donationByChannel,
                donationByCampaign: givingAll.donationByCampaign,
              });
              } else {
                setAnalytics(mapped);
              }
            }
            setMetricsError(null);
            return;
          }
        }
        setMetricsError(res.message || "Could not load live metrics; showing browser-storage demo data.");
        setAnalytics(computeReportAnalytics({ monthsBack: Number.isFinite(mb) ? mb : 12 }));
      })
      .catch(() => {
        if (cancelled) return;
        setMetricsError("Could not reach the API; showing browser-storage demo data.");
        setAnalytics(computeReportAnalytics({ monthsBack: Number.isFinite(mb) ? mb : 12 }));
      })
      .finally(() => {
        if (!cancelled) setMetricsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthsBack, safehouseId]);

  const safehouseLatestByName = useMemo(() => {
    const rows = analytics?.safehouseMonthly ?? [];
    const by: Record<string, SafehouseMonthlyRow> = {};
    for (const r of rows) {
      const cur = by[r.safehouseName];
      if (!cur || r.month > cur.month) by[r.safehouseName] = r;
    }
    return Object.values(by).sort((a, b) => a.safehouseName.localeCompare(b.safehouseName));
  }, [analytics?.safehouseMonthly]);

  if (!analytics) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground font-body">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading report metrics…</p>
      </div>
    );
  }

  const programChartData = analytics.byProgram.map((p) => ({
    name: p.program.length > 18 ? `${p.program.slice(0, 16)}…` : p.program,
    full: p.program,
    residents: p.count,
  }));

  const donationTrendData = analytics.donationsByMonth.map((m) => ({
    month: m.month,
    amount: Math.round(m.total),
    gifts: m.count,
  }));

  const visitRatePct =
    analytics.visitCompletionRate !== null ? Math.round(analytics.visitCompletionRate * 100) : null;

  const eduTrendData = (analytics.educationProgressByMonth ?? []).map((m) => ({
    month: m.month,
    avg: m.avg == null ? null : Math.round(m.avg),
  }));

  const healthTrendData = (analytics.healthScoreByMonth ?? []).map((m) => ({
    month: m.month,
    avg: m.avg == null ? null : Number(m.avg.toFixed(2)),
  }));

  const reintegrationStatusData = (analytics.reintegrationByStatus ?? []).map((x) => ({
    status: x.label,
    count: x.count,
  }));

  const donationByTypeData = (analytics.donationByType ?? []).map((x) => ({
    label: x.label,
    count: x.count,
    total: Math.round(x.total),
  }));

  const donationByChannelData = (analytics.donationByChannel ?? []).map((x) => ({
    label: x.label,
    count: x.count,
    total: Math.round(x.total),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 space-y-8 pb-10">
      {/* Formal accomplishment-report header (Philippine SWD–style cues) */}
      <div className="relative overflow-hidden rounded-2xl border-4 border-double border-secondary/50 bg-card shadow-warm-md">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-secondary/[0.08] pointer-events-none" />
        <div className="relative text-center px-4 py-8 sm:px-10 sm:py-10">
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-muted-foreground font-body">
            Republic of the Philippines
          </p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1 font-body">
            Program monitoring &amp; accomplishment reporting
          </p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mt-5 text-foreground">
            Bonfire Sanctuary Program
          </h1>
          <p className="font-heading text-lg sm:text-xl text-primary font-semibold mt-2">
            Reports, analytics &amp; annual accomplishment formats
          </p>
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed font-body">
            Layout and annex tables follow conventions common in{" "}
            <strong className="text-foreground">Philippine social welfare and development</strong> annual accomplishment
            submissions—aggregate indicators for boards, partners, and grant reporting. KPIs and charts load from the{" "}
            <strong className="text-foreground">Bonfire API</strong> when you are signed in.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 items-center">
            {metricsLoading ? (
              <Badge variant="secondary" className="font-body">
                Loading metrics…
              </Badge>
            ) : analytics.metricsSource === "database" ? (
              <Badge className="bg-success/90 text-success-foreground font-body">Live: database</Badge>
            ) : (
              <Badge variant="outline" className="border-warning/60 text-foreground font-body">
                Demo: browser storage
              </Badge>
            )}
            {metricsError && !metricsLoading && (
              <span className="text-xs text-muted-foreground font-body max-w-md text-center">{metricsError}</span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="shadow-warm">
              <Link to="/app/reports/generate">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate new report run
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-secondary/40 bg-background/80"
              onClick={() =>
                setTemplatePreview({ open: true, title: "Annual Program Accomplishment Report", variant: "accomplishment" })
              }
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview accomplishment report
            </Button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-end justify-center gap-3">
            <div className="w-full sm:w-56 text-left">
              <Label className="text-xs font-body text-muted-foreground">Time range</Label>
              <Select value={monthsBack} onValueChange={setMonthsBack}>
                <SelectTrigger className="mt-1" aria-label="Select time range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                  <SelectItem value="24">Last 24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-72 text-left">
              <Label className="text-xs font-body text-muted-foreground">Safehouse</Label>
              <Select value={safehouseId} onValueChange={setSafehouseId}>
                <SelectTrigger className="mt-1" aria-label="Select safehouse">
                  <SelectValue placeholder="All safehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All safehouses</SelectItem>
                  {safehouses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-warm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <Users className="h-3.5 w-3.5" />
              Caseload records (current)
            </CardDescription>
            <CardTitle className="font-heading text-3xl tabular-nums">
              {metricsLoading ? "—" : analytics.totalResidents}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4 px-4 pt-0 font-body">
            {metricsLoading
              ? "…"
              : `${analytics.byStatus.Active ?? 0} active · ${analytics.transitioningOrCompleted} transition / completed`}
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-warm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <HeartHandshake className="h-3.5 w-3.5" />
              Healing visits (period)
            </CardDescription>
            <CardTitle className="font-heading text-3xl tabular-nums">
              {metricsLoading ? "—" : visitRatePct !== null ? `${visitRatePct}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4 px-4 pt-0 font-body">
            {metricsLoading
              ? "…"
              : `${analytics.visitsCompleted} completed · ${analytics.visitsScheduled} follow-up flagged`}
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-warm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <FileText className="h-3.5 w-3.5" />
              Process recordings (period)
            </CardDescription>
            <CardTitle className="font-heading text-3xl tabular-nums">
              {metricsLoading ? "—" : analytics.totalRecordings}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4 px-4 pt-0 font-body">
            {metricsLoading ? "…" : `~${analytics.avgRecordingsPerIntake.toFixed(1)} per resident record`}
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-warm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <TrendingUp className="h-3.5 w-3.5" />
              Giving (period, all safehouses)
            </CardDescription>
            <CardTitle className="font-heading text-2xl sm:text-3xl tabular-nums">
              {metricsLoading
                ? "—"
                : analytics.donationTotal.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4 px-4 pt-0 font-body">
            {metricsLoading
              ? "…"
              : `${analytics.donationCount} gifts · safehouse filter does not apply (${analytics.metricsSource === "database" ? "database" : "browser"})`}
          </CardContent>
        </Card>
      </div>

      <Card className="border-secondary/20 shadow-warm">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-base">Reporting context</CardTitle>
          <CardDescription className="font-body text-sm leading-relaxed">
            Use this page for staff decision-making and INTEX-required reporting: donation trends, outcome metrics
            (education + health), safehouse comparisons, and reintegration tracking. Exports are aggregate-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground font-body flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Period: <strong className="text-foreground font-medium">{analytics.periodLabel}</strong>
          </span>
          <span>
            Source:{" "}
            <strong className="text-foreground font-medium">
              {analytics.metricsSource === "database" ? "Live database" : "Demo (browser storage)"}
            </strong>
          </span>
        </CardContent>
      </Card>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="w-full h-auto p-1 flex flex-wrap sm:flex-nowrap gap-1 sm:gap-0 sm:w-auto sm:h-10">
          <TabsTrigger
            value="insights"
            className="font-body text-xs sm:text-sm min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-auto whitespace-nowrap"
          >
            <span className="truncate">Insights</span>
          </TabsTrigger>
          <TabsTrigger
            value="charts"
            className="font-body text-xs sm:text-sm min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-auto whitespace-nowrap"
          >
            <span className="truncate">
              <span className="sm:hidden">Trends</span>
              <span className="hidden sm:inline">Trends &amp; comparison</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="outcomes"
            className="font-body text-xs sm:text-sm min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-auto whitespace-nowrap"
          >
            <span className="truncate">Outcomes</span>
          </TabsTrigger>
          <TabsTrigger
            value="safehouses"
            className="font-body text-xs sm:text-sm min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-auto whitespace-nowrap"
          >
            <span className="truncate">Safehouses</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-6 space-y-6">
          <Card className="border-secondary/25 shadow-warm">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-warning" />
                Operational insights
              </CardTitle>
              <CardDescription className="font-body text-sm leading-relaxed">
                Short reads dynamically derived from your current records—useful for staff huddles and accomplishment narratives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.insights.map((text, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-4 rounded-xl border border-border bg-muted/30 text-sm leading-relaxed font-body text-muted-foreground"
                >
                  <Badge variant="secondary" className="shrink-0 h-6 mt-0.5">
                    {i + 1}
                  </Badge>
                  <p>{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base">Program pathways</CardTitle>
                <CardDescription className="text-xs font-body">Residents by case category (API) or program field (demo)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.byProgram.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">No intake programs yet.</p>
                ) : (
                  analytics.byProgram.slice(0, 6).map((p) => (
                    <div key={p.program} className="flex justify-between text-sm font-body border-b border-border/50 py-2 last:border-0">
                      <span className="text-muted-foreground truncate pr-2">{p.program}</span>
                      <span className="tabular-nums font-medium shrink-0">{p.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle className="font-heading text-base">Residents by program</CardTitle>
                <CardDescription className="text-xs font-body">Comparison across pathways / sites</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {programChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground font-body">
                    Add residents to see a bar comparison.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={programChartData} margin={{ top: 8, right: 8, left: 0, bottom: isMobile ? 0 : 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }}
                        interval={0}
                        angle={isMobile ? 0 : -25}
                        textAnchor={isMobile ? "middle" : "end"}
                        height={isMobile ? 40 : 70}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(28, 80%, 97%)",
                          border: "1px solid hsl(24, 30%, 86%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [value, "Residents"]}
                        labelFormatter={(_, payload) => (payload?.[0]?.payload?.full as string) ?? ""}
                      />
                      <Bar dataKey="residents" radius={[6, 6, 0, 0]}>
                        {programChartData.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? CHART_PRIMARY : CHART_SECONDARY} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle className="font-heading text-base">Giving trend by month</CardTitle>
                <CardDescription className="text-xs font-body">Parsed numeric amounts from gift records</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {donationTrendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground font-body">
                    Record donations with dates to plot a trend line.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={donationTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }}
                        interval={isMobile ? "preserveStartEnd" : 0}
                        minTickGap={isMobile ? 16 : 0}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(28, 80%, 97%)",
                          border: "1px solid hsl(24, 30%, 86%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [value.toLocaleString(), "Amount (parsed)"]}
                      />
                      <Line type="monotone" dataKey="amount" stroke={CHART_SAGE} strokeWidth={2} dot={{ fill: CHART_PRIMARY, r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              {donationTrendData.length > 0 && (
                <div className="px-6 pb-6 -mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      downloadCsv(
                        `bonfire-donation-trend-${new Date().toISOString().slice(0, 10)}.csv`,
                        ["Month", "Total", "Count"],
                        donationTrendData.map((r) => [r.month, String(r.amount), String(r.gifts)]),
                      );
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="outcomes" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle className="font-heading text-base">Education progress trend</CardTitle>
                <CardDescription className="text-xs font-body">Average progress percent by month</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {eduTrendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground font-body">
                    Add education records to see an outcomes trend.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eduTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }}
                        interval={isMobile ? "preserveStartEnd" : 0}
                        minTickGap={isMobile ? 16 : 0}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(28, 80%, 97%)",
                          border: "1px solid hsl(24, 30%, 86%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`${value}%`, "Avg progress"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke={CHART_PRIMARY}
                        strokeWidth={2}
                        dot={{ fill: CHART_PRIMARY, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              {eduTrendData.length > 0 && (
                <div className="px-6 pb-6 -mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      downloadCsv(
                        `bonfire-education-progress-trend-${new Date().toISOString().slice(0, 10)}.csv`,
                        ["Month", "AvgProgressPercent"],
                        eduTrendData.map((r) => [r.month, r.avg == null ? "" : String(r.avg)]),
                      );
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              )}
            </Card>

            <Card className="shadow-warm">
              <CardHeader>
                <CardTitle className="font-heading text-base">Health score trend</CardTitle>
                <CardDescription className="text-xs font-body">Average general health score (1.0–5.0) by month</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {healthTrendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground font-body">
                    Add health &amp; wellbeing records to see a trend.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={healthTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }}
                        interval={isMobile ? "preserveStartEnd" : 0}
                        minTickGap={isMobile ? 16 : 0}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }} domain={[1, 5]} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(28, 80%, 97%)",
                          border: "1px solid hsl(24, 30%, 86%)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [value.toFixed(2), "Avg health score"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke={CHART_SAGE}
                        strokeWidth={2}
                        dot={{ fill: CHART_SECONDARY, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              {healthTrendData.length > 0 && (
                <div className="px-6 pb-6 -mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      downloadCsv(
                        `bonfire-health-score-trend-${new Date().toISOString().slice(0, 10)}.csv`,
                        ["Month", "AvgHealthScore"],
                        healthTrendData.map((r) => [r.month, r.avg == null ? "" : String(r.avg)]),
                      );
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="font-heading text-base">Reintegration status (snapshot)</CardTitle>
              <CardDescription className="text-xs font-body">Counts by reintegration status across resident records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reintegrationStatusData.length === 0 ? (
                <div className="text-sm text-muted-foreground font-body">No reintegration statuses recorded yet.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {reintegrationStatusData.slice(0, 8).map((x) => (
                    <Card key={x.status} className="border-border/70">
                      <CardContent className="p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">{x.status}</p>
                        <p className="font-heading text-2xl tabular-nums mt-1">{x.count}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {reintegrationStatusData.length > 0 && (
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      downloadCsv(
                        `bonfire-reintegration-status-${new Date().toISOString().slice(0, 10)}.csv`,
                        ["ReintegrationStatus", "Count"],
                        reintegrationStatusData.map((r) => [r.status, String(r.count)]),
                      );
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safehouses" className="mt-6 space-y-6">
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="font-heading text-base">Safehouse performance (latest month)</CardTitle>
              <CardDescription className="text-xs font-body">
                Active residents, education progress, health score, documentation volume, and incidents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {safehouseLatestByName.length === 0 ? (
                <div className="text-sm text-muted-foreground font-body">
                  No safehouse monthly metrics found for the selected range.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                  <table className="w-full text-sm font-body min-w-[760px]">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border">
                        <th className="text-left p-3 font-semibold">Safehouse</th>
                        <th className="text-left p-3 font-semibold">Month</th>
                        <th className="text-right p-3 font-semibold">Active</th>
                        <th className="text-right p-3 font-semibold">Edu avg</th>
                        <th className="text-right p-3 font-semibold">Health avg</th>
                        <th className="text-right p-3 font-semibold">Recordings</th>
                        <th className="text-right p-3 font-semibold">Visits</th>
                        <th className="text-right p-3 font-semibold">Incidents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safehouseLatestByName.map((r, i) => (
                        <tr key={r.safehouseId} className={i % 2 === 1 ? "bg-muted/20" : "bg-card"}>
                          <td className="p-3 border-t border-border/60">{r.safehouseName}</td>
                          <td className="p-3 border-t border-border/60">{r.month}</td>
                          <td className="p-3 border-t border-border/60 text-right tabular-nums">{r.activeResidents}</td>
                          <td className="p-3 border-t border-border/60 text-right tabular-nums">
                            {r.avgEducationProgress > 0 ? `${Math.round(r.avgEducationProgress)}%` : "—"}
                          </td>
                          <td className="p-3 border-t border-border/60 text-right tabular-nums">
                            {r.avgHealthScore > 0 ? r.avgHealthScore.toFixed(2) : "—"}
                          </td>
                          <td className="p-3 border-t border-border/60 text-right tabular-nums">{r.processRecordingCount}</td>
                          <td className="p-3 border-t border-border/60 text-right tabular-nums">{r.homeVisitationCount}</td>
                          <td className="p-3 border-t border-border/60 text-right tabular-nums">{r.incidentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {safehouseLatestByName.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const rows = (analytics.safehouseMonthly ?? []).map((r) => [
                        r.safehouseName,
                        r.month,
                        String(r.activeResidents),
                        String(r.avgEducationProgress),
                        String(r.avgHealthScore),
                        String(r.processRecordingCount),
                        String(r.homeVisitationCount),
                        String(r.incidentCount),
                      ]);
                      downloadCsv(
                        `bonfire-safehouse-metrics-${new Date().toISOString().slice(0, 10)}.csv`,
                        [
                          "Safehouse",
                          "Month",
                          "ActiveResidents",
                          "AvgEducationProgress",
                          "AvgHealthScore",
                          "ProcessRecordings",
                          "HomeVisitations",
                          "Incidents",
                        ],
                        rows,
                      );
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="bg-secondary/20" />

      {/* Report templates — annex style list */}
      <div>
        <h2 className="font-heading text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Report templates &amp; exports
        </h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4 font-body">
          Each template opens a printable SWD-style preview or downloads a CSV annex for spreadsheets.
        </p>
        <div className="grid gap-4">
          {REPORT_TEMPLATES.map((r) => (
            <Card
              key={r.id}
              className="border-l-4 border-l-primary/70 shadow-warm bg-card/90 overflow-hidden"
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-foreground leading-snug">{r.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed font-body">{r.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 font-body uppercase tracking-wide">
                        Cadence: {r.lastRun}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-secondary/35 w-full sm:w-auto"
                      onClick={() => setTemplatePreview({ open: true, title: r.title, variant: r.preview })}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" className="w-full sm:w-auto" onClick={() => runExport(r.exportFn, analytics)}>
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AccomplishmentReportDialog
        open={preview.open}
        onOpenChange={(open) => setPreview((s) => ({ ...s, open }))}
        reportTitle={preview.title}
        analytics={analytics}
      />

      <ReportTemplatePreviewDialog
        open={templatePreview.open}
        onOpenChange={(open) => setTemplatePreview((s) => ({ ...s, open }))}
        title={templatePreview.title}
        variant={templatePreview.variant}
        analytics={analytics}
      />
    </div>
  );
}
