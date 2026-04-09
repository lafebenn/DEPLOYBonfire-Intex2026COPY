import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { accomplishmentTableRows, type ReportAnalytics, downloadAccomplishmentAnnexCsv } from "@/lib/reportAnalytics";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportTitle: string;
  analytics: ReportAnalytics;
};

export function AccomplishmentReportDialog({ open, onOpenChange, reportTitle, analytics }: Props) {
  const refNo = `BF-ACR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const rows = accomplishmentTableRows(analytics);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="report-dialog-print w-[calc(100vw-1.5rem)] max-w-3xl gap-0 overflow-hidden border-secondary/30 bg-[hsl(30,45%,98%)] p-0 sm:w-full print:max-w-none print:w-full print:overflow-visible print:bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>{reportTitle}</DialogTitle>
          <DialogDescription>Program accomplishment report preview for printing or export.</DialogDescription>
        </DialogHeader>
        {/* Explicit max-height so wheel / trackpad scroll works (ScrollArea + flex-1 inside transformed dialog was unreliable) */}
        <div className="report-print-inner max-h-[calc(90vh-2rem)] overflow-y-auto overflow-x-hidden overscroll-y-contain px-6 pb-6 pt-14 sm:max-h-[calc(90vh-3rem)] sm:px-8 sm:pb-8 sm:pt-16 print:max-h-none print:overflow-visible print:px-8 print:pb-8 print:pt-8">
          <div className="space-y-6 text-foreground">
            <div className="text-center border-y-4 border-double border-secondary/60 py-6 px-4 bg-card/80">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body">
                Republic of the Philippines
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1 font-body">
                Non-government program report (SWD-style format)
              </p>
              <h2 className="font-heading text-xl sm:text-2xl font-bold mt-4 leading-snug">
                Bonfire Sanctuary Program
              </h2>
              <p className="font-heading text-lg mt-2 font-semibold text-primary">{reportTitle}</p>
              <p className="text-sm text-muted-foreground mt-3 font-body leading-relaxed max-w-xl mx-auto">
                Prepared in the tradition of <strong>annual accomplishment reports</strong> used by Philippine social
                welfare and development partners—aggregate indicators only; all beneficiary data remain anonymized in
                line with organizational safeguarding policies.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs font-body text-muted-foreground">
                <span>Reference: {refNo}</span>
                <span>Covered period: {analytics.periodLabel}</span>
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                I. Executive summary
              </h3>
              <p className="text-sm leading-relaxed font-body text-muted-foreground">
                This annex summarizes programmatic outputs drawn from the Bonfire case-management and fundraising
                records: residential and community-based support (caring), psychosocial and home-based follow-up
                (healing), and structured case planning toward education, health, and reintegration (teaching). Figures
                below reflect <strong>local demo data</strong> until connected to the production database.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                II. Major accomplishments (caring · healing · teaching)
              </h3>
              <ul className="text-sm list-decimal pl-5 space-y-2 font-body text-muted-foreground leading-relaxed">
                <li>
                  <strong className="text-foreground">Caring (shelter & case coordination):</strong>{" "}
                  {analytics.totalResidents} resident records; {analytics.byStatus.Active ?? 0} active cases;
                  {analytics.transitioningOrCompleted > 0
                    ? ` ${analytics.transitioningOrCompleted} in transitioning or completed status for reintegration tracking.`
                    : " add intake data to show transition pathways."}
                </li>
                <li>
                  <strong className="text-foreground">Healing (documentation & field visits):</strong>{" "}
                  {analytics.totalRecordings} process recordings; {analytics.visitsCompleted} home visits completed
                  {analytics.visitCompletionRate !== null
                    ? ` (${Math.round(analytics.visitCompletionRate * 100)}% of visits marked completed).`
                    : "."}
                </li>
                <li>
                  <strong className="text-foreground">Teaching & development:</strong> Case conferences recorded:{" "}
                  {analytics.conferencesCompleted} completed, {analytics.conferencesUpcoming} upcoming—align with
                  individualized learning and reintegration plans per resident.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                III. Statistical annex — Table 1. Service outputs (aggregate)
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
                      <tr
                        key={r.label}
                        className={i % 2 === 1 ? "bg-muted/40" : "bg-card"}
                      >
                        <td className="p-3 border-t border-border/60">{r.label}</td>
                        <td className="p-3 border-t border-border/60 text-right tabular-nums font-medium">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                IV. Resource mobilization (summary)
              </h3>
              <p className="text-sm leading-relaxed font-body text-muted-foreground">
                Gifts recorded: <strong className="text-foreground">{analytics.donationCount}</strong>. Parsed total
                (numeric portion of amount fields):{" "}
                <strong className="text-foreground">
                  {analytics.donationTotal.toLocaleString(undefined, { style: "currency", currency: "USD" })}
                </strong>
                . Detailed allocation breakdown is available on the main Reports dashboard and in CSV export.
              </p>
            </section>

            <section className="space-y-2 pb-4">
              <h3 className="font-heading font-bold text-sm uppercase tracking-wide border-b border-border pb-1">
                V. Prepared by
              </h3>
              <p className="text-sm font-body text-muted-foreground">
                Generated electronically from Bonfire — {new Date(analytics.generatedAt).toLocaleString()}.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Not an official government filing. Format provided for INTEX demonstration and partner reporting
                alignment.
              </p>
            </section>

            <div className="flex flex-wrap gap-2 justify-end border-t border-border pt-4 print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.print();
                }}
              >
                Print / Save as PDF
              </Button>
              <Button type="button" onClick={() => downloadAccomplishmentAnnexCsv(analytics)}>
                Download annex (CSV)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
