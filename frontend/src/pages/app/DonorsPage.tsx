import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Heart, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { donorsApi, mlApi, type SupporterListRow, type SupportersListPayload } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { clientTotalPages, clampClientPage } from "@/lib/clientPagination";
import { ListPagination } from "@/components/ListPagination";

type PriorityTarget = {
  supporterId: number;
  displayName: string;
  email: string;
  supporterType: string;
  acquisitionChannel: string;
  riskTier?: "High" | "Medium" | "Low";
  lapseRiskScore: number;
  donationCount: number;
  totalLifetimeValue: number;
  lastDonationDate: string | null;
  daysSinceLastDonation: number | null;
};

const typeColors: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  Monthly: "default",
  "One-time": "secondary",
  Grant: "warning",
  Annual: "outline",
  MonetaryDonor: "default",
  InKindDonor: "secondary",
  Volunteer: "outline",
};

function formatPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

function formatGiftAmount(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return formatPhp(Number(v));
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Picks summary totals from camelCase or PascalCase API payloads. */
function extractListSummary(raw: unknown): SupportersListPayload["summary"] {
  const p = raw as Record<string, unknown>;
  const s = (p.summary ?? {}) as Record<string, unknown>;
  const last12 = num(
    s.last12MonthsDonationTotal ??
      s.Last12MonthsDonationTotal ??
      s.ytdDonationTotal ??
      s.YtdDonationTotal
  );
  const avg = num(s.avgMonthlyLast12 ?? s.AvgMonthlyLast12 ?? s.avgMonthlyYtd ?? s.AvgMonthlyYtd);
  return {
    last12MonthsDonationTotal: last12,
    avgMonthlyLast12: avg,
  };
}

/** Handles both current API shape and legacy array-only responses. */
function normalizeSupportersListPayload(data: unknown): SupportersListPayload {
  if (Array.isArray(data)) {
    return {
      supporters: data.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          supporterId: Number(r.supporterId),
          displayName: String(r.displayName ?? ""),
          supporterType: String(r.supporterType ?? ""),
          status: String(r.status ?? ""),
          country: String(r.country ?? ""),
          firstDonationDate: (r.firstDonationDate as string | null) ?? null,
          acquisitionChannel: String(r.acquisitionChannel ?? ""),
          donationCount: 0,
          totalLifetimeValue: 0,
          lastDonationDate: null,
          latestAmount: null,
        };
      }),
      summary: { last12MonthsDonationTotal: 0, avgMonthlyLast12: 0 },
    };
  }
  const p = data as Partial<SupportersListPayload> & Record<string, unknown>;
  if (Array.isArray(p.supporters)) {
    return {
      supporters: p.supporters as SupporterListRow[],
      summary: extractListSummary(data),
    };
  }
  return {
    supporters: [],
    summary: { last12MonthsDonationTotal: 0, avgMonthlyLast12: 0 },
  };
}

