import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MOCK_SOCIAL_KPIS,
  MOCK_PLATFORM_SUMMARY,
  MOCK_CONTENT_TYPES,
  MOCK_BEST_DAYS,
  MOCK_BEST_HOURS,
  MOCK_STRATEGY_RECOMMENDATIONS,
} from "@/lib/socialMediaMock";
import { Lightbulb, Megaphone, Share2, TrendingUp } from "lucide-react";

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

export default function SocialMediaInsightsPage() {
  const maxDay = Math.max(...MOCK_BEST_DAYS.map((d) => d.score), 0.01);
  const maxHour = Math.max(...MOCK_BEST_HOURS.map((h) => h.score), 0.01);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="font-normal">
              Demo data
            </Badge>
            <span className="text-xs text-muted-foreground">{MOCK_SOCIAL_KPIS.periodLabel}</span>
          </div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-7 w-7 text-primary shrink-0" />
            Social media insights
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl leading-relaxed">
            Bonfire helps your team see what actually moves <strong>donations</strong> versus{" "}
            <strong>engagement alone</strong>, so you can post with purpose on a lean schedule.
            This view will connect to your operational database when APIs are wired; numbers below are
            illustrative.
          </p>
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
            <p className="text-2xl font-heading font-bold">{formatPhp(MOCK_SOCIAL_KPIS.socialAttributedDonationsPhp)}</p>
            <p className="text-xs text-muted-foreground mt-1">Estimated from referral tags</p>
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
              {(MOCK_SOCIAL_KPIS.avgEngagementRate * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">(likes + comments + shares) ÷ reach</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Total reach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-bold">{formatReach(MOCK_SOCIAL_KPIS.reach)}</p>
            <p className="text-xs text-muted-foreground mt-1">{MOCK_SOCIAL_KPIS.totalPosts} posts in period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-body">
              Cadence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-bold">{MOCK_SOCIAL_KPIS.postsPerWeek}</p>
            <p className="text-xs text-muted-foreground mt-1">Posts per week (avg.). Aim 12-16.</p>
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
                  <TableHead className="text-right">Eng.</TableHead>
                  <TableHead className="text-right">Ref.</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Est. PHP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PLATFORM_SUMMARY.map((row) => (
                  <TableRow key={row.platform}>
                    <TableCell className="font-medium">{row.platform}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatReach(row.reach)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(row.avgEngagementRate * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.donationReferrals}</TableCell>
                    <TableCell className="text-right tabular-nums hidden md:table-cell">
                      {formatPhp(row.estimatedDonationPhp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3">
              Top platform by gifts (demo): <strong>{MOCK_SOCIAL_KPIS.topPlatform}</strong>. Validate with your next campaign UTM tags.
            </p>
          </CardContent>
        </Card>

        <Card className="card-warm">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Strategic recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Plain-language next steps your founders can act on without a marketing team.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed">
              {MOCK_STRATEGY_RECOMMENDATIONS.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                  <span>
                    <BoldInline text={line} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Content type: engagement vs. donations
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Answers “what should we post?”. Compare vanity metrics to <strong>donation referrals</strong> by post type.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {MOCK_CONTENT_TYPES.map((c) => (
              <div
                key={c.postType}
                className="rounded-xl border border-border p-4 bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="font-medium">{c.label}</p>
                  <Badge variant="outline">{c.posts} posts</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                  <span>Avg. likes: <strong className="text-foreground">{c.avgLikes}</strong></span>
                  <span>Donation refs: <strong className="text-foreground">{c.donationReferrals}</strong></span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{c.notes}</p>
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
              Relative composite score (reach + engagement + referrals). Demo.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_BEST_DAYS.map((d) => (
              <BarRow key={d.day} label={d.day} value={d.score} max={maxDay} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Best times (local)</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Evening slots often win for donations; test with scheduled posts.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_BEST_HOURS.map((h) => (
              <BarRow key={h.hour} label={h.label} value={h.score} max={maxHour} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
