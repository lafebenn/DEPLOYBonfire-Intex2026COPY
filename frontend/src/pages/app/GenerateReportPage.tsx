import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { localData } from "@/lib/localData";

const templates = [
  "Monthly Caseload Summary",
  "Donation & Fundraising Report",
  "Program Outcomes Report",
  "Staff Activity Report",
  "Quarterly Impact Summary",
];

export default function GenerateReportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templateTitle, setTemplateTitle] = useState(templates[0]);
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Generate Report</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Generate a report run (stored locally for now).
        </p>
      </div>

      <Card className="card-warm">
        <CardHeader>
          <CardTitle>Report options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateTitle} onValueChange={setTemplateTitle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any context for this report run (e.g., board meeting, end-of-month close)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/app/reports")}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                localData.addReportRun({
                  templateTitle,
                  notes: notes.trim().length ? notes.trim() : undefined,
                });
                toast({
                  title: "Report generated",
                  description: `Added a new run for “${templateTitle}”.`,
                });
                navigate("/app/reports");
              }}
            >
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