export default function DonorsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [allDonors, setAllDonors] = useState<SupporterListRow[] | null>(null);
  const [listSummary, setListSummary] = useState<SupportersListPayload["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [targets, setTargets] = useState<PriorityTarget[] | null>(null);
  const [targetsError, setTargetsError] = useState<string | null>(null);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const searchLower = search.toLowerCase();
  const filtered = useMemo(() => {
    if (!allDonors) return [];
    return allDonors.filter((d) => d.displayName.toLowerCase().includes(searchLower));
  }, [allDonors, searchLower]);

  const totalPages = clientTotalPages(filtered.length, pageSize);
  const currentPage = clampClientPage(pageNum, filtered.length, pageSize);

  useEffect(() => {
    setPageNum(1);
  }, [search]);

  useEffect(() => {
    const tp = clientTotalPages(filtered.length, pageSize);
    setPageNum((p) => Math.min(p, tp));
  }, [filtered.length, pageSize]);

  const paginatedDonors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  async function loadTargets() {
    setTargetsLoading(true);
    setTargetsError(null);
    try {
      const res = await donorsApi.priorityTargets({ limit: 15 });
      if (!res.success) throw new Error(res.message || "Could not load priority targets");
      setTargets(res.data as PriorityTarget[]);
    } finally {
      setTargetsLoading(false);
    }
  }

  const formattedTargets = useMemo(() => {
    if (!targets) return [];
    return targets.map((t) => {
      const tier: "High" | "Medium" | "Low" =
        t.riskTier ??
        (t.lapseRiskScore >= 0.7 ? "High" : t.lapseRiskScore >= 0.4 ? "Medium" : "Low");
      return { ...t, tier };
    });
  }, [targets]);

  useEffect(() => {
    donorsApi
      .supportersList()
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Failed to load supporters");
        const payload = normalizeSupportersListPayload(res.data);
        setAllDonors(payload.supporters);
        setListSummary(payload.summary);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadTargets();
      } catch (e) {
        if (!cancelled) setTargetsError(e instanceof Error ? e.message : "Could not load priority targets");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!allDonors) return <div className="p-8 text-muted-foreground">No data</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Supporter profiles & contributions</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Open a row to see full gift history from the operational database.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/donations/new">
            <Plus className="h-4 w-4 mr-2" /> Add Donation
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{allDonors.length}</p>
              <p className="text-sm text-muted-foreground">Supporters</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {listSummary ? formatPhp(Number(listSummary.last12MonthsDonationTotal)) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Last 12 months</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {listSummary ? formatPhp(Number(listSummary.avgMonthlyLast12)) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Avg. monthly (÷ 12)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">High priority outreach (donor lapse risk)</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground font-normal">
              Ranked by predicted lapse risk and lifetime value. Refreshed nightly at midnight (server time).
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={async () => {
                try {
                  setRefreshing(true);
                  const res = await mlApi.refreshSupporters();
                  if (!res.success) throw new Error(res.message || "Refresh failed");
                  toast({ title: "Pipeline refresh queued", description: "Refreshing priority list from the database…" });
                  await loadTargets();
                } catch (e) {
                  toast({
                    title: "Could not run pipeline",
                    description: e instanceof Error ? e.message : "Unknown error",
                    variant: "destructive",
                  });
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              {refreshing ? "Running…" : "Run pipeline now"}
            </Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto px-6 pb-6">
          {targetsLoading && <p className="text-sm text-muted-foreground">Loading priority targets…</p>}
          {!targetsLoading && targetsError && <p className="text-sm text-destructive">{targetsError}</p>}
          {!targetsLoading && !targetsError && formattedTargets.length === 0 && (
            <p className="text-sm text-muted-foreground">No targets available yet.</p>
          )}
          {!targetsLoading && !targetsError && formattedTargets.length > 0 && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Supporter</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Risk</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Last gift</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Lifetime value</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Channel</th>
                </tr>
              </thead>
              <tbody>
                {formattedTargets.map((t, i) => (
                  <tr
                    key={t.supporterId}
                    className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
                    onClick={() => navigate(`/app/donors/${t.supporterId}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/app/donors/${t.supporterId}`);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open supporter profile for ${t.displayName}`}
                  >
                    <td className="p-4 font-medium">
                      <div className="flex flex-col">
                        <span>{t.displayName}</span>
                        <span className="text-xs text-muted-foreground">{t.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={t.tier === "High" ? "warning" : t.tier === "Medium" ? "secondary" : "outline"}>
                        {t.tier}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm hidden md:table-cell">
                      {typeof t.daysSinceLastDonation === "number" ? `${t.daysSinceLastDonation} days ago` : "—"}
                    </td>
                    <td className="p-4 text-sm hidden md:table-cell">
                      {typeof t.totalLifetimeValue === "number" ? `$${t.totalLifetimeValue.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{t.acquisitionChannel || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search supporters..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-heading">All supporters</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">Click a row to open profile and donation summary.</p>
        </CardHeader>
        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Latest amount</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Total / count</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Allocation</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Since</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDonors.map((d, i) => (
                <tr
                  key={d.supporterId}
                  className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
                  onClick={() => navigate(`/app/donors/${d.supporterId}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/app/donors/${d.supporterId}`);
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open supporter profile for ${d.displayName}`}
                >
                  <td className="p-4 font-medium">{d.displayName}</td>
                  <td className="p-4">
                    <Badge variant={typeColors[d.supporterType] ?? "outline"}>{d.supporterType}</Badge>
                  </td>
                  <td className="p-4 text-sm">{formatGiftAmount(d.latestAmount)}</td>
                  <td className="p-4 text-sm hidden md:table-cell">
                    {d.donationCount > 0
                      ? `${formatPhp(Number(d.totalLifetimeValue))} · ${d.donationCount}`
                      : "—"}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{d.acquisitionChannel || "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{d.firstDonationDate ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 ? (
          <div className="px-6 pb-6">
            <ListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setPageNum}
              onPageSizeChange={setPageSize}
              className="mt-0"
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
