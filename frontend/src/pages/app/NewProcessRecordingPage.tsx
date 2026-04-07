import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { residentsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const recordingTypes = ["Session Note", "Intake Assessment", "Progress Review", "Incident Follow-up"];

async function resolveResidentId(raw: string): Promise<number> {
  const t = raw.trim();
  if (/^\d+$/.test(t)) return Number(t);
  const res = await residentsApi.list({ search: t });
  if (!res.success) throw new Error(res.message || "Lookup failed");
  const rows = res.data as { residentId: number }[];
  if (rows.length !== 1) throw new Error("Enter a resident ID or a name that matches exactly one case.");
  return rows[0].residentId;
}

export default function NewProcessRecordingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [resident, setResident] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState(recordingTypes[0]);
  const [author, setAuthor] = useState(user?.name ?? "Staff Member");
  const [summary, setSummary] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rid = searchParams.get("residentId");
    if (rid) setResident(rid);
  }, [searchParams]);

  const canSubmit =
    resident.trim().length > 0 &&
    date.trim().length > 0 &&
    type.trim().length > 0 &&
    author.trim().length > 0 &&
    summary.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Process Recording</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Add a new dated process recording entry (stored locally for now).
        </p>
      </div>

      {submitError && <div className="text-sm text-destructive">{submitError}</div>}

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Recording details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resident">Resident</Label>
              <Input
                id="resident"
                placeholder="Jane D. or resident ID"
                value={resident}
                onChange={(e) => setResident(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Social worker</Label>
              <Input
                id="author"
                placeholder="James Rivera"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recordingTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              placeholder="Brief narrative summary of the session..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/process-recording")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => {
                setSubmitError(null);
                setSubmitting(true);
                resolveResidentId(resident)
                  .then((residentId) =>
                    residentsApi.addProcessRecording(residentId, {
                      sessionDate: date,
                      socialWorker: author.trim(),
                      sessionType: type.trim(),
                      sessionDurationMinutes: 0,
                      emotionalStateObserved: "",
                      emotionalStateEnd: "",
                      sessionNarrative: summary.trim(),
                      interventionsApplied: "",
                      followUpActions: "",
                      progressNoted: false,
                      concernsFlagged: false,
                      referralMade: false,
                      notesRestricted: null,
                    })
                  )
                  .then((res) => {
                    if (!res.success) throw new Error(res.message || "Failed to save recording");
                    toast({
                      title: "Recording saved",
                      description: `Added a ${type} entry.`,
                    });
                    navigate(-1);
                  })
                  .catch((err: Error) => setSubmitError(err.message ?? "Failed to save"))
                  .finally(() => setSubmitting(false));
              }}
            >
              Save recording
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
