import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { localData } from "@/lib/localData";

const conferences = [
  { id: 1, title: "Quarterly Review — Residential Program", date: "2026-04-10", time: "2:00 PM", attendees: 5, status: "Upcoming", cases: ["Jane D.", "Aisha T.", "Lin W."] },
  { id: 2, title: "Transition Planning — Emily R.", date: "2026-04-07", time: "10:00 AM", attendees: 3, status: "Upcoming", cases: ["Emily R."] },
  { id: 3, title: "Monthly Outpatient Review", date: "2026-04-01", time: "3:00 PM", attendees: 4, status: "Completed", cases: ["Maria S."] },
  { id: 4, title: "Emergency Review — New Intake", date: "2026-03-28", time: "9:00 AM", attendees: 6, status: "Completed", cases: ["Lin W."] },
];

const statusColors: Record<string, "default" | "success"> = { Upcoming: "default", Completed: "success" };

export default function CaseConferencesPage() {
  const stored = localData.listConferences();
  const allConferences = [...stored, ...conferences];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Case Conferences</h2>
          <p className="text-muted-foreground text-sm mt-1">Collaborative care planning meetings</p>
        </div>
        <Button asChild>
          <Link to="/app/conferences/new">
            <Plus className="h-4 w-4 mr-2" /> Schedule Conference
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {allConferences.map((c) => (
          <Card key={c.id} className="hover:shadow-warm-lg transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{c.date} at {c.time}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{c.attendees} attendees</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">Cases: {c.cases.join(", ")}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={statusColors[c.status]}>{c.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
