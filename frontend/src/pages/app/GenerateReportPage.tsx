import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { safehousesApi, staffReportRunsApi } from "@/lib/api";

const templates = [
  "Annual Program Accomplishment Report",
  "Monthly Caseload & Status Summary",
  "Program & Safehouse Comparison",
  "Reintegration & Transition Outcomes",
  "Resource Mobilization & Allocations",
  "Staff Activity & Documentation Compliance",
] as const;

const statuses = ["Draft", "Final"] as const;

function defaultPeriodEnd(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultPeriodStart(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

export default function GenerateReportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templateTitle, setTemplateTitle] = useState<string>(templates[0]);
  const [reportTitle, setReportTitle] = useState("");
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd);
  const [safehouseId, setSafehouseId] = useState<string>("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Draft");
  const [notes, setNotes] = useState("");
  const [parametersJson, setParametersJson] = useState("");
  const [safehouses, setSafehouses] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    safehousesApi
      .list()
      .then((res) => {
        if (cancelled || !res.success || !Array.isArray(res.data)) return;
        const list = res.data
          .map((r) => {
            if (!r || typeof r !== "object") return null;
            const o = r as Record<string, unknown>;
            const id = Number(o.safehouseId ?? o.SafehouseId);
            const name = String(o.name ?? o.Name ?? "");
            if (!Number.isFinite(id) || !name) return null;
            return { id, name };
          })
          .filter((x): x is { id: number; name: string } => x !== null)
          .sort((a, b) => a.name.localeCompare(b.name));
        setSafehouses(list);
      })
      .catch(() => {
        if (!cancelled) setSafehouses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (!templateTitle.trim() || !reportTitle.trim()) return false;
    if (!periodStart || !periodEnd) return false;
    return periodStart <= periodEnd;
  }, [templateTitle, reportTitle, periodStart, periodEnd]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Generate report run</h2>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed font-body">
          Save a report run to the database with period, site scope, and status. Use the main Reports page for charts and
          CSV exports.
        </p>
      </div>

      <Card className="card-warm border-secondary/25 shadow-warm">
        <CardHeader>
          <CardTitle className="font-heading">Report details</CardTitle>
          <CardDescription className="font-body">
            Fields match what Bonfire stores on each run so teams can audit what was generated and for which period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateTitle} onValueChange={setTemplateTitle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-title">Report title</Label>
            <Input
              id="report-title"
              placeholder="e.g. Q2 2026 board packet — program outcomes"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period-start">Reporting period start</Label>
              <Input id="period-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-end">Reporting period end</Label>
              <Input id="period-end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Safehouse scope (optional)</Label>
            <Select value={safehouseId || "__all__"} onValueChange={(v) => setSafehouseId(v === "__all__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All sites</SelectItem>
                {safehouses.map((sh) => (
                  <SelectItem key={sh.id} value={String(sh.id)}>
                    {sh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as (typeof statuses)[number])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Audience, submission deadline, partner name, version notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] font-body"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="params-json">Extra parameters (JSON, optional)</Label>
            <Textarea
              id="params-json"
              placeholder='e.g. {"audience":"DSWD","includeCharts":true}'
              value={parametersJson}
              onChange={(e) => setParametersJson(e.target.value)}
              className="min-h-[72px] font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/reports")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => {
                let params: string | null = null;
                const trimmed = parametersJson.trim();
                if (trimmed) {
                  try {
                    JSON.parse(trimmed);
                    params = trimmed;
                  } catch {
                    toast({
                      variant: "destructive",
                      title: "Invalid JSON",
                      description: "Fix the extra parameters field or leave it empty.",
                    });
                    return;
                  }
                }
                setSubmitting(true);
                staffReportRunsApi
                  .create({
                    templateTitle: templateTitle.trim(),
                    reportingPeriodStart: periodStart,
                    reportingPeriodEnd: periodEnd,
                    safehouseId: safehouseId ? Number(safehouseId) : null,
                    title: reportTitle.trim(),
                    notes: notes.trim() || null,
                    status,
                    parametersJson: params,
                  })
                  .then((res) => {
                    if (!res.success) throw new Error(res.message || "Failed to save report run");
                    toast({
                      title: "Report run saved",
                      description: `“${reportTitle.trim()}” was stored on the server.`,
                    });
                    navigate("/app/reports");
                  })
                  .catch((e: unknown) => {
                    toast({
                      variant: "destructive",
                      title: "Could not save",
                      description: e instanceof Error ? e.message : "Unknown error",
                    });
                  })
                  .finally(() => setSubmitting(false));
              }}
            >
              {submitting ? "Saving…" : "Save report run"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
