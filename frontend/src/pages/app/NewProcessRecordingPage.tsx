import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { localData } from "@/lib/localData";
import { useAuth } from "@/contexts/AuthContext";

const recordingTypes = ["Session Note", "Intake Assessment", "Progress Review", "Incident Follow-up"];

export default function NewProcessRecordingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [resident, setResident] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState(recordingTypes[0]);
  const [author, setAuthor] = useState(user?.name ?? "Staff Member");
  const [summary, setSummary] = useState("");

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
                placeholder="Jane D."
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
              disabled={!canSubmit}
              onClick={() => {
                localData.addRecording({
                  resident: resident.trim(),
                  date,
                  type: type.trim(),
                  author: author.trim(),
                  summary: summary.trim(),
                });
                toast({
                  title: "Recording saved",
                  description: `Added a ${type} entry for ${resident.trim()}.`,
                });
                navigate("/app/process-recording");
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

