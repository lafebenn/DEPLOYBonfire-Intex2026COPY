import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Heart, Calendar, TrendingUp, FileText, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Active Residents", value: "42", icon: Users, trend: "+3 this month" },
  { label: "Recent Donations", value: "$12,450", icon: Heart, trend: "Last 30 days" },
  { label: "Upcoming Conferences", value: "7", icon: Calendar, trend: "This week" },
  { label: "Program Progress", value: "87%", icon: TrendingUp, trend: "Avg. completion" },
];

const recentActivity = [
  { text: "New intake completed for resident #R-2024-089", time: "2 hours ago", type: "case" },
  { text: "Monthly donation of $500 received from Sarah K.", time: "4 hours ago", type: "donation" },
  { text: "Case conference scheduled for April 10", time: "Yesterday", type: "conference" },
  { text: "Home visit report filed for resident #R-2024-075", time: "Yesterday", type: "visit" },
  { text: "Process recording submitted by James R.", time: "2 days ago", type: "recording" },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-bold">Bonfire · Program operations</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Authorized staff workspace. Signed in as{" "}
          <span className="text-foreground font-medium">{user?.name}</span>
          <span className="capitalize"> · {user?.role?.replace(/_/g, " ")}</span>
          . Figures below roll up from internal program reporting. Handle with care.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground font-body">{s.label}</CardTitle>
                <s.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-heading font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "New Intake", badge: "Case", to: "/app/intake/new" },
                { label: "Record Visit", badge: "Visit", to: "/app/visits/new" },
                { label: "Add Donation", badge: "Donor", to: "/app/donations/new" },
                { label: "Schedule Conference", badge: "Meeting", to: "/app/conferences/new" },
                { label: "Process Recording", badge: "Record", to: "/app/recordings/new" },
                { label: "Generate Report", badge: "Report", to: "/app/reports/generate" },
                { label: "Social insights", badge: "Outreach", to: "/app/social" },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-accent transition-colors text-left"
                >
                  <span className="text-sm font-medium">{action.label}</span>
                  <Badge variant="outline" className="text-xs">{action.badge}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
