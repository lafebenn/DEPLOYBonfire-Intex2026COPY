import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { socialMediaApi } from "@/lib/api";
import { ExternalLink, Lightbulb, Megaphone, Share2, Sparkles, TrendingUp } from "lucide-react";

function formatPhp(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatReach(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

type MlScenario = {
  platform: string;
  postType: string;
  representativePostId: number;
  score: number;
};

/** Present ML numeric output in plain language (model may return a probability or a count-like score). */
function formatSocialMlEstimate(score: number): { headline: string; detail: string } {
  if (!Number.isFinite(score)) {
    return { headline: "—", detail: "No estimate is available for this combination yet." };
  }
  if (score >= 0 && score <= 1) {
    return {
      headline: `${Math.round(score * 100)}%`,
      detail: "Relative strength for this platform and post style in your selected period.",
    };
  }
  const headline =
    score >= 100 ? Math.round(score).toLocaleString() : Number(score.toFixed(1)).toString();
  return {
    headline,
    detail: "Estimated support signal for this platform and post style in your selected period.",
  };
}

/** Renders strings with **segments** as bold (demo copy only). */
function BoldInline({ text }: { text: string }) {
  const parts = text.split(/\*\*/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i}>{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/80 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

type DatePreset = "last30" | "last90" | "ytd" | "all" | "custom";

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function toDateInputValue(d: Date): string {
  // yyyy-mm-dd in UTC, so it stays stable across time zones.
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateInputValue(v: string): Date | null {
  // Interpret date input as a UTC date boundary.
  if (!v) return null;
  const [y, m, d] = v.split("-").map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

export default function SocialMediaInsightsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<DatePreset>("last30");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedPostType, setSelectedPostType] = useState<string>("");

  const queryParams = useMemo(() => {
    const now = new Date();
    const to = now;

    if (preset === "all") {
      // SQL Server datetime doesn't support year 0001; use a safe early date.
      return {
        dateFrom: "1900-01-01T00:00:00.000Z",
        dateTo: to.toISOString(),
      };
    }

    if (preset === "ytd") {
      const ytd = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
      return { dateFrom: ytd.toISOString(), dateTo: to.toISOString() };
    }

    if (preset === "last90") {
      const from = startOfUtcDay(new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000));
      return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
    }

    if (preset === "custom") {
      const from = parseDateInputValue(customFrom);
      const toDate = parseDateInputValue(customTo) ?? startOfUtcDay(to);
      if (!from) return null;
      return { dateFrom: from.toISOString(), dateTo: toDate.toISOString() };
    }

    // last30 default
    const from = startOfUtcDay(new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await socialMediaApi.analytics(queryParams ?? undefined);
        if (!res.success) throw new Error(res.message || "Failed to load social analytics");
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryParams]);

  const periodLabel = useMemo(() => {
    const from = data?.period?.dateFrom ? new Date(data.period.dateFrom) : null;
    const to = data?.period?.dateTo ? new Date(data.period.dateTo) : null;
    if (!from || !to) return "Last 30 days";
    return `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`;
  }, [data]);

  const kpis = data?.kpis ?? null;
  const platformSummary = (data?.platformSummary ?? []) as any[];
  const contentTypes = (data?.contentTypes ?? []) as any[];
  const bestDays = (data?.bestDays ?? []) as any[];
  const bestHours = (data?.bestHours ?? []) as any[];
  const insights = (data?.insights ?? []) as string[];
  const topPosts = useMemo(() => (data?.topPosts ?? []) as any[], [data?.topPosts]);
  const mlScenarios = useMemo(() => (data?.mlScenarios ?? []) as MlScenario[], [data?.mlScenarios]);

  const mlPlatforms = useMemo(() => {
    const set = new Set(mlScenarios.map((s) => s.platform).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [mlScenarios]);

  const mlPostTypesForPlatform = useMemo(() => {
    if (!selectedPlatform) return [];
    const set = new Set(
      mlScenarios.filter((s) => s.platform === selectedPlatform).map((s) => s.postType).filter(Boolean),
    );
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [mlScenarios, selectedPlatform]);

  const activeMlScenario = useMemo(
    () =>
      mlScenarios.find((s) => s.platform === selectedPlatform && s.postType === selectedPostType) ?? null,
    [mlScenarios, selectedPlatform, selectedPostType],
  );

  const mlEstimateDisplay = useMemo(
    () => (activeMlScenario ? formatSocialMlEstimate(activeMlScenario.score) : null),
    [activeMlScenario],
  );

  useEffect(() => {
    if (!mlPlatforms.length) {
      setSelectedPlatform("");
      setSelectedPostType("");
      return;
    }
    setSelectedPlatform((prev) => (prev && mlPlatforms.includes(prev) ? prev : mlPlatforms[0]!));
  }, [mlPlatforms]);

  useEffect(() => {
    if (!mlPostTypesForPlatform.length) {
      setSelectedPostType("");
      return;
    }
    setSelectedPostType((prev) =>
      prev && mlPostTypesForPlatform.includes(prev) ? prev : mlPostTypesForPlatform[0]!,
    );
  }, [mlPostTypesForPlatform]);

  const maxDay = Math.max(...bestDays.map((d) => Number(d.score) || 0), 0.01);
  const maxHour = Math.max(...bestHours.map((h) => Number(h.score) || 0), 0.01);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="font-normal">
              Live
            </Badge>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-7 w-7 text-primary shrink-0" />
            Social media insights
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl leading-relaxed">
            Bonfire helps your team see what actually moves <strong>donations</strong> versus{" "}
            <strong>engagement alone</strong>, so you can post with purpose on a lean schedule.
            This view is built from your imported social posts for the period you select.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <div className="grid gap-3 sm:justify-items-end">
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Date range</Label>
              <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preset === "custom" ? (
              <div className="grid grid-cols-2 gap-2 w-full sm:w-56">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    placeholder={toDateInputValue(new Date())}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Social-attributed gifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-bold">{formatPhp(Number(kpis?.socialAttributedDonationsPhp ?? 0))}</p>
            <p className="text-xs text-muted-foreground mt-1">Estimated donation value attributed to social posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Avg. engagement rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-bold">
              {(Number(kpis?.avgEngagementRate ?? 0) * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Interactions compared to how many people saw the post</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Total reach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-bold">{formatReach(Number(kpis?.reach ?? 0))}</p>
            <p className="text-xs text-muted-foreground mt-1">{Number(kpis?.totalPosts ?? 0)} posts in period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Cadence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-bold">{Number(kpis?.postsPerWeek ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Posts per week (avg.)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Platform performance</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Where attention converts to <strong>donations</strong>, not only likes.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Reach</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="text-right">Gift links</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Est. value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformSummary.map((row) => (
                  <TableRow key={row.platform}>
                    <TableCell className="font-medium">{row.platform}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatReach(row.reach)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(Number(row.avgEngagementRate ?? 0) * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.donationReferrals}</TableCell>
                    <TableCell className="text-right tabular-nums hidden md:table-cell">
                      {formatPhp(Number(row.estimatedDonationPhp ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Actionable insights
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Plain-language next steps based on current database signals.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed">
              {insights.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                  <span>
                    <BoldInline text={line} />
                  </span>
                </li>
              ))}
              {insights.length === 0 ? <li className="text-muted-foreground text-sm">No insights available yet.</li> : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Top content (by estimated donation value)
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">Replicate what’s working. Click through to review the post and its CTA.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Reach</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
                <TableHead className="text-right">Gift links</TableHead>
                <TableHead className="text-right">Est. value</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPosts.map((p) => {
                const reach = Number(p.reach ?? 0);
                const interactions = Number(p.likes ?? 0) + Number(p.comments ?? 0) + Number(p.shares ?? 0) + Number(p.saves ?? 0);
                const er = reach > 0 ? interactions / reach : 0;
                return (
                  <TableRow key={p.postId}>
                    <TableCell className="font-medium">{p.platform}</TableCell>
                    <TableCell>{p.postType}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatReach(reach)}</TableCell>
                    <TableCell className="text-right tabular-nums">{(er * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right tabular-nums">{Number(p.donationReferrals ?? 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPhp(Number(p.estimatedDonationValuePhp ?? 0))}</TableCell>
                    <TableCell className="text-right">
                      {p.postUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={p.postUrl} target="_blank" rel="noreferrer">
                            View
                          </a>
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {topPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    No posts in this date range.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Content type: engagement vs. donations
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Answers “what should we post?”. Compare attention to <strong>gift links</strong> by post type.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {contentTypes.map((c) => (
              <div
                key={c.postType}
                className="rounded-xl border border-border p-4 bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="font-medium">{c.postType}</p>
                  <Badge variant="outline">{Number(c.posts ?? 0)} posts</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                  <span>Avg. likes: <strong className="text-foreground">{Number(c.avgLikes ?? 0)}</strong></span>
                  <span>Gift links: <strong className="text-foreground">{Number(c.donationReferrals ?? 0)}</strong></span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                  Est. donation value: <strong className="text-foreground">{formatPhp(Number(c.estimatedDonationPhp ?? 0))}</strong>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Best days to post</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Compared across days in this period using reach, interaction, and gift links.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestDays.map((d) => (
              <BarRow key={d.day} label={d.day} value={Number(d.score ?? 0)} max={maxDay} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Best times (local)</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Test with scheduled posts to confirm.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestHours.map((h) => (
              <BarRow key={h.hour} label={`${String(h.hour).padStart(2, "0")}:00`} value={Number(h.score ?? 0)} max={maxHour} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Estimated post impact
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Pick the platform and post format you care about. The estimate uses your best-performing example of that
            combination in this date range and is ready as soon as the page loads.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {mlScenarios.length === 0 ? (
            <p className="text-muted-foreground">
              No platform and format combinations in this period yet. Widen the date range or add posts to unlock
              estimates.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Platform</Label>
                  <Select
                    value={selectedPlatform}
                    onValueChange={(v) => {
                      setSelectedPlatform(v);
                      const nextTypes = [
                        ...new Set(mlScenarios.filter((s) => s.platform === v).map((s) => s.postType)),
                      ].sort((a, b) => a.localeCompare(b));
                      setSelectedPostType(nextTypes[0] ?? "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {mlPlatforms.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Post format</Label>
                  <Select
                    value={selectedPostType}
                    onValueChange={setSelectedPostType}
                    disabled={!mlPostTypesForPlatform.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose format" />
                    </SelectTrigger>
                    <SelectContent>
                      {mlPostTypesForPlatform.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mlEstimateDisplay && activeMlScenario ? (
                <div className="rounded-xl border border-border bg-muted/30 p-6 sm:p-8 space-y-3">
                  <p className="text-4xl sm:text-5xl font-heading font-bold tabular-nums tracking-tight text-foreground">
                    {mlEstimateDisplay.headline}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">{mlEstimateDisplay.detail}</p>
                </div>
              ) : null}

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                <span className="font-medium text-foreground">Estimates only.</span> These numbers come from a statistical
                model, not a guarantee of future results. Use them as one input alongside your team’s experience when you
                plan content.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
