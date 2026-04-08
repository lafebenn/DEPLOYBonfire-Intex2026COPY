import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Gift, Mail, MapPin, Phone, User } from "lucide-react";
import { donorsApi, fetchDonorGivingPrediction, pickMlProxyScore } from "@/lib/api";

const typeColors: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  Monthly: "default",
  "One-time": "secondary",
  Grant: "warning",
  Annual: "outline",
};

type SupporterApi = {
  supporterId: number;
  displayName: string;
  supporterType: string;
  status: string;
  email: string;
  phone: string;
  region: string;
  country: string;
  acquisitionChannel: string;
  firstDonationDate: string | null;
  createdAt?: string;
};

type DonationRow = {
  donationId: number;
  donationType: string;
  donationDate: string;
  amount: number | null;
  estimatedValue: number | null;
  channelSource: string;
};

function formatPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

export default function SupporterProfilePage() {
  const { supporterId } = useParams<{ supporterId: string }>();
  const idNum = supporterId ? Number(supporterId) : NaN;

  const [profile, setProfile] = useState<SupporterApi | null>(null);
  const [contributions, setContributions] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [givingMlScore, setGivingMlScore] = useState<number | null>(null);
  const [givingMlLoading, setGivingMlLoading] = useState(false);
  const [givingMlError, setGivingMlError] = useState<string | null>(null);

  useEffect(() => {
    if (!supporterId || Number.isNaN(idNum)) {
      setLoading(false);
      return;
    }

    Promise.all([donorsApi.supporterGet(idNum), donorsApi.donationsList({ supporterId: String(idNum) })])
      .then(([supRes, donRes]) => {
        if (!supRes.success) throw new Error(supRes.message || "Supporter not found");
        setProfile(supRes.data as SupporterApi);
        if (donRes.success) setContributions(donRes.data as DonationRow[]);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [supporterId, idNum]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setGivingMlLoading(true);
    setGivingMlError(null);
    fetchDonorGivingPrediction(profile.supporterId)
      .then((raw) => {
        if (!cancelled) setGivingMlScore(pickMlProxyScore(raw));
      })
      .catch((e: unknown) => {
        if (!cancelled) setGivingMlError(e instanceof Error ? e.message : "Could not load donor-giving ML");
      })
      .finally(() => {
        if (!cancelled) setGivingMlLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.supporterId]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error || !profile) {
    return (
      <div className="space-y-4 p-8">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
          <Link to="/app/donors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to supporters
          </Link>
        </Button>
        <div className="text-destructive">{error ?? "Supporter not found"}</div>
      </div>
    );
  }

  let sum = 0;
  let counted = 0;
  for (const c of contributions) {
    const v = c.amount ?? c.estimatedValue;
    if (v != null) {
      sum += Number(v);
      counted++;
    }
  }
  const totalLabel =
    counted > 0
      ? `${formatPhp(sum)} from ${contributions.length} gift${contributions.length === 1 ? "" : "s"}`
      : `${contributions.length} gift${contributions.length === 1 ? "" : "s"} on file`;

  const allocationTally = new Map<string, number>();
  for (const c of contributions) {
    const key = c.channelSource || "—";
    allocationTally.set(key, (allocationTally.get(key) ?? 0) + 1);
  }
  const topAllocations = [...allocationTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const memberSince =
    profile.firstDonationDate?.slice(0, 4) ?? (profile.createdAt ? profile.createdAt.slice(0, 4) : "—");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
          <Link to="/app/donors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to supporters
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/app/donations/new">Record another gift</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-2xl font-bold">{profile.displayName}</h2>
          <Badge variant={profile.status === "Active" ? "default" : "secondary"}>{profile.status}</Badge>
          <Badge variant="outline">{profile.supporterType}</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Supporter profile and contribution history from the operational database.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Giving summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-heading font-semibold">{totalLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">Amounts shown in PHP where available.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Relationship
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Since </span>
              <span className="font-medium">{memberSince}</span>
            </p>
            {profile.acquisitionChannel && (
              <p>
                <span className="text-muted-foreground">Source </span>
                <span className="font-medium">{profile.acquisitionChannel}</span>
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">Top allocations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {topAllocations.length === 0 ? (
              <p className="text-muted-foreground">No allocation data yet.</p>
            ) : (
              topAllocations.map(([label, n]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">{label}</span>
                  <span className="font-medium tabular-nums shrink-0">{n}×</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">Donor giving (ML via API)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-xs text-muted-foreground mb-2">
              Score from <code className="text-[10px]">/api/prediction/donor-giving</code>; browser never calls Python directly.
            </p>
            {givingMlLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : givingMlError ? (
              <p className="text-destructive text-xs">{givingMlError}</p>
            ) : givingMlScore != null ? (
              <p>
                Model score: <span className="font-mono font-semibold">{givingMlScore.toFixed(4)}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">No score in response (check API JSON shape).</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Contact & notes</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            {profile.email && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${profile.email}`} className="text-foreground hover:underline">
                  {profile.email}
                </a>
              </p>
            )}
            {profile.phone && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="text-foreground">{profile.phone}</span>
              </p>
            )}
            {(profile.region || profile.country) && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-foreground">{[profile.region, profile.country].filter(Boolean).join(", ")}</span>
              </p>
            )}
            {!profile.email && !profile.phone && !profile.region && !profile.country && (
              <p className="text-muted-foreground">No contact fields on file.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Contribution history</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">Newest first</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Allocation</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((row) => {
                const amt = row.amount ?? row.estimatedValue;
                const amtLabel = amt != null ? formatPhp(Number(amt)) : "—";
                return (
                  <TableRow key={row.donationId}>
                    <TableCell className="tabular-nums">{row.donationDate}</TableCell>
                    <TableCell>
                      <Badge variant={typeColors[row.donationType] ?? "outline"}>{row.donationType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{amtLabel}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{row.channelSource || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground capitalize">{row.channelSource || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
