import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { donorPortalApi } from "@/lib/api";
import { Heart, History } from "lucide-react";

type DonationRow = {
  donationId: number;
  donationDate: string; // DateOnly serialized
  donationType: string;
  amount: number | null;
  estimatedValue: number | null;
  isRecurring: boolean;
  campaignName: string | null;
  channelSource: string;
  impactUnit: string | null;
  notes: string | null;
};

type MyDonationsPayload = {
  supporterId: number;
  donations: DonationRow[];
};

function formatPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

export default function DonorDashboardPage() {
  const [data, setData] = useState<MyDonationsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await donorPortalApi.myDonations();
    if (!res.success) throw new Error(res.message || "Failed to load donation history");
    setData(res.data as MyDonationsPayload);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const rows = data?.donations ?? [];
    const lifetime = rows.reduce((acc, d) => acc + Number(d.amount ?? d.estimatedValue ?? 0), 0);
    const count = rows.length;
    return { lifetime, count };
  }, [data]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!data) return <div className="p-8 text-muted-foreground">No data</div>;

  return (
    <div className="py-12">
      <div className="section-container space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Badge variant="secondary" className="font-normal mb-2">
              Donor dashboard
            </Badge>
            <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
              <Heart className="h-7 w-7 text-primary" />
              Your giving history
            </h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-2xl leading-relaxed">
              This is a <strong className="text-foreground font-medium">fake donation</strong> flow for testing. Submitting here records a
              donation row in our database (no payment processor).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/impact">See impact</Link>
            </Button>
            <Button asChild variant="default">
              <Link to="/donate">Donate</Link>
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-body">Lifetime giving</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-heading font-bold">{formatPhp(totals.lifetime)}</p>
              <p className="text-xs text-muted-foreground mt-1">Across {totals.count} recorded gifts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-body">Supporter ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-heading font-bold tabular-nums">{data.supporterId}</p>
              <p className="text-xs text-muted-foreground mt-1">Linked to your account</p>
            </CardContent>
          </Card>
        </div>

        <Card className="card-warm">
          <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium">Want to donate again?</p>
              <p className="text-sm text-muted-foreground">Use the donation page. Your donation will be saved to your profile automatically.</p>
            </div>
            <Button asChild variant="hero">
              <Link to="/donate">Go to donation page</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Donation history
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">Most recent gifts first.</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Channel</TableHead>
                  <TableHead className="hidden lg:table-cell">Campaign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.donations.map((d) => (
                  <TableRow key={d.donationId}>
                    <TableCell className="tabular-nums">{d.donationDate}</TableCell>
                    <TableCell className="font-medium">{d.donationType || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {typeof d.amount === "number" ? formatPhp(d.amount) : typeof d.estimatedValue === "number" ? formatPhp(d.estimatedValue) : "—"}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">{d.channelSource || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{d.campaignName || "—"}</TableCell>
                  </TableRow>
                ))}
                {data.donations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No donations recorded yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

