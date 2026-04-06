import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Heart, DollarSign } from "lucide-react";
import { useState } from "react";

const donors = [
  { id: 1, name: "Sarah Kingsley", type: "Monthly", amount: "$500/mo", total: "$6,000", allocation: "Direct Services", since: "2022" },
  { id: 2, name: "Robert Chen", type: "One-time", amount: "$2,500", total: "$7,500", allocation: "Housing", since: "2021" },
  { id: 3, name: "Grace Foundation", type: "Grant", amount: "$25,000", total: "$75,000", allocation: "General", since: "2020" },
  { id: 4, name: "Michael Torres", type: "Monthly", amount: "$100/mo", total: "$2,400", allocation: "Training", since: "2023" },
  { id: 5, name: "Amara Johnson", type: "Annual", amount: "$5,000/yr", total: "$15,000", allocation: "Direct Services", since: "2021" },
];

const typeColors: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  Monthly: "default",
  "One-time": "secondary",
  Grant: "warning",
  Annual: "outline",
};

export default function DonorsPage() {
  const [search, setSearch] = useState("");
  const filtered = donors.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold">Donors & Contributions</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage supporters and track donations</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Donor</Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">1,834</p>
              <p className="text-sm text-muted-foreground">Total Donors</p>
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
        <Input placeholder="Search donors..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Total Given</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Allocation</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}>
                  <td className="p-4 font-medium">{d.name}</td>
                  <td className="p-4"><Badge variant={typeColors[d.type]}>{d.type}</Badge></td>
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
