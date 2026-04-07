import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { residentsApi } from "@/lib/api";

type ResidentRow = {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  caseStatus: string;
};

export default function ProcessRecordingPage() {
  const [residents, setResidents] = useState<ResidentRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    residentsApi
      .list()
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Failed to load residents");
        setResidents(res.data as ResidentRow[]);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!residents) return <div className="p-8 text-muted-foreground">No data</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Process Recording</h2>
          <p className="text-muted-foreground text-sm mt-1">Chronological session notes and assessments</p>
        </div>
        <Button asChild>
          <Link to="/app/recordings/new">
            <Plus className="h-4 w-4 mr-2" /> New Recording
          </Link>
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-5 text-sm text-muted-foreground leading-relaxed">
          There is no global list of process recordings in the API.{" "}
          <strong className="text-foreground font-medium">Session history</strong> for each resident is on their{" "}
          <Link to="/app/caseload" className="text-primary underline-offset-4 hover:underline">
            resident detail
          </Link>{" "}
          page. Pick a case below or use New Recording to add an entry.
        </CardContent>
      </Card>

      <div className="space-y-4">
        {residents.map((r) => (
          <Card key={r.residentId} className="hover:shadow-warm-lg transition-shadow">
            <CardContent className="p-5">
              <Link
                to={`/app/caseload/${r.residentId}`}
                className="flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{r.internalCode}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {r.caseControlNo} · {r.caseStatus}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Open profile for process recording history</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
