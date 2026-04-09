import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Plus, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { residentsApi } from "@/lib/api";
import { clientTotalPages, clampClientPage } from "@/lib/clientPagination";
import { ListPagination } from "@/components/ListPagination";
import { cn } from "@/lib/utils";
import { riskLevelBadgeClassFromLevel } from "@/lib/residentRiskUi";

type ResidentRow = {
  residentId: number;
  caseControlNo: string;
  internalCode: string;
  caseStatus: string;
  currentRiskLevel: string;
  caseCategory: string;
  dateOfAdmission: string;
  safehouseId: number;
  assignedSocialWorker: string;
};

const statusColors: Record<string, "default" | "success" | "warning" | "outline"> = {
  Active: "default",
  Transitioning: "warning",
  Completed: "success",
  Closed: "success",
  Transferred: "outline",
};

/** Preferred order in the filter list; unknown values from the API are appended alphabetically. */
const STATUS_ORDER = ["Active", "Transitioning", "Completed", "Closed", "Transferred"] as const;

function sortStatusOptions(a: string, b: string): number {
  const ia = STATUS_ORDER.indexOf(a as (typeof STATUS_ORDER)[number]);
  const ib = STATUS_ORDER.indexOf(b as (typeof STATUS_ORDER)[number]);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export default function CaseloadPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [allResidents, setAllResidents] = useState<ResidentRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    residentsApi
      .list()
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Failed to load residents");
        setAllResidents(res.data as ResidentRow[]);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const statusOptions = useMemo(() => {
    const set = new Set<string>(STATUS_ORDER);
    if (allResidents) {
      for (const r of allResidents) {
        if (r.caseStatus?.trim()) set.add(r.caseStatus.trim());
      }
    }
    return Array.from(set).sort(sortStatusOptions);
  }, [allResidents]);

  const searchLower = search.toLowerCase();
  const filtered = useMemo(() => {
    if (!allResidents) return [];
    return allResidents.filter((r) => {
      const matchesSearch =
        r.caseControlNo.toLowerCase().includes(searchLower) ||
        r.internalCode.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
      if (statusFilter.length === 0) return true;
      return statusFilter.includes(r.caseStatus);
    });
  }, [allResidents, searchLower, statusFilter]);

  useEffect(() => {
    setPageNum(1);
  }, [search, statusFilter]);

  const totalPages = clientTotalPages(filtered.length, pageSize);
  const currentPage = clampClientPage(pageNum, filtered.length, pageSize);

  useEffect(() => {
    const tp = clientTotalPages(filtered.length, pageSize);
    setPageNum((p) => Math.min(p, tp));
  }, [filtered.length, pageSize]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const filterActive = statusFilter.length > 0;

  function toggleStatus(status: string) {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!allResidents) return <div className="p-8 text-muted-foreground">No data</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Caseload Inventory</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {filterActive || search.trim()
              ? `Showing ${filtered.length} of ${allResidents.length} residents`
              : `${allResidents.length} residents across all programs`}
          </p>
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
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(filterActive && "border-primary/50 bg-primary/5")}
              aria-label="Filter by case status"
            >
              <Filter className="h-4 w-4" />
              {filterActive ? (
                <span className="sr-only">{statusFilter.length} statuses selected</span>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium">Case status</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leave none checked to show all. Select one or more to narrow the list.
              </p>
            </div>
            <ul className="p-2 max-h-64 overflow-y-auto space-y-1">
              {statusOptions.map((status) => {
                const checked = statusFilter.includes(status);
                return (
                  <li key={status}>
                    <label
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-2 text-sm cursor-pointer hover:bg-accent",
                        checked && "bg-accent/70"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleStatus(status)}
                        aria-label={`Filter ${status}`}
                      />
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        <Badge variant={statusColors[status] || "outline"} className="text-[10px] shrink-0">
                          {status}
                        </Badge>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {filterActive ? (
              <div className="p-2 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setStatusFilter([])}
                >
                  Clear status filters
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No residents match your search or status filters.
            </CardContent>
          </Card>
        ) : null}
        {paginated.map((r) => (
          <Card key={r.residentId} className="hover:shadow-warm-lg transition-shadow overflow-hidden">
            <Link
              to={`/app/caseload/${r.residentId}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-heading font-bold text-sm">{r.internalCode[0] ?? "?"}</span>
                    </div>
                    <div>
                      <p className="font-medium">{r.internalCode}</p>
                      <p className="text-sm text-muted-foreground">{r.caseControlNo} · {r.caseCategory}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-y-2 gap-x-0">
                    <div className="flex items-center gap-2 text-right pr-3 sm:pr-4">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Current risk:</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] capitalize shrink-0", riskLevelBadgeClassFromLevel(r.currentRiskLevel))}
                      >
                        {r.currentRiskLevel?.trim() ? r.currentRiskLevel : "Not set"}
                      </Badge>
                    </div>
                    <div className="flex items-center border-l border-border pl-3 sm:pl-4 min-h-[1.5rem]">
                      <Badge variant={statusColors[r.caseStatus] || "outline"}>{r.caseStatus}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {filtered.length > 0 ? (
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPageNum}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </div>
  );
}
