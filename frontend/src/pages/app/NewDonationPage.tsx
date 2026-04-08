import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { donorsApi, safehousesApi, type SupportersListPayload } from "@/lib/api";

const donationTypes = ["Monetary", "InKind", "Time", "Skills", "SocialMedia"] as const;
const channelSources = ["Campaign", "Event", "Direct", "SocialMedia", "PartnerReferral"] as const;
const programAreas = ["Education", "Wellbeing", "Operations", "Transport", "Maintenance", "Outreach"] as const;

export default function NewDonationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [donorName, setDonorName] = useState("");
  const [donationType, setDonationType] = useState<(typeof donationTypes)[number]>("Monetary");
  const [channelSource, setChannelSource] = useState<(typeof channelSources)[number]>("Direct");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [safehouses, setSafehouses] = useState<{ id: number; name: string }[]>([]);
  const [safehouseId, setSafehouseId] = useState<string>("");
  const [programArea, setProgramArea] = useState<(typeof programAreas)[number]>("Operations");
  const [amountAllocated, setAmountAllocated] = useState("");

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
        if (!safehouseId && parsed[0]) setSafehouseId(String(parsed[0].id));
      })
      .catch(() => {
        if (!cancelled) setSafehouses([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit =
    donorName.trim().length > 0 &&
    amount.trim().length > 0 &&
    date.trim().length > 0 &&
    safehouseId.trim().length > 0 &&
    amountAllocated.trim().length > 0;

  function parseAmount(raw: string): number | null {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Add Donation</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Record a gift for a supporter. Site and program tags keep{" "}
          <Link to="/app/reports" className="text-primary underline-offset-4 hover:underline">
            Reports &amp; analytics
          </Link>{" "}
          aligned with how money is directed.
        </p>
      </div>

      {submitError && <div className="text-sm text-destructive">{submitError}</div>}

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Donation details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donorName">Donor</Label>
              <Input
                id="donorName"
                placeholder="Sarah Kingsley"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={donationType} onValueChange={(v) => setDonationType(v as (typeof donationTypes)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {donationTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (display)</Label>
              <Input
                id="amount"
                placeholder="5000"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  setAmount(v);
                  // Convenience: default site/program amount to the same numeric value.
                  if (!amountAllocated) setAmountAllocated(v);
                }}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Channel source</Label>
              <Select value={channelSource} onValueChange={(v) => setChannelSource(v as (typeof channelSources)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channelSources.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-heading font-semibold">Program &amp; safehouse</p>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                Required so Reports can attribute giving to a site and program area (monthly trends, KPIs, and operational
                insights). Use the same amounts as the gift total when the full gift applies to one line.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Safehouse</Label>
                <Select value={safehouseId} onValueChange={setSafehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select safehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {safehouses.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Program area</Label>
                <Select value={programArea} onValueChange={(v) => setProgramArea(v as (typeof programAreas)[number])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {programAreas.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountAllocated">Amount for this site (PHP)</Label>
                <Input
                  id="amountAllocated"
                  placeholder="5000"
                  value={amountAllocated}
                  onChange={(e) => setAmountAllocated(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/donors")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => {
                setSubmitError(null);
                setSubmitting(true);
                const parsed = parseAmount(amount);
                const allocParsed = parseAmount(amountAllocated);
                if (parsed == null) {
                  setSubmitError("Enter a valid amount.");
                  setSubmitting(false);
                  return;
                }
                if (allocParsed == null) {
                  setSubmitError("Enter a valid amount for this site.");
                  setSubmitting(false);
                  return;
                }
                const shId = Number(safehouseId);
                if (!Number.isFinite(shId) || shId <= 0) {
                  setSubmitError("Select a safehouse for this gift.");
                  setSubmitting(false);
                  return;
                }
                donorsApi
                  .supportersList({ search: donorName.trim() })
                  .then((listRes) => {
                    if (!listRes.success) throw new Error(listRes.message || "Failed to look up donor");
                    const rows = (listRes.data as SupportersListPayload).supporters;
                    if (rows.length !== 1) {
                      throw new Error("Enter a donor name that matches exactly one supporter in the database.");
                    }
                    return donorsApi.donationCreate({
                      supporterId: rows[0].supporterId,
                      donationType,
                      donationDate: date,
                      channelSource,
                      currencyCode: "PHP",
                      amount: parsed,
                      estimatedValue: null,
                      impactUnit: null,
                      isRecurring: false,
                      campaignName: null,
                      notes: null,
                      createdByPartnerId: null,
                      referralPostId: null,
                      allocations: [
                        {
                          safehouseId: shId,
                          programArea,
                          amountAllocated: allocParsed,
                        },
                      ],
                    });
                  })
                  .then((res) => {
                    if (!res.success) throw new Error(res.message || "Failed to record donation");
                    toast({
                      title: "Donation saved",
                      description: `Recorded PHP ${parsed.toLocaleString()} from ${donorName.trim()}.`,
                    });
                    navigate("/app/donors");
                  })
                  .catch((err: Error) => setSubmitError(err.message ?? "Failed to save"))
                  .finally(() => setSubmitting(false));
              }}
            >
              Save donation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
