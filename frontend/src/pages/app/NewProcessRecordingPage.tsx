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
import { ResidentMultiSelect } from "@/components/ResidentMultiSelect";

const recordingTypes = ["Session Note", "Intake Assessment", "Progress Review", "Incident Follow-up"];

export default function NewProcessRecordingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [selectedResidents, setSelectedResidents] = useState<number[]>([]);
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState(recordingTypes[0]);
  const [author, setAuthor] = useState(user?.name ?? "Staff Member");
  const [summary, setSummary] = useState("");
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
    selectedResidents.length > 0 &&
    date.trim().length > 0 &&
    type.trim().length > 0 &&
    author.trim().length > 0 &&
    summary.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Process Recording</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Log a process recording for each selected case. The same session is saved on every resident you attach.
        </p>
      </div>

      {submitError && <div className="text-sm text-destructive">{submitError}</div>}

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Recording details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <ResidentMultiSelect
            id="recording-residents"
            value={selectedResidents}
            onChange={setSelectedResidents}
            disabled={submitting}
          />

          <div className="grid md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
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
                const body = {
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
                  notesRestricted: null as string | null,
                };
                Promise.all(selectedResidents.map((residentId) => residentsApi.addProcessRecording(residentId, body)))
                  .then((results) => {
                    const bad = results.find((r) => !r.success);
                    if (bad) throw new Error(bad.message || "One or more saves failed");
                    toast({
                      title: "Recording saved",
                      description:
                        selectedResidents.length === 1
                          ? `Added a ${type} entry to the case file.`
                          : `Added a ${type} entry to ${selectedResidents.length} case files.`,
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
