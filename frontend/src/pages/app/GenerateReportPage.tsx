import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { localData } from "@/lib/localData";

const templates = [
  "Annual Program Accomplishment Report",
  "Monthly Caseload & Status Summary",
  "Program & Safehouse Comparison",
  "Reintegration & Transition Outcomes",
  "Resource Mobilization & Allocations",
  "Staff Activity & Documentation Compliance",
];

export default function GenerateReportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [templateTitle, setTemplateTitle] = useState(templates[0]);
  const [notes, setNotes] = useState("");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Generate report run</h2>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed font-body">
          Log a report generation for your records (stored locally). Use the main Reports page for SWD-style previews,
          charts, and CSV annex exports tied to live demo data.
        </p>
      </div>

      <Card className="card-warm border-secondary/25 shadow-warm">
        <CardHeader>
          <CardTitle className="font-heading">Report options</CardTitle>
          <CardDescription className="font-body">
            Select a template aligned with Philippine social welfare accomplishment reporting and partner submissions.
          </CardDescription>
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
              placeholder="e.g. DSWD partner submission draft, board packet Q2, grant narrative attachment…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] font-body"
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
                  title: "Report run logged",
                  description: `Recorded “${templateTitle}”. Open Reports for previews and CSV exports.`,
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
