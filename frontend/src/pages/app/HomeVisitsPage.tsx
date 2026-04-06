import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { localData } from "@/lib/localData";

const visits = [
  { id: 1, resident: "Aisha T.", address: "1234 Elm St, Suite 5", date: "2026-04-08", time: "10:00 AM", status: "Scheduled", worker: "James Rivera" },
  { id: 2, resident: "Emily R.", address: "567 Oak Ave", date: "2026-04-05", time: "2:00 PM", status: "Completed", worker: "Sarah Mitchell" },
  { id: 3, resident: "Jane D.", address: "890 Pine Blvd", date: "2026-04-03", time: "11:00 AM", status: "Completed", worker: "James Rivera" },
  { id: 4, resident: "Lin W.", address: "234 Maple Dr, Apt 2B", date: "2026-04-10", time: "9:30 AM", status: "Scheduled", worker: "Sarah Mitchell" },
];

const statusColors: Record<string, "default" | "success"> = { Scheduled: "default", Completed: "success" };

export default function HomeVisitsPage() {
  const stored = localData.listVisits();
  const allVisits = [...stored, ...visits];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Home Visitations</h2>
          <p className="text-muted-foreground text-sm mt-1">Schedule and track home visits</p>
        </div>
        <Button asChild>
          <Link to="/app/visits/new">
            <Plus className="h-4 w-4 mr-2" /> Schedule Visit
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {allVisits.map((v) => (
          <Card key={v.id} className="hover:shadow-warm-lg transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{v.resident}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" /> {v.address}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={statusColors[v.status]}>{v.status}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">{v.date} · {v.time}</p>
                  <p className="text-xs text-muted-foreground">{v.worker}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
