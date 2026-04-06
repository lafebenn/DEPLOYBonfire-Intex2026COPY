import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { localData } from "@/lib/localData";
import { useAuth } from "@/contexts/AuthContext";

const statuses = ["Scheduled", "Completed"] as const;

export default function NewVisitPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const defaultDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [resident, setResident] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00 AM");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Scheduled");
  const [worker, setWorker] = useState(user?.name ?? "Staff Member");

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
                placeholder="Aisha T."
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
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/home-visits")}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                localData.addVisit({
                  resident: resident.trim(),
                  address: address.trim(),
                  date,
                  time: time.trim(),
                  status,
                  worker: worker.trim(),
                });
                toast({
                  title: "Visit saved",
                  description: `Visit for ${resident.trim()} on ${date} added.`,
                });
                navigate("/app/home-visits");
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

