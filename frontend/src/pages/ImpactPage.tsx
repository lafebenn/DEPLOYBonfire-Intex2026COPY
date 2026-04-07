import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import textileBg from "@/assets/textile_bg.png";

const metrics = [
  {
    label: "Survivors who've walked with us",
    value: "247",
    change: "Each number is a person. Names and stories stay private here.",
    icon: Users,
  },
  {
    label: "Young people in care today",
    value: "42",
    change: "In safe housing and counseling, not “file numbers,” but neighbors rebuilding.",
    icon: Shield,
  },
  {
    label: "Neighbors who give & volunteer",
    value: "1,834",
    change: "Families, congregations, and partners standing with children and young people in need.",
    icon: Heart,
  },
  {
    label: "Young people finishing key milestones",
    value: "89%",
    change: "Core program goals met: education, stability, and steps toward home.",
    icon: TrendingUp,
  },
];

export default function ImpactPage() {
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
          <div className="mt-8 flex items-center justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/donate">Stand with children in need</Link>
            </Button>
          </div>
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
              Roll-ups from program teams. Percentages reflect how many of those we served this period moved forward on these goals (not cold “case” tallies).
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
              Honoring what donors intend: most support flows straight to services that touch a young person’s day-to-day safety and healing.
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
      </div>
    </div>
  );
}
