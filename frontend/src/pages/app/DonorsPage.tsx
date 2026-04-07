import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Heart, DollarSign } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listSupporterTableRows } from "@/lib/supporterData";

const typeColors: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  Monthly: "default",
  "One-time": "secondary",
  Grant: "warning",
  Annual: "outline",
};

export default function DonorsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const allDonors = listSupporterTableRows();
  const filtered = allDonors.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Supporter profiles & contributions</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Open a row to see full gift history (demo data + gifts recorded on this device).
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
              <p className="text-2xl font-heading font-bold">$248,500</p>
              <p className="text-sm text-muted-foreground">This Year</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">$42/mo</p>
              <p className="text-sm text-muted-foreground">Avg. Monthly</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {filtered.map((d, i) => (
                <tr
                  key={d.profileId}
                  className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
                  onClick={() => navigate(`/app/donors/${encodeURIComponent(d.profileId)}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/app/donors/${encodeURIComponent(d.profileId)}`);
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open supporter profile for ${d.name}`}
                >
                  <td className="p-4 font-medium">{d.name}</td>
                  <td className="p-4">
                    <Badge variant={typeColors[d.type] ?? "outline"}>{d.type}</Badge>
                  </td>
                  <td className="p-4 text-sm">{d.amount}</td>
                  <td className="p-4 text-sm hidden md:table-cell">{d.total}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{d.allocation}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{d.since}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
