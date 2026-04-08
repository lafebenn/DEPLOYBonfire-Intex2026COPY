import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Home, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { residentsApi } from "@/lib/api";
import { clientTotalPages, clampClientPage } from "@/lib/clientPagination";
import { ListPagination } from "@/components/ListPagination";

type ResidentRow = {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  caseStatus: string;
};

export default function HomeVisitsPage() {
  const [residents, setResidents] = useState<ResidentRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const list = residents ?? [];
  const totalPages = clientTotalPages(list.length, pageSize);
  const currentPage = clampClientPage(pageNum, list.length, pageSize);

  useEffect(() => {
    setPageNum((p) => Math.min(p, totalPages));
  }, [list.length, pageSize, totalPages]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, currentPage, pageSize]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!residents) return <div className="p-8 text-muted-foreground">No data</div>;

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

      <Card className="border-dashed">
        <CardContent className="p-5 text-sm text-muted-foreground leading-relaxed">
          There is no global list of visits in the API.{" "}
          <strong className="text-foreground font-medium">Visit history for each young person</strong> is shown on their{" "}
          <Link to="/app/caseload" className="text-primary underline-offset-4 hover:underline">
            resident detail
          </Link>{" "}
          page. Open a case below to go to their profile, or use Schedule Visit to log a new visit.
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {paginated.map((r) => (
          <Card key={r.residentId} className="hover:shadow-warm-lg transition-shadow">
            <CardContent className="p-5">
              <Link
                to={`/app/caseload/${r.residentId}`}
                className="flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{r.internalCode}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" /> Case {r.caseControlNo} · {r.caseStatus}
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {list.length > 0 ? (
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={list.length}
          onPageChange={setPageNum}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  );
}
