import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReportAnalytics } from "@/lib/reportAnalytics";
import {
  accomplishmentTableRows,
  downloadAccomplishmentAnnexCsv,
  downloadProgramComparisonCsv,
  downloadCsv,
} from "@/lib/reportAnalytics";

type Variant =
  | "accomplishment"
  | "caseload"
  | "program"
  | "reintegration"
  | "safehouses"
  | "staff";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  variant: Variant;
  analytics: ReportAnalytics;
};

function safehouseLatestRows(a: ReportAnalytics) {
  const rows = a.safehouseMonthly ?? [];
  const by: Record<string, (typeof rows)[number]> = {};
  for (const r of rows) {
    const cur = by[r.safehouseName];
    if (!cur || r.month > cur.month) by[r.safehouseName] = r;
  }
  return Object.values(by).sort((x, y) => x.safehouseName.localeCompare(y.safehouseName));
}

export function ReportTemplatePreviewDialog({ open, onOpenChange, title, variant, analytics }: Props) {
  const rows = accomplishmentTableRows(analytics);
  const refNo = `BF-RPT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const reintegration = (analytics.reintegrationByStatus ?? []).slice(0, 12);
  const reintegrationByType = (analytics.reintegrationByType ?? []).slice(0, 12);
  const safehouseRows = safehouseLatestRows(analytics);
  const visitTotal = analytics.visitsTotal ?? analytics.visitsCompleted + analytics.visitsScheduled;
  const visitRate =
    analytics.visitCompletionRate == null ? null : Math.round(analytics.visitCompletionRate * 100);
  const recordingPerResident =
    analytics.totalResidents > 0 ? analytics.totalRecordings / analytics.totalResidents : null;
  const giftAvg = analytics.donationCount > 0 ? analytics.donationTotal / analytics.donationCount : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-4xl gap-0 overflow-hidden border-secondary/30 bg-[hsl(30,45%,98%)] p-0 sm:w-full print:max-w-none print:w-full print:overflow-visible print:bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Report preview for printing or export.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-2rem)] overflow-y-auto overflow-x-hidden overscroll-y-contain px-6 pb-6 pt-14 sm:max-h-[calc(90vh-3rem)] sm:px-8 sm:pb-8 sm:pt-16 print:max-h-none print:overflow-visible print:px-8 print:pb-8 print:pt-8">
          <div className="space-y-6 text-foreground">
            <div className="text-center border-y-4 border-double border-secondary/60 py-6 px-4 bg-card/80">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1 font-body">
                Program reporting preview
              </p>
              <h2 className="font-heading text-xl sm:text-2xl font-bold mt-4 leading-snug">Bonfire Sanctuary Program</h2>
              <p className="font-heading text-lg mt-2 font-semibold text-primary">{title}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-body text-muted-foreground">
                <span>Reference: {refNo}</span>
                <span>Covered period: {analytics.periodLabel}</span>
                <Badge variant="secondary" className="font-body">
                  {analytics.metricsSource === "database" ? "Live DB" : "Demo"}
                </Badge>
              </div>
            </div>

            {variant === "accomplishment" && (
              <>
                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                    Executive summary
                  </h3>
                  <p className="text-sm leading-relaxed font-body text-muted-foreground">
                    This Annual Program Accomplishment Report is the all-up summary for the Reports page: it includes
                    caseload, staff documentation signals, donations trends, outcomes, reintegration, and safehouse
                    comparisons. All outputs are aggregate-only.
                  </p>
                  {Array.isArray(analytics.insights) && analytics.insights.length > 0 && (
                    <ul className="text-sm font-body text-muted-foreground list-disc pl-5 space-y-1">
                      {analytics.insights.slice(0, 6).map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Resident records</p>
                    <p className="font-heading text-2xl tabular-nums mt-1">{analytics.totalResidents}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {analytics.byStatus.Active ?? 0} active
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Home visits</p>
                    <p className="font-heading text-2xl tabular-nums mt-1">{visitTotal}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {visitRate == null ? "—" : `${visitRate}% no follow-up needed`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Process recordings</p>
                    <p className="font-heading text-2xl tabular-nums mt-1">{analytics.totalRecordings}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {recordingPerResident == null ? "—" : `~${recordingPerResident.toFixed(1)} per resident`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Gifts recorded</p>
                    <p className="font-heading text-2xl tabular-nums mt-1">{analytics.donationCount}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {giftAvg == null
                        ? "—"
                        : `Avg ${giftAvg.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`}
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                    Statistical annex — service outputs (aggregate)
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                    <table className="w-full text-sm font-body">
                      <thead>
                        <tr className="bg-muted/80 border-b border-border">
                          <th className="text-left p-3 font-semibold">Indicator</th>
                          <th className="text-right p-3 font-semibold w-28">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={r.label} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
                            <td className="p-3 border-t border-border/60">{r.label}</td>
                            <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                    Donations summary (aggregate)
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Parsed total</p>
                      <p className="font-heading text-2xl tabular-nums mt-1">
                        {analytics.donationTotal.toLocaleString(undefined, {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        Period: {analytics.periodLabel}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Breakdowns</p>
                      <p className="text-sm font-body text-muted-foreground mt-2">
                        {[
                          (analytics.donationByType?.length ?? 0) > 0 ? "Type" : null,
                          (analytics.donationByChannel?.length ?? 0) > 0 ? "Channel" : null,
                          (analytics.donationByCampaign?.length ?? 0) > 0 ? "Campaign" : null,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "No breakdown fields recorded."}
                      </p>
                    </div>
                  </div>
                  {analytics.donationsByMonth.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                      <table className="w-full text-sm font-body min-w-[520px]">
                        <thead>
                          <tr className="bg-muted/80 border-b border-border">
                            <th className="text-left p-3 font-semibold">Month</th>
                            <th className="text-right p-3 font-semibold">Total</th>
                            <th className="text-right p-3 font-semibold">Gifts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.donationsByMonth.slice(-12).map((r, i) => (
                            <tr key={r.month} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
                              <td className="p-3 border-t border-border/60">{r.month}</td>
                              <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">
                                {Math.round(r.total).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                              </td>
                              <td className="p-3 border-t border-border/60 text-right tabular-nums">{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                    Outcomes & reintegration (aggregate)
                  </h3>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Education progress</p>
                      <p className="text-sm font-body text-muted-foreground mt-2">
                        {analytics.avgProgressActive == null
                          ? "—"
                          : `Active avg: ${Math.round(analytics.avgProgressActive)}%`}
                      </p>
                      {(analytics.educationProgressByMonth?.length ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground font-body mt-2">
                          {analytics.educationProgressByMonth!.slice(-1)[0]?.month} latest month recorded
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Health score</p>
                      <p className="text-sm font-body text-muted-foreground mt-2">
                        {analytics.avgHealthActive == null ? "—" : `Active avg: ${analytics.avgHealthActive.toFixed(2)}`}
                      </p>
                      {(analytics.healthScoreByMonth?.length ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground font-body mt-2">
                          {analytics.healthScoreByMonth!.slice(-1)[0]?.month} latest month recorded
                        </p>
                      )}
                    </div>
                  </div>
                  {reintegration.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                      <table className="w-full text-sm font-body min-w-[520px]">
                        <thead>
                          <tr className="bg-muted/80 border-b border-border">
                            <th className="text-left p-3 font-semibold">Reintegration status</th>
                            <th className="text-right p-3 font-semibold">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reintegration.map((r, i) => (
                            <tr key={r.label} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
                              <td className="p-3 border-t border-border/60">{r.label}</td>
                              <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {reintegrationByType.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                      <table className="w-full text-sm font-body min-w-[520px]">
                        <thead>
                          <tr className="bg-muted/80 border-b border-border">
                            <th className="text-left p-3 font-semibold">Reintegration type</th>
                            <th className="text-right p-3 font-semibold">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reintegrationByType.map((r, i) => (
                            <tr key={r.label} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
                              <td className="p-3 border-t border-border/60">{r.label}</td>
                              <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                    Safehouse comparison (latest month)
                  </h3>
                  {safehouseRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body">No safehouse monthly metrics found.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                      <table className="w-full text-sm font-body min-w-[860px]">
                        <thead>
                          <tr className="bg-muted/80 border-b border-border">
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
                          {safehouseRows.map((r, i) => (
                            <tr key={r.safehouseId} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
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
                </section>
              </>
            )}

            {variant === "staff" && (
              <>
                <section className="space-y-2">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                    Documentation compliance snapshot
                  </h3>
                  <p className="text-sm leading-relaxed font-body text-muted-foreground">
                    This preview focuses on staff operational throughput and documentation signals: process recordings,
                    home visitation follow-ups, and case conference activity. Use it for monthly huddles and internal QA.
                  </p>
                </section>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Process recordings</p>
                    <p className="font-heading text-2xl tabular-nums mt-1">{analytics.totalRecordings}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {recordingPerResident == null ? "—" : `~${recordingPerResident.toFixed(1)} per resident record`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Home visits</p>
                    <p className="font-heading text-2xl tabular-nums mt-1">{visitTotal}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {visitRate == null ? "—" : `${visitRate}% no follow-up needed`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Follow-up flagged</p>
                    <p className="font-heading text-2xl tabular-nums mt-1">{analytics.visitsScheduled}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">Home visits requiring follow-up</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">Case conferences</p>
                    <p className="font-heading text-2xl tabular-nums mt-1">{analytics.conferencesCompleted}</p>
                    <p className="text-xs text-muted-foreground font-body mt-1">
                      {analytics.conferencesUpcoming} upcoming
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                    Annex — staff activity indicators (aggregate)
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                    <table className="w-full text-sm font-body min-w-[620px]">
                      <thead>
                        <tr className="bg-muted/80 border-b border-border">
                          <th className="text-left p-3 font-semibold">Indicator</th>
                          <th className="text-right p-3 font-semibold w-32">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Resident records", String(analytics.totalResidents)],
                          ["Active cases", String(analytics.byStatus.Active ?? 0)],
                          ["Process recordings", String(analytics.totalRecordings)],
                          ["Residents w/ recording", String(analytics.uniqueResidentsWithRecording)],
                          ["Home visits (total)", String(visitTotal)],
                          ["Home visits (no follow-up needed)", String(analytics.visitsCompleted)],
                          ["Home visits (follow-up flagged)", String(analytics.visitsScheduled)],
                          ["Case conferences held", String(analytics.conferencesCompleted)],
                          ["Case conferences upcoming", String(analytics.conferencesUpcoming)],
                        ].map(([label, value], i) => (
                          <tr key={label} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
                            <td className="p-3 border-t border-border/60">{label}</td>
                            <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {variant === "caseload" && (
              <section className="space-y-3">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                  Caseload & status summary (aggregate)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                  <table className="w-full text-sm font-body min-w-[520px]">
                    <thead>
                      <tr className="bg-muted/80 border-b border-border">
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-right p-3 font-semibold">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analytics.byStatus)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v], i) => (
                          <tr key={k} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
                            <td className="p-3 border-t border-border/60">{k}</td>
                            <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">{v}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {variant === "program" && (
              <section className="space-y-3">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                  Program pathways comparison (aggregate)
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  Residents grouped by case category (live) or program field (demo).
                </p>
                <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                  <table className="w-full text-sm font-body min-w-[520px]">
                    <thead>
                      <tr className="bg-muted/80 border-b border-border">
                        <th className="text-left p-3 font-semibold">Program / pathway</th>
                        <th className="text-right p-3 font-semibold">Residents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.byProgram.map((p, i) => (
                        <tr key={p.program} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
                          <td className="p-3 border-t border-border/60">{p.program}</td>
                          <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">{p.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {variant === "reintegration" && (
              <section className="space-y-3">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                  Reintegration outcomes (aggregate)
                </h3>
                {reintegration.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">No reintegration statuses recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                    <table className="w-full text-sm font-body min-w-[520px]">
                      <thead>
                        <tr className="bg-muted/80 border-b border-border">
                          <th className="text-left p-3 font-semibold">Reintegration status</th>
                          <th className="text-right p-3 font-semibold">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reintegration.map((r, i) => (
                          <tr key={r.label} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
                            <td className="p-3 border-t border-border/60">{r.label}</td>
                            <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">{r.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {variant === "safehouses" && (
              <section className="space-y-3">
                <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                  Safehouse comparison (latest month)
                </h3>
                {safehouseRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">No safehouse monthly metrics found.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-secondary/20 bg-card">
                    <table className="w-full text-sm font-body min-w-[860px]">
                      <thead>
                        <tr className="bg-muted/80 border-b border-border">
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
                        {safehouseRows.map((r, i) => (
                          <tr key={r.safehouseId} className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}>
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
              </section>
            )}

            <div className="flex flex-wrap gap-2 justify-end border-t border-border pt-4 print:hidden">
              <Button type="button" variant="outline" onClick={() => window.print()}>
                Print / Save as PDF
              </Button>

              {variant === "accomplishment" && (
                <Button type="button" onClick={() => downloadAccomplishmentAnnexCsv(analytics)}>
                  Download annex (CSV)
                </Button>
              )}
              {variant === "staff" && (
                <Button type="button" onClick={() => downloadAccomplishmentAnnexCsv(analytics)}>
                  Download staff indicators (CSV)
                </Button>
              )}
              {variant === "program" && (
                <Button type="button" onClick={() => downloadProgramComparisonCsv(analytics)}>
                  Download program comparison (CSV)
                </Button>
              )}
              {variant === "caseload" && (
                <Button
                  type="button"
                  onClick={() => {
                    const statusRows = Object.entries(analytics.byStatus).map(([k, v]) => [k, String(v)]);
                    downloadCsv(
                      `bonfire-caseload-status-${new Date().toISOString().slice(0, 10)}.csv`,
                      ["Status", "Count"],
                      statusRows,
                    );
                  }}
                >
                  Download status summary (CSV)
                </Button>
              )}
              {variant === "reintegration" && (
                <Button
                  type="button"
                  onClick={() => {
                    const rows = (analytics.reintegrationByStatus ?? []).map((r) => [r.label, String(r.count)]);
                    downloadCsv(
                      `bonfire-reintegration-status-${new Date().toISOString().slice(0, 10)}.csv`,
                      ["ReintegrationStatus", "Count"],
                      rows,
                    );
                  }}
                >
                  Download reintegration (CSV)
                </Button>
              )}
              {variant === "safehouses" && (
                <Button
                  type="button"
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
                  Download safehouse metrics (CSV)
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

