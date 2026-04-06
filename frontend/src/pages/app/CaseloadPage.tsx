import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { listResidentsForCaseload } from "@/lib/residentData";

const statusColors: Record<string, "default" | "success" | "warning" | "outline"> = {
  Active: "default",
  Transitioning: "warning",
  Completed: "success",
};

export default function CaseloadPage() {
  const [search, setSearch] = useState("");
  const allResidents = listResidentsForCaseload();
  const filtered = allResidents.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Caseload Inventory</h2>
          <p className="text-muted-foreground text-sm mt-1">{allResidents.length} residents across all programs</p>
        </div>
        <Button asChild>
          <Link to="/app/intake/new">
            <Plus className="h-4 w-4 mr-2" /> New Intake
          </Link>
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      <div className="grid gap-4">
        {filtered.map((r) => (
          <Card key={r.id} className="hover:shadow-warm-lg transition-shadow overflow-hidden">
            <Link
              to={`/app/caseload/${encodeURIComponent(r.id)}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-heading font-bold text-sm">{r.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.id} · {r.program}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{r.progress}%</p>
                      <div className="w-20 h-1.5 bg-muted rounded-full mt-1">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${r.progress}%` }} />
                      </div>
                    </div>
                    <Badge variant={statusColors[r.status] || "outline"}>{r.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
