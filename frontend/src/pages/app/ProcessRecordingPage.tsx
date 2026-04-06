import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";

const recordings = [
  { id: 1, resident: "Jane D.", date: "2026-04-05", type: "Session Note", author: "James Rivera", summary: "Discussed employment goals and reviewed progress on GED preparation." },
  { id: 2, resident: "Maria S.", date: "2026-04-04", type: "Intake Assessment", author: "Sarah Mitchell", summary: "Initial intake completed. Assigned to outpatient program." },
  { id: 3, resident: "Aisha T.", date: "2026-04-03", type: "Session Note", author: "James Rivera", summary: "Explored coping strategies for anxiety. Positive engagement noted." },
  { id: 4, resident: "Lin W.", date: "2026-04-01", type: "Progress Review", author: "Sarah Mitchell", summary: "30-day progress review. Adjusting goals for next quarter." },
];

export default function ProcessRecordingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Process Recording</h2>
          <p className="text-muted-foreground text-sm mt-1">Chronological session notes and assessments</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> New Recording</Button>
      </div>

      <div className="space-y-4">
        {recordings.map((r) => (
          <Card key={r.id} className="hover:shadow-warm-lg transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{r.resident}</p>
                      <Badge variant="outline">{r.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">By {r.author} · {r.date}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
