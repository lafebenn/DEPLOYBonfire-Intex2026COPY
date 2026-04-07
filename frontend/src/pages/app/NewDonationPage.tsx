import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { donorsApi, type SupportersListPayload } from "@/lib/api";

const donationTypes = ["Monthly", "One-time", "Annual", "Grant"] as const;

export default function NewDonationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [donorName, setDonorName] = useState("");
  const [donationType, setDonationType] = useState<(typeof donationTypes)[number]>("One-time");
  const [amount, setAmount] = useState("");
  const [allocation, setAllocation] = useState("Direct Services");
  const [date, setDate] = useState(defaultDate);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    donorName.trim().length > 0 &&
    amount.trim().length > 0 &&
    allocation.trim().length > 0 &&
    date.trim().length > 0;

  function parseAmount(raw: string): number | null {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Add Donation</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Record a new donation or contribution (stored locally for now).
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
                placeholder="$500 / mo"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocation">Allocation</Label>
              <Input
                id="allocation"
                placeholder="Direct Services"
                value={allocation}
                onChange={(e) => setAllocation(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
                if (parsed == null) {
                  setSubmitError("Enter a valid amount.");
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
                      channelSource: allocation.trim(),
                      currencyCode: "PHP",
                      amount: parsed,
                      estimatedValue: null,
                      impactUnit: null,
                      isRecurring: donationType === "Monthly",
                      campaignName: null,
                      notes: null,
                      createdByPartnerId: null,
                      referralPostId: null,
                    });
                  })
                  .then((res) => {
                    if (!res.success) throw new Error(res.message || "Failed to record donation");
                    toast({
                      title: "Donation saved",
                      description: `Recorded ${amount.trim()} from ${donorName.trim()}.`,
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
