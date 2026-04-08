import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import { localData } from "@/lib/localData";
import {
  computeReportAnalytics,
  downloadAccomplishmentAnnexCsv,
  downloadAllocationCsv,
  downloadProgramComparisonCsv,
  downloadCsv,
} from "@/lib/reportAnalytics";
import { AccomplishmentReportDialog } from "@/components/reports/AccomplishmentReportDialog";
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
  exportFn: "accomplishment" | "program" | "allocation" | "caseload";
};

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "annual-accomplishment",
    title: "Annual Program Accomplishment Report",
    description:
      "SWD-style narrative + statistical annex: caring, healing, teaching pillars; beneficiary counts; service outputs.",
    lastRun: "FY template",
    exportFn: "accomplishment",
  },
  {
    id: "monthly-caseload",
    title: "Monthly Caseload & Status Summary",
    description: "Active, transitioning, and completed residents; intake velocity vs documentation load.",
    lastRun: "Monthly",
    exportFn: "caseload",
  },
  {
    id: "program-safehouse",
    title: "Program & Safehouse Comparison",
    description: "Resident counts by program pathway and implied safehouse/program allocation from records.",
    lastRun: "Quarterly",
    exportFn: "program",
  },
  {
    id: "reintegration",
    title: "Reintegration & Transition Outcomes",
    description: "Transitioning and completed statuses as proxy for reintegration tracking (aggregate only).",
    lastRun: "Semi-annual",
    exportFn: "accomplishment",
  },
  {
    id: "donations",
    title: "Resource Mobilization & Allocations",
    description: "Gift counts and parsed totals by allocation (safehouse, program, general).",
    lastRun: "Monthly",
    exportFn: "allocation",
  },
  {
    id: "staff-doc",
    title: "Staff Activity & Documentation Compliance",
    description: "Process recordings vs caseload; home visit completion rates; conference throughput.",
    lastRun: "Monthly",
    exportFn: "accomplishment",
  },
];

const CHART_PRIMARY = "hsl(24, 76%, 43%)";
const CHART_SECONDARY = "hsl(17, 51%, 41%)";
const CHART_SAGE = "hsl(120, 15%, 42%)";

function runExport(
  kind: ReportTemplate["exportFn"],
  analytics: ReturnType<typeof computeReportAnalytics>,
) {
  if (kind === "accomplishment") downloadAccomplishmentAnnexCsv(analytics);
  else if (kind === "program") downloadProgramComparisonCsv(analytics);
  else if (kind === "allocation") downloadAllocationCsv(analytics);
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
  const analytics = useMemo(() => computeReportAnalytics(), []);
  const reportRuns = localData.listReportRuns();
  const [preview, setPreview] = useState<{ open: boolean; title: string }>({ open: false, title: "" });

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
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
            submissions—aggregate indicators for boards, partners, and grant reporting. All figures below pull from your{" "}
            <strong className="text-foreground">local Bonfire records</strong> (demo) until the API is connected.
          </p>
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
              onClick={() => setPreview({ open: true, title: "Annual Program Accomplishment Report" })}
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview accomplishment report
            </Button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-warm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <Users className="h-3.5 w-3.5" />
              Caseload records
            </CardDescription>
            <CardTitle className="font-heading text-3xl tabular-nums">{analytics.totalResidents}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4 px-4 pt-0 font-body">
            {analytics.byStatus.Active ?? 0} active · {analytics.transitioningOrCompleted} transition / completed
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-warm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <HeartHandshake className="h-3.5 w-3.5" />
              Healing (visits)
            </CardDescription>
            <CardTitle className="font-heading text-3xl tabular-nums">
              {visitRatePct !== null ? `${visitRatePct}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4 px-4 pt-0 font-body">
            {analytics.visitsCompleted} completed · {analytics.visitsScheduled} scheduled
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-warm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <FileText className="h-3.5 w-3.5" />
              Process recordings
            </CardDescription>
            <CardTitle className="font-heading text-3xl tabular-nums">{analytics.totalRecordings}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4 px-4 pt-0 font-body">
            ~{analytics.avgRecordingsPerIntake.toFixed(1)} per resident record
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-warm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              <TrendingUp className="h-3.5 w-3.5" />
              Giving (parsed)
            </CardDescription>
            <CardTitle className="font-heading text-2xl sm:text-3xl tabular-nums">
              {analytics.donationTotal.toLocaleString(undefined, {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground pb-4 px-4 pt-0 font-body">
            {analytics.donationCount} gifts in local data
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 sm:inline-flex sm:h-10 sm:w-auto">
          <TabsTrigger value="insights" className="font-body">
            Insights
          </TabsTrigger>
          <TabsTrigger value="charts" className="font-body">
            Trends &amp; comparison
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
                Short reads derived from your current records—useful for staff huddles and accomplishment narratives.
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

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base">Program pathways</CardTitle>
                <CardDescription className="text-xs font-body">Residents by program field</CardDescription>
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base">Top allocations</CardTitle>
                <CardDescription className="text-xs font-body">Where gifts are directed (local)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.byAllocation.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">No donations recorded yet.</p>
                ) : (
                  analytics.byAllocation.slice(0, 6).map((a) => (
                    <div key={a.allocation} className="flex justify-between text-sm font-body border-b border-border/50 py-2 last:border-0 gap-2">
                      <span className="text-muted-foreground truncate">{a.allocation}</span>
                      <span className="tabular-nums font-medium shrink-0">
                        {a.totalAmount.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                      </span>
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
                    <BarChart data={programChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }} interval={0} angle={-25} textAnchor="end" height={70} />
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
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(24, 28%, 38%)" }} />
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
            </Card>
          </div>
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
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-secondary/35"
                      onClick={() => setPreview({ open: true, title: r.title })}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" onClick={() => runExport(r.exportFn, analytics)}>
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

      {reportRuns.length > 0 && (
        <Card className="card-warm border-secondary/25">
          <CardHeader>
            <CardTitle className="font-heading">Recent generated report runs</CardTitle>
            <CardDescription className="font-body">Stored locally until backend persistence is wired.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportRuns.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  <div className="min-w-0">
                    <p className="font-medium font-heading text-sm">{run.templateTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-body">
                      Generated {new Date(run.generatedAt).toLocaleString()}
                    </p>
                    {run.notes && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed font-body border-l-2 border-primary/30 pl-3">
                        {run.notes}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadAccomplishmentAnnexCsv(analytics)}>
                    <Download className="h-4 w-4 mr-1" />
                    Annex CSV
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AccomplishmentReportDialog
        open={preview.open}
        onOpenChange={(open) => setPreview((s) => ({ ...s, open }))}
        reportTitle={preview.title}
        analytics={analytics}
      />
    </div>
  );
}
