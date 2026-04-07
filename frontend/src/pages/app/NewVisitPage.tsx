import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { residentsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const statuses = ["Scheduled", "Completed"] as const;

async function resolveResidentId(raw: string): Promise<number> {
  const t = raw.trim();
  if (/^\d+$/.test(t)) return Number(t);
  const res = await residentsApi.list({ search: t });
  if (!res.success) throw new Error(res.message || "Lookup failed");
  const rows = res.data as { residentId: number }[];
  if (rows.length !== 1) throw new Error("Enter a resident ID or a name that matches exactly one case.");
  return rows[0].residentId;
}

export default function NewVisitPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [resident, setResident] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00 AM");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Scheduled");
  const [worker, setWorker] = useState(user?.name ?? "Staff Member");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rid = searchParams.get("residentId");
    if (rid) setResident(rid);
  }, [searchParams]);

  const canSubmit =
    resident.trim().length > 0 &&
    address.trim().length > 0 &&
    date.trim().length > 0 &&
    time.trim().length > 0 &&
    worker.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Record Visit</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Schedule or log a home/field visit (stored locally for now).
        </p>
      </div>

      {submitError && <div className="text-sm text-destructive">{submitError}</div>}

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Visit details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resident">Resident</Label>
              <Input
                id="resident"
                placeholder="Aisha T. or resident ID"
                value={resident}
                onChange={(e) => setResident(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="worker">Social worker</Label>
              <Input
                id="worker"
                placeholder="James Rivera"
                value={worker}
                onChange={(e) => setWorker(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Location visited</Label>
            <Input
              id="address"
              placeholder="1234 Elm St, Suite 5"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/home-visits")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => {
                setSubmitError(null);
                setSubmitting(true);
                resolveResidentId(resident)
                  .then((residentId) =>
                    residentsApi.addHomeVisitation(residentId, {
                      visitDate: date,
                      socialWorker: worker.trim(),
                      visitType: "Home",
                      locationVisited: address.trim(),
                      familyMembersPresent: "",
                      purpose: "",
                      observations: `Scheduled time: ${time.trim()}`,
                      familyCooperationLevel: "",
                      safetyConcernsNoted: false,
                      followUpNeeded: false,
                      followUpNotes: null,
                      visitOutcome: status,
                    })
                  )
                  .then((res) => {
                    if (!res.success) throw new Error(res.message || "Failed to save visit");
                    toast({
                      title: "Visit saved",
                      description: `Visit on ${date} added.`,
                    });
                    navigate(-1);
                  })
                  .catch((err: Error) => setSubmitError(err.message ?? "Failed to save"))
                  .finally(() => setSubmitting(false));
              }}
            >
              Save visit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
