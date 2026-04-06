import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { localData } from "@/lib/localData";

export default function NewConferencePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("2:00 PM");
  const [attendees, setAttendees] = useState(4);
  const [caseNames, setCaseNames] = useState("");

  const canSubmit = title.trim().length > 0 && date.trim().length > 0 && time.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Schedule Conference</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Create a case conference meeting (stored locally for now).
        </p>
      </div>

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Meeting details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Quarterly Review — Residential Program"
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
              <Label htmlFor="attendees">Attendees</Label>
              <Input
                id="attendees"
                type="number"
                min={1}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cases">Cases (comma-separated)</Label>
            <Input
              id="cases"
              placeholder="Jane D., Aisha T., Lin W."
              value={caseNames}
              onChange={(e) => setCaseNames(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/case-conferences")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                const cases = caseNames
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean);
                localData.addConference({
                  title: title.trim(),
                  date,
                  time: time.trim(),
                  attendees: Number.isFinite(attendees) && attendees > 0 ? attendees : 1,
                  status: "Upcoming",
                  cases,
                });
                toast({
                  title: "Conference scheduled",
                  description: `${title.trim()} on ${date} added.`,
                });
                navigate("/app/case-conferences");
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

