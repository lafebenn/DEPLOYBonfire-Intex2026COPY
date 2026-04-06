import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { localData } from "@/lib/localData";

const programs = ["Residential", "Outpatient", "Aftercare"];
const statuses = ["Active", "Transitioning", "Completed"] as const;

export default function NewIntakePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultAdmitted = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [residentId, setResidentId] = useState("");
  const [name, setName] = useState("");
  const [program, setProgram] = useState<string>(programs[0]);
  const [status, setStatus] = useState<(typeof statuses)[number]>("Active");
  const [admitted, setAdmitted] = useState(defaultAdmitted);

  const canSubmit =
    residentId.trim().length > 0 &&
    name.trim().length > 0 &&
    admitted.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">New Intake</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new case intake (stored locally for now).
        </p>
      </div>

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Case details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="residentId">Resident ID</Label>
              <Input
                id="residentId"
                placeholder="R-2026-001"
                value={residentId}
                onChange={(e) => setResidentId(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                placeholder="Jane D."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
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
              <Label htmlFor="admitted">Admission date</Label>
              <Input
                id="admitted"
                type="date"
                value={admitted}
                onChange={(e) => setAdmitted(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/caseload")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                localData.addIntake({
                  id: residentId.trim(),
                  name: name.trim(),
                  program,
                  status,
                  admitted,
                  progress: 0,
                });
                toast({
                  title: "Intake created",
                  description: `Added ${residentId.trim()} to the caseload.`,
                });
                navigate("/app/caseload");
              }}
            >
              Save intake
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

