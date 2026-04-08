import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import textileBg from "@/assets/textile_bg.png";
import { dashboardApi } from "@/lib/api";

type ImpactSnapshot = {
  headline: string;
  summaryText: string;
  metricPayloadJson: string;
};

type ImpactData = {
  aggregateMetrics: {
    activeResidents: number;
    residentsServedTotal: number;
    supportersTotal: number;
    totalDonationsYtd: number;
    counselingSessionsYtd: number;
    homeVisitsYtd: number;
  };
  latestPublishedSnapshot: ImpactSnapshot | null;
};

function formatPhp(n: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

export default function ImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .impact()
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Failed to load impact data");
        setData(res.data as ImpactData);
      })
      .catch((err: Error) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const agg = data?.aggregateMetrics;
    const served = agg?.residentsServedTotal ?? 0;
    const active = agg?.activeResidents ?? 0;
    const ytd = agg?.totalDonationsYtd ?? 0;
    const sessions = agg?.counselingSessionsYtd ?? 0;
    const visits = agg?.homeVisitsYtd ?? 0;
    return [
      {
        label: "Survivors who've walked with us",
        value: served.toLocaleString(),
        change: "Total residents in our operational system.",
        icon: Users,
      },
      {
        label: "Young people in care today",
        value: String(active),
        change: "In safe housing and counseling.",
        icon: Shield,
      },
      {
        label: "Total donations this year",
        value: formatPhp(Number(ytd)),
        change: "Year-to-date total from operational data (PHP).",
        icon: Heart,
      },
      {
        label: "Counseling sessions & home visits (YTD)",
        value: `${sessions.toLocaleString()} / ${visits.toLocaleString()}`,
        change: "Year-to-date counts of logged counseling sessions and home visitations.",
        icon: TrendingUp,
      },
    ];
  }, [data]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;

  return (
    <div className="py-16">
      <div className="section-container">
        <div className="text-center mb-10">
          <Badge variant="default" className="mb-4">
            Impact
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Real people. Real shelter. Real next steps.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            What you see here is <strong className="text-foreground font-medium">anonymized and added up on purpose</strong> so we
            can celebrate progress without exposing anyone’s identity. Behind every statistic is someone who deserves safety,
            counseling, and belonging. Our staff and partners show up for this work every day.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-4 italic border-l-2 border-primary/40 pl-4 text-left md:text-center md:border-l-0 md:pl-0 md:border-t md:pt-4 md:border-primary/40">
            We share aggregates the way a responsible nonprofit should: honest about scale, careful with individual dignity.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/50 p-6 md:p-8 mb-16">
          <div
            className="absolute inset-0 bg-repeat opacity-35"
            style={{ backgroundImage: `url(${textileBg})`, backgroundSize: "520px" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" aria-hidden="true" />
          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m) => (
              <Card key={m.label}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground font-body">{m.label}</CardTitle>
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-heading font-bold">{m.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{m.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8">
            <h3 className="font-heading text-xl font-semibold mb-1">Where young people are gaining ground</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Roll-ups from program teams. Percentages reflect how many of those we served this period moved forward on these goals.
            </p>
            <div className="space-y-4">
              {[
                { label: "Safe housing placement", pct: 94 },
                { label: "Employment readiness", pct: 78 },
                { label: "Mental health improvement", pct: 85 },
                { label: "Community reintegration", pct: 72 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-primary font-medium">{item.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-8">
            <h3 className="font-heading text-xl font-semibold mb-1">How your gifts reach people</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Most support flows straight to services that touch a young person’s day-to-day safety and healing.
            </p>
            <div className="space-y-4">
              {[
                { label: "Direct services for children in care", pct: 65, color: "bg-primary" },
                { label: "Housing & facilities", pct: 18, color: "bg-secondary" },
                { label: "Staff & training", pct: 12, color: "bg-warning" },
                { label: "Administration", pct: 5, color: "bg-muted-foreground" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{item.label}</span>
                    <span className="font-medium">{item.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Every number here is a real person served. If you want to help fund safe housing, counseling, and home visits, you can give
            today.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/donate">Donate</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
