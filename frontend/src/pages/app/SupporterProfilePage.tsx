import { Link, Navigate, useParams } from "react-router-dom";
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
import { getSupporterBundle } from "@/lib/supporterData";

const typeColors: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  Monthly: "default",
  "One-time": "secondary",
  Grant: "warning",
  Annual: "outline",
};

function parseRoughUsd(amount: string): number | null {
  const cleaned = amount.replace(/,/g, "");
  const m = cleaned.match(/\$?\s*([\d.]+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export default function SupporterProfilePage() {
  const { supporterId } = useParams<{ supporterId: string }>();
  const bundle = supporterId ? getSupporterBundle(supporterId) : null;

  if (!supporterId || !bundle) {
    return <Navigate to="/app/donors" replace />;
  }

  const { profile, contributions } = bundle;
  let sum = 0;
  let counted = 0;
  for (const c of contributions) {
    const v = parseRoughUsd(c.amount);
    if (v != null) {
      sum += v;
      counted++;
    }
  }
  const totalLabel =
    counted > 0
      ? `~$${Math.round(sum).toLocaleString()} from ${contributions.length} gift${contributions.length === 1 ? "" : "s"}`
      : `${contributions.length} gift${contributions.length === 1 ? "" : "s"} on file`;

  const allocationTally = new Map<string, number>();
  for (const c of contributions) {
    allocationTally.set(c.allocation, (allocationTally.get(c.allocation) ?? 0) + 1);
  }
  const topAllocations = [...allocationTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

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
          <h2 className="font-heading text-2xl font-bold">{profile.name}</h2>
          <Badge variant={profile.status === "Active" ? "default" : "secondary"}>{profile.status}</Badge>
          <Badge variant="outline">{profile.supporterType}</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Supporter profile and contribution history (demo ledger + gifts recorded in this browser). When the API is
          connected, this view will mirror your operational database.
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
            <p className="text-xs text-muted-foreground mt-1">Amounts are display values; refine when accounting is wired.</p>
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
              <span className="font-medium">{profile.memberSinceYear}</span>
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
            {topAllocations.map(([label, n]) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-muted-foreground truncate">{label}</span>
                <span className="font-medium tabular-nums shrink-0">{n}×</span>
              </div>
            ))}
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
            {profile.region && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-foreground">{profile.region}</span>
              </p>
            )}
            {!profile.email && !profile.phone && !profile.region && (
              <p className="text-muted-foreground">No contact fields on file. Add these when you migrate supporter records.</p>
            )}
          </div>
          {profile.notes && <p className="text-muted-foreground leading-relaxed">{profile.notes}</p>}
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
              {contributions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums">{row.date}</TableCell>
                  <TableCell>
                    <Badge variant={typeColors[row.donationType] ?? "outline"}>{row.donationType}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{row.amount}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{row.allocation}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground capitalize">{row.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
