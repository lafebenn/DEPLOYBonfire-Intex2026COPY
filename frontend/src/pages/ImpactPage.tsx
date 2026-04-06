import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, TrendingUp, Shield } from "lucide-react";

const metrics = [
  { label: "Survivors Served", value: "247", change: "+18 this year", icon: Users },
  { label: "Active Cases", value: "42", change: "Across 3 programs", icon: Shield },
  { label: "Donor Supporters", value: "1,834", change: "+312 this year", icon: Heart },
  { label: "Program Completion", value: "89%", change: "+5% from last year", icon: TrendingUp },
];

export default function ImpactPage() {
  return (
    <div className="py-16">
      <div className="section-container">
        <div className="text-center mb-16">
          <Badge variant="default" className="mb-4">Impact Report 2026</Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Making a difference</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            Anonymized, aggregated data showing the collective impact of our community.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8">
            <h3 className="font-heading text-xl font-semibold mb-4">Program Outcomes</h3>
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
            <h3 className="font-heading text-xl font-semibold mb-4">Donation Allocation</h3>
            <div className="space-y-4">
              {[
                { label: "Direct survivor services", pct: 65, color: "bg-primary" },
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
