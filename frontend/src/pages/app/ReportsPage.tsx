import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, FileText } from "lucide-react";

const reports = [
  { title: "Monthly Caseload Summary", description: "Active cases, intakes, discharges, and program utilization", lastRun: "April 1, 2026" },
  { title: "Donation & Fundraising Report", description: "Donation trends, donor retention, and allocation breakdown", lastRun: "April 1, 2026" },
  { title: "Program Outcomes Report", description: "Completion rates, goal progress, and outcome metrics", lastRun: "March 31, 2026" },
  { title: "Staff Activity Report", description: "Session counts, visit completions, and documentation compliance", lastRun: "March 31, 2026" },
  { title: "Quarterly Impact Summary", description: "Anonymized aggregate metrics for board and stakeholders", lastRun: "March 31, 2026" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">Generate and download organizational reports</p>
      </div>

      <div className="grid gap-4">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{r.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Last generated: {r.lastRun}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> View</Button>
                  <Button size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
