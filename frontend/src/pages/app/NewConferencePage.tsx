import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { residentsApi } from "@/lib/api";
import { ResidentMultiSelect } from "@/components/ResidentMultiSelect";

export default function NewConferencePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [selectedResidents, setSelectedResidents] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("2:00 PM");
  const [attendees, setAttendees] = useState(4);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rid = searchParams.get("residentId");
    if (rid && /^\d+$/.test(rid)) {
      const n = Number(rid);
      setSelectedResidents((prev) => (prev.includes(n) ? prev : [...prev, n]));
    }
  }, [searchParams]);

  const canSubmit =
    title.trim().length > 0 &&
    date.trim().length > 0 &&
    time.trim().length > 0 &&
    selectedResidents.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Schedule Conference</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Creates an intervention-plan record with a case conference date on each selected resident&apos;s file.
        </p>
      </div>

      {submitError && <div className="text-sm text-destructive">{submitError}</div>}

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Meeting details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ResidentMultiSelect
            id="conference-residents"
            value={selectedResidents}
            onChange={setSelectedResidents}
            disabled={submitting}
          />

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Quarterly Review - Residential Program"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input id="time" value={time} onChange={(e) => setTime(e.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendees">Expected attendees (count)</Label>
              <Input
                id="attendees"
                type="number"
                min={1}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/caseload")} disabled={submitting}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => {
                setSubmitError(null);
                setSubmitting(true);
                const ac = Number.isFinite(attendees) && attendees > 0 ? attendees : 1;
                const planDescription = [
                  title.trim(),
                  `When: ${date} ${time.trim()}`,
                  `Expected attendees: ${ac}`,
                ].join("\n");
                const body = {
                  planCategory: "Case Conference",
                  planDescription,
                  servicesProvided: "",
                  targetValue: null as number | null,
                  targetDate: date,
                  status: "Active",
                  caseConferenceDate: date,
                };
                Promise.all(
                  selectedResidents.map((residentId) => residentsApi.addInterventionPlan(residentId, body))
                )
                  .then((results) => {
                    const bad = results.find((r) => !r.success);
                    if (bad) throw new Error(bad.message || "One or more saves failed");
                    toast({
                      title: "Conference scheduled",
                      description:
                        selectedResidents.length === 1
                          ? `${title.trim()} linked to the case file.`
                          : `${title.trim()} linked to ${selectedResidents.length} case files.`,
                    });
                    navigate("/app/caseload");
                  })
                  .catch((err: Error) => setSubmitError(err.message ?? "Failed to save"))
                  .finally(() => setSubmitting(false));
              }}
            >
              Save conference
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
